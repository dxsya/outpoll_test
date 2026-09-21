import {
  CategoryShareChart,
  type CategoryShare,
} from "@/components/dashboard/category-share-chart";
import { useI18n } from "@/lib/i18n";

export function DashboardSummary({
  periodDelta,
  categoryShare,
}: {
  periodDelta: number | null;
  categoryShare: CategoryShare[];
}) {
  const { t } = useI18n();
  return (
    <>
      <section className="grid gap-4 py-6 sm:grid-cols-3" aria-label="Data summary">
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
