import { z } from "zod";

export const kalshiMarketSchema = z.object({
  ticker: z.string().min(1),
  event_ticker: z.string().min(1),
  title: z.string().optional(),
  status: z.string().optional(),
  volume_fp: z.string(),
  volume_24h_fp: z.string().optional(),
  created_time: z.string().optional(),
});

export const kalshiMarketsResponseSchema = z.object({
  markets: z.array(kalshiMarketSchema),
  cursor: z.string(),
});

export const kalshiEventWithMarketsSchema = z.object({
  event_ticker: z.string().min(1),
  series_ticker: z.string().min(1),
  category: z.string().nullable().optional(),
  markets: z.array(kalshiMarketSchema).optional(),
});

export const kalshiEventsResponseSchema = z.object({
  events: z.array(kalshiEventWithMarketsSchema),
  cursor: z.string(),
});

export const kalshiCandlestickSchema = z.object({
  end_period_ts: z.number(),
  volume_fp: z.string(),
});

export const kalshiCandlesticksResponseSchema = z.object({
  ticker: z.string().min(1),
  candlesticks: z.array(kalshiCandlestickSchema),
});

export const polymarketMarketSchema = z.object({
  id: z.string().min(1),
  // Some Gamma markets (e.g. not-yet-initialized ones) report an empty
  // conditionId; filter those out downstream instead of failing validation.
  conditionId: z.string(),
  question: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  tags: z
    .array(
      z.object({
        id: z.string().optional(),
        label: z.string().optional(),
        slug: z.string().optional(),
      }),
    )
    .optional(),
  volumeNum: z.number().nullable().optional(),
  closed: z.boolean().nullable().optional(),
});

export const polymarketMarketsResponseSchema = z.object({
  markets: z.array(polymarketMarketSchema),
  next_cursor: z.string().nullable(),
});

export const polymarketTradeSchema = z.object({
  condition_id: z.string().min(1),
  size: z.number(),
  price: z.number(),
  timestamp: z.number(),
});

export const polymarketTradesResponseSchema = z.object({
  data: z.array(polymarketTradeSchema),
  pagination: z.object({
    has_more: z.boolean(),
    next_cursor: z.string().nullable(),
  }),
});
