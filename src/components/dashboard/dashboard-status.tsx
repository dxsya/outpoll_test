import type { RequestStats } from "@/lib/api/errors";
import type { Platform } from "@/types/market";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";

type SourceErrors = Partial<Record<Platform, string>>;

function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-slate-200 dark:bg-slate-800 ${className}`} />;
}

export function DashboardSkeleton() {
  const { t } = useI18n();
  return (
    <section className="space-y-6 py-6" aria-label="Loading dashboard" aria-live="polite">
      <SkeletonBlock className="h-11 w-2/3" />

      <div className="grid gap-3 sm:grid-cols-3">
        {["skeleton-range", "skeleton-categories", "skeleton-scope"].map((key) => (
          <div key={key} className="space-y-3 border border-slate-200 p-4 dark:border-slate-800">
            <SkeletonBlock className="h-4 w-24" />
            <div className="flex flex-wrap gap-2">
              <SkeletonBlock className="h-8.5 w-16" />
              <SkeletonBlock className="h-8.5 w-16" />
              <SkeletonBlock className="h-8.5 w-16" />
            </div>
          </div>
        ))}
      </div>

      <div className="border border-slate-200 p-4 dark:border-slate-800">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <SkeletonBlock className="h-8.5 w-14" />
            <SkeletonBlock className="h-8.5 w-14" />
            <SkeletonBlock className="h-8.5 w-14" />
          </div>
          <div className="flex items-center gap-2">
            <SkeletonBlock className="h-8.5 w-16" />
            <SkeletonBlock className="h-8.5 w-16" />
            <SkeletonBlock className="h-8.5 w-16" />
          </div>
        </div>
        <SkeletonBlock className="h-100 w-full" />
      </div>

      <div className="border border-slate-200 p-0 dark:border-slate-800">
        <div className="grid gap-4 border-b border-slate-200 p-4 dark:border-slate-800 sm:grid-cols-2">
          <div className="space-y-3">
            <SkeletonBlock className="h-8 w-40" />
            <SkeletonBlock className="h-10 w-32" />
            <SkeletonBlock className="h-5 w-48" />
          </div>
          <div className="space-y-4">
            <SkeletonBlock className="h-5 w-full" />
            <SkeletonBlock className="h-5 w-full" />
          </div>
        </div>
        <div className="flex items-center justify-between p-4">
          <SkeletonBlock className="h-4 w-32" />
          <SkeletonBlock className="h-4 w-20" />
        </div>
      </div>

      <SkeletonBlock className="h-64 w-full" />

      <div className="border border-slate-200 p-4 dark:border-slate-800">
        <SkeletonBlock className="mb-4 h-9 w-full max-w-sm" />
        <div className="space-y-2">
          {["row-1", "row-2", "row-3", "row-4", "row-5", "row-6"].map((key) => (
            <SkeletonBlock key={key} className="h-10 w-full" />
          ))}
        </div>
      </div>

      <p className="text-sm text-slate-600 dark:text-slate-300">{t("loadingData")}</p>
    </section>
  );
}

export function InitialLoadError({ onRetry }: { onRetry: () => void }) {
  const { t } = useI18n();
  return (
    <section className="py-12" role="alert">
      <h2 className="text-xl font-semibold">{t("unableToLoad")}</h2>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{t("apiAvailability")}</p>
      <Button
        type="button"
        onClick={onRetry}
        className="mt-5 px-4 py-2 hover:bg-blue-600"
        variant="primary"
      >
        {t("retryRequest")}
      </Button>
    </section>
  );
}

export function RefreshError({ onRetry }: { onRetry: () => void }) {
  const { t } = useI18n();
  return (
    <section
      className="mt-6 border border-amber-300 bg-amber-50 p-4 text-amber-950 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100"
      role="alert"
    >
      <p className="text-sm font-semibold">{t("unableToUpdate")}</p>
      <p className="mt-1 text-sm">{t("showingRecent")}</p>
      <Button type="button" onClick={onRetry} className="mt-3" variant="primary">
        {t("retryRequest")}
      </Button>
    </section>
  );
}

function sourceErrorLabel(platform: Platform): string {
  return platform === "kalshi" ? "Kalshi" : "Polymarket";
}

function InfoIcon() {
  return (
    <span
      aria-hidden="true"
      className="flex rounded-full size-8 shrink-0 items-center justify-center bg-blue-500 text-lg font-bold text-white"
    >
      i
    </span>
  );
}

export function SourceErrors({
  errors,
  requestStats,
  isLoading,
  onRetry,
}: {
  errors: SourceErrors;
  requestStats: Record<Platform, RequestStats>;
  isLoading: boolean;
  onRetry: () => void;
}) {
  const { t } = useI18n();
  if (Object.keys(errors).length === 0) {
    return null;
  }

  return (
    <section
      className="mt-6 flex flex-col gap-4 border border-blue-200 bg-blue-50 p-4 text-blue-950 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-100 sm:flex-row sm:items-center"
      role="status"
    >
      <InfoIcon />
      <div className="min-w-0 flex-1 border-l border-blue-200 pl-4 dark:border-blue-800">
        <p className="text-sm font-semibold">{t("dataIncomplete")}</p>
        <p className="mt-1 text-xs text-blue-900/70 dark:text-blue-100/70">{t("showingRecent")}</p>
        <ul className="mt-2 space-y-1 text-xs text-blue-900/80 dark:text-blue-100/80">
          {Object.entries(errors).map(([platform, message]) => (
            <li key={platform}>
              {sourceErrorLabel(platform as Platform)}: {message}
            </li>
          ))}
        </ul>
        <div className="mt-2 flex flex-wrap gap-2">
          {Object.entries(requestStats).map(([platform, stats]) => (
            <span
              key={platform}
              className="inline-flex rounded-full items-center gap-2 border border-blue-200 bg-white/80 px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:border-blue-800 dark:bg-slate-900/50 dark:text-slate-200"
            >
              <span
                aria-hidden="true"
                className={`size-2 rounded-full ${stats.failed > 0 ? "bg-rose-400" : "bg-emerald-400"}`}
              />
              {t("sentFailed", {
                platform: sourceErrorLabel(platform as Platform),
                sent: stats.sent,
                failed: stats.failed,
              })}
            </span>
          ))}
        </div>
      </div>
      <Button
        type="button"
        onClick={onRetry}
        disabled={isLoading}
        className="shrink-0 self-start text-xs sm:self-center"
        variant="primary"
      >
        {t("retryLoading")}
      </Button>
    </section>
  );
}
