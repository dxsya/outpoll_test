"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo } from "react";

import { dashboardQueryKey, fetchDashboardSnapshot } from "@/lib/api/dashboard-query";
import { aggregateVolumePoints, chooseAggregationBucket } from "@/lib/chart/aggregate-series";
import { DashboardFilters } from "@/components/dashboard/dashboard-filters";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import type { CategoryShare } from "@/components/dashboard/category-share-chart";
import {
  DashboardSkeleton,
  InitialLoadError,
  RefreshError,
  SourceErrors,
} from "@/components/dashboard/dashboard-status";
import { DashboardVolumeSection } from "@/components/dashboard/dashboard-volume-section";
import { DashboardSummary } from "@/components/dashboard/dashboard-summary";
import { parseDashboardUrlState, serializeDashboardUrlState } from "@/lib/url-state";
import { useI18n } from "@/lib/i18n";
import type { DashboardRange } from "@/types/market";

function DashboardPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlState = useMemo(
    () => parseDashboardUrlState(new URLSearchParams(searchParams.toString())),
    [searchParams],
  );
  const { range, categoryIds: selectedCategoryIds } = urlState;

  function updateUrl(nextState: { range: DashboardRange; categoryIds: string[] | null }): void {
    router.push(`${pathname}${serializeDashboardUrlState(nextState)}`);
  }

  const query = useQuery({
    queryKey: dashboardQueryKey({ range, categoryIds: selectedCategoryIds }),
    queryFn: ({ signal }) => fetchDashboardSnapshot(signal, range, selectedCategoryIds),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
    retry: false,
    refetchOnWindowFocus: false,
  });
  const dashboard = query.data;
  const sourceErrors = dashboard?.sourceErrors ?? {};
  const effectiveCategoryIds = useMemo(() => {
    if (selectedCategoryIds === null || !dashboard) {
      return selectedCategoryIds;
    }

    const availableIds = new Set(dashboard.categories.map((category) => category.id));
    const knownIds = selectedCategoryIds.filter((id) => availableIds.has(id));
    return knownIds;
  }, [dashboard, selectedCategoryIds]);
  const filteredMarketIds = useMemo(
    () => new Set(dashboard?.markets.map((market) => `${market.platform}:${market.id}`)),
    [dashboard],
  );
  const chartSeries = useMemo(() => {
    if (!dashboard) {
      return [];
    }

    const points = dashboard.volumePoints.filter((point) =>
      filteredMarketIds.has(`${point.platform}:${point.marketId}`),
    );
    return aggregateVolumePoints(points, chooseAggregationBucket(range));
  }, [dashboard, filteredMarketIds, range]);
  const categoryShare = useMemo<CategoryShare[]>(() => {
    if (!dashboard) return [];
    const labels = new Map(dashboard.categories.map((category) => [category.id, category.label]));
    const totals = new Map<string, number>();
    dashboard.volumePoints
      .filter((point) => filteredMarketIds.has(`${point.platform}:${point.marketId}`))
      .forEach((point) => {
        if (point.volumeUsd !== null) {
          totals.set(point.categoryId, (totals.get(point.categoryId) ?? 0) + point.volumeUsd);
        }
      });
    return [...totals.entries()]
      .map(([id, value]) => ({ id, label: labels.get(id) ?? id, value }))
      .sort((left, right) => right.value - left.value);
  }, [dashboard, filteredMarketIds]);
  const periodDelta = useMemo(() => {
    const values = chartSeries.flatMap((item) => item.points.map((point) => point.volumeUsd ?? 0));
    if (values.length < 2) return null;
    const midpoint = Math.ceil(values.length / 2);
    const previous = values.slice(0, midpoint).reduce((sum, value) => sum + value, 0);
    const current = values.slice(midpoint).reduce((sum, value) => sum + value, 0);
    return previous === 0 ? null : ((current - previous) / previous) * 100;
  }, [chartSeries]);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-950 dark:bg-slate-950 dark:text-white sm:px-8">
      <div className="mx-auto max-w-7xl">
        <DashboardHeader fetchedAt={dashboard?.fetchedAt} />

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
              categories={dashboard.categories}
              disabled={query.isFetching}
              onChange={updateUrl}
            />
            <DashboardVolumeSection
              categoryIds={effectiveCategoryIds}
              series={chartSeries}
              isLoading={query.isFetching}
            />
            <DashboardSummary periodDelta={periodDelta} categoryShare={categoryShare} />
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
