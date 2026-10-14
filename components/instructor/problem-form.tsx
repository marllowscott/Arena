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

function localDateTime(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

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
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="slug">URL slug</Label>
          <Input
            id="slug"
            name="slug"
            maxLength={60}
            defaultValue={problem?.slug}
            placeholder="generated-from-title"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="codename">Codename</Label>
          <Input id="codename" name="codename" defaultValue={problem?.codename} />
        </div>
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
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="pathwayId">Pathway</Label>
          <Select id="pathwayId" name="pathwayId" defaultValue={problem?.pathway_id ?? "problem-solver"}>
            {pathwayOptions.map((pathway) => (
              <option key={pathway.id} value={pathway.id}>
                {pathway.name}
              </option>
            ))}
          </Select>
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
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="xp">XP value</Label>
          <Input id="xp" name="xp" type="number" min={5} max={1000} required defaultValue={problem?.xp ?? 40} />
          <FieldHint>Paid only when you approve the solution.</FieldHint>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="effort">Estimated effort</Label>
          <Input id="effort" name="effort" defaultValue={problem?.estimated_effort ?? "1 hour"} />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="deadline">Deadline (optional)</Label>
          <Input id="deadline" name="deadline" type="datetime-local" defaultValue={localDateTime(problem?.deadline)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="status">Status</Label>
          <Select id="status" name="status" defaultValue={problem?.status ?? "open"}>
            {STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
          </Select>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="tags">Tags (comma-separated)</Label>
        <Input id="tags" name="tags" defaultValue={problem?.tags.join(", ")} placeholder="api, debugging, authentication" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="whyItMatters">Why it matters (optional)</Label>
        <Textarea id="whyItMatters" name="whyItMatters" defaultValue={problem?.why_it_matters} placeholder="The skill this builds." />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="requirements">Requirements (one per line)</Label>
        <Textarea id="requirements" name="requirements" defaultValue={problem?.requirements.join("\n")} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="evidence">Evidence that helps the review (one per line)</Label>
        <Textarea id="evidence" name="evidence" defaultValue={problem?.evidence.join("\n")} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="explainPrompt">Explanation prompt (optional)</Label>
          <Textarea id="explainPrompt" name="explainPrompt" defaultValue={problem?.explain_prompt} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="brokePrompt">What broke prompt (optional)</Label>
          <Textarea id="brokePrompt" name="brokePrompt" defaultValue={problem?.broke_prompt} />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="rubric">Review rubric (JSON array, optional)</Label>
        <Textarea id="rubric" name="rubric" defaultValue={JSON.stringify(problem?.rubric ?? [], null, 2)} />
        <FieldHint>Enter a JSON array of rubric items, for example [].</FieldHint>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="recommendationReason">Recommendation note (optional)</Label>
        <Input id="recommendationReason" name="recommendationReason" defaultValue={problem?.recommendation_reason} />
      </div>
      <label className="flex items-center gap-2 text-sm text-ink-600">
        <input type="checkbox" name="recommended" defaultChecked={problem?.recommended ?? false} />
        Recommend this problem
      </label>

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
