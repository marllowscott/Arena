import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-[background-color,color,border-color,box-shadow,transform] duration-150 ease-out disabled:pointer-events-none disabled:opacity-45 active:translate-y-px [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-sand-50 shadow-subtle hover:bg-primary-strong hover:shadow-raised",
        secondary:
          "border border-sand-400 bg-sand-50 text-ink-800 hover:border-ink-300 hover:bg-sand-100",
        gold: "bg-secondary text-ink-950 hover:bg-secondary-soft",
        outline:
          "border border-secondary-line bg-secondary-tint text-secondary-muted hover:border-secondary hover:bg-secondary-tint",
        ghost: "text-ink-500 hover:bg-sand-200 hover:text-ink-800",
        dark: "border border-ink-700 bg-ink-800 text-sand-100 hover:bg-ink-700",
        success:
          "border border-support-deep/40 bg-support-tint text-support-deep hover:border-support-deep",
        danger: "border border-primary-line bg-primary-tint text-primary hover:border-primary",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-8 px-3 text-xs [&_svg]:size-3.5",
        md: "h-10 px-4 text-sm [&_svg]:size-4",
        lg: "h-12 px-6 text-sm [&_svg]:size-[18px]",
        icon: "size-9 [&_svg]:size-4",
        "icon-sm": "size-8 [&_svg]:size-3.5",
      },
      tone: {
        default: "",
        tech: "font-mono text-[11px] uppercase tracking-[0.14em]",
      },
    },
    defaultVariants: { variant: "primary", size: "md", tone: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, tone, type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(buttonVariants({ variant, size, tone }), className)}
      {...props}
    />
  ),
);
Button.displayName = "Button";

export { buttonVariants };