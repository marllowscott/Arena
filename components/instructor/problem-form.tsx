"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  FieldError,
  FieldHint,
  Input,
  Label,
  Select,
  Textarea,
} from "@/components/ui/input";
import { createProblem, updateProblem } from "@/lib/arena/actions";
import type { ChallengeRow, PathwayRow } from "@/lib/arena/data";

const DIFFICULTIES = ["starter", "builder", "advanced", "expert", "boss"];
const STATUSES = ["open", "locked", "closed", "draft"];

/** Instructor-side problem authoring form. */
export function ProblemForm({
  pathwayOptions,
  problem,
  onCancel,
}: {
  pathwayOptions: PathwayRow[];
  problem?: ChallengeRow;
  onCancel?: () => void;
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
      const result = problem
        ? await updateProblem(problem.id, formData)
        : await createProblem(formData);
      if (result.error) setError(result.error);
      if (result.info) setInfo(result.info);
      if (result.ok) {
        router.refresh();
        if (problem) onCancel?.();
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <form key={problem?.id ?? "new-problem"} action={handle} className="space-y-3">
      <input type="hidden" name="pathwayId" value={problem?.pathway_id ?? "problem-solver"} />
      <div className="space-y-1.5">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          name="title"
          required
          maxLength={200}
          defaultValue={problem?.title}
          placeholder="My API request returns a 401 even though the token looks correct"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="summary">Summary</Label>
        <Textarea id="summary" name="summary" required defaultValue={problem?.summary} placeholder="One or two sentences a developer can scan." />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="mission">Mission — what to do</Label>
        <Textarea
          id="mission"
          name="mission"
          required
          defaultValue={problem?.mission}
          placeholder="Find the cause, fix it, and show evidence that the request now succeeds."
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="difficulty">Difficulty</Label>
        <Select id="difficulty" name="difficulty" defaultValue={problem?.difficulty ?? "starter"}>
          {DIFFICULTIES.map((difficulty) => (
            <option key={difficulty} value={difficulty}>
              {difficulty}
            </option>
          ))}
        </Select>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="xp">XP value</Label>
          <Input id="xp" name="xp" type="number" min={5} max={1000} required defaultValue={problem?.xp ?? 40} />
          <FieldHint>Paid only when you approve the solution.</FieldHint>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="status">Status</Label>
          <Select id="status" name="status" defaultValue={problem?.status ?? "open"}>
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </Select>
        </div>
      </div>
      {error ? <FieldError>{error}</FieldError> : null}
      {info ? (
        <p role="status" className="rounded-md border border-support/50 bg-support-tint px-3 py-2 text-sm text-support-deep">
          {info}
        </p>
      ) : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Saving" : problem ? "Save problem" : "Publish problem"}
      </Button>
      {problem && onCancel ? (
        <Button type="button" variant="secondary" disabled={pending} onClick={onCancel}>
          Cancel
        </Button>
      ) : null}
    </form>
  );
}