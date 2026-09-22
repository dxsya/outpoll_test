"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";

import { DashboardFilters } from "@/components/dashboard/dashboard-filters";
import type { CategoryShare } from "@/components/dashboard/category-share-chart";
import {
  DashboardSkeleton,
  InitialLoadError,
  RefreshError,
  SourceErrors,
} from "@/components/dashboard/dashboard-status";
import { DashboardSummary } from "@/components/dashboard/dashboard-summary";
import { DashboardVolumeSection } from "@/components/dashboard/dashboard-volume-section";
import { MarketTable } from "@/components/dashboard/market-table";
import { type ChartMode } from "@/components/dashboard/volume-chart";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { Card } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n";
import { dashboardQueryKey, fetchDashboardSnapshot } from "@/lib/api/dashboard-query";
import { aggregateVolumePoints, chooseAggregationBucket } from "@/lib/chart/aggregate-series";
import { parseDashboardUrlState, serializeDashboardUrlState } from "@/lib/url-state";
import type { CategoryScope, DashboardMetric, DashboardRange, Platform } from "@/types/market";

function DashboardPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlState = useMemo(
    () => parseDashboardUrlState(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );
  const { range, categoryIds: selectedCategoryIds, platformIds, metric, categoryScope } = urlState;
  const [chartMode, setChartMode] = useState<ChartMode>("line");

  function updateUrl(nextState: {
    range?: DashboardRange;
    categoryIds?: string[] | null;
    platformIds?: Platform[] | null;
    metric?: DashboardMetric;
    categoryScope?: CategoryScope;
  }): void {
    router.push(
      `${pathname}${serializeDashboardUrlState({
        range: nextState.range ?? range,
        categoryIds:
          nextState.categoryIds === undefined ? selectedCategoryIds : nextState.categoryIds,
        platformIds: nextState.platformIds === undefined ? platformIds : nextState.platformIds,
        metric: nextState.metric ?? metric,
        categoryScope: nextState.categoryScope ?? categoryScope,
      })}`,
      { scroll: false },
    );
  }

  const query = useQuery({
    queryKey: dashboardQueryKey({
      range,
      categoryIds: null, // Всегда загружаем ВСЕ категории, фильтруем на клиенте
    }),
    queryFn: ({ signal }) => fetchDashboardSnapshot(signal, range, null),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
    retry: false,
    refetchOnWindowFocus: false,
  });
  const dashboard = query.data;
  const sourceErrors = dashboard?.sourceErrors ?? {};
  const effectiveCategoryIds = useMemo(() => {
    if (selectedCategoryIds === null || !dashboard) return selectedCategoryIds;
    const availableIds = new Set(dashboard.categories.map((category) => category.id));
    return selectedCategoryIds.filter((id) => availableIds.has(id));
  }, [dashboard, selectedCategoryIds]);
  const filteredMarkets = useMemo(
    () =>
      dashboard?.markets.filter(
        (market) =>
          (platformIds === null || platformIds.includes(market.platform)) &&
          (selectedCategoryIds === null ||
            (categoryScope === "both"
              ? selectedCategoryIds.includes(market.category.id)
              : market.platform !== categoryScope ||
                selectedCategoryIds.includes(market.category.id))),
      ) ?? [],
    [categoryScope, dashboard, platformIds, selectedCategoryIds],
  );
  const filteredMarketIds = useMemo(
    () => new Set(filteredMarkets.map((market) => `${market.platform}:${market.id}`)),
    [filteredMarkets],
  );
  const filteredVolumePoints = useMemo(
    () =>
      dashboard?.volumePoints.filter((point) =>
        filteredMarketIds.has(`${point.platform}:${point.marketId}`),
      ) ?? [],
    [dashboard, filteredMarketIds],
  );
  const chartSeries = useMemo(
    () => aggregateVolumePoints(filteredVolumePoints, chooseAggregationBucket(range)),
    [filteredVolumePoints, range],
  );
  const categoryShare = useMemo<CategoryShare[]>(() => {
    if (!dashboard) return [];
    const labels = new Map(dashboard.categories.map((category) => [category.id, category.label]));
    const totals = new Map<string, number>();
    filteredVolumePoints.forEach((point) => {
      if (point.volumeUsd !== null) {
        totals.set(point.categoryId, (totals.get(point.categoryId) ?? 0) + point.volumeUsd);
      }
    });
    return [...totals.entries()]
      .map(([id, value]) => ({ id, label: labels.get(id) ?? id, value }))
      .sort((left, right) => right.value - left.value);
  }, [dashboard, filteredVolumePoints]);
  const periodDelta = useMemo(() => {
    if (chartSeries.length === 0) return null;

    // Собираем все уникальные timestamps
    const timestamps = [...new Set(chartSeries.flatMap((item) =>
      item.points.map((point) => point.timestamp)
    ))].sort((a, b) => a - b);

    if (timestamps.length < 2) return null;

    // Суммируем volume по каждому timestamp (kalshi + polymarket)
    const volumeByTimestamp = timestamps.map((timestamp) => {
      return chartSeries.reduce((sum, series) => {
        const point = series.points.find((p) => p.timestamp === timestamp);
        return sum + (point?.volumeUsd ?? 0);
      }, 0);
    });

    // Делим на две половины по времени
    const midpoint = Math.ceil(volumeByTimestamp.length / 2);
    const previous = volumeByTimestamp.slice(0, midpoint).reduce((sum, value) => sum + value, 0);
    const current = volumeByTimestamp.slice(midpoint).reduce((sum, value) => sum + value, 0);

    return previous === 0 ? null : ((current - previous) / previous) * 100;
  }, [chartSeries]);
  const totalVolume = useMemo(
    () => filteredVolumePoints.reduce((total, point) => total + (point.volumeUsd ?? 0), 0),
    [filteredVolumePoints],
  );
  const averageDailyVolume = useMemo(() => {
    if (filteredVolumePoints.length === 0) return 0;
    const timestamps = filteredVolumePoints.map((point) => point.timestamp);
    const rangeDays =
      range === "7d"
        ? 7
        : range === "30d"
          ? 30
          : range === "90d"
            ? 90
            : (() => {
                const { earliest, latest } = timestamps.reduce(
                  (bounds, timestamp) => ({
                    earliest: Math.min(bounds.earliest, timestamp),
                    latest: Math.max(bounds.latest, timestamp),
                  }),
                  { earliest: timestamps[0], latest: timestamps[0] },
                );
                return Math.max(1, Math.ceil((latest - earliest) / 86400));
              })();
    return totalVolume / rangeDays;
  }, [filteredVolumePoints, range, totalVolume]);
  const volumeByMarket = useMemo(() => {
    const totals = new Map<string, number>();
    filteredVolumePoints.forEach((point) => {
      const key = `${point.platform}:${point.marketId}`;
      totals.set(key, (totals.get(key) ?? 0) + (point.volumeUsd ?? 0));
    });
    return totals;
  }, [filteredVolumePoints]);
  const platformVolumes = useMemo(() => {
    const totals: Record<Platform, number> = { kalshi: 0, polymarket: 0 };
    filteredVolumePoints.forEach((point) => {
      totals[point.platform] += point.volumeUsd ?? 0;
    });
    return totals;
  }, [filteredVolumePoints]);
  const platformLastTimestamps = useMemo(() => {
    const latest: Record<Platform, number | null> = { kalshi: null, polymarket: null };
    filteredVolumePoints.forEach((point) => {
      latest[point.platform] = Math.max(latest[point.platform] ?? 0, point.timestamp);
    });
    return latest;
  }, [filteredVolumePoints]);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-2 text-slate-950 dark:bg-slate-950 dark:text-white sm:px-8">
      <div className="mx-auto max-w-7xl">
        <DashboardHeader
          fetchedAt={dashboard?.fetchedAt}
          isRefreshing={query.isFetching}
          isStale={query.isStale}
        />
        {query.isPending && !dashboard ? (
          <DashboardSkeleton />
        ) : query.isError && !dashboard ? (
          <InitialLoadError onRetry={() => query.refetch()} />
        ) : dashboard ? (
          <>
            {query.isError ? <RefreshError onRetry={() => query.refetch()} /> : null}
            <SourceErrors
              errors={sourceErrors}
              requestStats={dashboard.requestStats}
              isLoading={query.isFetching}
              onRetry={() => query.refetch()}
            />
            <DashboardFilters
              range={range}
              selectedCategoryIds={selectedCategoryIds}
              effectiveCategoryIds={effectiveCategoryIds}
              platformIds={platformIds}
              categoryScope={categoryScope}
              categories={dashboard.categories}
              onChange={updateUrl}
            />
            <DashboardVolumeSection
              categoryIds={effectiveCategoryIds}
              series={chartSeries}
              isLoading={query.isFetching}
              chartMode={chartMode}
              onChartModeChange={setChartMode}
            />
            <DashboardSummary
              periodDelta={periodDelta}
              categoryShare={categoryShare}
              metric={metric}
              totalVolume={totalVolume}
              averageDailyVolume={averageDailyVolume}
              marketCount={filteredMarkets.length}
              onMetricChange={(nextMetric) => updateUrl({ metric: nextMetric })}
              platformVolumes={platformVolumes}
              platformLastTimestamps={platformLastTimestamps}
            />
            <MarketTable markets={filteredMarkets} volumeByMarket={volumeByMarket} />
          </>
        ) : null}
      </div>
    </main>
  );
}

export default function Home() {
  const { t } = useI18n();

  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-950 dark:bg-slate-950 dark:text-white sm:px-8">
          <p className="mx-auto max-w-7xl text-sm text-slate-600 dark:text-slate-300">
            {t("loadingDashboard")}
          </p>
        </main>
      }
    >
      <DashboardPage />
    </Suspense>
  );
}
