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
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";

import { useI18n } from "@/lib/i18n";
import type { Platform, PlatformSeries } from "@/types/market";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export type LightweightChartMode = "line" | "area" | "bar";

export type LightweightVolumeChartHandle = {
  exportPng: () => void;
};

type LightweightVolumeChartProps = {
  series: PlatformSeries[];
  chartMode: LightweightChartMode;
  isLoading?: boolean;
};

type PlatformFilter = "both" | Platform;

const platformColors = {
  kalshi: "#0891b2",
  polymarket: "#f97316",
} as const;

export const LightweightVolumeChart = forwardRef<
  LightweightVolumeChartHandle,
  LightweightVolumeChartProps
>(function LightweightVolumeChart({ series, chartMode, isLoading = false }, ref) {
  const { formatValue, t } = useI18n();
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>("both");

  const visibleSeries = useMemo(
    () =>
      platformFilter === "both"
        ? series
        : series.filter((item) => item.platform === platformFilter),
    [platformFilter, series],
  );

  const summary = useMemo(
    () =>
      visibleSeries.map((item) => {
        const points = item.points.filter((point) => point.volumeUsd !== null);
        const last = points.at(-1)?.volumeUsd ?? null;
        const previous = points.at(-2)?.volumeUsd ?? null;
        const delta =
          last !== null && previous !== null && previous !== 0
            ? ((last - previous) / previous) * 100
            : null;

        return {
          platform: item.platform,
          label: item.platform === "kalshi" ? "Kalshi" : "Polymarket",
          color: platformColors[item.platform],
          last,
          delta,
        };
      }),
    [visibleSeries],
  );

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
      handleScroll: { mouseWheel: true, pressedMouseMove: true },
      handleScale: { axisPressedMouseMove: true, mouseWheel: true, pinch: true },
    });
    chartRef.current = chart;

    for (const item of visibleSeries) {
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
    const resizeObserver = new ResizeObserver(() =>
      chart.applyOptions({ width: container.clientWidth }),
    );
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      chart.remove();
      chartRef.current = null;
    };
  }, [chartMode, formatValue, visibleSeries]);

  useImperativeHandle(
    ref,
    () => ({
      exportPng: () => {
        const chart = chartRef.current;
        if (!chart) return;
        const canvas = chart.takeScreenshot();
        const anchor = document.createElement("a");
        anchor.href = canvas.toDataURL("image/png");
        anchor.download = "volume-dashboard-lightweight.png";
        anchor.click();
      },
    }),
    [],
  );

  return (
    <Card as="section" aria-labelledby="lightweight-volume-chart-title" className="mt-4">
      <div className="flex items-center gap-1" role="group" aria-label={t("platforms")}>
        {(["both", "kalshi", "polymarket"] as const).map((option) => (
          <Button
            key={option}
            type="button"
            aria-pressed={platformFilter === option}
            variant={platformFilter === option ? "primary" : "default"}
            onClick={() => setPlatformFilter(option)}
            className="px-3 text-xs"
          >
            {option === "both"
              ? t("scopeBoth")
              : option === "kalshi"
                ? t("scopeKalshi")
                : t("scopePolymarket")}
          </Button>
        ))}
      </div>

      <div className="relative mt-3">
        <div
          ref={containerRef}
          className="h-[360px] w-full"
          aria-label={t("historicalVolumeChart")}
        />
        {isLoading ? (
          <div
            className="pointer-events-none absolute inset-0 flex items-center justify-center bg-white/35 dark:bg-slate-900/35"
            role="status"
          >
            <span className="bg-slate-900/85 px-3 py-2 text-xs font-semibold text-white dark:bg-white/90 dark:text-slate-950">
              {t("updatingChart")}
            </span>
          </div>
        ) : null}
      </div>
    </Card>
  );
});
