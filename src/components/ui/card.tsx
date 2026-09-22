import type { ComponentPropsWithoutRef, ElementType } from "react";

type CardProps<T extends ElementType = "div"> = {
  as?: T;
  className?: string;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "className">;

export function Card<T extends ElementType = "div">({
  as,
  className = "",
  ...props
}: CardProps<T>) {
  const Component = as ?? "div";

  return (
    <Component
      className={`border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 ${className}`}
      {...props}
    />
  );
}
