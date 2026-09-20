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
      { id: "sports", label: "Sports" },
    );

    expect(market).toMatchObject({
      id: "KXTEST-YES",
      title: "Test market title",
      category: { id: "sports", label: "Sports" },
      source: { status: "active", volumeContracts: "123.45" },
    });
  });

  it("attaches the resolved category to a Polymarket market", () => {
    const market = normalizePolymarketMarket(
      {
        id: "123",
        conditionId: "0xcondition",
        question: "Tagged market",
        volumeNum: 42,
        closed: false,
      },
      { id: "politics", label: "Politics" },
    );

    expect(market.category).toEqual({ id: "politics", label: "Politics" });
  });

  it("normalizes Polymarket trade notional", () => {
    const points = normalizePolymarketTrades(
      {
        id: "123",
        conditionId: "0xcondition",
      },
      [{ condition_id: "0xcondition", size: 10, price: 0.25, timestamp: 1_000 }],
      "sports",
    );

    expect(points[0]).toMatchObject({
      marketId: "0xcondition",
      categoryId: "sports",
      volumeUsd: 2.5,
    });
  });
});
