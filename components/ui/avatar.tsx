"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const sizes = {
  sm: "size-8 text-[11px]",
  md: "size-10 text-xs",
  lg: "size-14 text-base",
  xl: "size-20 text-2xl",
} as const;

/**
 * Avatars are generated tiles by default. Pass `src` to use an uploaded image
 * from Supabase Storage. The gradient colors are used as fallback/loading state.
 */
export function Avatar({
  initials,
  name,
  from = "#830000",
  to = "#DB9558",
  size = "md",
  className,
  ring = false,
  src,
}: {
  initials: string;
  name?: string;
  from?: string;
  to?: string;
  size?: keyof typeof sizes;
  className?: string;
  ring?: boolean;
  src?: string;
}) {
  const [imgError, setImgError] = React.useState(false);

  if (src && !imgError) {
    return (
      <img
        src={src}
        alt={name ?? ""}
        aria-hidden={!name}
        title={name}
        className={cn(
          "inline-flex shrink-0 select-none items-center justify-center rounded-full object-cover",
          sizes[size],
          ring && "ring-2 ring-sand-50 ring-offset-1 ring-offset-sand-300",
          className,
        )}
        style={{ backgroundImage: `linear-gradient(140deg, ${from} 0%, ${to} 100%)` }}
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <span
      aria-hidden={!name}
      aria-label={name}
      title={name}
      role={name ? "img" : undefined}
      className={cn(
        "inline-flex shrink-0 select-none items-center justify-center rounded-full font-display font-semibold tracking-tight text-sand-50",
        sizes[size],
        ring && "ring-2 ring-sand-50 ring-offset-1 ring-offset-sand-300",
        className,
      )}
      style={{
        backgroundImage: `linear-gradient(140deg, ${from} 0%, ${to} 100%)`,
      }}
    >
      {initials}
    </span>
  );
}