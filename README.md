# Prediction Markets Volume Dashboard

Dashboard исторического торгового объёма Kalshi и Polymarket на Next.js 16, React 19, TypeScript, TanStack React Query, Zustand и ECharts.

## Запуск

```bash
npm install
npm run dev
```

Открыть [http://localhost:3000](http://localhost:3000).

Проверки:

```bash
npm run lint
npm run typecheck
npm run test
npm run format:check
npm run build
```

## Источники данных

Запросы выполняются из браузера через typed API adapters в `src/lib/api/`. Ответы проходят Zod-валидацию, затем нормализуются в общую доменную модель. React Query отвечает за cache, deduplication, retry, `AbortSignal` и состояния запроса.

### Kalshi

Используем публичный Predictions REST API:

```text
GET https://api.elections.kalshi.com/trade-api/v2/markets
GET https://api.elections.kalshi.com/trade-api/v2/events/{event_ticker}
GET https://api.elections.kalshi.com/trade-api/v2/series/{series_ticker}
GET https://api.elections.kalshi.com/trade-api/v2/series/{series_ticker}/markets/{ticker}/candlesticks
```

Подтверждённые поля:

- `/markets` возвращает `{ markets, cursor }`; `limit` поддерживает до 1000, pagination cursor-based;
- market содержит `ticker`, `event_ticker` и `volume_fp`;
- event связывает market с `series_ticker`;
- series содержит `category` и `categories`;
- candlesticks принимают `start_ts`, `end_ts` и `period_interval=1440` для дневных bucket;
- candlestick содержит `end_period_ts` и `volume_fp`.

`volume_fp` у Kalshi измеряется в контрактах. Для графика сейчас используется прозрачный proxy: один контракт трактуется как $1 contract-notional. Это не равно фактической сумме премий, поэтому UI и README должны называть метрику именно contract-notional proxy.

Рынки, ушедшие за historical cutoff, требуют historical endpoints. Для первого этапа адаптер ограничен активными рынками и дневными live candlesticks; поддержку archived history нужно добавить перед полноценным режимом `all`.

### Polymarket

Используем публичные endpoints без API key:

```text
GET https://gamma-api.polymarket.com/markets/keyset
GET https://data-api.polymarket.com/v2/trades
```

Подтверждённые поля:

- `/markets/keyset` возвращает `{ markets, next_cursor }`; cursor opaque и передаётся обратно как `next_cursor`;
- market содержит `id`, `conditionId`, `question`, `category`, `volumeNum`, `closed` и связанные metadata;
- `/v2/trades?condition={conditionId}&limit={limit}` возвращает `{ data, pagination }`;
- trade содержит `condition_id`, `size`, `price`, `timestamp`;
- `size` измеряется в shares, `price` в USDC за share, поэтому trade notional считается как `size * price`;
- pagination использует `pagination.next_cursor`, а не offset; cursor нужно передавать неизменённым;
- API может вернуть `429` и `Retry-After`, поэтому retry должен учитывать временную ошибку и лимит запросов.

В отличие от Kalshi, у Polymarket нет готового daily volume в market metadata. Исторический ряд строится из trade pages по каждому condition ID, затем trades агрегируются по UTC-дню. Это реальные данные, но путь тяжелее: число запросов растёт вместе с количеством markets и trades. Для production-версии нужно ограничить число markets, применять server-side filters, кэшировать результат React Query и не загружать неограниченную историю в один браузерный запрос.

### Сопоставимость метрик

Метрики платформ не идентичны:

| Platform | Raw metric | Normalized dashboard metric |
| --- | --- | --- |
| Kalshi | contracts in `volume_fp` | contract-notional proxy in USD |
| Polymarket | shares and USDC/share in trades | trade notional in USDC |

Обе серии показываются рядом для сравнительного анализа активности, но не должны описываться как строго одинаковый cash turnover без этой оговорки.

## CORS и ограничения

Проверка публичных GET-запросов 16 сентября 2026 года:

- Kalshi GET `/markets` ответил `200` с `access-control-allow-origin: http://localhost:3000` при Origin-заголовке;
- Polymarket Data API trades ответил `200` с `access-control-allow-origin: *`;
- Polymarket Gamma `/markets` работает, но помечен deprecated и предупреждает использовать `/markets/keyset`;
- публичность API не гарантирует одинаковые CORS-заголовки для любого endpoint или production origin, поэтому deploy нужно проверять отдельно;
- API requests не требуют секретов или API keys для выбранных read-only endpoints.

## Реализация этапа 2

- `src/lib/api/schemas.ts` содержит Zod-схемы внешних ответов;
- `src/lib/api/kalshi.ts` нормализует markets, categories и daily candlesticks;
- `src/lib/api/polymarket.ts` нормализует markets и trades, включая keyset/cursor pagination;
- `src/lib/api/errors.ts` обрабатывает HTTP errors, `Retry-After`, timestamps и finite numbers;
- `src/lib/api/pagination.ts` содержит общий cursor pagination helper с safety limit;
- `src/types/market.ts` содержит общие platform/market/volume types;
- `src/lib/api/*.test.ts` покрывает normalization, categories, timestamp, malformed values, pagination и error boundaries.

## Следующие ограничения этапа 2

1. Подключить `dashboardQueryFn` к React Query и ограничить набор markets по диапазону/категориям.
2. Добавить Kalshi historical markets/candlesticks для корректного `all`.
3. Добавить integration tests с `fetch` fixtures для реальных envelope shapes без обращения к API в unit-тестах.
4. Добавить измерение числа запросов и graceful partial failure для независимых платформ.
