import * as React from "react";
import { cn } from "@/lib/utils";

export function PageContainer({
  children,
  className,
  size = "default",
}: {
  children: React.ReactNode;
  className?: string;
  size?: "default" | "wide" | "narrow";
}) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-4 py-6 sm:px-6 sm:py-8",
        size === "default" && "max-w-6xl",
        size === "wide" && "max-w-7xl",
        size === "narrow" && "max-w-3xl",
        className,
      )}
    >
      {children}
    </div>
  );
}

/** Vertical rhythm helper so sections never crowd each other. */
export function PageSection({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <section className={cn("mt-8 first:mt-0", className)}>{children}</section>;
}