"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("Dev Arena error:", error);
  }, [error]);

  return (
    <div className="mx-auto w-full max-w-md px-4 py-16 text-center">
      <p className="eyebrow">Something broke</p>
      <h1 className="mt-3 font-display text-xl font-bold tracking-tight text-ink-900">
        This screen failed to render
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-ink-500">
        Nothing was lost. Try the screen again — if it keeps failing, the detail is in the browser
        console.
      </p>
      <Button tone="tech" className="mt-6" onClick={reset}>
        Try again
      </Button>
    </div>
  );
}