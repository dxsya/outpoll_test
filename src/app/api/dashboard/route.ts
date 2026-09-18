import { NextResponse } from "next/server";

import { fetchDashboardSnapshotFromApis } from "@/lib/api/dashboard-query";
import type { DashboardRange } from "@/types/market";

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
    const data = await fetchDashboardSnapshotFromApis(request.signal, range, categoryIds);
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Dashboard request failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
