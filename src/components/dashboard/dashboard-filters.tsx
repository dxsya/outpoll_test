import type { DashboardRange, MarketCategory } from "@/types/market";
import { useI18n } from "@/lib/i18n";

const ranges: Array<{ id: DashboardRange; label: string }> = [
  { id: "7d", label: "7d" },
  { id: "30d", label: "30d" },
  { id: "90d", label: "90d" },
  { id: "all", label: "allTime" },
];

type DashboardFiltersProps = {
  range: DashboardRange;
  selectedCategoryIds: string[] | null;
  effectiveCategoryIds: string[] | null;
  categories: MarketCategory[];
  disabled: boolean;
  onChange: (nextState: { range: DashboardRange; categoryIds: string[] | null }) => void;
};

export function DashboardFilters({
  range,
  selectedCategoryIds,
  effectiveCategoryIds,
  categories,
  disabled,
  onChange,
}: DashboardFiltersProps) {
  const { t, categoryLabel } = useI18n();
  return (
    <section
      className="border-b border-slate-200 py-5 dark:border-slate-800"
      aria-label={`${t("range")}, ${t("categories")}`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-2 text-sm font-semibold">{t("range")}</span>
        {ranges.map((option) => (
          <button
            key={option.id}
            type="button"
            disabled={disabled}
            aria-pressed={range === option.id}
            onClick={() => onChange({ range: option.id, categoryIds: effectiveCategoryIds })}
            className={`min-h-11 rounded-md border px-4 text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 disabled:cursor-not-allowed disabled:opacity-50 ${
              range === option.id
                ? "border-cyan-700 bg-cyan-700 text-white"
                : "border-slate-300 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            }`}
          >
            {option.label === "allTime" ? t("allTime") : option.label}
          </button>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <span className="mr-2 text-sm font-semibold">{t("categories")}</span>
        <button
          type="button"
          aria-pressed={effectiveCategoryIds === null}
          onClick={() => onChange({ range, categoryIds: null })}
          className={`min-h-11 rounded-md border px-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 ${
            effectiveCategoryIds === null
              ? "border-cyan-700 bg-cyan-700 text-white"
              : "border-slate-300 dark:border-slate-700"
          }`}
        >
          {t("all")}
        </button>
        {categories.map((category) => {
          const selected =
            effectiveCategoryIds === null || effectiveCategoryIds.includes(category.id);
          return (
            <label key={category.id} className="flex min-h-11 items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={selected}
                onChange={() => {
                  const current = selectedCategoryIds ?? categories.map((item) => item.id);
                  const nextCategoryIds = selected
                    ? current.filter((id) => id !== category.id)
                    : [...current, category.id];
                  onChange({ range, categoryIds: nextCategoryIds });
                }}
                className="size-4 accent-cyan-700"
              />
              {categoryLabel(category.id, category.label)}
            </label>
          );
        })}
        <span className="basis-full text-xs text-slate-500 dark:text-slate-400">
          {t("allCategoriesShown")}
        </span>
      </div>
    </section>
  );
}
