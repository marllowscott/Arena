"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { createProbe } from "@/lib/arena/actions";
import type { PathwayRow } from "@/lib/arena/data";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label, Select, Textarea } from "@/components/ui/input";

export function ProbeRequestForm({ pathways }: { pathways: PathwayRow[] }) {
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
      const result = await createProbe(formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      setSuccess(result.info ?? "Probe posted.");
      form.reset();
      router.refresh();
    });
  }

  return (
    <Card className="mt-6 p-5 sm:p-6">
      <h2 className="font-display text-lg font-semibold tracking-tight text-ink-900">
        Ask the hub
      </h2>
      <p className="mt-1 text-sm text-ink-500">
        Share the concrete problem and remove credentials or private customer information.
      </p>
      <form onSubmit={submit} className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="probe-title">What are you stuck on?</Label>
          <Input id="probe-title" name="title" required minLength={5} maxLength={120} />
        </div>
        <div>
          <Label htmlFor="probe-pathway">Pathway</Label>
          <Select
            id="probe-pathway"
            name="pathwayId"
            required
            disabled={pathways.length === 0}
            defaultValue={pathways[0]?.id ?? ""}
          >
            {pathways.map((pathway) => (
              <option key={pathway.id} value={pathway.id}>
                {pathway.name}
              </option>
            ))}
          </Select>
          {pathways.length === 0 ? (
            <p role="alert" className="mt-1 text-xs text-primary">
              Pathways are not configured, so a Probe cannot be posted.
            </p>
          ) : null}
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="probe-body">Problem and what you have tried</Label>
          <Textarea id="probe-body" name="body" required minLength={20} maxLength={5000} className="min-h-28" />
        </div>
        <div>
          <Label htmlFor="probe-technologies">Technologies (comma-separated)</Label>
          <Input id="probe-technologies" name="technologies" placeholder="TypeScript, Supabase" />
        </div>
        <div>
          <Label htmlFor="probe-urgency">Urgency</Label>
          <Select id="probe-urgency" name="urgency" defaultValue="normal">
            <option value="normal">Normal</option>
            <option value="blocking">Blocking</option>
          </Select>
        </div>
        <div className="flex flex-col items-start justify-end">
          <Button type="submit" tone="tech" disabled={pending || pathways.length === 0}>
            {pending ? "Posting…" : "Post Probe"}
          </Button>
        </div>
        {error ? (
          <p role="alert" className="text-sm font-medium text-primary sm:col-span-2">
            {error}
          </p>
        ) : null}
        {success ? (
          <p role="status" className="text-sm font-medium text-support-deep sm:col-span-2">
            {success}
          </p>
        ) : null}
      </form>
    </Card>
  );
}
