# Architecture Rules

## Runtime

This project is a Next.js 16 App Router application using React 19 and strict TypeScript. Use Server Components by default. A component becomes a Client Component only when it needs browser APIs, event handlers, Zustand, React Query hooks, or ECharts.

## Layers

Use the repository's focused structure:

```text
src/app/                 # routes, layouts, metadata, providers
src/components/dashboard # composed dashboard UI
src/hooks/               # reusable React hooks
src/lib/api/             # external requests, validation, normalization
src/lib/chart/           # aggregation and chart formatting
src/lib/filters/         # category/filter domain logic
src/stores/              # Zustand UI state only
src/types/               # shared domain contracts
```

Keep route files thin. Components may compose hooks and domain helpers, but presentation components must not own API calls or platform-specific response parsing.

## Dependency Direction

- `app` may compose components, hooks, stores, and library modules.
- `components` may use hooks, stores, types, and domain helpers.
- `hooks` may use React Query, stores, API query functions, and domain helpers.
- `lib/api` may use types and schemas, but must not import UI components or stores.
- `lib/chart` and `lib/filters` must be framework-independent where practical.
- `stores` may contain UI preferences and filter state, never fetched server data.
- Shared lower-level modules must not import from routes or presentation components.

## API Boundary

All Kalshi and Polymarket communication belongs in `src/lib/api/`. Each adapter validates untrusted responses, normalizes them into shared types, supports `AbortSignal`, and exposes typed functions to React Query. UI code must never depend on vendor field names.

## State Strategy

| State                                            | Owner                           |
| ------------------------------------------------ | ------------------------------- |
| API data, loading, errors, cache                 | TanStack React Query            |
| Range, categories, hidden series, UI preferences | Zustand and validated URL state |
| Form draft or open/closed local state            | Component state                 |
| Aggregated chart series                          | Pure chart/domain functions     |

Use one URL parser/serializer. Back/Forward must update the UI without creating synchronization loops.

## Chart Pipeline

```text
API response -> schema validation -> platform normalization -> category filter
-> UTC bucketing/downsampling -> shared chart model -> ECharts options
```

Aggregation and formatting stay outside the chart component. Missing data remains distinguishable from a true zero. Long histories must be reduced before rendering.

## Adding New Features

1. Identify the owning route or dashboard widget.
2. Define or update shared types and validation at the boundary.
3. Add domain logic as a pure, testable helper.
4. Add API/query wiring if server data is involved.
5. Keep the component responsible for rendering and user interaction.
6. Add focused tests and run the relevant validation commands.
