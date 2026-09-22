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
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = async (text: string, marketKey: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(marketKey);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };
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
        <div className="mt-4 -mx-4 sm:mx-0">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead className="border-b border-blue-100 text-[10px] uppercase text-slate-500 dark:border-slate-800">
                <tr>
                  <th className="hidden w-8 px-2 py-3 text-center font-semibold sm:table-cell">#</th>
                  <th className="px-2 py-3 font-semibold sm:px-3">{t("title")}</th>
                  <th className="hidden px-3 py-3 font-semibold md:table-cell">{t("platforms")}</th>
                  <th className="hidden px-3 py-3 font-semibold lg:table-cell">{t("category")}</th>
                  <th className="px-2 py-3 text-right font-semibold sm:px-3">{t("volume")}</th>
                </tr>
              </thead>
              <tbody>
                {visibleMarkets.map((market, index) => {
                  const volume = volumeByMarket.get(`${market.platform}:${market.id}`) ?? 0;
                  const fillPercent =
                    maxVisibleVolume > 0 ? Math.max(2, (volume / maxVisibleVolume) * 100) : 0;
                  const marketKey = `${market.platform}:${market.id}`;
                  const shortId = market.id.length > 12 ? `${market.id.slice(0, 8)}…` : market.id;
                  const isCopied = copiedId === marketKey;
                  return (
                    <tr
                      key={marketKey}
                      className="border-b border-slate-100 last:border-0 dark:border-slate-800/70"
                      style={{
                        backgroundImage: `linear-gradient(to right, rgba(148, 163, 184, 0.12) ${fillPercent}%, transparent ${fillPercent}%)`,
                      }}
                    >
                      <td className="hidden px-2 py-2 text-center text-xs font-semibold text-slate-500 sm:table-cell">
                        {index + 1}
                      </td>
                      <td className="px-2 py-2 sm:px-3">
                        <div className="break-words line-clamp-3 text-xs font-semibold sm:text-sm" title={market.title}>
                          {market.title}
                        </div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-1 text-[9px] text-slate-500">
                          <span className="font-mono">{shortId}</span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(market.id, marketKey)}
                            className="inline-flex items-center rounded px-1 py-0.5 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="Copy ID"
                          >
                            {isCopied ? (
                              <svg
                                className="size-3 text-green-600 dark:text-green-400"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            ) : (
                              <svg
                                className="size-3"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                />
                              </svg>
                            )}
                          </button>
                          {/* Показываем platform и category на мобильных */}
                          <span className="md:hidden">·</span>
                          <span
                            className={`md:hidden border px-1.5 py-0.5 text-[9px] font-semibold ${
                              market.platform === "kalshi"
                                ? "border-cyan-100 bg-cyan-50 text-cyan-700 dark:border-cyan-900 dark:bg-cyan-950/40 dark:text-cyan-300"
                                : "border-orange-100 bg-orange-50 text-orange-700 dark:border-orange-900 dark:bg-orange-950/40 dark:text-orange-300"
                            }`}
                          >
                            {market.platform}
                          </span>
                          <span className="lg:hidden">·</span>
                          <span
                            className={`lg:hidden border px-1.5 py-0.5 text-[9px] font-semibold ${
                              market.category.id === "politics"
                                ? "border-blue-100 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/40 dark:text-blue-300"
                                : market.category.id === "weather"
                                  ? "border-violet-100 bg-violet-50 text-violet-700 dark:border-violet-900 dark:bg-violet-950/40 dark:text-violet-300"
                                  : "border-emerald-100 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
                            }`}
                          >
                            {categoryLabel(market.category.id, market.category.label)}
                          </span>
                        </div>
                      </td>
                      <td className="hidden px-3 py-2 md:table-cell">
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
                      <td className="hidden px-3 py-2 lg:table-cell">
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
                      <td className="px-2 py-2 text-right text-xs font-bold tabular-nums sm:px-3 sm:text-sm">
                        {formatValue(volume)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Card>
  );
}
