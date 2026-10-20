"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function InstructorProbesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("Probe moderation page failed to load.", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <Card className="p-6">
        <h1 className="font-display text-lg font-semibold tracking-tight text-ink-900">
          Moderation reports could not be loaded
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-500">{error.message}</p>
        <Button type="button" variant="secondary" className="mt-4" onClick={reset}>
          Try again
        </Button>
      </Card>
    </div>
  );
}
