import { z } from "zod";

export const kalshiMarketSchema = z.object({
  ticker: z.string().min(1),
  event_ticker: z.string().min(1),
  volume_fp: z.string(),
});

export const kalshiMarketsResponseSchema = z.object({
  markets: z.array(kalshiMarketSchema),
  cursor: z.string(),
});

export const kalshiEventSchema = z.object({
  event_ticker: z.string().min(1),
  series_ticker: z.string().min(1),
  category: z.string().nullable().optional(),
});

export const kalshiEventResponseSchema = z.object({
  event: kalshiEventSchema,
});

export const kalshiSeriesSchema = z.object({
  ticker: z.string().min(1),
  category: z.string().min(1),
  categories: z.array(z.string()),
});

export const kalshiSeriesResponseSchema = z.object({
  series: kalshiSeriesSchema,
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
  conditionId: z.string().min(1),
  question: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
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
