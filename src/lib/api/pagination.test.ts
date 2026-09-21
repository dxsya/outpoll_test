import { describe, expect, it } from "vitest";

import { mapWithConcurrency } from "@/lib/api/pagination";

describe("mapWithConcurrency", () => {
  it("never starts more work than its configured limit", async () => {
    let active = 0;
    let maxActive = 0;
    const results = await mapWithConcurrency([1, 2, 3], 2, async (value) => {
      active += 1;
      maxActive = Math.max(maxActive, active);
      await Promise.resolve();
      active -= 1;
      return value * 2;
    });

    expect(maxActive).toBe(2);
    expect(results).toEqual([2, 4, 6]);
  });
});
