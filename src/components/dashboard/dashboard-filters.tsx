import {
  platforms,
  type CategoryScope,
  type DashboardRange,
  type MarketCategory,
  type Platform,
} from "@/types/market";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "../ui/card";

const ranges: Array<{ id: DashboardRange; label: string }> = [
  { id: "7d", label: "7d" },
  { id: "30d", label: "30d" },
  { id: "90d", label: "90d" },
  { id: "all", label: "allTime" },
];

function FilterIcon({ type }: { type: "calendar" | "tag" | "filter" }) {
  if (type === "calendar") {
    return (
      <svg aria-hidden="true" className="size-4 text-blue-500" viewBox="0 0 16 16" fill="none">
        <rect x="2.25" y="3.25" width="11.5" height="10" rx="1" stroke="currentColor" />
        <path d="M5 2v3M11 2v3M2.5 6.5h11" stroke="currentColor" />
      </svg>
    );
  }

  if (type === "tag") {
    return (
      <svg aria-hidden="true" className="size-4 text-blue-500" viewBox="0 0 16 16" fill="none">
        <path d="M2.5 3.5v4l6 6 5-5-6-6h-5Z" stroke="currentColor" strokeLinejoin="round" />
        <circle cx="5.25" cy="5.25" r=".9" fill="currentColor" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" className="size-4 text-blue-500" viewBox="0 0 16 16" fill="none">
      <path d="M2.5 3.5h11L9.5 8v4l-3 1V8l-4-4.5Z" stroke="currentColor" strokeLinejoin="round" />
    </svg>
  );
}

type DashboardFiltersProps = {
  range: DashboardRange;
  selectedCategoryIds: string[] | null;
  effectiveCategoryIds: string[] | null;
  platformIds: Platform[] | null;
  categoryScope: CategoryScope;
  categories: MarketCategory[];
  onChange: (nextState: {
    range: DashboardRange;
    categoryIds: string[] | null;
    platformIds: Platform[] | null;
    categoryScope?: CategoryScope;
  }) => void;
};

export function DashboardFilters({
  range,
  selectedCategoryIds,
  effectiveCategoryIds,
  platformIds,
  categoryScope,
  categories,
  onChange,
}: DashboardFiltersProps) {
  const { t, categoryLabel } = useI18n();
  return (
    <div
      className="mt-6 grid gap-3 sm:grid-cols-3"
      aria-label={`${t("range")}, ${t("categories")}`}
    >
      <Card className="flex flex-col gap-2" aria-label={t("range")}>
        <h2 className="mr-2 flex items-center gap-2 text-sm font-semibold">
          <FilterIcon type="calendar" />
          {t("range")}
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          {ranges.map((option) => (
            <Button
              key={option.id}
              type="button"
              aria-pressed={range === option.id}
              variant={range === option.id ? "primary" : "default"}
              onClick={() =>
                onChange({ range: option.id, categoryIds: effectiveCategoryIds, platformIds })
              }
              className="px-4"
            >
              {option.label === "allTime" ? t("allTime") : option.label}
            </Button>
          ))}
        </div>
      </Card>
      <Card className="flex flex-col gap-2" aria-label={t("categories")}>
        <h2 className="mr-2 flex items-center gap-2 text-sm font-semibold">
          <FilterIcon type="tag" />
          {t("categories")}
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          {categories.map((category) => {
            const selected =
              effectiveCategoryIds === null || effectiveCategoryIds.includes(category.id);
            return (
              <label
                key={category.id}
                className="group relative flex min-h-9 cursor-pointer items-center"
              >
                <Checkbox
                  checked={selected}
                  className="peer sr-only"
                  onChange={() => {
                    const current = selectedCategoryIds ?? categories.map((item) => item.id);
                    const nextCategoryIds = selected
                      ? current.filter((id) => id !== category.id)
                      : [...current, category.id];
                    onChange({ range, categoryIds: nextCategoryIds, platformIds });
                  }}
                />
                <span className="flex min-h-9 items-center gap-2 rounded-md border border-slate-300 px-3 text-sm font-semibold text-slate-700 transition-colors peer-checked:border-blue-500 peer-checked:bg-blue-500 peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-blue-500 dark:border-slate-700 dark:text-slate-200 dark:peer-checked:border-blue-400 dark:peer-checked:bg-blue-400 dark:peer-checked:text-slate-950">
                  <svg
                    aria-hidden="true"
                    className="size-3.5 opacity-0 transition-opacity group-has-checked:opacity-100"
                    viewBox="0 0 16 16"
                    fill="none"
                  >
                    <path d="m3 8 3 3 7-7" stroke="currentColor" strokeWidth="2" />
                  </svg>
                  {categoryLabel(category.id, category.label)}
                </span>
              </label>
            );
          })}
        </div>
      </Card>

      <Card className="flex flex-col gap-2" aria-label={t("categoryScope")}>
        <h2 className="mr-2 flex items-center gap-2 text-sm font-semibold">
          <FilterIcon type="filter" />
          {t("categoryScope")}
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          {(["both", "kalshi", "polymarket"] as const).map((scope) => (
            <Button
              key={scope}
              type="button"
              aria-pressed={categoryScope === scope}
              variant={categoryScope === scope ? "primary" : "default"}
              onClick={() =>
                onChange({
                  range,
                  categoryIds: effectiveCategoryIds,
                  platformIds,
                  categoryScope: scope,
                })
              }
              className="font-normal"
            >
              {scope === "both"
                ? t("scopeBoth")
                : scope === "kalshi"
                  ? t("scopeKalshi")
                  : t("scopePolymarket")}
            </Button>
          ))}
        </div>
      </Card>
    </div>
  );
}
