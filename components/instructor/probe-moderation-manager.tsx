"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { moderateProbe } from "@/lib/arena/actions";
import type { HelpRequestDetail } from "@/lib/services/contracts";
import { ProbeActionButton } from "@/components/dev/probe-action-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label, Textarea } from "@/components/ui/input";
import { EmptyState } from "@/components/shared/empty-state";
import { LifeBuoy } from "lucide-react";

export function ProbeModerationManager({
  requests,
}: {
  requests: HelpRequestDetail[];
}) {
  if (requests.length === 0) {
    return (
      <EmptyState
        icon={LifeBuoy}
        eyebrow="Probe moderation"
        title="No flagged probes"
        body="Developer reports and instructor restrictions will appear here."
      />
    );
  }

  return (
    <div className="mt-6 space-y-4">
      {requests.map((request) => (
        <ModerationCard key={request.id} request={request} />
      ))}
    </div>
  );
}

function ModerationCard({ request }: { request: HelpRequestDetail }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  function updateReason(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const reason = String(new FormData(event.currentTarget).get("reason") ?? "").trim();
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await moderateProbe(request.id, true, reason);
      if (result.error) {
        setError(result.error);
        return;
      }
      setSuccess(result.info ?? "Moderation note saved.");
      router.refresh();
    });
  }

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-primary">
            Reported by {request.developerName}
          </p>
          <h2 className="mt-1 font-display text-lg font-semibold tracking-tight text-ink-900">
            {request.title}
          </h2>
        </div>
        <span className="rounded-xs border border-primary-line bg-primary-tint px-2 py-1 font-mono text-[10px] uppercase tracking-[0.1em] text-primary">
          {request.status}
        </span>
      </div>

      <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-ink-600">{request.body}</p>
      {request.acceptedByName ? (
        <p className="mt-2 text-xs text-ink-400">Accepted helper: {request.acceptedByName}</p>
      ) : null}

      <form onSubmit={updateReason} className="mt-4 border-t border-sand-300 pt-4">
        <Label htmlFor={`moderation-${request.id}`}>Moderation note</Label>
        <Textarea
          id={`moderation-${request.id}`}
          name="reason"
          key={request.flagReason ?? request.id}
          defaultValue={request.flagReason ?? ""}
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
        <div className="mt-3 flex flex-wrap gap-2">
          <Button type="submit" variant="secondary" disabled={pending}>
            {pending ? "Saving…" : "Save note"}
          </Button>
          <ProbeActionButton
            action={{ kind: "unflag", requestId: request.id }}
            variant="success"
          >
            Clear restriction
          </ProbeActionButton>
        </div>
      </form>
    </Card>
  );
}
