import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-xs border px-2 py-0.5 font-mono text-[10px] font-medium uppercase leading-5 tracking-[0.12em]",
  {
    variants: {
      tone: {
        neutral: "border-sand-400 bg-sand-200 text-ink-500",
        outline: "border-sand-400 bg-transparent text-ink-500",
        primary: "border-primary-line bg-primary-tint text-primary",
        gold: "border-secondary-line bg-secondary-tint text-secondary-muted",
        support: "border-support/50 bg-support-tint text-support-deep",
        dark: "border-ink-600 bg-ink-800 text-sand-200",
        solid: "border-primary bg-primary text-sand-50",
      },
      size: {
        sm: "px-1.5 text-[9px]",
        md: "",
        lg: "px-2.5 py-1 text-[11px]",
      },
    },
    defaultVariants: { tone: "neutral", size: "md" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, tone, size, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone, size }), className)} {...props} />;
}

export { badgeVariants };