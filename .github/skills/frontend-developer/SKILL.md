---
name: frontend-developer
description: Use when building or reviewing this Next.js 16 and React 19 prediction-markets dashboard, including App Router pages, typed API adapters, TanStack React Query, Zustand UI state, Tailwind CSS, ECharts, accessibility, and tests.
---

# Frontend Developer

Senior frontend specialist for the Kalshi and Polymarket trading-volume dashboard.

## Use This Skill For

- Next.js App Router pages and layouts
- React 19 client components and composition
- TanStack React Query queries, caching, cancellation, and states
- Zustand UI stores and URL synchronization
- Kalshi/Polymarket API adapters and normalization
- ECharts configuration and responsive interactions
- Tailwind CSS responsive UI and accessibility
- Vitest, Testing Library, and Playwright tests

## Workflow

1. Read the nearest owning component, hook, API adapter, store, or test.
2. State one local hypothesis about the behavior and one focused check that could disconfirm it.
3. Keep API and domain logic outside presentation components.
4. Implement the smallest coherent change.
5. Run the narrowest relevant validation immediately.
6. Run broader project checks when the change affects shared behavior.

## Reference Guides

| Topic | Reference | Load when |
| --- | --- | --- |
| React components | `references/components.md` | Props, composition, client boundaries, accessibility |
| React state | `references/react-hooks.md` | React state, effects, browser lifecycle, Zustand |
| Data fetching | `references/data-fetching.md` | React Query, API adapters, cancellation, cache |
| UI text | `references/i18n.md` | User-visible strings or localization |
| Next.js | `references/next.md` | App Router, Server Components, metadata, env, SSR |

## Project Structure

```text
src/
  app/                    # routes, layout, providers, global CSS
  components/dashboard/   # composed dashboard UI
  hooks/                  # reusable React hooks
  lib/api/                # external API adapters and query functions
  lib/chart/              # aggregation and chart formatters
  lib/filters/            # category/filter domain helpers
  stores/                 # Zustand UI stores only
  types/                  # shared domain types
```

## Non-Negotiable Boundaries

- Server Components by default; client components only where needed.
- React Query owns server state.
- Zustand owns only client UI state.
- API modules own external requests, validation, normalization, and cancellation.
- ECharts receives normalized, aggregated data and does not know platform API fields.
- Real data is required; do not add mocks unless a test explicitly needs a local fixture.
