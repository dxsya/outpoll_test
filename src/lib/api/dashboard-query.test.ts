import { describe, expect, it } from "vitest";

import { dashboardQueryKey, getRangeWindow } from "@/lib/api/dashboard-query";

describe("dashboardQueryKey", () => {
  it("keeps an empty category selection distinct from all categories", () => {
    expect(dashboardQueryKey({ range: "30d", categoryIds: null })).not.toEqual(
      dashboardQueryKey({ range: "30d", categoryIds: [] }),
    );
  });

  it("normalizes category order for the same selection", () => {
    expect(dashboardQueryKey({ range: "30d", categoryIds: ["sports", "politics"] })).toEqual(
      dashboardQueryKey({ range: "30d", categoryIds: ["politics", "sports"] }),
    );
  });

  it("does not impose a fixed historical limit on the all-time range", () => {
    expect(getRangeWindow("all", 1_000_000)).toEqual({ startTs: 0, endTs: 1_000_000 });
  });
});
