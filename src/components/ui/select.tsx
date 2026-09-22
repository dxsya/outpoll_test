import { forwardRef, type SelectHTMLAttributes } from "react";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className = "", ...props },
  ref,
) {
  return (
    <select
      ref={ref}
      className={`min-h-8.5 rounded-md border border-slate-300 bg-transparent px-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 ${className}`}
      {...props}
    />
  );
});
