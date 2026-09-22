import {
  fetchJson,
  parseFiniteNumber,
  parseTimestampSeconds,
  type RequestStats,
} from "@/lib/api/errors";
import { collectCursorPages } from "@/lib/api/pagination";
import {
  polymarketMarketSchema,
  polymarketMarketsResponseSchema,
  polymarketTradesResponseSchema,
} from "@/lib/api/schemas";
import type { Market, MarketCategory, VolumePoint } from "@/types/market";

const GAMMA_API_BASE_URL = "https://gamma-api.polymarket.com";
const DATA_API_BASE_URL = "https://data-api.polymarket.com/v2";
const PAGE_LIMIT = 500;
const MAX_MARKET_PAGES = 10;

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

export function normalizePolymarketMarket(
  market: PolymarketMarket,
  category: MarketCategory,
): Market {
  return {
    id: market.conditionId,
    platform: "polymarket",
    title: market.question?.trim() || market.id,
    category,
    volumeMetric: "outcome-token-count",
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
  categoryId: string,
): VolumePoint[] {
  return trades.map((trade) => ({
    timestamp: parseTimestampSeconds(trade.timestamp, "timestamp"),
    volumeUsd: parseFiniteNumber(trade.size, "size"),
    marketId: market.conditionId,
    categoryId,
    platform: "polymarket",
  }));
}

/** Fetches every market tagged with `tagId`, open or closed depending on `closed`. */
export async function fetchPolymarketMarketsByTag(
  tagId: string,
  closed: boolean,
  signal: AbortSignal,
  limit = PAGE_LIMIT,
  maxPages = MAX_MARKET_PAGES,
  requestStats?: RequestStats,
): Promise<PolymarketMarket[]> {
  return collectCursorPages({
    maxPages,
    fetchPage: async (cursor) => {
      const url = new URL(`${GAMMA_API_BASE_URL}/markets/keyset`);
      url.searchParams.set("tag_id", tagId);
      url.searchParams.set("limit", String(limit));
      url.searchParams.set("closed", String(closed));
      url.searchParams.set("include_tag", "true");
      if (cursor) {
        url.searchParams.set("next_cursor", cursor);
      }

      const payload = polymarketMarketsResponseSchema.parse(
        await fetchJson(url, { signal }, requestStats),
      );
      const items = payload.markets
        .map((market) => polymarketMarketSchema.parse(market))
        .filter((market) => market.conditionId.length > 0);
      return { items, nextCursor: payload.next_cursor };
    },
  });
}

export async function fetchPolymarketTradesPage(
  market: PolymarketMarket,
  categoryId: string,
  signal: AbortSignal,
  cursor: string | null = null,
  requestStats?: RequestStats,
): Promise<{ points: VolumePoint[]; nextCursor: string | null }> {
  const url = new URL(`${DATA_API_BASE_URL}/trades`);
  url.searchParams.set("condition", market.conditionId);
  url.searchParams.set("limit", String(PAGE_LIMIT));
  if (cursor) {
    url.searchParams.set("cursor", cursor);
  }

  const payload = polymarketTradesResponseSchema.parse(
    await fetchJson(url, { signal }, requestStats),
  );
  return {
    points: normalizePolymarketTrades(market, payload.data, categoryId),
    nextCursor: payload.pagination.has_more ? payload.pagination.next_cursor : null,
  };
}

export async function fetchAllPolymarketTrades(
  market: PolymarketMarket,
  categoryId: string,
  signal: AbortSignal,
  maxPages = 10,
  requestStats?: RequestStats,
): Promise<VolumePoint[]> {
  return collectCursorPages({
    maxPages,
    fetchPage: async (cursor) => {
      const result = await fetchPolymarketTradesPage(
        market,
        categoryId,
        signal,
        cursor,
        requestStats,
      );
      return { items: result.points, nextCursor: result.nextCursor };
    },
  });
}
