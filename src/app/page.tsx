"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState, useSyncExternalStore } from "react";

import { dashboardQueryKey, fetchDashboardSnapshot } from "@/lib/api/dashboard-query";
import {
  aggregateVolumePoints,
  chooseAggregationBucket,
} from "@/lib/chart/aggregate-series";
import { VolumeChart } from "@/components/dashboard/volume-chart";
import {
  CategoryShareChart,
  type CategoryShare,
} from "@/components/dashboard/category-share-chart";
import { parseDashboardUrlState, serializeDashboardUrlState } from "@/lib/url-state";
import type { DashboardRange } from "@/types/market";

type ThemeMode = "light" | "dark";

function applyTheme(mode: ThemeMode): void {
  const dark = mode === "dark";
  document.documentElement.classList.toggle("dark", dark);
  document.documentElement.style.colorScheme = dark ? "dark" : "light";
}

const ranges: Array<{ id: DashboardRange; label: string }> = [
  { id: "7d", label: "7d" },
  { id: "30d", label: "30d" },
  { id: "90d", label: "90d" },
  { id: "all", label: "All time" },
];

function formatFetchedAt(timestamp: number): string {
  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "medium",
    timeStyle: "medium",
  }).format(timestamp);
}

function DashboardSkeleton() {
  return (
    <section className="space-y-4 py-8" aria-label="Loading dashboard" aria-live="polite">
      <div className="h-11 animate-pulse rounded-md bg-slate-200 dark:bg-slate-800" />
      <div className="grid gap-4 sm:grid-cols-3">
        {["skeleton-total", "skeleton-kalshi", "skeleton-polymarket"].map((key) => (
          <div key={key} className="h-24 animate-pulse bg-slate-200 dark:bg-slate-800" />
        ))}
      </div>
      <div className="h-[360px] animate-pulse border border-slate-200 bg-slate-200 dark:border-slate-800 dark:bg-slate-900" />
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Загружаю данные обеих платформ...
      </p>
    </section>
  );
}

function subscribeToSystemTheme(onChange: () => void): () => void {
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  mediaQuery.addEventListener("change", onChange);
  return () => mediaQuery.removeEventListener("change", onChange);
}

