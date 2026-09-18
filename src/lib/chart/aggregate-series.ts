import type { DashboardRange, Market, Platform, PlatformSeries, VolumePoint } from "@/types/market";

export type AggregationBucket = "day" | "week" | "month";

const PLATFORM_ORDER: Platform[] = ["kalshi", "polymarket"];

export function filterMarketsByCategories(
  markets: readonly Market[],
  categoryIds: readonly string[] | null,
): Market[] {
  if (categoryIds === null) {
    return [...markets];
  }

  const selected = new Set(categoryIds);
  return markets.filter((market) => selected.has(market.category.id));
}

export function chooseAggregationBucket(range: DashboardRange): AggregationBucket {
  if (range === "7d" || range === "30d") {
    return "day";
  }

  if (range === "90d") {
    return "week";
  }

  return "month";
}

function startOfUtcBucket(timestamp: number, bucket: AggregationBucket): number {
  const date = new Date(timestamp * 1000);
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const day = date.getUTCDate();

  if (bucket === "month") {
    return Date.UTC(year, month, 1) / 1000;
  }

  if (bucket === "week") {
    const dayOfWeek = date.getUTCDay();
    const daysFromMonday = (dayOfWeek + 6) % 7;
    return Date.UTC(year, month, day - daysFromMonday) / 1000;
  }

  return Date.UTC(year, month, day) / 1000;
}

function pointKey(point: VolumePoint): string {
  return `${point.platform}:${point.marketId}:${point.timestamp}:${point.categoryId}`;
}

export function aggregateVolumePoints(
  points: readonly VolumePoint[],
  bucket: AggregationBucket,
): PlatformSeries[] {
  const uniquePoints = new Map<string, VolumePoint>();
  for (const point of points) {
    uniquePoints.set(pointKey(point), point);
  }

  const totals = new Map<Platform, Map<number, number>>();
  for (const platform of PLATFORM_ORDER) {
    totals.set(platform, new Map());
  }

  for (const point of uniquePoints.values()) {
    if (point.volumeUsd === null) {
      continue;
    }

    const bucketTimestamp = startOfUtcBucket(point.timestamp, bucket);
    const platformTotals = totals.get(point.platform);
    if (!platformTotals) {
      continue;
    }

    platformTotals.set(
      bucketTimestamp,
      (platformTotals.get(bucketTimestamp) ?? 0) + point.volumeUsd,
    );
  }

  const timestamps = [
    ...new Set([...totals.values()].flatMap((platform) => [...platform.keys()])),
  ].sort((left, right) => left - right);

  return PLATFORM_ORDER.map((platform) => {
    const platformTotals = totals.get(platform) ?? new Map<number, number>();
    return {
      platform,
      points: timestamps.map((timestamp) => ({
        timestamp,
        volumeUsd: platformTotals.get(timestamp) ?? null,
        marketId: "aggregated",
        categoryId: "aggregated",
        platform,
      })),
    };
  });
}
