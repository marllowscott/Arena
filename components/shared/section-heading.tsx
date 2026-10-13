import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Every screen opens with the same question answered: what am I working
 * toward, and what can I do next.
 */
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  meta,
  className,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
  meta?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("animate-fade-in flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between", className)}>
      <div className="max-w-2xl">
        <div className="eyebrow mb-2.5">
          {eyebrow}
        </div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink-900 sm:text-[28px]">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 text-sm leading-relaxed text-ink-900">{description}</p>
        ) : null}
        {meta ? <div className="mt-4">{meta}</div> : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </header>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  action,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div>
        {eyebrow ? <div className="eyebrow mb-2">{eyebrow}</div> : null}
        <h2 className="font-display text-lg font-semibold tracking-tight text-ink-900">{title}</h2>
        {description ? (
          <p className="mt-1 max-w-xl text-sm leading-relaxed text-ink-400">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}