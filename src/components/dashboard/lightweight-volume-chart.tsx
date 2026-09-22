"use client";

import {
  AreaSeries,
  ColorType,
  CrosshairMode,
  HistogramSeries,
  LineSeries,
  createChart,
  type IChartApi,
  type Time,
} from "lightweight-charts";
import { useEffect, useRef } from "react";

import { useI18n } from "@/lib/i18n";
import type { PlatformSeries } from "@/types/market";
import { Card } from "@/components/ui/card";

export type LightweightChartMode = "line" | "area" | "bar";

type LightweightVolumeChartProps = {
  series: PlatformSeries[];
  chartMode: LightweightChartMode;
  isLoading?: boolean;
};

const platformColors = {
  kalshi: "#0891b2",
  polymarket: "#f97316",
} as const;

export function LightweightVolumeChart({
  series,
  chartMode,
  isLoading = false,
}: LightweightVolumeChartProps) {
  const { formatValue, t } = useI18n();
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const chart = createChart(container, {
      autoSize: true,
      height: 360,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#64748b",
      },
      grid: {
        vertLines: { color: "rgba(148, 163, 184, 0.12)" },
        horzLines: { color: "rgba(148, 163, 184, 0.18)" },
      },
      crosshair: { mode: CrosshairMode.Magnet },
      rightPriceScale: {
        borderColor: "rgba(148, 163, 184, 0.24)",
      },
      timeScale: {
        borderColor: "rgba(148, 163, 184, 0.24)",
        timeVisible: false,
      },
      localization: { priceFormatter: (value: number) => formatValue(value) },
    });
    chartRef.current = chart;

    for (const item of series) {
      const color = platformColors[item.platform];
      const data = item.points
        .filter((point) => point.volumeUsd !== null)
        .map((point) => ({ time: point.timestamp as Time, value: point.volumeUsd ?? 0 }));

      if (chartMode === "area") {
        const chartSeries = chart.addSeries(AreaSeries, {
          lineColor: color,
          topColor: `${color}55`,
          bottomColor: `${color}08`,
          lineWidth: 2,
          title: item.platform === "kalshi" ? "Kalshi" : "Polymarket",
        });
        chartSeries.setData(data);
      } else if (chartMode === "bar") {
        const chartSeries = chart.addSeries(HistogramSeries, {
          color,
          priceFormat: { type: "volume" },
          title: item.platform === "kalshi" ? "Kalshi" : "Polymarket",
        });
        chartSeries.setData(data);
      } else {
        const chartSeries = chart.addSeries(LineSeries, {
          color,
          lineWidth: 2,
          title: item.platform === "kalshi" ? "Kalshi" : "Polymarket",
        });
        chartSeries.setData(data);
      }
    }

    chart.timeScale().fitContent();
    return () => {
      chart.remove();
      chartRef.current = null;
    };
  }, [chartMode, formatValue, series]);

  return (
    <Card as="section" aria-labelledby="lightweight-volume-chart-title" className="mt-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 id="lightweight-volume-chart-title" className="text-sm font-semibold">
            Lightweight Charts
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {t("historicalVolumeChart")}
          </p>
        </div>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {chartMode === "bar" ? t("chartBars") : chartMode === "area" ? t("chartArea") : t("chartLine")}
        </span>
      </div>
      <div className="relative mt-3">
        <div ref={containerRef} className="h-[360px] w-full" aria-label={t("historicalVolumeChart")} />
        {isLoading ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-white/35 dark:bg-slate-900/35" role="status">
            <span className="bg-slate-900/85 px-3 py-2 text-xs font-semibold text-white dark:bg-white/90 dark:text-slate-950">
              {t("updatingChart")}
            </span>
          </div>
        ) : null}
      </div>
    </Card>
  );
}
