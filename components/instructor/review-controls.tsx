"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, RotateCcw, Sliders } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label, Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  deleteInstructorSubmission,
  reviewSubmission,
  updateInstructorSubmission,
} from "@/lib/arena/actions";
import { formatXp } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { SubmissionRow } from "@/lib/arena/data";

/**
 * Instructor review controls for one submission. Approval pays the
 * problem's XP (or an adjusted figure); return pays nothing and asks
 * for another pass. All three go through the instructor-gated
 * review_submission RPC.
 */
export function ReviewControls({ submission }: { submission: SubmissionRow }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [mode, setMode] = React.useState<"approved" | "adjusted" | "returned">("approved");
  const [xp, setXp] = React.useState(String(submission.suggested_xp));
  const [note, setNote] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function resolve() {
    setPending(true);
    setError(null);
    try {
      const result = await reviewSubmission(
        submission.id,
        mode,
        mode === "returned" ? 0 : Number(xp),
        note,
      );
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not resolve this submission. Please try again.",
      );
    } finally {
      setPending(false);
    }
  }

  if (!open) {
    return (
      <Button size="sm" variant="primary" onClick={() => setOpen(true)}>
        Review
      </Button>
    );
  }

  return (
    <div className="rounded-md border border-primary-line bg-primary-tint/40 p-4">
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Review outcome">
        {(
          [
            { id: "approved", label: "Approve", icon: Check, hint: `awards ${xp || "0"} XP` },
            { id: "adjusted", label: "Adjust", icon: Sliders, hint: "award less" },
            { id: "returned", label: "Return", icon: RotateCcw, hint: "no XP" },
          ] as const
        ).map((candidate) => (
          <button
            key={candidate.id}
            type="button"
            role="radio"
            aria-checked={mode === candidate.id}
            onClick={() => setMode(candidate.id)}
            className={cn(
              "flex h-10 items-center gap-2 rounded-md border px-3 text-sm transition-colors",
              mode === candidate.id
                ? "border-primary bg-sand-50 text-ink-900"
                : "border-sand-400 bg-sand-50 text-ink-500 hover:border-ink-300",
            )}
          >
            <candidate.icon className="size-4" aria-hidden />
            {candidate.label}
          </button>
        ))}
      </div>

      {mode !== "returned" ? (
        <div className="mt-3 max-w-40 space-y-1.5">
          <Label htmlFor={`xp-${submission.id}`}>XP to award</Label>
          <Input
            id={`xp-${submission.id}`}
            type="number"
            min={1}
            max={1000}
            value={xp}
            onChange={(event) => setXp(event.target.value)}
          />
          <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-300">
            suggested {formatXp(submission.suggested_xp)} XP
          </p>
        </div>
      ) : null}

      <div className="mt-3 space-y-1.5">
        <Label htmlFor={`note-${submission.id}`}>Note to the developer</Label>
        <Textarea
          id={`note-${submission.id}`}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder={
            mode === "returned"
              ? "What needs another pass?"
              : "What was good? What could be stronger?"
          }
        />
      </div>

      {error ? <FieldError>{error}</FieldError> : null}

      <div className="mt-4 flex items-center gap-2">
        <Button
          size="sm"
          variant={mode === "returned" ? "secondary" : "primary"}
          onClick={resolve}
          disabled={pending}
        >
          {pending
            ? "Resolving"
            : mode === "approved"
              ? "Approve and award XP"
              : mode === "adjusted"
                ? "Approve with adjusted XP"
                : "Return for another pass"}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

export function SubmissionPanel({ submission }: { submission: SubmissionRow }) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="outline">
          {submission.challenge_id ? "Problem" : "Topic presentation"}
        </Badge>
        <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-300">
          suggested {formatXp(submission.suggested_xp)} XP
        </span>
      </div>

      <div>
        <div className="eyebrow mb-1">Solution</div>
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink-700">
          {submission.solution}
        </p>
      </div>

      {submission.evidence.length > 0 ? (
        <div>
          <div className="eyebrow mb-1">Evidence</div>
          <ul className="list-disc space-y-0.5 pl-5 text-sm text-ink-600">
            {submission.evidence.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div>
        <div className="eyebrow mb-1">Explanation</div>
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink-700">
          {submission.explain_it}
        </p>
      </div>

      {submission.what_broke ? (
        <div>
          <div className="eyebrow mb-1">What broke</div>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink-700">
            {submission.what_broke}
          </p>
        </div>
      ) : null}

      {submission.how_fixed ? (
        <div>
          <div className="eyebrow mb-1">How it was fixed</div>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink-700">
            {submission.how_fixed}
          </p>
        </div>
      ) : null}
    </div>
  );
}

export function SubmissionManagementControls({
  submission,
}: {
  submission: SubmissionRow;
}) {
  const router = useRouter();
  const [editing, setEditing] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [info, setInfo] = React.useState<string | null>(null);

  async function save(formData: FormData) {
    setPending(true);
    setError(null);
    setInfo(null);
    try {
      const result = await updateInstructorSubmission(submission.id, formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      setEditing(false);
      setInfo(result.info ?? "Submission updated.");
      router.refresh();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not update this submission. Please try again.",
      );
    } finally {
      setPending(false);
    }
  }

  async function remove() {
    if (
      !window.confirm(
        `Delete this ${submission.awarded_xp ? "reviewed" : "unapproved"} submission? Any XP already awarded remains in the XP history.`,
      )
    ) {
      return;
    }
    setPending(true);
    setError(null);
    setInfo(null);
    try {
      const result = await deleteInstructorSubmission(submission.id);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Could not delete this submission. Please try again.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mt-3 border-t border-sand-300 pt-3">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={pending}
          onClick={() => setEditing((current) => !current)}
        >
          {editing ? "Close editor" : "Edit submission"}
        </Button>
        <Button type="button" size="sm" variant="danger" disabled={pending} onClick={remove}>
          {pending ? "Working…" : "Delete submission"}
        </Button>
      </div>

      {error ? <FieldError className="mt-2">{error}</FieldError> : null}
      {info ? (
        <p role="status" className="mt-2 text-sm text-support-deep">
          {info}
        </p>
      ) : null}

      {editing ? (
        <form action={save} className="mt-4 space-y-3">
          {submission.status !== "pending" ? (
            <p className="text-xs text-ink-400">
              Editing reviewed work does not change its review decision or XP award.
            </p>
          ) : null}
          <div className="space-y-1.5">
            <Label htmlFor={`submission-solution-${submission.id}`}>Solution / presentation</Label>
            <Textarea
              id={`submission-solution-${submission.id}`}
              name="solution"
              required
              maxLength={20000}
              defaultValue={submission.solution}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`submission-evidence-${submission.id}`}>Evidence (one per line)</Label>
            <Textarea
              id={`submission-evidence-${submission.id}`}
              name="evidence"
              defaultValue={submission.evidence.join("\n")}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`submission-explanation-${submission.id}`}>Explanation</Label>
            <Textarea
              id={`submission-explanation-${submission.id}`}
              name="explainIt"
              required
              maxLength={10000}
              defaultValue={submission.explain_it}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor={`submission-broke-${submission.id}`}>What broke</Label>
              <Textarea
                id={`submission-broke-${submission.id}`}
                name="whatBroke"
                maxLength={10000}
                defaultValue={submission.what_broke}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`submission-fixed-${submission.id}`}>How it was fixed</Label>
              <Textarea
                id={`submission-fixed-${submission.id}`}
                name="howFixed"
                maxLength={10000}
                defaultValue={submission.how_fixed}
              />
            </div>
          </div>
          <Button type="submit" size="sm" disabled={pending}>
            {pending ? "Saving…" : "Save submission"}
          </Button>
        </form>
      ) : null}
    </div>
  );
}
