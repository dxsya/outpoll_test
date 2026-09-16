# Coding Standards

## TypeScript

- Strict TypeScript is required.
- Avoid `any`, `@ts-ignore`, and unnecessary type assertions.
- Use `unknown` for untrusted API, URL, and browser input; narrow it with Zod schemas or type guards.
- Explicitly type exported functions, public props, API contracts, and domain models.
- Prefer discriminated unions for loading/error/success and other variant states.
- Use `@/*` imports and keep import groups ordered: Next/React, third-party, internal, type-only.
- Use kebab-case filenames and PascalCase exported React components.

## React

- Prefer Server Components. Use `"use client"` only at the smallest interactive boundary.
- Use functional components and semantic HTML.
- Do not call hooks conditionally or inside loops/callbacks.
- Keep effects for synchronization with external systems; derive values during render when possible.
- Clean up timers, subscriptions, observers, and event listeners in effects.
- Do not mutate props or query data directly.
- Use stable keys based on domain IDs, never array indexes for dynamic lists.
- Do not add `useMemo` or `useCallback` without a measured or concrete identity-stability reason.

## React Query

- All server data uses `@tanstack/react-query`.
- Query keys include every parameter that changes the result and use stable ordering.
- API query functions accept and forward `AbortSignal`.
- Configure stale time, retries, and refetch behavior deliberately.
- Use previous-data behavior during range/filter changes.
- Do not copy query data into Zustand or an unrelated `useState`.
- Invalidate or update affected query keys after mutations if mutations are introduced.

## Zustand

- Store only client UI state: filters, visibility, preferences, and transient display state.
- Keep stores small and expose actions for updates.
- Select the smallest state slice needed by a component.
- Do not persist server responses or secrets in the store.

## API and Errors

- Validate every external response before reading fields.
- Normalize Kalshi and Polymarket data into shared internal types.
- Never silently swallow an API or parsing error.
- Do not expose raw vendor error text directly to users; log only safe diagnostic context.
- Distinguish loading, background fetching, API error, no categories, and no data for period.

## Styling and Accessibility

- Prefer Tailwind CSS v4 utilities and project tokens.
- Use mobile-first responsive layouts from 360px upward.
- Avoid inline styles unless a third-party API requires them.
- Use visible `:focus-visible`, semantic controls, labels, keyboard interaction, and 44px touch targets.
- Do not rely on color alone to communicate platform or status.
- Respect reduced motion.

## Testing

- Test behavior rather than implementation details.
- Unit test aggregation, normalization, filtering, formatters, and URL parsing.
- Component test controls and loading/error/empty behavior.
- Use Playwright for critical desktop and mobile flows.
- Run `npm run lint`, `npm run typecheck`, `npm run format:check`, and `npm run build` before completion when relevant.
