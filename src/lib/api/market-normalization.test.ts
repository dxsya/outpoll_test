import { describe, expect, it } from "vitest";

import { normalizeKalshiMarket } from "@/lib/api/kalshi";
import { normalizePolymarketMarket, normalizePolymarketTrades } from "@/lib/api/polymarket";

describe("market normalization", () => {
  it("keeps Kalshi title, status, and category metadata", () => {
    const market = normalizeKalshiMarket(
      {
        ticker: "KXTEST-YES",
        event_ticker: "KXTEST",
        title: "Test market title",
        status: "active",
        volume_fp: "123.45",
      },
      { category: { id: "sports", label: "Sports" }, seriesTicker: "KXTEST-S" },
    );

    expect(market).toMatchObject({
      id: "KXTEST-YES",
      title: "Test market title",
      category: { id: "sports", label: "Sports" },
      source: { status: "active", volumeContracts: "123.45" },
    });
  });

  it("uses Polymarket tags when category is absent", () => {
    const market = normalizePolymarketMarket({
      id: "123",
      conditionId: "0xcondition",
      question: "Tagged market",
      tags: [{ id: "2", label: "Politics", slug: "politics" }],
      volumeNum: 42,
      closed: false,
    });

    expect(market.category).toEqual({ id: "politics", label: "Politics" });
  });

  it("normalizes Polymarket trade notional", () => {
    const points = normalizePolymarketTrades(
      {
        id: "123",
        conditionId: "0xcondition",
        category: "Sports",
      },
      [{ condition_id: "0xcondition", size: 10, price: 0.25, timestamp: 1_000 }],
    );

    expect(points[0]).toMatchObject({
      marketId: "0xcondition",
      categoryId: "sports",
      volumeUsd: 2.5,
    });
  });
});
