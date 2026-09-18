import { fetchJson, parseFiniteNumber, parseTimestampSeconds } from "@/lib/api/errors";
import { collectCursorPages } from "@/lib/api/pagination";
import { normalizeMarketCategory } from "@/lib/filters/normalize-category";
import {
  polymarketMarketSchema,
  polymarketMarketsResponseSchema,
  polymarketTradesResponseSchema,
} from "@/lib/api/schemas";
import type { Market, MarketCategory, VolumePoint } from "@/types/market";

const GAMMA_API_BASE_URL = "https://gamma-api.polymarket.com";
const DATA_API_BASE_URL = "https://data-api.polymarket.com/v2";
const PAGE_LIMIT = 500;
const MAX_MARKET_PAGES = 100;

export type PolymarketMarket = {
  id: string;
  conditionId: string;
  question?: string | null;
  category?: string | null;
  tags?: Array<{ id?: string; label?: string; slug?: string }>;
  volumeNum?: number | null;
  closed?: boolean | null;
};

export type PolymarketTrade = {
  condition_id: string;
  size: number;
  price: number;
  timestamp: number;
};

function getMarketCategory(market: PolymarketMarket): MarketCategory {
  if (market.category?.trim()) {
    return normalizeMarketCategory(market.category);
  }

  const tag = market.tags?.find((item) => item.label?.trim() || item.slug?.trim());
  return normalizeMarketCategory(tag?.label || tag?.slug);
}

export function normalizePolymarketMarket(market: PolymarketMarket): Market {
  return {
    id: market.conditionId,
    platform: "polymarket",
    title: market.question?.trim() || market.id,
    category: getMarketCategory(market),
    volumeMetric: "trade-notional-usdc",
    source: {
      gammaId: market.id,
      volumeUsd: market.volumeNum ?? null,
      closed: market.closed ?? null,
    },
  };
}

export function normalizePolymarketTrades(
  market: PolymarketMarket,
  trades: PolymarketTrade[],
): VolumePoint[] {
  return trades.map((trade) => ({
    timestamp: parseTimestampSeconds(trade.timestamp, "timestamp"),
    volumeUsd: parseFiniteNumber(trade.size, "size") * parseFiniteNumber(trade.price, "price"),
    marketId: market.conditionId,
    categoryId: getMarketCategory(market).id,
    platform: "polymarket",
  }));
}

export async function fetchPolymarketMarkets(
  signal: AbortSignal,
  limit = PAGE_LIMIT,
): Promise<PolymarketMarket[]> {
  return collectCursorPages({
    maxPages: MAX_MARKET_PAGES,
    fetchPage: async (cursor) => {
      const url = new URL(`${GAMMA_API_BASE_URL}/markets/keyset`);
      url.searchParams.set("limit", String(limit));
      url.searchParams.set("closed", "false");
      url.searchParams.set("include_tag", "true");
      if (cursor) {
        url.searchParams.set("next_cursor", cursor);
      }

      const payload = polymarketMarketsResponseSchema.parse(await fetchJson(url, { signal }));
      return {
        items: payload.markets.map((market) => polymarketMarketSchema.parse(market)),
        nextCursor: payload.next_cursor,
      };
    },
  });
}

export async function fetchPolymarketTradesPage(
  market: PolymarketMarket,
  signal: AbortSignal,
  cursor: string | null = null,
): Promise<{ points: VolumePoint[]; nextCursor: string | null }> {
  const url = new URL(`${DATA_API_BASE_URL}/trades`);
  url.searchParams.set("condition", market.conditionId);
  url.searchParams.set("limit", String(PAGE_LIMIT));
  if (cursor) {
    url.searchParams.set("cursor", cursor);
  }

  const payload = polymarketTradesResponseSchema.parse(await fetchJson(url, { signal }));
  return {
    points: normalizePolymarketTrades(market, payload.data),
    nextCursor: payload.pagination.has_more ? payload.pagination.next_cursor : null,
  };
}

export async function fetchAllPolymarketTrades(
  market: PolymarketMarket,
  signal: AbortSignal,
  maxPages = 10,
): Promise<VolumePoint[]> {
  return collectCursorPages({
    maxPages,
    fetchPage: async (cursor) => {
      const result = await fetchPolymarketTradesPage(market, signal, cursor);
      return { items: result.points, nextCursor: result.nextCursor };
    },
  });
}
