"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Bell, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label, Textarea } from "@/components/ui/input";
import { deleteHubAnnouncement, saveHubAnnouncement } from "@/lib/arena/actions";
import { relativeTime } from "@/lib/format";
import { nowMs } from "@/lib/arena/clock";
import type { HubAnnouncement } from "@/lib/arena/hub";

export function AnnouncementManager({
  announcements,
}: {
  announcements: HubAnnouncement[];
}) {
  const router = useRouter();
  const [editing, setEditing] = React.useState<HubAnnouncement | null>(null);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [info, setInfo] = React.useState<string | null>(null);

  async function save(formData: FormData) {
    setPending(true);
    setError(null);
    setInfo(null);
    try {
      const result = await saveHubAnnouncement(formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      setInfo(result.info ?? "Announcement saved.");
      setEditing(null);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  async function remove(announcement: HubAnnouncement) {
    if (
      !window.confirm(
        `Remove the announcement "${announcement.headline}"? Developers will no longer see it.`,
      )
    ) {
      return;
    }

    setPending(true);
    setError(null);
    setInfo(null);
    try {
      const result = await deleteHubAnnouncement(announcement.id);
      if (result.error) {
        setError(result.error);
        return;
      }
      setInfo(result.info ?? "Announcement removed.");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="mt-8 rounded-lg border border-sand-300 bg-sand-50 p-5 shadow-subtle sm:p-6">
      <div>
        <div className="eyebrow">Hub-wide messaging</div>
        <h2 className="mt-1 font-display text-lg font-semibold text-ink-900">
          {editing ? "Edit announcement" : "Publish an announcement"}
        </h2>
        <p className="mt-1 text-sm text-ink-500">
          Announcements appear at the top of every developer dashboard until they
          are removed.
        </p>
      </div>

      <form
        key={editing?.id ?? "new-announcement"}
        action={save}
        className="mt-4 grid gap-3 sm:grid-cols-2"
      >
        <input type="hidden" name="announcementId" value={editing?.id ?? ""} />
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="announcement-headline">Headline</Label>
          <Input
            id="announcement-headline"
            name="headline"
            required
            maxLength={140}
            defaultValue={editing?.headline ?? ""}
            placeholder="Saturday session moved to 10am"
          />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="announcement-body">Body</Label>
          <Textarea
            id="announcement-body"
            name="body"
            required
            maxLength={2000}
            rows={3}
            defaultValue={editing?.body ?? ""}
            placeholder="Tell the hub what changed and what to expect."
          />
        </div>

        {error ? <FieldError className="sm:col-span-2">{error}</FieldError> : null}
        {info ? (
          <p role="status" className="text-sm text-support-deep sm:col-span-2">
            {info}
          </p>
        ) : null}

        <div className="flex gap-2 sm:col-span-2">
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : editing ? "Save changes" : "Publish announcement"}
          </Button>
          {editing ? (
            <Button
              type="button"
              variant="secondary"
              disabled={pending}
              onClick={() => {
                setEditing(null);
                setError(null);
                setInfo(null);
              }}
            >
              Cancel
            </Button>
          ) : null}
        </div>
      </form>

      <div className="mt-6 border-t border-sand-300 pt-5">
        <h3 className="font-display text-base font-semibold text-ink-900">
          Live announcements
        </h3>
        {announcements.length === 0 ? (
          <p className="mt-3 text-sm text-ink-400">
            Nothing published. The developer dashboard shows announcements here.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-sand-300">
            {announcements.map((announcement) => (
              <li key={announcement.id} className="flex flex-wrap items-start gap-3 py-3">
                <Bell className="mt-0.5 size-4 shrink-0 text-secondary-muted" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink-800">
                    {announcement.headline}
                  </p>
                  <p className="mt-0.5 text-sm leading-relaxed text-ink-500">
                    {announcement.body}
                  </p>
                  {announcement.publishedAt ? (
                    <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-300">
                      {relativeTime(announcement.publishedAt, nowMs())}
                    </p>
                  ) : null}
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    disabled={pending}
                    onClick={() => {
                      setEditing(announcement);
                      setError(null);
                      setInfo(null);
                    }}
                  >
                    Edit
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="danger"
                    disabled={pending}
                    onClick={() => remove(announcement)}
                  >
                    <Trash2 className="size-3.5" aria-hidden />
                    Delete
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
