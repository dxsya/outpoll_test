"use client";

import { useMemo, useState } from "react";

import { useI18n } from "@/lib/i18n";
import type { Market } from "@/types/market";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card } from "@/components/ui/card";

type MarketTableProps = {
  markets: Market[];
  volumeByMarket: Map<string, number>;
};

type SortKey = "volume" | "platform" | "category" | "title";

export function MarketTable({ markets, volumeByMarket }: MarketTableProps) {
  const { t, categoryLabel, formatValue } = useI18n();
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("volume");
  const visibleMarkets = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase();
    return markets
      .filter((market) => {
        if (!normalizedSearch) return true;
        return `${market.title} ${market.id} ${market.category.label}`
          .toLocaleLowerCase()
          .includes(normalizedSearch);
      })
      .sort((left, right) => {
        if (sortKey === "volume") {
          return (
            (volumeByMarket.get(`${right.platform}:${right.id}`) ?? 0) -
            (volumeByMarket.get(`${left.platform}:${left.id}`) ?? 0)
          );
        }
        const leftValue =
          sortKey === "category"
            ? left.category.label
            : sortKey === "platform"
              ? left.platform
              : left.title;
        const rightValue =
          sortKey === "category"
            ? right.category.label
            : sortKey === "platform"
              ? right.platform
              : right.title;
        return leftValue.localeCompare(rightValue);
      });
  }, [markets, search, sortKey, volumeByMarket]);
  const maxVisibleVolume = Math.max(
    0,
    ...visibleMarkets.map((market) => volumeByMarket.get(`${market.platform}:${market.id}`) ?? 0),
  );

  return (
    <Card
      as="section"
      className="border-blue-100 bg-white my-6 p-4 dark:border-slate-800 dark:bg-slate-900"
      aria-labelledby="market-table-title"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="market-table-title" className="text-sm font-semibold">
            {t("markets")}
          </h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {visibleMarkets.length} / {markets.length}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <label className="sr-only" htmlFor="market-search">
            {t("searchMarkets")}
          </label>
          <Input
            id="market-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("searchMarkets")}
            className="min-w-56"
          />
          <label className="sr-only" htmlFor="market-sort">
            {t("sortBy")}
          </label>
          <span className="relative inline-flex">
            <Select
              id="market-sort"
              value={sortKey}
              onChange={(event) => setSortKey(event.target.value as SortKey)}
              className="appearance-none pl-2 pr-4"
            >
              <option value="volume">{t("volume")}</option>
              <option value="platform">{t("platforms")}</option>
              <option value="category">{t("category")}</option>
              <option value="title">{t("title")}</option>
            </Select>
            <span
              aria-hidden="true"
              className="pointer-events-none absolute right-3 top-1/2 size-1.5 -translate-y-1/2 rotate-45 border-b-2 border-r-2 border-current"
            />
          </span>
        </div>
      </div>
      {visibleMarkets.length === 0 ? (
        <p className="py-10 text-center text-sm text-slate-500">{t("noMarkets")}</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[680px] border-collapse text-left text-sm">
            <thead className="border-b border-blue-100 text-[10px] uppercase text-slate-500 dark:border-slate-800">
              <tr>
                <th className="w-10 px-2 py-3 text-center font-semibold">#</th>
                <th className="px-3 py-3 font-semibold">{t("title")}</th>
                <th className="px-3 py-3 font-semibold">{t("platforms")}</th>
                <th className="px-3 py-3 font-semibold">{t("category")}</th>
                <th className="px-3 py-3 text-right font-semibold">{t("volume")}</th>
              </tr>
            </thead>
            <tbody>
              {visibleMarkets.map((market, index) => {
                const volume = volumeByMarket.get(`${market.platform}:${market.id}`) ?? 0;
                const fillPercent =
                  maxVisibleVolume > 0 ? Math.max(2, (volume / maxVisibleVolume) * 100) : 0;
                return (
                  <tr
                    key={`${market.platform}:${market.id}`}
                    className="border-b border-slate-100 last:border-0 dark:border-slate-800/70"
                    style={{
                      backgroundImage: `linear-gradient(to right, rgba(148, 163, 184, 0.12) ${fillPercent}%, transparent ${fillPercent}%)`,
                    }}
                  >
                    <td className="px-2 py-2 text-center text-xs font-semibold text-slate-500">
                      {index + 1}
                    </td>
                    <td className="max-w-[420px] px-3 py-2">
                      <div className="truncate font-semibold" title={market.title}>
                        {market.title}
                      </div>
                      <div className="truncate text-[10px] text-slate-500">{market.id}</div>
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`border px-2 py-1 text-[10px] font-semibold ${
                          market.platform === "kalshi"
                            ? "border-cyan-100 bg-cyan-50 text-cyan-700 dark:border-cyan-900 dark:bg-cyan-950/40 dark:text-cyan-300"
                            : "border-orange-100 bg-orange-50 text-orange-700 dark:border-orange-900 dark:bg-orange-950/40 dark:text-orange-300"
                        }`}
                      >
                        {market.platform}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`border px-2 py-1 text-[10px] font-semibold ${
                          market.category.id === "politics"
                            ? "border-blue-100 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300"
                            : market.category.id === "weather"
                              ? "border-violet-100 bg-violet-50 text-violet-700 dark:border-violet-900 dark:bg-violet-950/40 dark:text-violet-300"
                              : "border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
                        }`}
                      >
                        {categoryLabel(market.category.id, market.category.label)}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right text-sm font-bold tabular-nums">
                      {formatValue(volume)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
