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

Браузер запрашивает same-origin Route Handler `/api/dashboard`; typed API adapters в `src/lib/api/` выполняются на сервере. Ответы проходят Zod-валидацию, затем нормализуются в общую доменную модель. React Query отвечает за cache, deduplication, retry, `AbortSignal` и состояния запроса.

### Kalshi

Используем публичный Predictions REST API:

```text
GET https://api.elections.kalshi.com/trade-api/v2/markets
GET https://api.elections.kalshi.com/trade-api/v2/events?with_nested_markets=true
GET https://api.elections.kalshi.com/trade-api/v2/series/{series_ticker}/markets/{ticker}/candlesticks
```

Подтверждённые поля:

- `/events?with_nested_markets=true` возвращает `{ events, cursor }`; pagination cursor-based;
- event связывает market с `series_ticker` и категорией, а nested market содержит `ticker`, `event_ticker`, `volume_fp`, `created_time` и `close_time`;
- candlesticks принимают `start_ts`, `end_ts` и `period_interval=1440` для дневных bucket;
- candlestick содержит `end_period_ts` и `volume_fp`.

`volume_fp` у Kalshi измеряется в контрактах. Для графика сейчас используется прозрачный proxy: один контракт трактуется как $1 contract-notional. Это не равно фактической сумме премий, поэтому UI и README должны называть метрику именно contract-notional proxy.

Для `all` адаптер получает как open, так и closed events и запрашивает доступные дневные candlesticks без искусственного годового cutoff. Исторический ряд остаётся ограниченным выбранным cohort: top-15 markets каждой доступной категории по текущему platform volume и safety limit пагинации.

### Polymarket

Используем публичные endpoints без API key:

```text
GET https://gamma-api.polymarket.com/markets/keyset
GET https://data-api.polymarket.com/v2/trades
```

Подтверждённые поля:

- `/markets/keyset` возвращает `{ markets, next_cursor }`; cursor opaque и передаётся обратно как `next_cursor`;
- market содержит `id`, `conditionId`, `question`, `category`, `tags`, `volumeNum`, `closed` и связанные metadata;
- `/v2/trades?condition={conditionId}&limit={limit}` возвращает `{ data, pagination }`;
- trade содержит `condition_id`, `size`, `price`, `timestamp`;
- `size` измеряется в shares, `price` в USDC за share, поэтому trade notional считается как `size * price`;
- pagination использует `pagination.next_cursor`, а не offset; cursor нужно передавать неизменённым;
- API может вернуть `429` и `Retry-After`, поэтому retry должен учитывать временную ошибку и лимит запросов.

В отличие от Kalshi, у Polymarket нет готового daily volume в market metadata. Исторический ряд строится из trade pages по top-15 markets на категорию, выбранным по `volumeNum`, затем trades агрегируются по UTC bucket. Список markets проходит keyset pagination с safety limit, а история каждого выбранного market проходит bounded trade pagination.

Для сопоставимого cohort обе платформы используют одинаковое число исторических markets: top-15 на категорию по platform-specific volume (`volume_fp` для Kalshi и `volumeNum` для Polymarket). Категории приводятся к общей таксономии `Politics`, `Weather`, `Sports` через точное Kalshi category и Polymarket tag id.

### Сопоставимость метрик

Метрики платформ не идентичны:

| Platform   | Raw metric                      | Normalized dashboard metric    |
| ---------- | ------------------------------- | ------------------------------ |
| Kalshi     | contracts in `volume_fp`        | contract-notional proxy in USD |
| Polymarket | shares and USDC/share in trades | trade notional in USDC         |

Обе серии показываются рядом для сравнительного анализа активности, но не должны описываться как строго одинаковый cash turnover без этой оговорки.

## CORS и ограничения

Проверка публичных GET-запросов 16 сентября 2026 года:

