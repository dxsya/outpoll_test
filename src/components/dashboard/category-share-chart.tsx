"use client";

import ReactECharts from "echarts-for-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export type CategoryShare = {
  id: string;
  label: string;
  value: number;
};

type CategoryShareChartProps = {
  data: CategoryShare[];
};

type CategoryChartType = "pie" | "bar";

const COMPACT_WIDTH_BREAKPOINT = 420;

const categoryColors: Record<string, { border: string; fill: string }> = {
  politics: { border: "#2563eb", fill: "rgba(59, 130, 246, 0.16)" },
  weather: { border: "#7c3aed", fill: "rgba(139, 92, 246, 0.16)" },
  sports: { border: "#059669", fill: "rgba(16, 185, 129, 0.16)" },
};

function colorsForCategory(category: CategoryShare): { border: string; fill: string } {
  return categoryColors[category.id] ?? { border: "#0284c7", fill: "rgba(14, 165, 233, 0.16)" };
}

export function CategoryShareChart({ data }: CategoryShareChartProps) {
  const { t, categoryLabel, formatValue } = useI18n();
  const [chartType, setChartType] = useState<CategoryChartType>("pie");
  const containerRef = useRef<HTMLDivElement>(null);
  const [isCompact, setIsCompact] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(([entry]) => {
      setIsCompact(entry.contentRect.width < COMPACT_WIDTH_BREAKPOINT);
    });
    observer.observe(container);

    return () => observer.disconnect();
  }, []);

  const option = useMemo(() => {
    const chartData = data.map((item) => ({
      name: categoryLabel(item.id, item.label),
      value: item.value,
      itemStyle: {
        color: colorsForCategory(item).fill,
        borderColor: colorsForCategory(item).border,
        borderWidth: 2,
      },
    }));

    if (chartType === "pie") {
      return {
        animation: true,
        aria: { enabled: true },
        tooltip: {
          trigger: "item",
          valueFormatter: (value: number) => formatValue(value),
        },
        legend: { bottom: 0, type: "scroll" },
        series: [
          {
            name: t("categoryShareSeries"),
            type: "pie",
            radius: isCompact ? ["34%", "58%"] : ["38%", "68%"],
            avoidLabelOverlap: true,
            label: isCompact
              ? { show: true, position: "inside", formatter: "{d}%", color: "#fff", fontSize: 11 }
              : { formatter: "{b}\n{d}%" },
            labelLine: { show: !isCompact },
            data: chartData,
          },
        ],
      };
    }

    return {
      animation: true,
      aria: { enabled: true },
      tooltip: {
        trigger: "axis",
        valueFormatter: (value: number) => formatValue(value),
      },
      grid: { left: 56, right: 24, top: 20, bottom: isCompact ? 56 : 36, containLabel: true },
      xAxis: {
        type: "category",
        data: chartData.map((item) => item.name),
        axisTick: { show: false },
        axisLabel: { rotate: isCompact ? 30 : 0 },
      },
      yAxis: {
        type: "value",
        axisLabel: { formatter: (value: number) => formatValue(value) },
        splitLine: { lineStyle: { color: "rgba(148, 163, 184, 0.18)", width: 1 } },
      },
      series: [
        {
          name: t("categoryShareSeries"),
          type: "bar",
          barMaxWidth: 72,
          smooth: true,
          symbol: "circle",
          symbolSize: 9,
          lineStyle: { width: 3 },
          data: chartData,
        },
      ],
    };
  }, [categoryLabel, chartType, data, formatValue, isCompact, t]);


  return (
    <Card
      as="section"
      className="border-blue-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
      aria-labelledby="category-share-title"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="category-share-title" className="text-sm font-semibold">
            {t("categoryShare")}
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {t("categoryShareDescription")}
          </p>
        </div>
        <div className="flex gap-1" role="group" aria-label={t("chartMode")}>
          {(["pie", "bar"] as const).map((type) => (
            <Button
              key={type}
              type="button"
              aria-pressed={chartType === type}
              variant={chartType === type ? "primary" : "default"}
              onClick={() => setChartType(type)}
              className="min-h-8 px-2 text-xs"
            >
              {type === "pie" ? t("chartPie") : t("chartBars")}
            </Button>
          ))}
        </div>
      </div>
      <div ref={containerRef}>
        {data.length ? (
          <ReactECharts
            option={option}
            notMerge
            lazyUpdate
            aria-label={t("marketVolumeShare")}
            style={{ height: 280, width: "100%" }}
          />
        ) : (
          <p className="py-12 text-center text-sm text-slate-500">{t("noCategoryVolume")}</p>
        )}
      </div>
    </Card>
  );
}
