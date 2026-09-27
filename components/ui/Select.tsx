"use client";

import { forwardRef, type SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, className, id, name, children, ...rest },
  ref
) {
  const selectId = id ?? name;
  return (
    <div className="w-full">
      {label ? (
        <label
          htmlFor={selectId}
          className="mb-1.5 block text-sm font-medium text-slate-700"
        >
          {label}
        </label>
      ) : null}
      <select
        ref={ref}
        id={selectId}
        name={name}
        className={cn(
          "w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100",
          error && "border-rose-400 focus:border-rose-500 focus:ring-rose-100",
          className
        )}
        {...rest}
      >
        {children}
      </select>
      {error ? (
        <p className="mt-1.5 text-xs font-medium text-rose-600">{error}</p>
      ) : null}
    </div>
  );
});

export default Select;