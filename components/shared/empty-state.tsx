import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  eyebrow,
  title,
  body,
  action,
  className,
}: {
  icon: LucideIcon;
  eyebrow?: string;
  title: string;
  body: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-dashed border-sand-400 bg-sand-50/60 px-6 py-14 text-center",
        className,
      )}
    >
      <span className="mb-4 inline-flex size-11 items-center justify-center rounded-full border border-sand-400 bg-sand-100">
        <Icon className="size-5 text-ink-400" aria-hidden />
      </span>
      {eyebrow ? <div className="eyebrow mb-2 text-ink-900">{eyebrow}</div> : null}
      <h3 className="font-display text-base font-semibold text-ink-950">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-ink-400">{body}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}