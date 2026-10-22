"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FieldError, Input, Label, Textarea } from "@/components/ui/input";
import { OpportunityStatusBadge } from "@/components/arena/status-badge";
import {
  deleteStudentOpportunity,
  reviewOpportunity,
  updateStudentOpportunity,
} from "@/lib/arena/actions";
import { nowMs } from "@/lib/arena/clock";
import { formatXp } from "@/lib/format";
import type { OpportunityRow } from "@/lib/arena/data";

function localDateTime(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 16);
}

/**
 * Verify or reject a developer-submitted opportunity. Verification
 * pays the XP entered here through the instructor-gated award_xp
 * RPC — the figure is the instructor's call, never the submitter's.
 */
export function OpportunityVerification({
  opportunity,
  allowReview = true,
}: {
  opportunity: OpportunityRow;
  allowReview?: boolean;
}) {
  const router = useRouter();
  const [xp, setXp] = React.useState("25");
  const [note, setNote] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [editing, setEditing] = React.useState(false);

  async function decide(decision: "approve" | "reject") {
    setPending(true);
    setError(null);
    try {
      const awarded = decision === "approve" ? Number(xp) || 0 : 0;
      const result = await reviewOpportunity(opportunity.id, decision, awarded, note);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not review this opportunity. Please try again.",
      );
    } finally {
      setPending(false);
    }
  }

  async function save(formData: FormData) {
    setPending(true);
    setError(null);
    try {
      const result = await updateStudentOpportunity(opportunity.id, formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      setEditing(false);
      router.refresh();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not update this opportunity. Please try again.",
      );
    } finally {
      setPending(false);
    }
  }

  async function remove() {
    if (
      !window.confirm(
        `Delete "${opportunity.role}" at ${opportunity.organisation}? Any XP already awarded remains in the XP history.`,
      )
    ) {
      return;
    }
    setPending(true);
    setError(null);
    try {
      const result = await deleteStudentOpportunity(opportunity.id);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not delete this opportunity. Please try again.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <li className="rounded-lg border border-sand-300 bg-sand-50 p-5 shadow-subtle">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="neutral">{opportunity.type}</Badge>
        <OpportunityStatusBadge reviewStatus={opportunity.review_status} />
        {opportunity.xp_reward > 0 ? (
          <span className="font-mono text-xs font-semibold tabular-nums text-primary">
            +{formatXp(opportunity.xp_reward)} XP
          </span>
        ) : null}
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

      {allowReview ? (
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
      ) : null}

      {error ? <FieldError>{error}</FieldError> : null}

      <div className="mt-4 flex flex-wrap gap-2">
        {allowReview ? (
          <>
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
          </>
        ) : null}
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={() => setEditing((current) => !current)}
          disabled={pending}
        >
          {editing ? "Close editor" : "Edit submission"}
        </Button>
        <Button type="button" size="sm" variant="danger" onClick={remove} disabled={pending}>
          {pending ? "Working…" : "Delete submission"}
        </Button>
      </div>

      {editing ? (
        <form action={save} className="mt-4 grid gap-3 border-t border-sand-300 pt-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor={`opp-org-${opportunity.id}`}>Organisation</Label>
            <Input
              id={`opp-org-${opportunity.id}`}
              name="organisation"
              required
              maxLength={160}
              defaultValue={opportunity.organisation}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`opp-role-${opportunity.id}`}>Role or title</Label>
            <Input
              id={`opp-role-${opportunity.id}`}
              name="role"
              required
              maxLength={200}
              defaultValue={opportunity.role}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`opp-type-${opportunity.id}`}>Type</Label>
            <Input
              id={`opp-type-${opportunity.id}`}
              name="type"
              required
              maxLength={80}
              defaultValue={opportunity.type}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`opp-location-${opportunity.id}`}>Location</Label>
            <Input
              id={`opp-location-${opportunity.id}`}
              name="location"
              maxLength={160}
              defaultValue={opportunity.location}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`opp-apply-url-${opportunity.id}`}>Application link</Label>
            <Input
              id={`opp-apply-url-${opportunity.id}`}
              name="applyUrl"
              type="url"
              maxLength={2000}
              defaultValue={opportunity.apply_url}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`opp-closes-at-${opportunity.id}`}>Closing date</Label>
            <Input
              id={`opp-closes-at-${opportunity.id}`}
              name="closesAt"
              type="datetime-local"
              defaultValue={localDateTime(opportunity.closes_at)}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor={`opp-summary-${opportunity.id}`}>Description</Label>
            <Textarea
              id={`opp-summary-${opportunity.id}`}
              name="summary"
              maxLength={5000}
              defaultValue={opportunity.summary}
            />
          </div>
          <Button type="submit" size="sm" disabled={pending}>
            {pending ? "Saving…" : "Save submission"}
          </Button>
        </form>
      ) : null}
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
