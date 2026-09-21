"use client";

import { useMemo, useState } from "react";

import { useI18n } from "@/lib/i18n";
import type { Market } from "@/types/market";

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

  return (
    <section
      className="border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
      aria-labelledby="market-table-title"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="market-table-title" className="text-lg font-semibold">
            {t("markets")}
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            {visibleMarkets.length} / {markets.length}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <label className="sr-only" htmlFor="market-search">
            {t("searchMarkets")}
          </label>
          <input
            id="market-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t("searchMarkets")}
            className="min-h-11 min-w-56 rounded-md border border-slate-300 bg-transparent px-3 text-sm dark:border-slate-700"
          />
          <label className="sr-only" htmlFor="market-sort">
            {t("sortBy")}
          </label>
          <select
            id="market-sort"
            value={sortKey}
            onChange={(event) => setSortKey(event.target.value as SortKey)}
            className="min-h-11 rounded-md border border-slate-300 bg-transparent px-3 text-sm dark:border-slate-700"
          >
            <option value="volume">{t("volume")}</option>
            <option value="platform">{t("platforms")}</option>
            <option value="category">{t("category")}</option>
            <option value="title">{t("title")}</option>
          </select>
        </div>
      </div>
      {visibleMarkets.length === 0 ? (
        <p className="py-10 text-center text-sm text-slate-500">{t("noMarkets")}</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase text-slate-500 dark:border-slate-800">
              <tr>
                <th className="px-3 py-3 font-semibold">{t("title")}</th>
                <th className="px-3 py-3 font-semibold">{t("platforms")}</th>
                <th className="px-3 py-3 font-semibold">{t("category")}</th>
                <th className="px-3 py-3 text-right font-semibold">{t("volume")}</th>
              </tr>
            </thead>
            <tbody>
              {visibleMarkets.map((market) => {
                const volume = volumeByMarket.get(`${market.platform}:${market.id}`) ?? 0;
                return (
                  <tr
                    key={`${market.platform}:${market.id}`}
                    className="border-b border-slate-100 last:border-0 dark:border-slate-800/70"
                  >
                    <td className="max-w-[420px] px-3 py-3">
                      <div className="truncate font-medium" title={market.title}>
                        {market.title}
                      </div>
                      <div className="truncate text-xs text-slate-500">{market.id}</div>
                    </td>
                    <td className="px-3 py-3 capitalize">{market.platform}</td>
                    <td className="px-3 py-3">
                      {categoryLabel(market.category.id, market.category.label)}
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums">{formatValue(volume)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
