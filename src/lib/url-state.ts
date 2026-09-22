import {
  platforms,
  type DashboardMetric,
  type DashboardRange,
  type CategoryScope,
  type Platform,
} from "@/types/market";

export type DashboardUrlState = {
  range: DashboardRange;
  categoryIds: string[] | null;
  platformIds: Platform[] | null;
  metric: DashboardMetric;
  categoryScope: CategoryScope;
};

const validRanges: DashboardRange[] = ["7d", "30d", "90d", "all"];
const validMetrics: DashboardMetric[] = ["total", "average", "markets"];
const validCategoryScopes: CategoryScope[] = ["both", "kalshi", "polymarket"];

export function parseDashboardUrlState(searchParams: URLSearchParams): DashboardUrlState {
  const rangeParam = searchParams.get("range");
  const range = validRanges.includes(rangeParam as DashboardRange)
    ? (rangeParam as DashboardRange)
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
        ].sort();
  const platformParam = searchParams.get("platforms");
  const platformIds =
    platformParam === null
      ? null
      : [
          ...new Set(
            platformParam
              .split(",")
              .filter((id): id is Platform => platforms.includes(id as Platform)),
          ),
        ].sort();
  const metricParam = searchParams.get("metric");
  const metric = validMetrics.includes(metricParam as DashboardMetric)
    ? (metricParam as DashboardMetric)
    : "total";
  const categoryScopeParam = searchParams.get("categoryScope");
  const categoryScope = validCategoryScopes.includes(categoryScopeParam as CategoryScope)
    ? (categoryScopeParam as CategoryScope)
    : "both";

  return { range, categoryIds, platformIds, metric, categoryScope };
}

export function serializeDashboardUrlState(state: DashboardUrlState): string {
  const params = new URLSearchParams();
  params.set("range", state.range);

  if (state.categoryIds !== null) {
    params.set("categories", [...new Set(state.categoryIds)].sort().join(","));
  }

  if (state.platformIds !== null) {
    params.set("platforms", [...new Set(state.platformIds)].sort().join(","));
  }

  if (state.metric !== "total") {
    params.set("metric", state.metric);
  }

  if (state.categoryScope !== "both") {
    params.set("categoryScope", state.categoryScope);
  }

  const query = params.toString();
  return query ? `?${query}` : "";
}
