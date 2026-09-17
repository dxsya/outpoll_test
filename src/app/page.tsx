"use client";

import { useQuery } from "@tanstack/react-query";

import { fetchDashboardSnapshot } from "@/lib/api/dashboard-query";
import type { Market, Platform } from "@/types/market";

function formatFetchedAt(timestamp: number): string {
  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "medium",
    timeStyle: "medium",
  }).format(timestamp);
}

function formatSourceValue(value: boolean | number | string | null): string {
  if (value === null) {
    return "null";
  }

  return typeof value === "string" ? value : String(value);
}

function MarketRow({ market }: { market: Market }) {
  return (
    <article className="border-b border-slate-200 px-4 py-4 last:border-b-0 dark:border-slate-800">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="break-all font-mono text-xs text-slate-500 dark:text-slate-400">
            {market.id}
          </p>
          <h3 className="mt-1 break-words text-base font-semibold text-slate-950 dark:text-white">
            {market.title}
          </h3>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-700 dark:bg-slate-800 dark:text-slate-200">
          {market.platform}
        </span>
      </div>

      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
        <div>
          <dt className="text-slate-500 dark:text-slate-400">Category</dt>
          <dd className="font-medium text-slate-900 dark:text-slate-100">
            {market.category.label}
          </dd>
        </div>
        <div>
          <dt className="text-slate-500 dark:text-slate-400">Volume metric</dt>
          <dd className="break-words font-medium text-slate-900 dark:text-slate-100">
            {market.volumeMetric}
          </dd>
        </div>
        <div>
          <dt className="text-slate-500 dark:text-slate-400">Source fields</dt>
          <dd className="mt-1 space-y-1 font-mono text-xs text-slate-700 dark:text-slate-300">
            {Object.entries(market.source).map(([key, value]) => (
              <div key={key} className="break-all">
                {key}: {formatSourceValue(value)}
              </div>
            ))}
          </dd>
        </div>
      </dl>
    </article>
  );
}

function countByPlatform(markets: Market[], platform: Platform): number {
  return markets.filter((market) => market.platform === platform).length;
}

export default function Home() {
  const query = useQuery({
    queryKey: ["dashboard-snapshot"],
    queryFn: ({ signal }) => fetchDashboardSnapshot(signal),
    staleTime: 60_000,
    retry: false,
    refetchOnWindowFocus: false,
  });

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-950 dark:bg-slate-950 dark:text-white sm:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="border-b border-slate-200 pb-6 dark:border-slate-800">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700 dark:text-cyan-300">
            Raw data explorer
          </p>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Prediction markets data
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-300">
                Реальные markets из публичных API Kalshi и Polymarket в текстовом формате.
              </p>
            </div>
            {query.data ? (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Updated: {formatFetchedAt(query.data.fetchedAt)}
              </p>
            ) : null}
          </div>
        </header>

        {query.isPending ? (
          <section className="py-12" aria-live="polite">
            <p className="text-sm text-slate-600 dark:text-slate-300">
              Загружаю данные обеих платформ...
            </p>
          </section>
        ) : query.isError ? (
          <section className="py-12" role="alert">
            <h2 className="text-xl font-semibold">Не удалось загрузить данные</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Проверьте доступность публичных API и CORS в браузере.
            </p>
            <button
              type="button"
              onClick={() => query.refetch()}
              className="mt-5 rounded-md bg-cyan-700 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
            >
              Повторить запрос
            </button>
          </section>
        ) : (
          <>
            <section className="grid gap-4 py-6 sm:grid-cols-3" aria-label="Data summary">
              <div className="border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                <p className="text-sm text-slate-500 dark:text-slate-400">Всего markets</p>
                <p className="mt-1 text-3xl font-bold">{query.data.markets.length}</p>
              </div>
              <div className="border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                <p className="text-sm text-slate-500 dark:text-slate-400">Kalshi</p>
                <p className="mt-1 text-3xl font-bold">
                  {countByPlatform(query.data.markets, "kalshi")}
                </p>
              </div>
              <div className="border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
                <p className="text-sm text-slate-500 dark:text-slate-400">Polymarket</p>
                <p className="mt-1 text-3xl font-bold">
                  {countByPlatform(query.data.markets, "polymarket")}
                </p>
              </div>
            </section>

            <section className="border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
              <div className="border-b border-slate-200 px-4 py-4 dark:border-slate-800">
                <h2 className="text-lg font-semibold">Markets</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Полный список market-объектов, полученных текущим snapshot-запросом.
                </p>
              </div>
              {query.data.markets.length ? (
                query.data.markets.map((market) => (
                  <MarketRow key={`${market.platform}-${market.id}`} market={market} />
                ))
              ) : (
                <p className="px-4 py-8 text-sm text-slate-500">API не вернул markets.</p>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
