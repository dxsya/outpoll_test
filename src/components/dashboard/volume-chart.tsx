"use client";

import * as echarts from "echarts";
import ReactECharts from "echarts-for-react";
import { useMemo, useRef } from "react";

import type { PlatformSeries } from "@/types/market";

type VolumeChartProps = {
  series: PlatformSeries[];
};

function downloadFile(content: string, filename: string, type: string): void {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

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

function formatValue(value: number | null): string {
  if (value === null) {
    return "No data";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
    notation: "compact",
  }).format(value);
}

export function VolumeChart({ series }: VolumeChartProps) {
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
      legend: { data: ["Kalshi", "Polymarket"] },
      grid: { left: 64, right: 64, top: 48, bottom: 48, containLabel: true },
      xAxis: {
        type: "time",
        data: timestamps,
        axisLabel: {
          hideOverlap: true,
          formatter: (value: number) =>
            new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(value),
        },
      },
      yAxis: [
        {
          type: "value",
          name: "Kalshi USD",
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
          name: "Polymarket USD",
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
        type: "line",
        yAxisIndex: item.platform === "kalshi" ? 0 : 1,
        smooth: true,
        connectNulls: false,
        showSymbol: false,
        lineStyle: { width: 2.5 },
        emphasis: { focus: "series" },
        data: item.points.map((point) => [point.timestamp * 1000, point.volumeUsd]),
      })),
    };
  }, [series]);

  function exportCsv(): void {
    const timestamps = series[0]?.points.map((point) => point.timestamp) ?? [];
    const rows = timestamps.map((timestamp, index) =>
      [
        new Date(timestamp * 1000).toISOString(),
        ...series.map((item) => item.points[index]?.volumeUsd ?? ""),
      ].join(","),
    );
    downloadFile(
      ["timestamp,kalshi,polymarket", ...rows].join("\n"),
      "volume-dashboard.csv",
      "text/csv;charset=utf-8",
    );
  }

  function exportImage(type: "png" | "svg"): void {
    const instance = chartRef.current?.getEchartsInstance();
    if (!instance) {
      return;
    }

    if (type === "png") {
      downloadDataUrl(instance.getDataURL({ type: "png", pixelRatio: 2 }), "volume-dashboard.png");
      return;
    }

    const container = document.createElement("div");
    const svgChart = echarts.init(container, undefined, {
      renderer: "svg",
      width: 1200,
      height: 480,
    });
    svgChart.setOption(option);
    downloadDataUrl(svgChart.getDataURL({ type: "svg" }), "volume-dashboard.svg");
    svgChart.dispose();
  }

  return (
    <section
      aria-labelledby="volume-chart-title"
      className="border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h2 id="volume-chart-title" className="text-lg font-semibold">
            Historical volume
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            UTC buckets. Kalshi contract-notional proxy and Polymarket trade notional are shown
            separately.
          </p>
        </div>
        <div className="flex flex-wrap gap-2" aria-label="Chart export actions">
          <button
            type="button"
            onClick={exportCsv}
            className="min-h-10 rounded-md border px-3 text-xs font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
          >
            CSV
          </button>
          <button
            type="button"
            onClick={() => exportImage("png")}
            className="min-h-10 rounded-md border px-3 text-xs font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
          >
            PNG
          </button>
          <button
            type="button"
            onClick={() => exportImage("svg")}
            className="min-h-10 rounded-md border px-3 text-xs font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
          >
            SVG
          </button>
        </div>
        {!hasPoints ? (
          <p className="text-sm text-slate-500">No historical points returned.</p>
        ) : null}
      </div>
      {hasPoints ? (
        <ReactECharts
          ref={chartRef}
          option={option}
          notMerge
          lazyUpdate
          aria-label="Historical volume chart for Kalshi and Polymarket"
          style={{ height: 360, width: "100%" }}
          opts={{ renderer: "canvas" }}
        />
      ) : null}
      <p className="sr-only">
        {series
          .map(
            (item) =>
              `${item.platform}: ${item.points.map((point) => formatValue(point.volumeUsd)).join(", ")}`,
          )
          .join(". ")}
      </p>
    </section>
  );
}
