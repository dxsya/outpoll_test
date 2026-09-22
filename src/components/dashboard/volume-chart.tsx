"use client";

import * as echarts from "echarts";
import ReactECharts from "echarts-for-react";
import { forwardRef, useImperativeHandle, useMemo, useRef, useState } from "react";

import { useI18n } from "@/lib/i18n";
import type { PlatformSeries } from "@/types/market";
import { Card } from "@/components/ui/card";

export type ChartMode = "line" | "area" | "bar";

export type VolumeChartHandle = {
  exportPng: () => void;
  exportSvg: () => void;
};

type VolumeChartProps = {
  series: PlatformSeries[];
  isLoading?: boolean;
  chartMode?: ChartMode;
};

function downloadDataUrl(dataUrl: string, filename: string): void {
  const anchor = document.createElement("a");
  anchor.href = dataUrl;
  anchor.download = filename;
  anchor.click();
}

const colors = {
  kalshi: "#0891b2",
  polymarket: "#f97316",
} as const;

export const VolumeChart = forwardRef<VolumeChartHandle, VolumeChartProps>(function VolumeChart(
  { series, isLoading = false, chartMode = "line" },
  ref,
) {
  const { locale, t, formatValue } = useI18n();
  const [zoom, setZoom] = useState({ start: 0, end: 100 });
  const hasPoints = series.some((item) => item.points.length > 0);
  const chartRef = useRef<ReactECharts>(null);
  const option = useMemo(() => {
    const timestamps = series[0]?.points.map((point) => point.timestamp * 1000) ?? [];
    return {
      animation: true,
      aria: { enabled: true },
      color: [colors.kalshi, colors.polymarket],
      tooltip: {
        trigger: "axis",
        triggerOn: "mousemove|click",
        axisPointer: {
          type: "cross",
          snap: true,
          handle: { show: true, size: 36 },
        },
        confine: true,
        valueFormatter: (value: number | null) => formatValue(value),
      },
      legend: { data: ["Kalshi", "Polymarket"], top: 8, left: "center" },
      dataZoom: [
        {
          type: "inside",
          xAxisIndex: 0,
          filterMode: "none",
          start: zoom.start,
          end: zoom.end,
          zoomOnMouseWheel: true,
          moveOnMouseMove: true,
          moveOnMouseWheel: true,
        },
        {
          type: "slider",
          xAxisIndex: 0,
          filterMode: "none",
          start: zoom.start,
          end: zoom.end,
          height: 22,
          bottom: 8,
          brushSelect: false,
        },
      ],
      grid: { left: 64, right: 64, top: 48, bottom: 78, containLabel: true },
      xAxis: {
        type: "time",
        data: timestamps,
        axisLabel: {
          hideOverlap: true,
          formatter: (value: number) =>
            new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : locale, {
              month: "short",
              day: "numeric",
            }).format(value),
        },
      },
      yAxis: [
        {
          type: "value",
          name: t("kalshiUsd"),
          nameTextStyle: { color: "rgba(8, 145, 178, 0.8)" },
          axisLabel: {
            color: "rgba(8, 145, 178, 0.8)",
            formatter: (value: number) => formatValue(value),
          },
          axisLine: { show: true, lineStyle: { color: "rgba(8, 145, 178, 0.55)" } },
          axisTick: {
            show: true,
            length: 5,
            lineStyle: { color: "rgba(8, 145, 178, 0.55)" },
          },
          splitLine: { lineStyle: { color: "rgba(148, 163, 184, 0.22)", width: 1 } },
        },
        {
          type: "value",
          name: t("polymarketUsd"),
          nameTextStyle: { color: "rgba(249, 115, 22, 0.8)" },
          axisLabel: {
            color: "rgba(249, 115, 22, 0.8)",
            formatter: (value: number) => formatValue(value),
          },
          axisLine: { show: true, lineStyle: { color: "rgba(249, 115, 22, 0.55)" } },
          axisTick: {
            show: true,
            length: 5,
            lineStyle: { color: "rgba(249, 115, 22, 0.55)" },
          },
          splitLine: { show: false },
        },
      ],
      series: series.map((item) => ({
        name: item.platform === "kalshi" ? "Kalshi" : "Polymarket",
        type: chartMode === "bar" ? "bar" : "line",
        yAxisIndex: item.platform === "kalshi" ? 0 : 1,
        smooth: true,
        connectNulls: false,
        showSymbol: false,
        lineStyle: { width: 2.5 },
        areaStyle: chartMode === "area" ? { opacity: 0.18 } : undefined,
        emphasis: { focus: "series" },
        data: item.points.map((point) => [point.timestamp * 1000, point.volumeUsd]),
      })),
    };
  }, [chartMode, formatValue, locale, series, t, zoom]);

  function handleDataZoom(event: unknown): void {
    const payload = event as {
      batch?: Array<{ start?: number; end?: number }>;
      start?: number;
      end?: number;
    };
    const next = payload.batch?.[0] ?? payload;
    if (typeof next.start === "number" && typeof next.end === "number") {
      setZoom({ start: next.start, end: next.end });
    }
  }

  useImperativeHandle(
    ref,
    () => ({
      exportPng: () => {
        const instance = chartRef.current?.getEchartsInstance();
        if (!instance) return;
        downloadDataUrl(instance.getDataURL({ type: "png", pixelRatio: 2 }), "volume-dashboard.png");
      },
      exportSvg: () => {
        const container = document.createElement("div");
        const svgChart = echarts.init(container, undefined, {
          renderer: "svg",
          width: 1200,
          height: 480,
        });
        svgChart.setOption(option);
        downloadDataUrl(svgChart.getDataURL({ type: "svg" }), "volume-dashboard.svg");
        svgChart.dispose();
      },
    }),
    [option],
  );

  return (
    <Card as="section" aria-labelledby="volume-chart-title">
      {!hasPoints ? <p className="text-sm text-slate-500">{t("noHistoricalPoints")}</p> : null}

      {hasPoints ? (
        <div className="relative" aria-busy={isLoading}>
          <ReactECharts
            ref={chartRef}
            option={option}
            notMerge
            lazyUpdate
            aria-label={t("historicalVolumeChart")}
            style={{ height: 400, width: "100%" }}
            opts={{ renderer: "canvas" }}
            onEvents={{ datazoom: handleDataZoom }}
          />
          {isLoading ? (
            <div
              className="pointer-events-none absolute inset-0 flex items-center justify-center bg-white/35 dark:bg-slate-900/35"
              role="status"
              aria-label={t("updatingChart")}
            >
              <span className="rounded-md bg-slate-900/85 px-3 py-2 text-xs font-semibold text-white shadow-sm dark:bg-white/90 dark:text-slate-950">
                {t("updatingChart")}
              </span>
            </div>
          ) : null}
        </div>
      ) : null}
      <p className="sr-only">
        {series
          .map(
            (item) =>
              `${item.platform}: ${item.points.map((point) => formatValue(point.volumeUsd)).join(", ")}`,
          )
          .join(". ")}
      </p>
    </Card>
  );
});
