import { NextResponse } from "next/server";

import { fetchDashboardSnapshotFromApis } from "@/lib/api/dashboard-query";

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const data = await fetchDashboardSnapshotFromApis(request.signal);
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Dashboard request failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
