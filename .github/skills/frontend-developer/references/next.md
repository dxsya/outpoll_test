# Next.js 16 Reference

This reference keeps the existing filename for compatibility with the skill index. It describes Next.js App Router, not Nuxt.

## Routing and Layouts

- Routes live under `src/app/`.
- `src/app/page.tsx` renders `/`.
- `src/app/layout.tsx` owns root HTML, metadata, fonts, and providers.
- Use nested `layout.tsx`, `loading.tsx`, `error.tsx`, and `not-found.tsx` when a route needs those states.
- Use `next/link` for internal links and `next/navigation` for client navigation.

## Server and Client Components

Server Components are the default and may safely read server-side configuration or compose data. Client Components require the `"use client"` directive and are used for event handlers, browser APIs, Zustand, React Query hooks, and ECharts.

Keep the client boundary as small as practical. Do not access `window`, `document`, storage, or chart instances while rendering on the server.

## Providers

Place client providers in a dedicated component such as `src/app/providers.tsx`, then render it from the root layout. Create browser-only singleton clients inside the provider rather than at module render time.

## Metadata and Environment

Use the Metadata API in `layout.tsx` or route metadata files. Public browser configuration must use `NEXT_PUBLIC_*`; server-only secrets must never use that prefix. Do not add an environment variable when a public constant is sufficient.

## Data Fetching

The dashboard uses TanStack React Query for client server-state requests. Do not replace it with `useEffect` plus local fetch state. API functions must validate and normalize external responses and accept `AbortSignal`.

## Error and Loading UX

Use route-level boundaries for route failures when useful, and component-level states for dashboard query loading/errors. During filter changes, keep the previous chart visible and show a non-blocking fetching indicator.

## Local Documentation

When a Next.js API is uncertain, consult the installed documentation under `node_modules/next/dist/docs/` and verify with `npm run typecheck` and `npm run build`.
