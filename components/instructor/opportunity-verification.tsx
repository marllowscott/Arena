"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FieldError, Input, Label, Textarea } from "@/components/ui/input";
import { reviewOpportunity } from "@/lib/arena/actions";
import { nowMs } from "@/lib/arena/clock";
import type { OpportunityRow } from "@/lib/arena/data";

/**
 * Verify or reject a developer-submitted opportunity. Verification
 * pays the XP entered here through the instructor-gated award_xp
 * RPC — the figure is the instructor's call, never the submitter's.
 */
export function OpportunityVerification({
  opportunity,
}: {
  opportunity: OpportunityRow;
}) {
  const router = useRouter();
  const [xp, setXp] = React.useState("25");
  const [note, setNote] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function decide(decision: "approve" | "reject") {
    setPending(true);
    setError(null);
    try {
      const awarded = decision === "approve" ? Number(xp) || 0 : 0;
      const result = await reviewOpportunity(opportunity.id, decision, awarded, note);
      if (result.error) {
        setError(result.error);
        setPending(false);
        return;
      }
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <li className="rounded-lg border border-sand-300 bg-sand-50 p-5 shadow-subtle">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="neutral">{opportunity.type}</Badge>
        {opportunity.location ? (
          <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-300">
            {opportunity.location}
          </span>
        ) : null}
        <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.1em] text-ink-300">
          by {opportunity.submitter_name ?? "a developer"} ·{" "}
          {relativeTimeSafe(opportunity.created_at)}
        </span>
      </div>

      <h3 className="mt-2 font-display text-base font-semibold tracking-tight text-ink-900">
        {opportunity.role}
      </h3>
      <p className="text-sm font-medium text-ink-600">{opportunity.organisation}</p>
      {opportunity.summary ? (
        <p className="mt-1.5 text-sm leading-relaxed text-ink-500">
          {opportunity.summary}
        </p>
      ) : null}

      {opportunity.apply_url ? (
        <a
          href={opportunity.apply_url}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-block break-all font-mono text-[11px] text-primary hover:underline"
        >
          {opportunity.apply_url}
        </a>
      ) : (
        <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.1em] text-ink-300">
          No link provided — ask for one before verifying.
        </p>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor={`opp-xp-${opportunity.id}`}>XP on verification</Label>
          <Input
            id={`opp-xp-${opportunity.id}`}
            type="number"
            min={0}
            max={500}
            value={xp}
            onChange={(event) => setXp(event.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`opp-note-${opportunity.id}`}>Note (optional)</Label>
          <Textarea
            id={`opp-note-${opportunity.id}`}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Shown to the developer either way."
          />
        </div>
      </div>

      {error ? <FieldError>{error}</FieldError> : null}

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="success"
          onClick={() => decide("approve")}
          disabled={pending}
        >
          <BadgeCheck className="size-4" aria-hidden />
          Verify and award XP
        </Button>
        <Button
          size="sm"
          variant="danger"
          onClick={() => decide("reject")}
          disabled={pending}
        >
          <XCircle className="size-4" aria-hidden />
          Reject
        </Button>
      </div>
    </li>
  );
}

function relativeTimeSafe(iso: string) {
  try {
    const diff = nowMs() - new Date(iso).getTime();
    const days = Math.floor(diff / 86400000);
    if (days <= 0) return "today";
    if (days === 1) return "yesterday";
    return `${days}d ago`;
  } catch {
    return "";
  }
}
