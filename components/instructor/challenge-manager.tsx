"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/input";
import type { ChallengeRow, PathwayRow } from "@/lib/arena/data";
import { deleteProblem } from "@/lib/arena/actions";
import { ProblemForm } from "./problem-form";

export function ChallengeManager({
  challenge,
  pathwayOptions,
  hasSubmissions = false,
}: {
  challenge: ChallengeRow;
  pathwayOptions: PathwayRow[];
  hasSubmissions?: boolean;
}) {
  const router = useRouter();
  const [editing, setEditing] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function remove() {
    if (
      !window.confirm(
        `Delete "${challenge.title}" and its student submissions? Any XP already awarded remains in the XP history.`,
      )
    ) {
      return;
    }
    setPending(true);
    setError(null);
    try {
      const result = await deleteProblem(challenge.id);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mt-4">
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="secondary" onClick={() => setEditing(!editing)}>
          {editing ? "Close editor" : "Edit problem"}
        </Button>
        {hasSubmissions ? (
          <span className="self-center font-mono text-[10px] uppercase tracking-[0.1em] text-ink-400">
            Has submissions — close instead of deleting
          </span>
        ) : (
          <Button type="button" size="sm" variant="danger" disabled={pending} onClick={remove}>
            {pending ? "Deleting…" : "Delete"}
          </Button>
        )}
      </div>
      {error ? <FieldError>{error}</FieldError> : null}
      {editing ? (
        <div className="mt-4 rounded-md border border-sand-300 bg-sand-100 p-4">
          <ProblemForm
            pathwayOptions={pathwayOptions}
            problem={challenge}
            onCancel={() => setEditing(false)}
          />
        </div>
      ) : null}
    </div>
  );
}
