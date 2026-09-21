import type { RequestStats } from "@/lib/api/errors";
import type { Platform } from "@/types/market";
import { useI18n } from "@/lib/i18n";

type SourceErrors = Partial<Record<Platform, string>>;

export function DashboardSkeleton() {
  const { t } = useI18n();
  return (
    <section className="space-y-4 py-8" aria-label="Loading dashboard" aria-live="polite">
      <div className="h-11 animate-pulse rounded-md bg-slate-200 dark:bg-slate-800" />
      <div className="grid gap-4 sm:grid-cols-3">
        {["skeleton-total", "skeleton-kalshi", "skeleton-polymarket"].map((key) => (
          <div key={key} className="h-24 animate-pulse bg-slate-200 dark:bg-slate-800" />
        ))}
      </div>
      <div className="h-[360px] animate-pulse border border-slate-200 bg-slate-200 dark:border-slate-800 dark:bg-slate-900" />
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
      <button
        type="button"
        onClick={onRetry}
        className="mt-5 rounded-md bg-cyan-700 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
      >
        {t("retryRequest")}
      </button>
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
      <button
        type="button"
        onClick={onRetry}
        className="mt-3 min-h-11 rounded-md border border-amber-700 px-3 text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 dark:border-amber-300"
      >
        {t("retryRequest")}
      </button>
    </section>
  );
}

function sourceErrorLabel(platform: Platform): string {
  return platform === "kalshi" ? "Kalshi" : "Polymarket";
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
      className="mt-6 border border-amber-300 bg-amber-50 p-4 text-amber-950 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100"
      role="status"
    >
      <p className="text-sm font-semibold">{t("dataIncomplete")}</p>
      <ul className="mt-1 list-inside list-disc text-sm">
        {Object.entries(errors).map(([platform, message]) => (
          <li key={platform}>
            {sourceErrorLabel(platform as Platform)}: {message}
          </li>
        ))}
      </ul>
      <ul className="mt-2 space-y-1 text-sm">
        {Object.entries(requestStats).map(([platform, stats]) => (
          <li key={platform}>
            {t("sentFailed", {
              platform: sourceErrorLabel(platform as Platform),
              sent: stats.sent,
              failed: stats.failed,
            })}
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={onRetry}
        disabled={isLoading}
        className="mt-3 min-h-11 rounded-md border border-amber-700 px-3 text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-amber-300"
      >
        {t("retryLoading")}
      </button>
    </section>
  );
}
