import {
  CategoryShareChart,
  type CategoryShare,
} from "@/components/dashboard/category-share-chart";
import { useI18n } from "@/lib/i18n";
import type { DashboardMetric, Platform } from "@/types/market";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function DashboardSummary({
  periodDelta,
  categoryShare,
  metric,
  totalVolume,
  averageDailyVolume,
  marketCount,
  onMetricChange,
  platformVolumes,
  platformLastTimestamps,
}: {
  periodDelta: number | null;
  categoryShare: CategoryShare[];
  metric: DashboardMetric;
  totalVolume: number;
  averageDailyVolume: number;
  marketCount: number;
  onMetricChange: (metric: DashboardMetric) => void;
  platformVolumes: Record<Platform, number>;
  platformLastTimestamps: Record<Platform, number | null>;
}) {
  const { t, formatValue, formatDate } = useI18n();
  const metricValue =
    metric === "average" ? formatValue(averageDailyVolume) : formatValue(totalVolume);
  const metricLabel = metric === "average" ? t("averageDailyVolume") : t("totalVolume");
  const platformTotal = platformVolumes.kalshi + platformVolumes.polymarket;
  const platformShare = (platform: Platform): number =>
    platformTotal === 0 ? 0 : (platformVolumes[platform] / platformTotal) * 100;
  return (
    <>
      <section className="py-6" aria-label="Data summary">
        <Card className="overflow-hidden border-blue-100 bg-white p-0 text-slate-950 dark:border-slate-800 dark:bg-slate-900 dark:text-white">
          <div className="grid sm:grid-cols-2">
            <div className="border-b border-slate-200 p-2 dark:border-slate-800 sm:border-b-0 sm:border-r">
              <div className="flex">
                <div className="flex gap-3" role="group" aria-label={t("metric")}>
                  {(["total", "average"] as const).map((option) => (
                    <Button
                      key={option}
                      type="button"
                      aria-pressed={metric === option}
                      variant={metric === option ? "primary" : "default"}
                      onClick={() => onMetricChange(option)}
                      className="min-h-8.5 px-3 text-sm"
                    >
                      {option === "total" ? t("totalVolume") : t("averageDailyVolume")}
                    </Button>
                  ))}
                </div>
              </div>
              <p className="mt-2 text-4xl font-bold tracking-tight">{metricValue}</p>
              <div className="mt-2 flex items-center gap-3">
                <span
                  className={`px-2 py-1 text-xs font-semibold ${periodDelta !== null && periodDelta < 0 ? "bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-300" : "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-300"}`}
                >
                  {periodDelta === null
                    ? "N/A"
                    : `${periodDelta >= 0 ? "+" : ""}${periodDelta.toFixed(1)}%`}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {t("periodDeltaFormula")}
                </span>
              </div>
            </div>
            <div
              className="flex h-full flex-col justify-center space-y-4 px-4 py-2"
              aria-label={t("platforms")}
            >
              {(["kalshi", "polymarket"] as const).map((platform) => {
                const share = platformShare(platform);
                const isKalshi = platform === "kalshi";
                return (
                  <div key={platform}>
                    <div className="flex items-center justify-between text-sm font-semibold text-slate-700 dark:text-slate-200">
                      <span className="flex items-center gap-2">
                        <span className={`size-2 ${isKalshi ? "bg-cyan-500" : "bg-orange-500"}`} />
                        {platform === "kalshi" ? "Kalshi" : "Polymarket"}
                      </span>
                      <span>
                        {formatValue(platformVolumes[platform])} · {share.toFixed(0)}%
                      </span>
                    </div>
                    <div className="mt-2 h-1 bg-slate-100 dark:bg-slate-800">
                      <div
                        className={`h-full ${isKalshi ? "bg-cyan-500" : "bg-orange-500"}`}
                        style={{ width: `${share}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-slate-200 px-5 py-3 text-sm dark:border-slate-800">
            <span className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
              <svg aria-hidden="true" className="size-4" viewBox="0 0 16 16" fill="none">
                <rect x="2.25" y="2.25" width="4" height="4" stroke="currentColor" />
                <rect x="9.75" y="2.25" width="4" height="4" stroke="currentColor" />
                <rect x="2.25" y="9.75" width="4" height="4" stroke="currentColor" />
                <rect x="9.75" y="9.75" width="4" height="4" stroke="currentColor" />
              </svg>
              {t("marketCount")}
            </span>
            <strong>
              {marketCount.toLocaleString()} {t("markets")}
            </strong>
          </div>
        </Card>
      </section>
      <section className="grid gap-6 py-6">
        <CategoryShareChart data={categoryShare} />
      </section>
    </>
  );
}
