"use client";

import ReactECharts from "echarts-for-react";
import { useMemo } from "react";

export type CategoryShare = {
  id: string;
  label: string;
  value: number;
};

type CategoryShareChartProps = {
  data: CategoryShare[];
};

export function CategoryShareChart({ data }: CategoryShareChartProps) {
  const option = useMemo(
    () => ({
      animation: true,
      aria: { enabled: true },
      tooltip: {
        trigger: "item",
        valueFormatter: (value: number) =>
          new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            notation: "compact",
            maximumFractionDigits: 0,
          }).format(value),
      },
      legend: { bottom: 0, type: "scroll" },
      series: [
        {
          name: "Category share",
          type: "pie",
          radius: ["38%", "68%"],
          avoidLabelOverlap: true,
          itemStyle: { borderColor: "#0f172a", borderWidth: 2 },
          label: { formatter: "{b}\n{d}%" },
          data: data.map((item) => ({ name: item.label, value: item.value })),
        },
      ],
    }),
    [data],
  );

  return (
    <section
      aria-labelledby="category-share-title"
      className="border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
    >
      <h2 id="category-share-title" className="text-lg font-semibold">
        Category share
      </h2>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Selected-period volume by category.
      </p>
      {data.length ? (
        <ReactECharts
          option={option}
          notMerge
          lazyUpdate
          aria-label="Market volume share by category"
          style={{ height: 300, width: "100%" }}
        />
      ) : (
        <p className="py-12 text-center text-sm text-slate-500">No category volume.</p>
      )}
    </section>
  );
}
