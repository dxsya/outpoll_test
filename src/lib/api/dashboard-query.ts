import {
  fetchAllKalshiMarkets,
  fetchKalshiCandlesticks,
  fetchKalshiCategory,
  normalizeKalshiMarket,
} from "@/lib/api/kalshi";
import {
  fetchAllPolymarketTrades,
  fetchPolymarketMarkets,
  normalizePolymarketMarket,
} from "@/lib/api/polymarket";
import { aggregateVolumePoints, chooseAggregationBucket } from "@/lib/chart/aggregate-series";
import type { DashboardRange, Market, PlatformSeries, VolumePoint } from "@/types/market";

const TOP_MARKET_LIMIT = 12;
const ALL_RANGE_DAYS = 365;

export type DashboardQueryParams = {
  range: DashboardRange;
  categoryIds: string[] | null;
};

export function dashboardQueryKey(params: DashboardQueryParams) {
  return [
    "volume-dashboard",
    {
      range: params.range,
      categories: [...(params.categoryIds ?? [])].sort(),
    },
  ] as const;
}

export type DashboardData = {
  series: PlatformSeries[];
  categories: Array<{ id: string; label: string }>;
  markets: Market[];
  catalogMarketCounts: { kalshi: number; polymarket: number };
  volumePoints: VolumePoint[];
  selectedMarketCounts: { kalshi: number; polymarket: number };
  fetchedAt: number;
};

function getRangeWindow(range: DashboardRange, endTs: number): { startTs: number; endTs: number } {
  const days = range === "7d" ? 7 : range === "30d" ? 30 : range === "90d" ? 90 : ALL_RANGE_DAYS;
  return { startTs: endTs - days * 24 * 60 * 60, endTs };
}

export async function fetchDashboardSnapshotFromApis(
  signal: AbortSignal,
  range: DashboardRange = "30d",
  categoryIds: string[] | null = null,
): Promise<DashboardData> {
  const [kalshiMarkets, historicalKalshiMarkets, polymarketMarkets] = await Promise.all([
    fetchAllKalshiMarkets(signal),
    fetchAllKalshiMarkets(signal, "closed"),
    fetchPolymarketMarkets(signal),
  ]);

  const endTs = Math.floor(Date.now() / 1000);
  const rangeWindow = getRangeWindow(range, endTs);
  const candidateMarkets = [
    ...new Map(
      [...kalshiMarkets, ...historicalKalshiMarkets].map((market) => [market.ticker, market]),
    ).values(),
  ];
  const historicalMarketCandidates = candidateMarkets
    .filter((market) => Number(market.volume_fp) > 0)
    .sort((left, right) => Number(right.volume_fp) - Number(left.volume_fp))
    .slice(0, TOP_MARKET_LIMIT);
  const kalshiLookups = new Map<string, Awaited<ReturnType<typeof fetchKalshiCategory>>>();
  await Promise.all(
    historicalMarketCandidates.map(async (market) => {
      try {
        kalshiLookups.set(
          market.event_ticker,
          await fetchKalshiCategory(market.event_ticker, signal),
        );
      } catch {}
    }),
  );
  const normalizeKalshi = (market: Awaited<ReturnType<typeof fetchAllKalshiMarkets>>[number]) =>
    normalizeKalshiMarket(
      market,
      kalshiLookups.get(market.event_ticker) ?? {
        category: { id: "other", label: "Other" },
        seriesTicker: market.event_ticker,
      },
    );
  const topPolymarketMarkets = [...polymarketMarkets]
    .sort((left, right) => (right.volumeNum ?? 0) - (left.volumeNum ?? 0))
    .slice(0, TOP_MARKET_LIMIT);
  const chartMarkets = [
    ...historicalMarketCandidates.map(normalizeKalshi),
    ...topPolymarketMarkets.map(normalizePolymarketMarket),
  ];
  const points = await Promise.all([
    Promise.allSettled(
      historicalMarketCandidates.map(async (market) => {
        const lookup =
          kalshiLookups.get(market.event_ticker) ??
          (await fetchKalshiCategory(market.event_ticker, signal));
        return fetchKalshiCandlesticks(
          market,
          rangeWindow,
          lookup.seriesTicker,
          signal,
          lookup.category.id,
        );
      }),
    ),
    Promise.allSettled(
      topPolymarketMarkets.map(async (market) => {
        const points = await fetchAllPolymarketTrades(market, signal);
        return points.filter(
          (point) => point.timestamp >= rangeWindow.startTs && point.timestamp <= rangeWindow.endTs,
        );
      }),
    ),
  ]).then((results) =>
    results.flatMap((platformResults) =>
      platformResults.flatMap((result) => (result.status === "fulfilled" ? result.value : [])),
    ),
  );
  const markets = [
    ...new Map(
      [...kalshiMarkets, ...historicalKalshiMarkets].map((market) => {
        const normalized = normalizeKalshi(market);
        return [normalized.id, normalized] as const;
      }),
    ).values(),
    ...polymarketMarkets.map(normalizePolymarketMarket),
  ];
  const catalogMarketCounts = markets.reduce(
    (counts, market) => {
      counts[market.platform] += 1;
      return counts;
    },
    { kalshi: 0, polymarket: 0 },
  );
  const categories = [
    ...new Map(chartMarkets.map((market) => [market.category.id, market.category])).values(),
  ].sort((left, right) => left.label.localeCompare(right.label));
  const selectedCategories = categoryIds === null ? null : new Set(categoryIds);
  const filteredChartMarkets = chartMarkets.filter(
    (market) => selectedCategories === null || selectedCategories.has(market.category.id),
  );
  const filteredMarketIds = new Set(
    filteredChartMarkets.map((market) => `${market.platform}:${market.id}`),
  );
  const filteredPoints =
    selectedCategories === null
      ? points
      : points.filter((point) => filteredMarketIds.has(`${point.platform}:${point.marketId}`));
  const selectedMarketCounts = filteredChartMarkets.reduce(
    (counts, market) => {
      counts[market.platform] += 1;
      return counts;
    },
    { kalshi: 0, polymarket: 0 },
  );

  return {
    series: aggregateVolumePoints(filteredPoints, chooseAggregationBucket(range)),
    categories,
    markets: filteredChartMarkets,
    catalogMarketCounts,
    volumePoints: filteredPoints,
    selectedMarketCounts,
    fetchedAt: Date.now(),
  };
}

export async function fetchDashboardSnapshot(
  signal: AbortSignal,
  range: DashboardRange = "30d",
  categoryIds: string[] | null = null,
): Promise<DashboardData> {
  const params = new URLSearchParams({ range });
  if (categoryIds !== null) {
    params.set("categories", [...categoryIds].sort().join(","));
  }
  const response = await fetch(`/api/dashboard?${params.toString()}`, { signal });
  if (!response.ok) {
    throw new Error(`Dashboard request failed with status ${response.status}`);
  }

  return (await response.json()) as DashboardData;
}
