export const platforms = ["kalshi", "polymarket"] as const;

export type Platform = (typeof platforms)[number];

export type DashboardRange = "7d" | "30d" | "90d" | "all";

export type DashboardMetric = "total" | "average" | "markets";

export type CategoryScope = "both" | "kalshi" | "polymarket";

export type MarketCategory = {
  id: string;
  label: string;
};

export type Market = {
  id: string;
  platform: Platform;
  title: string;
  category: MarketCategory;
  volumeMetric: "contract-notional-usd" | "outcome-token-count";
  source: Record<string, boolean | number | string | null>;
};

export type VolumePoint = {
  timestamp: number;
  volumeUsd: number | null;
  marketId: string;
  categoryId: string;
  platform: Platform;
};

export type PlatformSeries = {
  platform: Platform;
  points: VolumePoint[];
};
