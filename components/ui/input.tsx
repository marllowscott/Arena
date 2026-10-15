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

export function PasswordInput({
  className,
  disabled,
  ...props
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">) {
  const [visible, setVisible] = React.useState(false);

  return (
    <div className="relative">
      <input
        className={cn(fieldBase, "h-10 pr-11", className)}
        disabled={disabled}
        type={visible ? "text" : "password"}
        {...props}
      />
      <button
        type="button"
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        disabled={disabled}
        onClick={() => setVisible((current) => !current)}
        className="absolute inset-y-0 right-0 inline-flex items-center justify-center gap-1.5 rounded-r-md px-3 text-xs font-medium text-ink-500 transition-colors hover:text-ink-900 focus-visible:z-10 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {visible ? (
          <svg
            className="size-4 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M3 3l18 18" />
            <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
            <path d="M9.9 5.2A11 11 0 0 1 12 5c5.5 0 9 7 9 7a14.7 14.7 0 0 1-3.1 3.8" />
            <path d="M6.2 6.2C3.9 7.7 2 12 2 12s3.5 7 10 7a10.6 10.6 0 0 0 4-.8" />
          </svg>
        ) : (
          <svg
            className="size-4 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
        <span>{visible ? "Hide" : "Show"}</span>
      </button>
    </div>
  );
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