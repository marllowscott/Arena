"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { flagProbe } from "@/lib/arena/actions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label, Textarea } from "@/components/ui/input";

export function FlagProbeForm({
  requestId,
  flagged,
}: {
  requestId: string;
  flagged: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await flagProbe(requestId, formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      setSuccess(result.info ?? "Reported privately to the instructor.");
      router.refresh();
    });
  }

  if (flagged) return null;

  return (
    <Card className="p-5">
      <h2 className="font-display text-sm font-semibold tracking-tight text-ink-900">
        Report a privacy concern
      </h2>
      <p className="mt-1 text-xs leading-relaxed text-ink-500">
        Reporting restricts this thread to you, its helper, and instructors until it is reviewed.
      </p>
      <form onSubmit={submit} className="mt-3">
        <Label htmlFor="probe-flag-reason">What should the instructor review?</Label>
        <Textarea
          id="probe-flag-reason"
          name="reason"
          minLength={5}
          maxLength={1000}
          required
          className="min-h-20"
        />
        {error ? (
          <p role="alert" className="mt-1.5 text-xs font-medium text-primary">
            {error}
          </p>
        ) : null}
        {success ? (
          <p role="status" className="mt-1.5 text-xs font-medium text-support-deep">
            {success}
          </p>
        ) : null}
        <Button type="submit" variant="secondary" className="mt-3 w-full" disabled={pending}>
          {pending ? "Reporting…" : "Report privately"}
        </Button>
      </form>
    </Card>
  );
}
