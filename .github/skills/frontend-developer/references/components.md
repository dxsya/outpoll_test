# React Components Reference

## Component Boundaries

Use Server Components by default. Add `"use client"` only when a component needs state, event handlers, browser APIs, Zustand, React Query hooks, or ECharts.

```tsx
import type { ReactNode } from "react";

type DashboardSectionProps = {
  children: ReactNode;
  title: string;
};

export function DashboardSection({ children, title }: DashboardSectionProps) {
  return (
    <section aria-labelledby="dashboard-section-title">
      <h2 id="dashboard-section-title">{title}</h2>
      {children}
    </section>
  );
}
```

## Props and Composition

- Type public props explicitly.
- Prefer composition and small focused components over large conditional components.
- Do not mutate props or objects received from parents.
- Use stable domain IDs for list keys.
- Keep API response types out of presentation components; pass normalized domain types.
- Keep handlers close to the component that owns the interaction, while reusable calculations belong in `src/lib/`.

## Client Components

```tsx
"use client";

import { useDashboardStore } from "@/stores/dashboard-store";

export function RangeSelector() {
  const range = useDashboardStore((state) => state.range);
  const setRange = useDashboardStore((state) => state.setRange);

  return (
    <div role="group" aria-label="Date range">
      {(["7d", "30d", "90d", "all"] as const).map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={range === option}
          onClick={() => setRange(option)}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
```

## Effects and Browser APIs

Use `useEffect` only to synchronize with an external system. Return cleanup for listeners, timers, observers, and subscriptions. Never read `window`, `document`, `localStorage`, or ECharts APIs during Server Component execution.

## Accessibility

- Prefer native buttons, links, labels, inputs, and headings.
- Give every control an accessible name.
- Use `aria-pressed` for toggle buttons and `aria-checked` for custom checkbox patterns.
- Keep visible focus styles.
- Provide a text summary for charts.
- Do not make color the only distinction between platform series.
