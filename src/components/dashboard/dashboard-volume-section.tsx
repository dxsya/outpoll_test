import { VolumeChart } from "@/components/dashboard/volume-chart";
import type { PlatformSeries } from "@/types/market";
import { useI18n } from "@/lib/i18n";

type DashboardVolumeSectionProps = {
  categoryIds: string[] | null;
  series: PlatformSeries[];
  isLoading: boolean;
};

export function DashboardVolumeSection({
  categoryIds,
  series,
  isLoading,
}: DashboardVolumeSectionProps) {
  const { t } = useI18n();
  const hasNoData = series.every((item) => item.points.every((point) => point.volumeUsd === null));

  if (categoryIds?.length === 0) {
    return (
      <section className="border border-dashed border-slate-300 px-4 py-12 text-center dark:border-slate-700">
        <h2 className="text-lg font-semibold">{t("noCategories")}</h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{t("selectCategory")}</p>
      </section>
    );
  }

  if (isLoading && hasNoData) {
    return (
      <section
        className="border border-slate-200 px-4 py-12 text-center dark:border-slate-800"
        role="status"
        aria-live="polite"
      >
        <div className="mx-auto h-2 max-w-xs animate-pulse rounded-full bg-cyan-600/70" />
        <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">{t("loadingCategory")}</p>
      </section>
    );
  }

  if (hasNoData) {
    return (
      <section className="border border-dashed border-slate-300 px-4 py-12 text-center dark:border-slate-700">
        <h2 className="text-lg font-semibold">{t("noPeriodData")}</h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          {t("noPeriodDataDescription")}
        </p>
      </section>
    );
  }

  return (
    <section className="relative py-6">
      <VolumeChart series={series} isLoading={isLoading} />
    </section>
  );
}
