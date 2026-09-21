import {
  CategoryShareChart,
  type CategoryShare,
} from "@/components/dashboard/category-share-chart";
import { useI18n } from "@/lib/i18n";
import type { DashboardMetric } from "@/types/market";

export function DashboardSummary({
  periodDelta,
  categoryShare,
  metric,
  totalVolume,
  averageDailyVolume,
  marketCount,
  onMetricChange,
}: {
  periodDelta: number | null;
  categoryShare: CategoryShare[];
  metric: DashboardMetric;
  totalVolume: number;
  averageDailyVolume: number;
  marketCount: number;
  onMetricChange: (metric: DashboardMetric) => void;
}) {
  const { t, formatValue } = useI18n();
  const metricValue =
    metric === "total"
      ? formatValue(totalVolume)
      : metric === "average"
        ? formatValue(averageDailyVolume)
        : marketCount.toLocaleString();
  const metricLabel =
    metric === "total"
      ? t("totalVolume")
      : metric === "average"
        ? t("averageDailyVolume")
        : t("marketCount");
  return (
    <>
      <section className="grid gap-4 py-6 sm:grid-cols-3" aria-label="Data summary">
        <div className="border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 sm:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-500 dark:text-slate-400">{t("metric")}</p>
            <div className="flex flex-wrap gap-2" role="group" aria-label={t("metric")}>
              {(["total", "average", "markets"] as const).map((option) => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={metric === option}
                  onClick={() => onMetricChange(option)}
                  className={`min-h-10 rounded-md border px-3 text-xs font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 ${
                    metric === option
                      ? "border-cyan-700 bg-cyan-700 text-white"
                      : "border-slate-300 dark:border-slate-700"
                  }`}
                >
                  {option === "total"
                    ? t("totalVolume")
                    : option === "average"
                      ? t("averageDailyVolume")
                      : t("marketCount")}
                </button>
              ))}
            </div>
          </div>
          <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">{metricLabel}</p>
          <p className="mt-1 text-3xl font-bold">{metricValue}</p>
        </div>
        <div className="border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <p className="text-sm text-slate-500 dark:text-slate-400">{t("periodDelta")}</p>
          <p
            className={`mt-1 text-3xl font-bold ${periodDelta !== null && periodDelta < 0 ? "text-rose-600" : "text-emerald-600"}`}
          >
            {periodDelta === null
              ? "N/A"
              : `${periodDelta >= 0 ? "+" : ""}${periodDelta.toFixed(1)}%`}
          </p>
          <p className="mt-1 text-xs text-slate-500">{t("periodDeltaFormula")}</p>
        </div>
      </section>
      <section className="grid gap-6 py-6">
        <CategoryShareChart data={categoryShare} />
      </section>
    </>
  );
}
