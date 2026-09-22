import { describe, expect, it } from "vitest";

import { parseDashboardUrlState, serializeDashboardUrlState } from "@/lib/url-state";

describe("dashboard URL state", () => {
  it("uses safe defaults for an invalid range and preserves all categories", () => {
    expect(parseDashboardUrlState(new URLSearchParams("range=unknown"))).toEqual({
      range: "30d",
      categoryIds: null,
      platformIds: null,
      metric: "total",
      categoryScope: "both",
    });
  });

  it("keeps an explicit empty selection for the empty state", () => {
    expect(parseDashboardUrlState(new URLSearchParams("range=7d&categories="))).toEqual({
      range: "7d",
      categoryIds: [],
      platformIds: null,
      metric: "total",
      categoryScope: "both",
    });
    expect(
      serializeDashboardUrlState({
        range: "7d",
        categoryIds: null,
        platformIds: null,
        metric: "total",
        categoryScope: "both",
      }),
    ).toBe("?range=7d");
    expect(
      serializeDashboardUrlState({
        range: "7d",
        categoryIds: [],
        platformIds: null,
        metric: "total",
        categoryScope: "both",
      }),
    ).toBe("?range=7d&categories=");
  });

  it("deduplicates and sorts categories for a stable URL", () => {
    expect(
      serializeDashboardUrlState({
        range: "90d",
        categoryIds: ["sports", "politics", "sports"],
        platformIds: null,
        metric: "total",
        categoryScope: "both",
      }),
    ).toBe("?range=90d&categories=politics%2Csports");
    expect(
      parseDashboardUrlState(new URLSearchParams("categories=sports,politics,sports")),
    ).toEqual({
      range: "30d",
      categoryIds: ["politics", "sports"],
      platformIds: null,
      metric: "total",
      categoryScope: "both",
    });
  });

  it("round-trips platform and metric selections", () => {
    const state = {
      range: "30d" as const,
      categoryIds: null,
      platformIds: ["polymarket", "kalshi"] as ("kalshi" | "polymarket")[],
      metric: "average" as const,
      categoryScope: "polymarket" as const,
    };
    const serialized = serializeDashboardUrlState(state);
    expect(serialized).toBe(
      "?range=30d&platforms=kalshi%2Cpolymarket&metric=average&categoryScope=polymarket",
    );
    expect(parseDashboardUrlState(new URLSearchParams(serialized))).toEqual({
      ...state,
      platformIds: ["kalshi", "polymarket"],
    });
  });

  it("round-trips category scope selections", () => {
    const state = {
      range: "30d" as const,
      categoryIds: ["sports"],
      platformIds: null,
      metric: "total" as const,
      categoryScope: "kalshi" as const,
    };
    const serialized = serializeDashboardUrlState(state);
    expect(serialized).toBe("?range=30d&categories=sports&categoryScope=kalshi");
    expect(parseDashboardUrlState(new URLSearchParams(serialized))).toEqual(state);
  });
});
