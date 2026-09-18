import { describe, expect, it } from "vitest";

import {
  aggregateVolumePoints,
  chooseAggregationBucket,
  filterMarketsByCategories,
} from "@/lib/chart/aggregate-series";
import type { Market, VolumePoint } from "@/types/market";

const market = (id: string, categoryId: string): Market => ({
  id,
  platform: "kalshi",
  title: id,
  category: { id: categoryId, label: categoryId },
  volumeMetric: "contract-notional-usd",
  source: {},
});

const point = (overrides: Partial<VolumePoint>): VolumePoint => ({
  timestamp: 0,
  volumeUsd: 1,
  marketId: "market-1",
  categoryId: "politics",
  platform: "kalshi",
  ...overrides,
});

describe("domain volume aggregation", () => {
  it("filters all, selected, and explicitly empty categories", () => {
    const markets = [market("politics-1", "politics"), market("sports-1", "sports")];

    expect(filterMarketsByCategories(markets, null)).toEqual(markets);
    expect(filterMarketsByCategories(markets, ["sports"])).toEqual([markets[1]]);
    expect(filterMarketsByCategories(markets, [])).toEqual([]);
  });

  it("aggregates duplicate points once and keeps missing platforms as null", () => {
    const points = [
      point({ timestamp: Date.UTC(2026, 0, 5, 12) / 1000, volumeUsd: 10 }),
      point({ timestamp: Date.UTC(2026, 0, 5, 12) / 1000, volumeUsd: 10 }),
      point({
        timestamp: Date.UTC(2026, 0, 5, 13) / 1000,
        volumeUsd: null,
        marketId: "market-2",
      }),
    ];

    const series = aggregateVolumePoints(points, "day");

    expect(series).toEqual([
      {
        platform: "kalshi",
        points: [
          {
            timestamp: Date.UTC(2026, 0, 5) / 1000,
            volumeUsd: 10,
            marketId: "aggregated",
            categoryId: "aggregated",
            platform: "kalshi",
          },
        ],
      },
      {
        platform: "polymarket",
        points: [
          {
            timestamp: Date.UTC(2026, 0, 5) / 1000,
            volumeUsd: null,
            marketId: "aggregated",
            categoryId: "aggregated",
            platform: "polymarket",
          },
        ],
      },
    ]);
  });

  it("uses UTC boundaries for day and Monday boundaries for week", () => {
    const points = [
      point({ timestamp: Date.UTC(2026, 0, 5, 23, 59) / 1000, volumeUsd: 2 }),
      point({ timestamp: Date.UTC(2026, 0, 6, 0, 1) / 1000, volumeUsd: 3 }),
    ];

    expect(aggregateVolumePoints(points, "day")[0].points.map((item) => item.timestamp)).toEqual([
      Date.UTC(2026, 0, 5) / 1000,
      Date.UTC(2026, 0, 6) / 1000,
    ]);
    expect(aggregateVolumePoints(points, "week")[0].points).toHaveLength(1);
    expect(aggregateVolumePoints(points, "week")[0].points[0].volumeUsd).toBe(5);
  });

  it("chooses coarser buckets for longer ranges", () => {
    expect(chooseAggregationBucket("7d")).toBe("day");
    expect(chooseAggregationBucket("30d")).toBe("day");
    expect(chooseAggregationBucket("90d")).toBe("week");
    expect(chooseAggregationBucket("all")).toBe("month");
  });

  it("supports long ranges with monthly aggregation", () => {
    const series = aggregateVolumePoints(
      [
        point({ timestamp: Date.UTC(2020, 0, 1) / 1000, volumeUsd: 4 }),
        point({ timestamp: Date.UTC(2030, 11, 31) / 1000, volumeUsd: 6 }),
      ],
      "month",
    );

    expect(series[0].points.map((item) => item.timestamp)).toEqual([
      Date.UTC(2020, 0, 1) / 1000,
      Date.UTC(2030, 11, 1) / 1000,
    ]);
  });
});
