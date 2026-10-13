import * as React from "react";
import { cn } from "@/lib/utils";

const fieldBase =
  "w-full rounded-md border border-sand-400 bg-sand-50 px-3 py-2 text-sm text-ink-800 transition-colors duration-150 placeholder:text-ink-300 hover:border-ink-300 focus:border-secondary focus:outline-none disabled:opacity-50";

export function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(fieldBase, "h-10", className)} {...props} />;
}

export function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(fieldBase, "min-h-28 resize-y leading-relaxed", className)}
      {...props}
    />
  );
}

export function Select({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(fieldBase, "h-10 pr-8 appearance-none bg-sand-50", className)} {...props}>
      {children}
    </select>
  );
}

export function Label({
  className,
  children,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn(
        "eyebrow mb-1.5 block text-ink-500",
        className,
      )}
      {...props}
    >
      {children}
    </label>
  );
}

export function FieldHint({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("mt-1.5 text-xs leading-relaxed text-ink-400", className)} {...props}>
      {children}
    </p>
  );
}

export function FieldError({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      role="alert"
      className={cn("mt-1.5 text-xs font-medium text-primary", className)}
      {...props}
    >
      {children}
    </p>
  );
}