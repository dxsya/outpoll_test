import type { DashboardRange } from "@/types/market";

export type DashboardUrlState = {
  range: DashboardRange;
  categoryIds: string[] | null;
};

const validRanges: DashboardRange[] = ["7d", "30d", "90d", "all"];

export function parseDashboardUrlState(searchParams: URLSearchParams): DashboardUrlState {
  const rangeParam = searchParams.get("range");
  const range = validRanges.includes(rangeParam as DashboardRange)
    ? (rangeParam as DashboardRange)
    : "30d";
  const categoriesParam = searchParams.get("categories");

  if (categoriesParam === null) {
    return { range, categoryIds: null };
  }

  const categoryIds = [
    ...new Set(
      categoriesParam
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean),
    ),
  ].sort();
  return { range, categoryIds };
}

export function serializeDashboardUrlState(state: DashboardUrlState): string {
  const params = new URLSearchParams();
  params.set("range", state.range);

  if (state.categoryIds !== null) {
    params.set("categories", [...new Set(state.categoryIds)].sort().join(","));
  }

  const query = params.toString();
  return query ? `?${query}` : "";
}
