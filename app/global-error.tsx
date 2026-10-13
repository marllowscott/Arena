"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    // Phase 1 has no backend to report to, so the console is the only sink.
    console.error("Dev Arena error boundary:", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-dvh items-center justify-center bg-sand-100 px-6">
        <div className="w-full max-w-md rounded-lg border border-sand-400 bg-sand-50 p-8 text-center shadow-raised">
          <p className="eyebrow">Something broke</p>
          <h1 className="mt-3 font-display text-xl font-bold tracking-tight text-ink-900">
            This screen failed to render
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-ink-500">
            The rest of Dev Arena is unaffected. Try the screen again, and if it keeps failing the
            detail is in the browser console.
          </p>
          <Button tone="tech" className="mt-6 w-full" onClick={reset}>
            Try again
          </Button>
        </div>
      </body>
    </html>
  );
}