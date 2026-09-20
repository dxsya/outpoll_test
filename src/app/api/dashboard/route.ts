import { unstable_cache } from "next/cache";
import { NextResponse } from "next/server";

import { fetchDashboardSnapshotFromApis } from "@/lib/api/dashboard-query";
import type { DashboardRange } from "@/types/market";

// `export const revalidate` has no effect here: this GET handler reads the
// Request object (for query params), which opts the route out of Next's
// route-segment cache. Cache the snapshot explicitly instead, keyed by the
// serializable range/category params, so identical params reuse the same
// market selection and totals for 5 minutes instead of re-picking "top by
// current live volume" markets (which shift constantly) on every request.
const getCachedDashboardSnapshot = unstable_cache(
  async (range: DashboardRange, categoryIds: string[] | null) =>
    fetchDashboardSnapshotFromApis(new AbortController().signal, range, categoryIds),
  ["dashboard-snapshot"],
  { revalidate: 300 },
);

const ranges: DashboardRange[] = ["7d", "30d", "90d", "all"];

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const searchParams = new URL(request.url).searchParams;
    const requestedRange = searchParams.get("range");
    const range = ranges.includes(requestedRange as DashboardRange)
      ? (requestedRange as DashboardRange)
      : "30d";
    const categoriesParam = searchParams.get("categories");
    const categoryIds =
      categoriesParam === null
        ? null
        : [
            ...new Set(
              categoriesParam
                .split(",")
                .map((id) => id.trim())
                .filter(Boolean),
            ),
          ];
    const data = await getCachedDashboardSnapshot(range, categoryIds);
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Dashboard request failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