- Kalshi GET `/markets` ответил `200` с `access-control-allow-origin: http://localhost:3000` при Origin-заголовке;
- Polymarket Data API trades ответил `200` с `access-control-allow-origin: *`;
- Polymarket Gamma `/markets` работает, но помечен deprecated и предупреждает использовать `/markets/keyset`;
- публичность API не гарантирует одинаковые CORS-заголовки для любого endpoint или production origin, поэтому deploy нужно проверять отдельно;
- API requests не требуют секретов или API keys для выбранных read-only endpoints.
- Внутренние запросы к одному источнику ограничены четырьмя одновременно выполняемыми задачами; `429` и `5xx` повторяются максимум два раза, с `Retry-After` или экспоненциальной паузой, отменяемой через `AbortSignal`.

## Реализация этапа 2

- `src/lib/api/schemas.ts` содержит Zod-схемы внешних ответов;
- `src/lib/api/kalshi.ts` нормализует markets, categories и daily candlesticks;
- `src/lib/api/polymarket.ts` нормализует markets и trades, включая keyset/cursor pagination;
- `src/lib/api/errors.ts` обрабатывает HTTP errors, `Retry-After`, timestamps и finite numbers;
- `src/lib/api/pagination.ts` содержит общий cursor pagination helper с safety limit;
- `src/types/market.ts` содержит общие platform/market/volume types;
- `src/lib/chart/aggregate-series.test.ts` покрывает доменную агрегацию и её edge cases.

Исторические points подключены в `fetchDashboardSnapshotFromApis`: Kalshi получает daily candlesticks для open и closed markets, Polymarket получает trades, после чего обе платформы нормализуются и агрегируются перед передачей в UI. Диапазон передаётся в `/api/dashboard?range=7d|30d|90d|all`; `all` не имеет fixed-day cutoff. При пустом выборе категорий внешние запросы не выполняются.

Каталог может содержать больше markets, чем исторический cohort графика. В summary отдельно показываются размеры полного каталога и количество markets, реально использованных для исторического графика на каждой платформе.

## График и выбранный стек

График реализован через `echarts-for-react` и Apache ECharts с Canvas renderer. Это позволяет использовать настоящие time/value axes, две независимые USD-шкалы, axis tooltip для обеих платформ и crosshair с snap к ближайшей точке. Для touch-сценариев включены `click`-активация tooltip и draggable crosshair handle; `aria` включён в конфигурации ECharts, а рядом с canvas есть текстовое summary для screen readers.

Диапазон и категории синхронизированы с URL: `/?range=30d&categories=politics,sports`. Отсутствующий `categories` означает все категории, а пустой `categories=` показывает состояние «No categories selected». Изменения фильтров создают history entries, поэтому Back/Forward восстанавливают состояние интерфейса.

Дополнительные возможности dashboard:

- category share pie chart строится из выбранных normalized volume points;
- `Period delta` сравнивает сумму второй половины выбранного периода с первой половиной;
- тема по умолчанию следует `prefers-color-scheme`, а кнопка `Theme` переключает system/light/dark;
- chart export скачивает текущие агрегированные данные в CSV и текущий вид графика в PNG или SVG.

## Реализация этапа 3

- `src/lib/chart/aggregate-series.ts` фильтрует markets по категориям и выбирает UTC bucket для диапазона;
- дневная, недельная и месячная агрегация суммирует уникальные точки по платформам;
- объединённая временная шкала сохраняет `null`, когда у платформы нет значения в bucket;
- `src/lib/chart/aggregate-series.test.ts` проверяет пустые категории, дубликаты, пустые значения, UTC-недели и длинные диапазоны.

## Ограничения данных

- Режим `all` показывает все доступные API observations для bounded cohort, а не полный архив каждого рынка платформы.
- Календари и определения объёма платформ различаются; значения пригодны для сравнения активности, но не являются строго идентичным cash turnover.
- Частичные ошибки источников показываются в интерфейсе вместе с доступными данными другой платформы.
