"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FieldError, FieldHint, Input, Label } from "@/components/ui/input";
import { saveHubSettingsAction } from "@/lib/arena/actions";
import type { HubSettings } from "@/lib/arena/hub";

export function HubSettingsForm({ settings }: { settings: HubSettings }) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [info, setInfo] = React.useState<string | null>(null);

  async function save(formData: FormData) {
    setPending(true);
    setError(null);
    setInfo(null);
    try {
      const result = await saveHubSettingsAction(formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      setInfo(result.info ?? "Hub settings saved.");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      action={save}
      className="mt-4 grid gap-4 rounded-lg border border-sand-300 bg-sand-50 p-5 shadow-subtle sm:grid-cols-2"
    >
      <div className="space-y-1.5 sm:col-span-2">
        <Label htmlFor="hub-name">Hub name</Label>
        <Input
          id="hub-name"
          name="hubName"
          required
          maxLength={120}
          defaultValue={settings.name}
        />
        <FieldHint>Shown in the sidebar and on the developer dashboard.</FieldHint>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="hub-review-window">Review window (days)</Label>
        <Input
          id="hub-review-window"
          name="reviewWindowDays"
          type="number"
          min={1}
          max={90}
          step={1}
          required
          defaultValue={settings.reviewWindowDays}
        />
        <FieldHint>How long a submission stays open for review.</FieldHint>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="hub-session-length">Session length (minutes)</Label>
        <Input
          id="hub-session-length"
          name="sessionLengthMinutes"
          type="number"
          min={15}
          max={480}
          step={5}
          required
          defaultValue={settings.sessionLengthMinutes}
        />
        <FieldHint>Default length of a hub session.</FieldHint>
      </div>

      {error ? <FieldError className="sm:col-span-2">{error}</FieldError> : null}
      {info ? (
        <p role="status" className="text-sm text-support-deep sm:col-span-2">
          {info}
        </p>
      ) : null}

      <div className="sm:col-span-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save settings"}
        </Button>
      </div>
    </form>
  );
}
