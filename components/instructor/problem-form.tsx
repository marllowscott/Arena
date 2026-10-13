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
import { createProblem } from "@/lib/arena/actions";
import type { PathwayRow } from "@/lib/arena/data";

const DIFFICULTIES = ["starter", "builder", "advanced", "expert", "boss"];

/** Instructor-side problem authoring form. */
export function ProblemForm({
  pathwayOptions,
}: {
  pathwayOptions: PathwayRow[];
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
      const result = await createProblem(formData);
      if (result.error) setError(result.error);
      if (result.info) setInfo(result.info);
      if (result.ok) router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <form action={handle} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          name="title"
          required
          placeholder="My API request returns a 401 even though the token looks correct"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="summary">Summary</Label>
        <Textarea
          id="summary"
          name="summary"
          required
          placeholder="One or two sentences a developer can scan."
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="mission">Mission — what to do</Label>
        <Textarea
          id="mission"
          name="mission"
          required
          placeholder="Find the cause, fix it, and show evidence that the request now succeeds."
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="pathwayId">Pathway</Label>
          <Select id="pathwayId" name="pathwayId" defaultValue="problem-solver">
            {pathwayOptions.map((pathway) => (
              <option key={pathway.id} value={pathway.id}>
                {pathway.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="difficulty">Difficulty</Label>
          <Select id="difficulty" name="difficulty" defaultValue="starter">
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
          <Input id="xp" name="xp" type="number" min={5} max={1000} required defaultValue={40} />
          <FieldHint>Paid only when you approve the solution.</FieldHint>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="effort">Estimated effort</Label>
          <Input id="effort" name="effort" defaultValue="1 hour" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="whyItMatters">Why it matters (optional)</Label>
        <Textarea id="whyItMatters" name="whyItMatters" placeholder="The skill this builds." />
      </div>

      {error ? <FieldError>{error}</FieldError> : null}
      {info ? (
        <p role="status" className="rounded-md border border-support/50 bg-support-tint px-3 py-2 text-sm text-support-deep">
          {info}
        </p>
      ) : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Publishing" : "Publish problem"}
      </Button>
    </form>
  );
}
