"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export interface FilterOption<T extends string> {
  value: T;
  label: string;
  count?: number;
}

/** Pill filters. `aria-pressed` keeps the state readable to a screen reader. */
export function FilterChips<T extends string>({
  options,
  value,
  onChange,
  label,
  className,
  size = "md",
}: {
  options: FilterOption<T>[];
  value: T;
  onChange: (value: T) => void;
  label: string;
  className?: string;
  size?: "sm" | "md";
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn("flex flex-wrap items-center gap-1.5", className)}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              buttonVariants({
                variant: selected ? "primary" : "secondary",
                size,
                tone: "tech",
              }),
              "transition-colors duration-150",
              !selected && "text-ink-500 hover:text-ink-800",
            )}
          >
            {option.label}
            {typeof option.count === "number" ? (
              <span className={cn("ml-1.5 tabular-nums", selected ? "text-sand-200" : "text-ink-300")}>
                {option.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

/** Underlined tabs for views that share a page (leaderboard, review queue). */
export function TabBar<T extends string>({
  options,
  value,
  onChange,
  label,
  className,
}: {
  options: FilterOption<T>[];
  value: T;
  onChange: (value: T) => void;
  label: string;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className={cn("flex gap-1 overflow-x-auto border-b border-sand-300", className)}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              "-mb-px h-10 shrink-0 border-b-2 px-4 font-mono text-[11px] uppercase tracking-[0.12em] transition-colors",
              selected
                ? "border-primary text-primary"
                : "border-transparent text-ink-400 hover:border-sand-400 hover:text-ink-700",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}