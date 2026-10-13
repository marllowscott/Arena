"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label, Select, Textarea } from "@/components/ui/input";
import { submitOpportunity } from "@/lib/arena/actions";

const OPPORTUNITY_TYPES = [
  "job",
  "internship",
  "hackathon",
  "scholarship",
  "programme",
  "competition",
  "training",
];

/** Developer-side opportunity submission form. */
export function OpportunityForm() {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [info, setInfo] = React.useState<string | null>(null);

  async function handle(formData: FormData) {
    setPending(true);
    setError(null);
    setInfo(null);
    try {
      const result = await submitOpportunity(formData);
      if (result.error) setError(result.error);
      if (result.info) setInfo(result.info);
      if (result.ok) router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <form action={handle} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="role">Title or role</Label>
          <Input id="role" name="role" required placeholder="Frontend Developer" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="organisation">Organisation</Label>
          <Input id="organisation" name="organisation" required placeholder="Mufakose Labs" />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="type">Type</Label>
          <Select id="type" name="type" defaultValue="job">
            {OPPORTUNITY_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="link">Link (optional)</Label>
          <Input id="link" name="link" type="url" placeholder="https://…" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="description">Description (optional)</Label>
        <Textarea
          id="description"
          name="description"
          placeholder="What is it, who is it for, when does it close?"
        />
      </div>
      {error ? <FieldError>{error}</FieldError> : null}
      {info ? (
        <p role="status" className="rounded-md border border-support/50 bg-support-tint px-3 py-2 text-sm text-support-deep">
          {info}
        </p>
      ) : null}
      <Button type="submit" disabled={pending}>
        <Plus className="size-4" aria-hidden />
        {pending ? "Submitting" : "Submit for verification"}
      </Button>
      <p className="text-xs leading-relaxed text-ink-400">
        No XP on submission. The instructor verifies it first — that is when
        XP is awarded.
      </p>
    </form>
  );
}
