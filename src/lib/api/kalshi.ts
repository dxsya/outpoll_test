import {
  fetchJson,
  parseFiniteNumber,
  parseTimestampSeconds,
  type RequestStats,
} from "@/lib/api/errors";
import { collectCursorPages } from "@/lib/api/pagination";
import { kalshiCandlesticksResponseSchema, kalshiEventsResponseSchema } from "@/lib/api/schemas";
import type { Market, MarketCategory, VolumePoint } from "@/types/market";

const KALSHI_API_BASE_URL = "https://api.elections.kalshi.com/trade-api/v2";
const KALSHI_EVENT_PAGE_LIMIT = 200;
const MAX_KALSHI_EVENT_PAGES = 15;

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

export type KalshiEventWithMarkets = {
  event_ticker: string;
  series_ticker: string;
  category?: string | null;
  markets?: KalshiMarket[];
};

export function normalizeKalshiMarket(market: KalshiMarket, category: MarketCategory): Market {
  return {
    id: market.ticker,
    platform: "kalshi",
    title: market.title?.trim() || market.ticker,
    category,
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

async function fetchKalshiEventsPage(
  cursor: string | null,
  signal: AbortSignal,
  status: KalshiMarketStatus,
  requestStats?: RequestStats,
): Promise<{ events: KalshiEventWithMarkets[]; cursor: string }> {
  const url = new URL(`${KALSHI_API_BASE_URL}/events`);
  url.searchParams.set("limit", String(KALSHI_EVENT_PAGE_LIMIT));
  url.searchParams.set("status", status);
  url.searchParams.set("with_nested_markets", "true");
  if (cursor) {
    url.searchParams.set("cursor", cursor);
  }

  return kalshiEventsResponseSchema.parse(await fetchJson(url, { signal }, requestStats));
}

/**
 * Fetches events with nested markets. Kalshi's `/events` response already
 * includes each event's category and its markets' volume, so a single paged
 * walk covers every category without a per-market series lookup round trip.
 */
export async function fetchAllKalshiEvents(
  signal: AbortSignal,
  status: KalshiMarketStatus,
  maxPages = MAX_KALSHI_EVENT_PAGES,
  requestStats?: RequestStats,
): Promise<KalshiEventWithMarkets[]> {
  return collectCursorPages({
    maxPages,
    fetchPage: async (cursor) => {
      const page = await fetchKalshiEventsPage(cursor, signal, status, requestStats);
      return { items: page.events, nextCursor: page.cursor || null };
    },
  });
}

export async function fetchKalshiCandlesticks(
  market: KalshiMarket,
  range: { startTs: number; endTs: number },
  seriesTicker: string,
  signal: AbortSignal,
  categoryId = "uncategorized",
  requestStats?: RequestStats,
): Promise<VolumePoint[]> {
  const url = new URL(
    `${KALSHI_API_BASE_URL}/series/${encodeURIComponent(seriesTicker)}/markets/${encodeURIComponent(market.ticker)}/candlesticks`,
  );
  url.searchParams.set("start_ts", String(range.startTs));
  url.searchParams.set("end_ts", String(range.endTs));
  url.searchParams.set("period_interval", "1440");

  const payload = kalshiCandlesticksResponseSchema.parse(
    await fetchJson(url, { signal }, requestStats),
  );
  return normalizeKalshiCandlesticks(market, payload.candlesticks, categoryId);
}
