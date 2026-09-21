"use client";

import ReactECharts from "echarts-for-react";
import { useMemo } from "react";

import { useI18n } from "@/lib/i18n";

export type CategoryShare = {
  id: string;
  label: string;
  value: number;
};

type CategoryShareChartProps = {
  data: CategoryShare[];
};

export function CategoryShareChart({ data }: CategoryShareChartProps) {
  const { t, categoryLabel, formatValue } = useI18n();
  const option = useMemo(
    () => ({
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
          radius: ["38%", "68%"],
          avoidLabelOverlap: true,
          itemStyle: { borderColor: "#0f172a", borderWidth: 2 },
          label: { formatter: "{b}\n{d}%" },
          data: data.map((item) => ({
            name: categoryLabel(item.id, item.label),
            value: item.value,
          })),
        },
      ],
    }),
    [categoryLabel, data, formatValue, t],
  );

  return (
    <section
      aria-labelledby="category-share-title"
      className="border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
    >
      <h2 id="category-share-title" className="text-lg font-semibold">
        {t("categoryShare")}
      </h2>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        {t("categoryShareDescription")}
      </p>
      {data.length ? (
        <ReactECharts
          option={option}
          notMerge
          lazyUpdate
          aria-label={t("marketVolumeShare")}
          style={{ height: 300, width: "100%" }}
        />
      ) : (
        <p className="py-12 text-center text-sm text-slate-500">{t("noCategoryVolume")}</p>
      )}
    </section>
  );
}