function getSystemTheme(): ThemeMode {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function ThemeToggle() {
  const systemMode = useSyncExternalStore(
    subscribeToSystemTheme,
    getSystemTheme,
    (): ThemeMode => "light",
  );
  const [manualMode, setManualMode] = useState<ThemeMode | null>(null);
  const mode = manualMode ?? systemMode;

  useEffect(() => {
    applyTheme(mode);
  }, [mode]);

  function cycleTheme(): void {
    const nextMode: ThemeMode = mode === "dark" ? "light" : "dark";
    setManualMode(nextMode);
  }

  return (
    <button
      type="button"
      onClick={cycleTheme}
      className="min-h-11 rounded-md border border-slate-300 px-3 text-sm font-semibold dark:border-slate-700"
      aria-label={`Theme mode: ${mode}. Activate to change`}
    >
      {mode === "dark" ? "🌙" : "☀️"}
    </button>
  );
}

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
  const effectiveCategoryIds = useMemo(() => {
    if (selectedCategoryIds === null || !query.data) {
      return selectedCategoryIds;
    }

    const availableIds = new Set(query.data.categories.map((category) => category.id));
    const knownIds = selectedCategoryIds.filter((id) => availableIds.has(id));
    return knownIds;
  }, [query.data, selectedCategoryIds]);
  const filteredMarketIds = useMemo(
    () => new Set(query.data?.markets.map((market) => `${market.platform}:${market.id}`)),
    [query.data],
  );
  const chartSeries = useMemo(() => {
    if (!query.data) {
      return [];
    }

    const points = query.data.volumePoints.filter((point) =>
      filteredMarketIds.has(`${point.platform}:${point.marketId}`),
    );
    return aggregateVolumePoints(points, chooseAggregationBucket(range));
  }, [filteredMarketIds, query.data, range]);
  const categoryShare = useMemo<CategoryShare[]>(() => {
    if (!query.data) return [];
    const labels = new Map(query.data.categories.map((category) => [category.id, category.label]));
    const totals = new Map<string, number>();
    query.data.volumePoints
      .filter((point) => filteredMarketIds.has(`${point.platform}:${point.marketId}`))
      .forEach((point) => {
        if (point.volumeUsd !== null) {
          totals.set(point.categoryId, (totals.get(point.categoryId) ?? 0) + point.volumeUsd);
        }
      });
    return [...totals.entries()]
      .map(([id, value]) => ({ id, label: labels.get(id) ?? id, value }))
      .sort((left, right) => right.value - left.value);
  }, [filteredMarketIds, query.data]);
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
        <header className="border-b border-slate-200 pb-6 dark:border-slate-800">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700 dark:text-cyan-300">
            Raw data explorer
          </p>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Prediction markets data
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-300">
                Реальные markets из публичных API Kalshi и Polymarket в текстовом формате.
              </p>
            </div>
            {query.data ? (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Updated: {formatFetchedAt(query.data.fetchedAt)}
              </p>
            ) : null}
            <ThemeToggle />
          </div>
        </header>

        {query.isPending && !query.data ? (
          <DashboardSkeleton />
        ) : query.isError ? (
          <section className="py-12" role="alert">
            <h2 className="text-xl font-semibold">Не удалось загрузить данные</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Проверьте доступность публичных API и CORS в браузере.
            </p>
            <button
              type="button"
              onClick={() => query.refetch()}
              className="mt-5 rounded-md bg-cyan-700 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
            >
              Повторить запрос
            </button>
          </section>
        ) : (
          <>
            <section
              className="border-b border-slate-200 py-5 dark:border-slate-800"
              aria-label="Dashboard filters"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="mr-2 text-sm font-semibold">Range</span>
                {ranges.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    aria-pressed={range === option.id}
                    onClick={() => {
                      updateUrl({ range: option.id, categoryIds: effectiveCategoryIds });
                    }}
                    className={`min-h-11 rounded-md border px-4 text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 ${
                      range === option.id
                        ? "border-cyan-700 bg-cyan-700 text-white"
                        : "border-slate-300 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <span className="mr-2 text-sm font-semibold">Categories</span>
                <button
                  type="button"
                  aria-pressed={effectiveCategoryIds === null}
                  onClick={() => {
                    updateUrl({ range, categoryIds: null });
                  }}
                  className="min-h-11 rounded-md border border-slate-300 px-3 text-sm dark:border-slate-700"
                >
                  All
                </button>
                {query.data.categories.map((category) => {
                  const selected = effectiveCategoryIds?.includes(category.id) ?? false;
                  return (
                    <label key={category.id} className="flex min-h-11 items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => {
                          const current =
                            selectedCategoryIds ?? query.data.categories.map((item) => item.id);
                          const nextCategoryIds = selected
                            ? current.filter((id) => id !== category.id)
                            : [...current, category.id];
                          updateUrl({ range, categoryIds: nextCategoryIds });
                        }}
                        className="size-4 accent-cyan-700"
                      />
                      {category.label}
                    </label>
                  );
                })}
              </div>
            </section>
            {effectiveCategoryIds?.length === 0 ? (
              <section className="border border-dashed border-slate-300 px-4 py-12 text-center dark:border-slate-700">
                <h2 className="text-lg font-semibold">No categories selected</h2>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  Select at least one category to display volume.
                </p>
              </section>
            ) : chartSeries.every((item) =>
                item.points.every((point) => point.volumeUsd === null),
              ) ? (
              <section className="border border-dashed border-slate-300 px-4 py-12 text-center dark:border-slate-700">
                <h2 className="text-lg font-semibold">No data for this period</h2>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  The selected categories have no volume points in this range.
                </p>
              </section>
            ) : (
              <section className="relative py-6">
                <VolumeChart series={chartSeries} />
                {query.isFetching ? (
                  <div className="pointer-events-none absolute right-6 top-9 rounded-full bg-slate-900/85 px-3 py-1 text-xs font-semibold text-white">
                    Updating data...
                  </div>
                ) : null}
              </section>
            )}
            <section className="grid gap-4 py-6 sm:grid-cols-3" aria-label="Data summary">
              <div className="border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                <p className="text-sm text-slate-500 dark:text-slate-400">Всего markets</p>
                <p className="mt-1 text-3xl font-bold">
                  {query.data.catalogMarketCounts.kalshi + query.data.catalogMarketCounts.polymarket}
                </p>
              </div>
              <div className="border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                <p className="text-sm text-slate-500 dark:text-slate-400">Kalshi</p>
                <p className="mt-1 text-3xl font-bold">
                  {query.data.catalogMarketCounts.kalshi}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  In chart: {query.data.selectedMarketCounts.kalshi}
                </p>
              </div>
              <div className="border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                <p className="text-sm text-slate-500 dark:text-slate-400">Polymarket</p>
                <p className="mt-1 text-3xl font-bold">
                  {query.data.catalogMarketCounts.polymarket}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  In chart: {query.data.selectedMarketCounts.polymarket}
                </p>
              </div>
              <div className="border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                <p className="text-sm text-slate-500 dark:text-slate-400">Period delta</p>
                <p
                  className={`mt-1 text-3xl font-bold ${periodDelta !== null && periodDelta < 0 ? "text-rose-600" : "text-emerald-600"}`}
                >
                  {periodDelta === null
                    ? "N/A"
                    : `${periodDelta >= 0 ? "+" : ""}${periodDelta.toFixed(1)}%`}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  (2-я половина − 1-я половина) / 1-я половина × 100%
                </p>
              </div>
            </section>
            <section className="grid gap-6 py-6 ">
              <CategoryShareChart data={categoryShare} />
            </section>
          </>
        )}
      </div>
    </main>
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-950 dark:bg-slate-950 dark:text-white sm:px-8">
          <p className="mx-auto max-w-7xl text-sm text-slate-600 dark:text-slate-300">
            Загружаю dashboard...
          </p>
        </main>
      }
    >
      <DashboardPage />
    </Suspense>
  );
}
