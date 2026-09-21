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
import { mapWithConcurrency } from "@/lib/api/pagination";
import type { RequestStats } from "@/lib/api/errors";
import type { DashboardRange, Market, Platform, PlatformSeries, VolumePoint } from "@/types/market";

const TOP_MARKETS_PER_CATEGORY = 15;
const HISTORY_REQUEST_CONCURRENCY = 4;

export type DashboardQueryParams = {
  range: DashboardRange;
  categoryIds: string[] | null;
};

export function dashboardQueryKey(params: DashboardQueryParams) {
  return [
    "volume-dashboard",
    {
      range: params.range,
      categories: params.categoryIds === null ? "all" : [...params.categoryIds].sort(),
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
  sourceErrors: Partial<Record<Platform, string>>;
  requestStats: Record<Platform, RequestStats>;
  fetchedAt: number;
};

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Public API request failed";
}

function setSourceError(
  sourceErrors: Partial<Record<Platform, string>>,
  platform: Platform,
  error: unknown,
): void {
  sourceErrors[platform] ??= errorMessage(error);
}

export function getRangeWindow(
  range: DashboardRange,
  endTs: number,
): { startTs: number; endTs: number } {
  if (range === "all") {
    return { startTs: 0, endTs };
  }

  const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
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
  categoryDefinitions: typeof DASHBOARD_CATEGORIES,
  requestStats: RequestStats,
): Promise<Map<string, KalshiCandidate[]>> {
  const byCategory = new Map<string, KalshiCandidate[]>(
    categoryDefinitions.map((definition) => [definition.id, []]),
  );
  const [openEvents, closedEvents] = await Promise.all([
    fetchAllKalshiEvents(signal, "open", undefined, requestStats),
    fetchAllKalshiEvents(signal, "closed", undefined, requestStats),
  ]);

  for (const event of [...openEvents, ...closedEvents]) {
    const definition = categoryDefinitions.find((item) => item.kalshiCategory === event.category);
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
  categoryDefinitions: typeof DASHBOARD_CATEGORIES,
  requestStats: RequestStats,
): Promise<Map<string, PolymarketMarket[]>> {
  const byCategory = new Map<string, PolymarketMarket[]>();
  await mapWithConcurrency(categoryDefinitions, HISTORY_REQUEST_CONCURRENCY, async (definition) => {
    const marketLists = await Promise.all(
      definition.polymarketTagIds.flatMap((tagId) => [
        fetchPolymarketMarketsByTag(tagId, false, signal, undefined, undefined, requestStats),
        fetchPolymarketMarketsByTag(tagId, true, signal, undefined, undefined, requestStats),
      ]),
    );
    byCategory.set(definition.id, [
      ...new Map(marketLists.flat().map((market) => [market.conditionId, market])).values(),
    ]);
  });

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
  const selectedCategories = categoryIds === null ? null : new Set(categoryIds);

  if (selectedCategories?.size === 0) {
    return {
      series: aggregateVolumePoints([], chooseAggregationBucket(range)),
      categories: DASHBOARD_CATEGORIES.map(categoryOf),
      markets: [],
      catalogMarketCounts: { kalshi: 0, polymarket: 0 },
      volumePoints: [],
      selectedMarketCounts: { kalshi: 0, polymarket: 0 },
      sourceErrors: {},
      requestStats: {
        kalshi: { sent: 0, failed: 0 },
        polymarket: { sent: 0, failed: 0 },
      },
      fetchedAt: Date.now(),
    };
  }

  const categoryDefinitions = DASHBOARD_CATEGORIES.filter(
    (definition) => selectedCategories === null || selectedCategories.has(definition.id),
  );
  const requestStats: Record<Platform, RequestStats> = {
    kalshi: { sent: 0, failed: 0 },
    polymarket: { sent: 0, failed: 0 },
  };

  const [kalshiCandidatesResult, polymarketCandidatesResult] = await Promise.allSettled([
    collectKalshiCandidatesByCategory(signal, categoryDefinitions, requestStats.kalshi),
    collectPolymarketCandidatesByCategory(signal, categoryDefinitions, requestStats.polymarket),
  ]);
  const sourceErrors: Partial<Record<Platform, string>> = {};
  const kalshiByCategory =
    kalshiCandidatesResult.status === "fulfilled" ? kalshiCandidatesResult.value : new Map();
  const polymarketByCategory =
    polymarketCandidatesResult.status === "fulfilled"
      ? polymarketCandidatesResult.value
      : new Map();
  if (kalshiCandidatesResult.status === "rejected") {
    setSourceError(sourceErrors, "kalshi", kalshiCandidatesResult.reason);
  }
  if (polymarketCandidatesResult.status === "rejected") {
    setSourceError(sourceErrors, "polymarket", polymarketCandidatesResult.reason);
  }

  const markets: Market[] = [];
  const pointGroups: VolumePoint[][] = [];
  const catalogMarketCounts = { kalshi: 0, polymarket: 0 };

  for (const definition of categoryDefinitions) {
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
      mapWithConcurrency(topKalshi, HISTORY_REQUEST_CONCURRENCY, async ({ market, seriesTicker }) =>
        Promise.allSettled([
          fetchKalshiCandlesticks(
            market,
            rangeWindow,
            seriesTicker,
            signal,
            definition.id,
            requestStats.kalshi,
          ),
        ]),
      ),
      mapWithConcurrency(topPolymarket, HISTORY_REQUEST_CONCURRENCY, async (market) =>
        Promise.allSettled([
          fetchAllPolymarketTrades(
            market,
            definition.id,
            signal,
            undefined,
            requestStats.polymarket,
          ).then((points) =>
              points.filter(
                (point) =>
                  point.timestamp >= rangeWindow.startTs && point.timestamp <= rangeWindow.endTs,
              ),
            ),
        ]),
      ),
    ]);

    for (const [result] of kalshiResults) {
      if (result.status === "fulfilled") {
        pointGroups.push(result.value);
      } else {
        setSourceError(sourceErrors, "kalshi", result.reason);
      }
    }
    for (const [result] of polymarketResults) {
      if (result.status === "fulfilled") {
        pointGroups.push(result.value);
      } else {
        setSourceError(sourceErrors, "polymarket", result.reason);
      }
    }
  }

  if (signal.aborted) {
    throw signal.reason;
  }

  const allPoints = pointGroups.flat();
  const categories = DASHBOARD_CATEGORIES.map(categoryOf);
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
    sourceErrors,
    requestStats,
    fetchedAt: Date.now(),
  };
}

export async function fetchDashboardSnapshot(
  signal: AbortSignal,
  range: DashboardRange = "30d",
  categoryIds: string[] | null = null,
): Promise<DashboardData> {
  return fetchDashboardSnapshotFromApis(signal, range, categoryIds);
}
