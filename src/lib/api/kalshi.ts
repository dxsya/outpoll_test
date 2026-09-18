import { fetchJson, parseFiniteNumber, parseTimestampSeconds } from "@/lib/api/errors";
import { collectCursorPages } from "@/lib/api/pagination";
import { normalizeMarketCategory } from "@/lib/filters/normalize-category";
import {
  kalshiCandlesticksResponseSchema,
  kalshiEventResponseSchema,
  kalshiMarketsResponseSchema,
  kalshiSeriesResponseSchema,
} from "@/lib/api/schemas";
import type { Market, MarketCategory, VolumePoint } from "@/types/market";

const KALSHI_API_BASE_URL = "https://api.elections.kalshi.com/trade-api/v2";
const KALSHI_PAGE_LIMIT = 1000;
const MAX_KALSHI_MARKET_PAGES = 10;

export type KalshiMarketStatus = "open" | "closed";

export type KalshiMarket = {
  ticker: string;
  event_ticker: string;
  title?: string;
  status?: string;
  volume_fp: string;
  volume_24h_fp?: string;
  created_time?: string;
};

export type KalshiCategoryLookup = {
  category: MarketCategory;
  seriesTicker: string;
};

export function normalizeKalshiMarket(market: KalshiMarket, lookup: KalshiCategoryLookup): Market {
  return {
    id: market.ticker,
    platform: "kalshi",
    title: market.title?.trim() || market.ticker,
    category: normalizeMarketCategory(lookup.category.label),
    volumeMetric: "contract-notional-usd",
    source: {
      eventTicker: market.event_ticker,
      status: market.status ?? null,
      volumeContracts: market.volume_fp,
    },
  };
}

export function normalizeKalshiCandlesticks(
  market: KalshiMarket,
  candlesticks: Array<{ end_period_ts: number; volume_fp: string }>,
  categoryId = "uncategorized",
): VolumePoint[] {
  return candlesticks.map((candlestick) => ({
    timestamp: parseTimestampSeconds(candlestick.end_period_ts, "end_period_ts"),
    volumeUsd: parseFiniteNumber(candlestick.volume_fp, "volume_fp"),
    marketId: market.ticker,
    categoryId,
    platform: "kalshi",
  }));
}

async function fetchKalshiMarketsPage(
  cursor: string | null,
  signal: AbortSignal,
  status: KalshiMarketStatus,
): Promise<{ markets: KalshiMarket[]; cursor: string }> {
  const url = new URL(`${KALSHI_API_BASE_URL}/markets`);
  url.searchParams.set("limit", String(KALSHI_PAGE_LIMIT));
  url.searchParams.set("status", status);
  if (cursor) {
    url.searchParams.set("cursor", cursor);
  }

  const payload = kalshiMarketsResponseSchema.parse(await fetchJson(url, { signal }));
  return payload;
}

export async function fetchAllKalshiMarkets(
  signal: AbortSignal,
  status: KalshiMarketStatus = "open",
  maxPages = MAX_KALSHI_MARKET_PAGES,
): Promise<KalshiMarket[]> {
  return collectCursorPages({
    maxPages,
    fetchPage: async (cursor) => {
      const result = await fetchKalshiMarketsPage(cursor, signal, status);
      return { items: result.markets, nextCursor: result.cursor || null };
    },
  });
}

export async function fetchKalshiCategory(
  eventTicker: string,
  signal: AbortSignal,
): Promise<KalshiCategoryLookup> {
  const eventUrl = new URL(`${KALSHI_API_BASE_URL}/events/${encodeURIComponent(eventTicker)}`);
  const eventPayload = kalshiEventResponseSchema.parse(await fetchJson(eventUrl, { signal }));
  const seriesUrl = new URL(
    `${KALSHI_API_BASE_URL}/series/${encodeURIComponent(eventPayload.event.series_ticker)}`,
  );
  const seriesPayload = kalshiSeriesResponseSchema.parse(await fetchJson(seriesUrl, { signal }));

  return {
    category: normalizeMarketCategory(seriesPayload.series.category),
    seriesTicker: seriesPayload.series.ticker,
  };
}

export async function fetchKalshiCandlesticks(
  market: KalshiMarket,
  range: { startTs: number; endTs: number },
  seriesTicker: string,
  signal: AbortSignal,
  categoryId = "uncategorized",
): Promise<VolumePoint[]> {
  const url = new URL(
    `${KALSHI_API_BASE_URL}/series/${encodeURIComponent(seriesTicker)}/markets/${encodeURIComponent(market.ticker)}/candlesticks`,
  );
  url.searchParams.set("start_ts", String(range.startTs));
  url.searchParams.set("end_ts", String(range.endTs));
  url.searchParams.set("period_interval", "1440");

  const payload = kalshiCandlesticksResponseSchema.parse(await fetchJson(url, { signal }));
  return normalizeKalshiCandlesticks(market, payload.candlesticks, categoryId);
}
