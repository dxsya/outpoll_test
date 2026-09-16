# TanStack React Query Reference

All Kalshi and Polymarket server data flows through TanStack React Query v5.

## API Adapter

Keep external requests in `src/lib/api/`. The adapter validates and normalizes the response:

```ts
export async function fetchMarkets(signal: AbortSignal): Promise<Market[]> {
  const response = await fetch(MARKETS_URL, { signal });
  if (!response.ok) {
    throw new ApiError("Markets request failed", response.status);
  }

  const payload: unknown = await response.json();
  return marketsResponseSchema.parse(payload).markets.map(normalizeMarket);
}
```

Use `unknown` for JSON, validate it, and never leak vendor-specific fields into UI code.

## Query Hook

```ts
export function useDashboardQuery(params: DashboardQueryParams) {
  const queryKey = [
    "volume-dashboard",
    {
      range: params.range,
      categories: [...params.categoryIds].sort(),
    },
  ] as const;

  return useQuery({
    queryKey,
    queryFn: ({ signal }) => fetchDashboardData(params, signal),
    placeholderData: (previous) => previous,
    staleTime: 60_000,
    retry: (failureCount, error) => isTransientError(error) && failureCount < 2,
    refetchOnWindowFocus: false,
  });
}
```

Every result-changing parameter belongs in the key. Sort unordered filters before building the key.

## Cancellation and Refetching

Pass React Query's `signal` through every adapter and fetch call. Do not create an unrelated `AbortController` that prevents React Query from cancelling obsolete work.

Use `isPending` for the first load and `isFetching` for background updates. Preserve previous chart data while a new range or category request is pending.

## State Handling

Distinguish:

- `isPending`: first-load skeleton;
- `isError`: user-facing error with retry;
- `isFetching && data`: stale data plus non-blocking update indicator;
- successful empty data: no data for the selected period;
- no selected categories: explicit filter empty state.

Do not expose raw exception messages directly to users.

## Query Client

Create one browser `QueryClient` in the client provider. Configure defaults deliberately. Do not create a new client during every render and do not put query data in Zustand.

## Mutations

The dashboard is primarily read-only. If mutations are added later, use `useMutation`, invalidate all affected query keys, and test cache behavior explicitly.
