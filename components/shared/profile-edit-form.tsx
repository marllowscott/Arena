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
import { updateProfile } from "@/lib/arena/actions";
import type { Pathway } from "@/lib/types";
import type { ProfileRow } from "@/lib/arena/data";

const PATHWAYS: Array<{ id: string; name: string }> = [
  { id: "builder", name: "Builder" },
  { id: "problem-solver", name: "Problem Solver" },
  { id: "teacher", name: "Teacher" },
  { id: "mentor", name: "Mentor" },
  { id: "scout", name: "Scout" },
];

export function ProfileEditForm({
  profile,
  pathways,
}: {
  profile: ProfileRow;
  pathways?: Pathway[];
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
      const result = await updateProfile(formData);
      if (result.error) setError(result.error);
      if (result.info) setInfo(result.info);
      if (result.ok) router.refresh();
    } finally {
      setPending(false);
    }
  }

  const pathwayOptions =
    pathways && pathways.length > 0
      ? pathways.map((p) => ({ id: p.id, name: p.name }))
      : PATHWAYS;

  return (
    <form action={handle} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="fullName">Full name</Label>
        <Input
          id="fullName"
          name="fullName"
          required
          defaultValue={profile.full_name}
          placeholder="Ada Lovelace"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="handle">Handle</Label>
        <Input
          id="handle"
          name="handle"
          defaultValue={profile.handle}
          placeholder="ada"
        />
        <FieldHint>2-40 lowercase letters, numbers, or hyphens.</FieldHint>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="headline">Headline</Label>
        <Input
          id="headline"
          name="headline"
          defaultValue={profile.headline}
          placeholder="What you do."
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="primaryPathway">Primary pathway</Label>
        <Select
          id="primaryPathway"
          name="primaryPathway"
          defaultValue={profile.primary_pathway}
        >
          {pathwayOptions.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="focus">Focus</Label>
        <Input
          id="focus"
          name="focus"
          defaultValue={profile.focus}
          placeholder="What you're focused on."
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="skills">Skills (comma-separated)</Label>
        <Textarea
          id="skills"
          name="skills"
          defaultValue={profile.skills.join(", ")}
          placeholder="TypeScript, React, Postgres"
        />
      </div>

      {error ? <FieldError>{error}</FieldError> : null}
      {info ? (
        <p role="status" className="rounded-md border border-support/50 bg-support-tint px-3 py-2 text-sm text-support-deep">
          {info}
        </p>
      ) : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save profile"}
      </Button>
    </form>
  );
}