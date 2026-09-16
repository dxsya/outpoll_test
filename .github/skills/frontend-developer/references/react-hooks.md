# React State and Effects Reference

This project uses React state and effects, not Vue Composition API.

## State Choice

- Component `useState`: local form drafts, open/closed UI, selected point that is not shareable.
- Zustand: shared client UI state such as range, selected categories, hidden series, and preferences.
- React Query: server data, loading, errors, cache, refetching, and request lifecycle.
- URL search params: shareable and navigable dashboard state.
- Pure functions: derived aggregation, formatting, and filtering.

Do not copy React Query data into Zustand or `useState` just to derive another value.

## Derived Values

Calculate cheap derived values during render. Use `useMemo` only for expensive transformations or when a stable object identity is required by a third-party API such as ECharts.

```tsx
const visibleSeries = useMemo(
  () => buildVisibleSeries(data, hiddenPlatforms),
  [data, hiddenPlatforms],
);
```

## Effects

```tsx
useEffect(() => {
  const observer = new ResizeObserver(handleResize);
  observer.observe(container);

  return () => observer.disconnect();
}, [container, handleResize]);
```

Effects must not be used to mirror derived state. If an effect starts a timer, listener, observer, or subscription, it must clean it up.

## Zustand

Create small stores with typed state and actions. Select only the fields a component needs:

```ts
const range = useDashboardStore((state) => state.range);
const setRange = useDashboardStore((state) => state.setRange);
```

Do not subscribe a component to the whole store when a narrow selector is sufficient. Keep URL synchronization in one hook/module instead of duplicating it across controls.

## Hook Rules

- Call hooks at the top level of components or custom hooks.
- Never call hooks conditionally, in loops, or in event handlers.
- Name custom hooks with `use` and keep them focused.
- Return typed values and stable actions where consumers need stable identity.
