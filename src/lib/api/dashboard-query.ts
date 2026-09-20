import {
  fetchAllKalshiEvents,
  fetchKalshiCandlesticks,
  normalizeKalshiMarket,
  type KalshiMarket,
} from "@/lib/api/kalshi";
import {
  fetchAllPolymarketTrades,
  fetchPolymarketMarketsByTag,
  normalizePolymarketMarket,
  type PolymarketMarket,
} from "@/lib/api/polymarket";
import { aggregateVolumePoints, chooseAggregationBucket } from "@/lib/chart/aggregate-series";
import { DASHBOARD_CATEGORIES, categoryOf } from "@/lib/filters/normalize-category";
import type { DashboardRange, Market, PlatformSeries, VolumePoint } from "@/types/market";

const TOP_MARKETS_PER_CATEGORY = 15;
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

type KalshiCandidate = { market: KalshiMarket; seriesTicker: string };

/**
 * Kalshi's `/events?with_nested_markets=true` already reports each event's
 * category and its markets' volume, so one paged walk (open + closed) is
 * enough to bucket every candidate market into the three dashboard
 * categories, instead of a per-market series lookup.
 */
async function collectKalshiCandidatesByCategory(
  signal: AbortSignal,
): Promise<Map<string, KalshiCandidate[]>> {
  const byCategory = new Map<string, KalshiCandidate[]>(
    DASHBOARD_CATEGORIES.map((definition) => [definition.id, []]),
  );
  const [openEvents, closedEvents] = await Promise.all([
    fetchAllKalshiEvents(signal, "open"),
    fetchAllKalshiEvents(signal, "closed"),
  ]);

  for (const event of [...openEvents, ...closedEvents]) {
    const definition = DASHBOARD_CATEGORIES.find((item) => item.kalshiCategory === event.category);
    if (!definition || !event.markets) {
      continue;
    }

    const bucket = byCategory.get(definition.id);
    for (const market of event.markets) {
      bucket?.push({ market, seriesTicker: event.series_ticker });
    }
  }

  return byCategory;
}

async function collectPolymarketCandidatesByCategory(
  signal: AbortSignal,
): Promise<Map<string, PolymarketMarket[]>> {
  const byCategory = new Map<string, PolymarketMarket[]>();
  await Promise.all(
    DASHBOARD_CATEGORIES.map(async (definition) => {
      const marketLists = await Promise.all(
        definition.polymarketTagIds.flatMap((tagId) => [
          fetchPolymarketMarketsByTag(tagId, false, signal),
          fetchPolymarketMarketsByTag(tagId, true, signal),
        ]),
      );
      byCategory.set(definition.id, [
        ...new Map(marketLists.flat().map((market) => [market.conditionId, market])).values(),
      ]);
    }),
  );

  return byCategory;
}

function pickTopKalshi(candidates: KalshiCandidate[], limit: number): KalshiCandidate[] {
  return [...candidates]
    .sort((left, right) => {
      const diff = Number(right.market.volume_fp) - Number(left.market.volume_fp);
      return diff !== 0 ? diff : left.market.ticker.localeCompare(right.market.ticker);
    })
    .slice(0, limit);
}

function pickTopPolymarket(candidates: PolymarketMarket[], limit: number): PolymarketMarket[] {
  return [...candidates]
    .sort((left, right) => {
      const diff = (right.volumeNum ?? 0) - (left.volumeNum ?? 0);
      return diff !== 0 ? diff : left.conditionId.localeCompare(right.conditionId);
    })
    .slice(0, limit);
}

export async function fetchDashboardSnapshotFromApis(
  signal: AbortSignal,
  range: DashboardRange = "30d",
  categoryIds: string[] | null = null,
): Promise<DashboardData> {
  const endTs = Math.floor(Date.now() / 1000);
  const rangeWindow = getRangeWindow(range, endTs);

  const [kalshiByCategory, polymarketByCategory] = await Promise.all([
    collectKalshiCandidatesByCategory(signal),
    collectPolymarketCandidatesByCategory(signal),
  ]);

  const markets: Market[] = [];
  const pointGroups: VolumePoint[][] = [];
  const catalogMarketCounts = { kalshi: 0, polymarket: 0 };

  for (const definition of DASHBOARD_CATEGORIES) {
    const category = categoryOf(definition);
    const kalshiCandidates = kalshiByCategory.get(definition.id) ?? [];
    const polymarketCandidates = polymarketByCategory.get(definition.id) ?? [];
    catalogMarketCounts.kalshi += kalshiCandidates.length;
    catalogMarketCounts.polymarket += polymarketCandidates.length;

    const topKalshi = pickTopKalshi(kalshiCandidates, TOP_MARKETS_PER_CATEGORY);
    const topPolymarket = pickTopPolymarket(polymarketCandidates, TOP_MARKETS_PER_CATEGORY);

    markets.push(...topKalshi.map(({ market }) => normalizeKalshiMarket(market, category)));
    markets.push(...topPolymarket.map((market) => normalizePolymarketMarket(market, category)));

    const [kalshiResults, polymarketResults] = await Promise.all([
      Promise.allSettled(
        topKalshi.map(({ market, seriesTicker }) =>
          fetchKalshiCandlesticks(market, rangeWindow, seriesTicker, signal, definition.id),
        ),
      ),
      Promise.allSettled(
        topPolymarket.map(async (market) => {
          const points = await fetchAllPolymarketTrades(market, definition.id, signal);
          return points.filter(
            (point) =>
              point.timestamp >= rangeWindow.startTs && point.timestamp <= rangeWindow.endTs,
          );
        }),
      ),
    ]);

    for (const result of [...kalshiResults, ...polymarketResults]) {
      pointGroups.push(result.status === "fulfilled" ? result.value : []);
    }
  }

  const allPoints = pointGroups.flat();
  const categories = DASHBOARD_CATEGORIES.map(categoryOf);
  const selectedCategories = categoryIds === null ? null : new Set(categoryIds);
  const filteredMarkets = markets.filter(
    (market) => selectedCategories === null || selectedCategories.has(market.category.id),
  );
  const filteredMarketIds = new Set(
    filteredMarkets.map((market) => `${market.platform}:${market.id}`),
  );
  const filteredPoints = allPoints.filter((point) =>
    filteredMarketIds.has(`${point.platform}:${point.marketId}`),
  );
  const selectedMarketCounts = filteredMarkets.reduce(
    (counts, market) => {
      counts[market.platform] += 1;
      return counts;
    },
    { kalshi: 0, polymarket: 0 },
  );

  return {
    series: aggregateVolumePoints(filteredPoints, chooseAggregationBucket(range)),
    categories,
    markets: filteredMarkets,
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
