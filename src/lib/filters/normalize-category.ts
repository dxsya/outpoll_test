import type { MarketCategory } from "@/types/market";

export type DashboardCategoryId = "politics" | "weather" | "sports";

type DashboardCategoryDefinition = {
  id: DashboardCategoryId;
  label: string;
  /** Exact `series.category` / `event.category` string reported by Kalshi. */
  kalshiCategory: string;
  /** Polymarket Gamma tag ids that map onto this category. */
  polymarketTagIds: string[];
};

// The dashboard tracks exactly these three categories, matched by exact
// platform fields (Kalshi category, Polymarket tag id) instead of keyword
// guessing, so both platforms report the same category for the same markets.
export const DASHBOARD_CATEGORIES: readonly DashboardCategoryDefinition[] = [
  { id: "politics", label: "Politics", kalshiCategory: "Politics", polymarketTagIds: ["2"] },
  {
    id: "weather",
    label: "Weather",
    kalshiCategory: "Climate and Weather",
    polymarketTagIds: ["84", "87"],
  },
  { id: "sports", label: "Sports", kalshiCategory: "Sports", polymarketTagIds: ["1"] },
];

export function categoryOf(definition: DashboardCategoryDefinition): MarketCategory {
  return { id: definition.id, label: definition.label };
}

export function normalizeKalshiEventCategory(
  category: string | null | undefined,
): MarketCategory | null {
  const definition = DASHBOARD_CATEGORIES.find((item) => item.kalshiCategory === category);
  return definition ? categoryOf(definition) : null;
}

export function normalizePolymarketTagCategory(tagIds: string[]): MarketCategory | null {
  const definition = DASHBOARD_CATEGORIES.find((item) =>
    item.polymarketTagIds.some((tagId) => tagIds.includes(tagId)),
  );
  return definition ? categoryOf(definition) : null;
}
