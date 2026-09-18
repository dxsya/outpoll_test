import type { MarketCategory } from "@/types/market";

const CATEGORY_RULES: Array<{ id: string; label: string; matches: string[] }> = [
  {
    id: "politics",
    label: "Politics",
    matches: ["politic", "president", "primary", "election", "government"],
  },
  {
    id: "sports",
    label: "Sports",
    matches: ["sport", "nfl", "nba", "soccer", "football", "tennis", "hfc"],
  },
  { id: "weather", label: "Weather", matches: ["weather", "climate", "temperature"] },
  { id: "technology", label: "Technology", matches: ["technology", "science", "tech", "ai"] },
  {
    id: "entertainment",
    label: "Entertainment",
    matches: ["entertainment", "culture", "movie", "music"],
  },
  { id: "crypto", label: "Crypto", matches: ["crypto", "bitcoin", "ethereum", "blockchain"] },
  {
    id: "economics",
    label: "Economics",
    matches: ["economic", "economy", "finance", "market", "interest"],
  },
];

export function normalizeMarketCategory(value: string | null | undefined): MarketCategory {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) {
    return { id: "other", label: "Other" };
  }

  const rule = CATEGORY_RULES.find(({ matches }) =>
    matches.some((match) => normalized.includes(match)),
  );
  return rule ? { id: rule.id, label: rule.label } : { id: "other", label: "Other" };
}
