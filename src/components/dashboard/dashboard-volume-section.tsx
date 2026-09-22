import { useRef, useState } from "react";

import {
  VolumeChart,
  type ChartMode,
  type VolumeChartHandle,
} from "@/components/dashboard/volume-chart";
import {
  LightweightVolumeChart,
  type LightweightVolumeChartHandle,
} from "@/components/dashboard/lightweight-volume-chart";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n";
import type { PlatformSeries } from "@/types/market";

type DashboardVolumeSectionProps = {
  categoryIds: string[] | null;
  series: PlatformSeries[];
  isLoading: boolean;
  chartMode: ChartMode;
  onChartModeChange: (mode: ChartMode) => void;
};

function downloadCsv(series: PlatformSeries[]): void {
  const timestamps = series[0]?.points.map((point) => point.timestamp) ?? [];
  const rows = timestamps.map((timestamp, index) =>
    [
      new Date(timestamp * 1000).toISOString(),
      ...series.map((item) => item.points[index]?.volumeUsd ?? ""),
    ].join(","),
  );
  const csv = ["timestamp,kalshi,polymarket", ...rows].join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "volume-dashboard.csv";
  anchor.click();
  URL.revokeObjectURL(url);
}

function ExportIcon({ type }: { type: "csv" | "image" }) {
  return type === "csv" ? (
    <svg aria-hidden="true" className="size-3.5" viewBox="0 0 16 16" fill="none">
      <path d="M8 2v8m0 0 3-3m-3 3L5 7M3 13h10" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  ) : (
    <svg aria-hidden="true" className="size-3.5" viewBox="0 0 16 16" fill="none">
      <rect x="2" y="2.5" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="5.5" cy="6" r="1" fill="currentColor" />
      <path d="m3.5 11 2.5-2.5 2 2 1.5-1.5 3 3" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export function DashboardVolumeSection({
  categoryIds,
  series,
  isLoading,
  chartMode,
  onChartModeChange,
}: DashboardVolumeSectionProps) {
  const { t } = useI18n();
  const [chartVariant, setChartVariant] = useState<"full" | "lightweight">("full");
  const volumeChartRef = useRef<VolumeChartHandle>(null);
  const lightweightChartRef = useRef<LightweightVolumeChartHandle>(null);
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

  function exportPng(): void {
    if (chartVariant === "full") {
      volumeChartRef.current?.exportPng();
    } else {
      lightweightChartRef.current?.exportPng();
    }
  }

  return (
    <section className="relative py-6">
      <Card as="div" className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 " role="group" aria-label={t("chartView")}>
            {(
              [
                { value: "full", label: t("chartViewFull") },
                { value: "lightweight", label: t("chartViewLightweight") },
              ] as const
            ).map((option) => (
              <Button
                key={option.value}
                type="button"
                variant={chartVariant === option.value ? "primary" : "default"}
                aria-pressed={chartVariant === option.value}
                onClick={() => setChartVariant(option.value)}
                className="px-3 text-xs"
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-4" aria-label={t("chartExportActions")}>
          <div className="flex flex-wrap items-center gap-2 border-r border-slate-300 pr-4 dark:border-slate-700">
            <p className="mr-4 text-slate-600 dark:text-slate-300">Volume:</p>
            <div className="flex items-center gap-1" role="group" aria-label={t("chartMode")}>
              {(["line", "area", "bar"] as const).map((mode) => (
                <Button
                  key={mode}
                  type="button"
                  aria-pressed={chartMode === mode}
                  variant={chartMode === mode ? "primary" : "default"}
                  onClick={() => onChartModeChange(mode)}
                  className="px-2 text-xs"
                >
                  {mode === "line"
                    ? t("chartLine")
                    : mode === "area"
                      ? t("chartArea")
                      : t("chartBars")}
                </Button>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-1">
            <Button
              type="button"
              onClick={() => downloadCsv(series)}
              className="flex items-center gap-1 px-3 text-xs"
            >
              <ExportIcon type="csv" />
              <span>CSV</span>
            </Button>
            <Button
              type="button"
              onClick={exportPng}
              className="flex items-center gap-1 px-3 text-xs"
            >
              <ExportIcon type="image" />
              <span>PNG</span>
            </Button>
            <Button
              type="button"
              onClick={() => volumeChartRef.current?.exportSvg()}
              disabled={chartVariant !== "full"}
              title={chartVariant !== "full" ? t("svgExportUnavailable") : undefined}
              className="flex items-center gap-1 px-3 text-xs"
            >
              <ExportIcon type="image" />
              <span>SVG</span>
            </Button>
          </div>
        </div>
      </Card>

      {chartVariant === "full" ? (
        <VolumeChart
          ref={volumeChartRef}
          series={series}
          isLoading={isLoading}
          chartMode={chartMode}
        />
      ) : (
        <LightweightVolumeChart
          ref={lightweightChartRef}
          series={series}
          isLoading={isLoading}
          chartMode={chartMode}
        />
      )}
    </section>
  );
}
