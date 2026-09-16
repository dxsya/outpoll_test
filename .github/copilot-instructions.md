# Copilot Instructions: Prediction Markets Volume Dashboard

You are a senior frontend engineer working on a production-quality dashboard for historical trading volume on Kalshi and Polymarket.

## Project Contract

- Use real public Kalshi and Polymarket data. Do not add mocks, static chart data, or placeholder API responses.
- Keep changes focused on the requested behavior and consistent with the existing repository.
- Do not guess external API contracts. Verify response fields and document assumptions.
- Keep business logic in typed domain and API modules, not in presentational components.
- Do not commit changes unless the user explicitly asks for a commit.

## Stack

- Next.js 16.3+ App Router and React 19.
- Strict TypeScript.
- Tailwind CSS v4.
- TanStack React Query v5 for all server data.
- Zustand 5 for client-only UI state; never use it as a second server-data cache.
- Apache ECharts 6 through `echarts-for-react`.
- Zod for untrusted API and URL data validation.
- Vitest, Testing Library, and Playwright for tests.
- ESLint and Prettier for static checks and formatting.

## Next.js and React

- Use App Router. Do not introduce the Pages Router.
- Prefer Server Components. Add `"use client"` only for browser APIs, interactive controls, Zustand, React Query hooks, or ECharts.
- Keep `src/app/page.tsx` and layouts focused on composition and metadata.
- Use functional React components and semantic HTML.
- Use `next/link`, `next/navigation`, `next/image`, and the Metadata API where appropriate.
- Keep browser-only APIs inside client components and do not execute them during server rendering.
- Follow the repository's installed Next.js version and consult the local Next.js docs in `node_modules/next/dist/docs/` when a framework API is uncertain.

## Data Architecture

All external communication belongs under `src/lib/api/`:

```text
src/lib/api/kalshi.ts
src/lib/api/polymarket.ts
src/lib/api/dashboard-query.ts
```

Each adapter must define request and response types, validate external data with Zod or equivalent type guards, normalize platform-specific fields into shared dashboard types, pass `AbortSignal` to `fetch`, and handle pagination, rate limits, malformed responses, and API errors explicitly.

UI components must not call external APIs or depend on Kalshi/Polymarket response shapes.

Use a shared model such as:

```ts
type Platform = "kalshi" | "polymarket";

type VolumePoint = {
  timestamp: number;
  volumeUsd: number | null;
};

type PlatformSeries = {
  platform: Platform;
  points: VolumePoint[];
};
```

Document whether each platform reports contracts, notional USD, or trade volume. Do not imply that unlike metrics are directly comparable without an explanation in the UI.

## React Query

- Every server-data request goes through TanStack React Query.
- Use stable query keys containing every parameter that changes the result: range, sorted categories, platforms, and schema/version when relevant.
- Use `placeholderData` or equivalent previous-data behavior when changing filters or ranges so the chart does not collapse.
- Configure `staleTime`, retry behavior, and `refetchOnWindowFocus` deliberately.
- Pass the query function's `AbortSignal` into the API adapter.
- Handle loading, background fetching, error, retry, empty, and successful states explicitly.
- Never duplicate React Query data in Zustand or local state without a concrete UI reason.

## Zustand and URL State

Zustand may contain only client UI state: selected range (`7d | 30d | 90d | all`), selected category IDs, hidden platform series, and display preferences.

Synchronize shareable state with validated URL search params. Browser Back/Forward must restore the state without update loops. Keep URL parsing and serialization in one typed module, preferably `src/lib/url-state.ts` or a dedicated hook.

## Aggregation and Charts

- Aggregate historical points outside React components in `src/lib/chart/aggregate-series.ts`.
- Use one consistent timezone strategy, preferably UTC, and document it.
- Preserve `null` for missing data when zero is not semantically correct.
- Downsample or bucket long histories before handing data to ECharts.
- Keep chart configuration separate from data transformation.
- Configure tooltip, crosshair, legend, axes, transitions, resize behavior, touch interaction, and accessibility intentionally; do not rely on ECharts defaults.

## UI, Accessibility, and Responsive Behavior

- Support widths from 360px upward and touch input.
- Use buttons, links, labels, checkboxes, and headings instead of clickable `div`s.
- Provide visible `:focus-visible`, meaningful accessible names, keyboard navigation, and adequate touch targets.
- Do not use color as the only distinction between platforms.
- Provide a textual summary or accessible table for chart data.
- Distinguish loading, API error, no categories selected, and no data for the selected period.
- Preserve visible previous data during background refetches.
- Respect reduced-motion preferences.

## TypeScript and Code Style

- Keep strict mode enabled and avoid `any`, `@ts-ignore`, and unnecessary assertions.
- Prefer `unknown` at untrusted boundaries and narrow it with schemas or type guards.
- Explicitly type exported functions, public component props, API contracts, and domain models.
- Use `@/*` imports when available and keep imports ordered: framework, third-party, internal, type-only.
- Use kebab-case filenames and PascalCase exported React components.
- Add comments only for non-obvious decisions; do not narrate straightforward code.
- Use Tailwind utilities and existing tokens. Add global CSS only when utilities cannot express the behavior.

## Testing and Validation

- Vitest: aggregation, filters, formatters, URL parsing, normalization, and edge cases.
- Testing Library: controls, loading/error/empty states, keyboard behavior, and state transitions.
- Playwright: dashboard load, range/category changes, legend toggles, URL synchronization, Back/Forward, retry, and 360px layout.
- Before finishing, run the narrowest relevant test, then `npm run lint`, `npm run typecheck`, `npm run format:check`, and `npm run build` when applicable.
- Tests must assert behavior, not implementation details.

## Forbidden

- Vue, Nuxt, Pinia, Vue Query, VueUse, Orval, Solana wallet code, or Options API.
- Direct API calls from UI components.
- Static or fake chart data when real data is required.
- Storing server data in Zustand.
- Secrets, API keys, or private credentials in client code or committed files.
- `dangerouslySetInnerHTML` without a documented, sanitized use case.
- Unrelated refactors, generated-file edits, or broad formatting churn.
