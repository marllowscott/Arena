"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label, Select, Textarea } from "@/components/ui/input";
import { createTopic } from "@/lib/arena/actions";
import type { PathwayRow } from "@/lib/arena/data";

/** Instructor-side topic authoring form. */
export function TopicForm({
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
      const result = await createTopic(formData);
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
        <Input id="title" name="title" required placeholder="Git Rebase Without Fear" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="summary">Summary</Label>
        <Textarea
          id="summary"
          name="summary"
          required
          placeholder="What should the presenter cover?"
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="pathwayId">Pathway</Label>
          <Select id="pathwayId" name="pathwayId" defaultValue="teacher">
            {pathwayOptions.map((pathway) => (
              <option key={pathway.id} value={pathway.id}>
                {pathway.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="xpReward">XP reward</Label>
          <Input id="xpReward" name="xpReward" type="number" min={5} max={500} required defaultValue={40} />
        </div>
      </div>

      {error ? <FieldError>{error}</FieldError> : null}
      {info ? (
        <p role="status" className="rounded-md border border-support/50 bg-support-tint px-3 py-2 text-sm text-support-deep">
          {info}
        </p>
      ) : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Publishing" : "Publish topic"}
      </Button>
    </form>
  );
}
