"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FieldError, FieldHint, Label, Textarea } from "@/components/ui/input";
import { submitProblem, presentTopic } from "@/lib/arena/actions";

/**
 * Evidence form for a claimed problem or topic. XP is never set here —
 * the problem/topic row owns the figure and the instructor approves it.
 */
export function EvidenceForm({
  mode,
  activityId,
  xp,
}: {
  mode: "challenge" | "topic";
  activityId: string;
  xp: number;
}) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [info, setInfo] = React.useState<string | null>(null);

  async function handle(formData: FormData) {
    setPending(true);
    setError(null);
    setInfo(null);
    try {
      const payload = new FormData();
      payload.set("challengeId", formData.get("challengeId") ?? "");
      payload.set("topicId", formData.get("topicId") ?? "");
      payload.set("solution", formData.get("solution") ?? "");
      payload.set("evidence", formData.get("evidence") ?? "");
      payload.set("explainIt", formData.get("explainIt") ?? "");
      payload.set("whatBroke", formData.get("whatBroke") ?? "");
      payload.set("howFixed", formData.get("howFixed") ?? "");
      const result =
        mode === "challenge"
          ? await submitProblem(payload)
          : await presentTopic(payload);
      if (result.error) setError(result.error);
      if (result.info) setInfo(result.info);
      if (result.ok) router.refresh();
    } finally {
      setPending(false);
    }
  }

  const isChallenge = mode === "challenge";

  return (
    <form action={handle} className="space-y-4">
      <input
        type="hidden"
        name="challengeId"
        value={isChallenge ? activityId : ""}
      />
      <input type="hidden" name="topicId" value={isChallenge ? "" : activityId} />

      <div className="space-y-1.5">
        <Label htmlFor="solution">
          {isChallenge
            ? "What you discovered and changed"
            : "What you prepared and the key points"}
        </Label>
        <Textarea
          id="solution"
          name="solution"
          required
          placeholder={
            isChallenge
              ? "The cause, what you changed, and how you solved it."
              : "Your outline, the key points, and what the audience takes away."
          }
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="evidence">Evidence (optional)</Label>
        <Textarea
          id="evidence"
          name="evidence"
          placeholder="One link per line — GitHub commit, demo, recording, screenshot…"
        />
        <FieldHint>GitHub, demo or screenshot links strengthen the review.</FieldHint>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="explainIt">
          {isChallenge ? "How your solution works" : "Why this matters to other developers"}
        </Label>
        <Textarea
          id="explainIt"
          name="explainIt"
          required
          placeholder="Explain it so another developer could follow your reasoning."
        />
      </div>

      {isChallenge ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="whatBroke">What broke (optional)</Label>
            <Textarea id="whatBroke" name="whatBroke" placeholder="The symptom that started it." />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="howFixed">How you fixed it (optional)</Label>
            <Textarea id="howFixed" name="howFixed" placeholder="The change that resolved it." />
          </div>
        </div>
      ) : null}

      {error ? <FieldError>{error}</FieldError> : null}
      {info ? (
        <p role="status" className="rounded-md border border-support/50 bg-support-tint px-3 py-2 text-sm text-support-deep">
          {info}
        </p>
      ) : null}

      <Button type="submit" size="lg" disabled={pending}>
        <Send className="size-4" aria-hidden />
        {pending
          ? "Submitting"
          : isChallenge
            ? `Submit solution · up to ${xp} XP on approval`
            : `Submit presentation · up to ${xp} XP on approval`}
      </Button>
    </form>
  );
}
