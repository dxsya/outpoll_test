import { fetchAllKalshiMarkets } from "@/lib/api/kalshi";
import { fetchPolymarketMarkets } from "@/lib/api/polymarket";
import type { DashboardRange, Market, Platform, PlatformSeries } from "@/types/market";

export type DashboardQueryParams = {
  range: DashboardRange;
  categoryIds: string[];
};

export function dashboardQueryKey(params: DashboardQueryParams) {
  return [
    "volume-dashboard",
    {
      range: params.range,
      categories: [...params.categoryIds].sort(),
    },
  ] as const;
}

export type DashboardData = {
  series: PlatformSeries[];
  categories: Array<{ id: string; label: string }>;
  markets: Market[];
  fetchedAt: number;
};

function normalizeKalshiMarkets(
  markets: Awaited<ReturnType<typeof fetchAllKalshiMarkets>>,
): Market[] {
  return markets.map((market) => ({
    id: market.ticker,
    platform: "kalshi" satisfies Platform,
    title: market.ticker,
    category: { id: "uncategorized", label: "Category from series metadata" },
    volumeMetric: "contract-notional-usd",
    source: {
      eventTicker: market.event_ticker,
      volumeContracts: market.volume_fp,
    },
  }));
}

function normalizePolymarketMarkets(
  markets: Awaited<ReturnType<typeof fetchPolymarketMarkets>>,
): Market[] {
  return markets.map((market) => ({
    id: market.conditionId,
    platform: "polymarket" satisfies Platform,
    title: market.question?.trim() || market.id,
    category: {
      id: market.category?.trim().toLowerCase() || "uncategorized",
      label: market.category?.trim() || "Uncategorized",
    },
    volumeMetric: "trade-notional-usdc",
    source: {
      gammaId: market.id,
      volumeUsd: market.volumeNum ?? null,
      closed: market.closed ?? null,
    },
  }));
}

export async function fetchDashboardSnapshotFromApis(signal: AbortSignal): Promise<DashboardData> {
  const [kalshiMarkets, polymarketMarkets] = await Promise.all([
    fetchAllKalshiMarkets(signal),
    fetchPolymarketMarkets(signal),
  ]);

  return {
    series: [],
    categories: [],
    markets: [
      ...normalizeKalshiMarkets(kalshiMarkets),
      ...normalizePolymarketMarkets(polymarketMarkets),
    ],
    fetchedAt: Date.now(),
  };
}

export async function fetchDashboardSnapshot(signal: AbortSignal): Promise<DashboardData> {
  const response = await fetch("/api/dashboard", { signal });
  if (!response.ok) {
    throw new Error(`Dashboard request failed with status ${response.status}`);
  }

  return (await response.json()) as DashboardData;
}
