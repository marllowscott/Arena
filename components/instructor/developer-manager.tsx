"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronRight, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { FieldError, FieldHint, Input, Label, Select } from "@/components/ui/input";
import { deleteDeveloper, inviteDeveloper, updateDeveloper } from "@/lib/arena/actions";
import type { ManagedDeveloper } from "@/lib/arena/developer-management";
import type { InstructorXpAuditRow, PathwayRow } from "@/lib/arena/data";
import { formatXp, relativeTime } from "@/lib/format";
import { nowMs } from "@/lib/arena/clock";
import { levelForXp } from "@/lib/progression";

export function DeveloperManager({
  developers,
  pathways,
  xpEvents = [],
}: {
  developers: ManagedDeveloper[];
  pathways: PathwayRow[];
  xpEvents?: InstructorXpAuditRow[];
}) {
  const router = useRouter();
  const [showInvite, setShowInvite] = React.useState(false);
  const [invitePending, setInvitePending] = React.useState(false);
  const [inviteError, setInviteError] = React.useState<string | null>(null);
  const [inviteInfo, setInviteInfo] = React.useState<string | null>(null);
  const [query, setQuery] = React.useState("");
  const [pathway, setPathway] = React.useState("all");
  const inviteForm = React.useRef<HTMLFormElement>(null);

  const eventsByDeveloper = React.useMemo(() => {
    const map = new Map<string, InstructorXpAuditRow[]>();
    for (const event of xpEvents) {
      map.set(event.developer_id, [...(map.get(event.developer_id) ?? []), event]);
    }
    return map;
  }, [xpEvents]);

  const visible = developers.filter((developer) => {
    if (pathway !== "all" && developer.primary_pathway !== pathway) return false;
    if (!query.trim()) return true;
    const haystack = `${developer.full_name} ${developer.email} ${developer.handle} ${developer.headline}`.toLowerCase();
    return haystack.includes(query.trim().toLowerCase());
  });

  async function invite(formData: FormData) {
    setInvitePending(true);
    setInviteError(null);
    setInviteInfo(null);
    try {
      const result = await inviteDeveloper(formData);
      if (result.error) setInviteError(result.error);
      if (result.info) setInviteInfo(result.info);
      if (result.ok) {
        inviteForm.current?.reset();
        setShowInvite(false);
        router.refresh();
      }
    } finally {
      setInvitePending(false);
    }
  }

  return (
    <>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-500">
          {visible.length} of {developers.length} developer
          {developers.length === 1 ? "" : "s"} in the roster
        </p>
        <Button type="button" onClick={() => setShowInvite((current) => !current)}>
          {showInvite ? "Close invite form" : "Add developer"}
        </Button>
      </div>

      {inviteInfo ? (
        <p
          role="status"
          className="mt-3 rounded-md border border-support/50 bg-support-tint px-3 py-2 text-sm text-support-deep"
        >
          {inviteInfo}
        </p>
      ) : null}

      {showInvite ? (
        <form
          ref={inviteForm}
          action={invite}
          className="mt-4 grid gap-4 rounded-lg border border-sand-300 bg-sand-50 p-4 shadow-subtle sm:grid-cols-2"
        >
          <div className="space-y-1.5">
            <Label htmlFor="invite-full-name">Full name</Label>
            <Input
              id="invite-full-name"
              name="fullName"
              required
              maxLength={100}
              autoComplete="name"
              placeholder="Ada Lovelace"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="invite-email">Email address</Label>
            <Input
              id="invite-email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="ada@example.com"
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="invite-handle">Handle (optional)</Label>
            <Input id="invite-handle" name="handle" maxLength={30} placeholder="ada" />
            <FieldHint>
              We’ll email an account invitation. Their account and developer profile are created
              when the invitation is sent, and they can sign in after accepting it.
            </FieldHint>
          </div>
          {inviteError ? <FieldError className="sm:col-span-2">{inviteError}</FieldError> : null}
          <div className="sm:col-span-2">
            <Button type="submit" disabled={invitePending}>
              {invitePending ? "Sending invitation…" : "Send invitation"}
            </Button>
          </div>
        </form>
      ) : null}

      <div className="mt-6 flex flex-col gap-3 rounded-lg border border-sand-300 bg-sand-50 p-4 shadow-subtle sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1.5 sm:max-w-xs sm:flex-1">
          <Label htmlFor="developer-search">Search the roster</Label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-300"
              aria-hidden
            />
            <Input
              id="developer-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Name, email or handle"
              className="pl-9"
            />
          </div>
        </div>
        <div className="space-y-1.5 sm:max-w-xs">
          <Label htmlFor="developer-pathway">Pathway</Label>
          <Select
            id="developer-pathway"
            value={pathway}
            onChange={(event) => setPathway(event.target.value)}
          >
            <option value="all">All pathways</option>
            {pathways.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {visible.length ? (
        <ul className="mt-6 grid gap-4 xl:grid-cols-2">
          {visible.map((developer) => (
            <DeveloperCard
              key={developer.id}
              developer={developer}
              pathways={pathways}
              xpEvents={eventsByDeveloper.get(developer.id) ?? []}
            />
          ))}
        </ul>
      ) : (
        <div className="mt-6 rounded-lg border border-sand-300 bg-sand-50 p-6 text-sm text-ink-500">
          {developers.length === 0
            ? "No developer accounts yet. Add one above to send an invitation."
            : "No developer matches that search. Clear the search or pick another pathway."}
        </div>
      )}
    </>
  );
}

function DeveloperCard({
  developer,
  pathways,
  xpEvents,
}: {
  developer: ManagedDeveloper;
  pathways: PathwayRow[];
  xpEvents: InstructorXpAuditRow[];
}) {
  const router = useRouter();
  const [editing, setEditing] = React.useState(false);
  const [showXp, setShowXp] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [info, setInfo] = React.useState<string | null>(null);

  async function save(formData: FormData) {
    setPending(true);
    setError(null);
    setInfo(null);
    try {
      const result = await updateDeveloper(developer.id, formData);
      if (result.error) setError(result.error);
      if (result.info) setInfo(result.info);
      if (result.ok) {
        setEditing(false);
        router.refresh();
      }
    } finally {
      setPending(false);
    }
  }

  async function remove() {
    const confirmed = window.confirm(
      `Permanently delete ${developer.full_name} (${developer.email})? This also deletes their profile, submissions, XP history, and related activity. This cannot be undone.`,
    );
    if (!confirmed) return;

    setPending(true);
    setError(null);
    setInfo(null);
    try {
      const result = await deleteDeveloper(developer.id);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  const level = levelForXp(developer.total_xp);
  const initials =
    developer.full_name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || developer.handle.slice(0, 2).toUpperCase();

  return (
    <li className="rounded-lg border border-sand-300 bg-sand-50 p-4 shadow-subtle">
      <div className="flex items-center gap-3">
        <Avatar
          initials={initials}
          name={developer.full_name}
          from={developer.avatar_from}
          to={developer.avatar_to}
          size="md"
        />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium text-ink-900">{developer.full_name}</div>
          <div className="truncate font-mono text-[10px] text-ink-400">{developer.email}</div>
          <div className="truncate font-mono text-[10px] uppercase tracking-[0.1em] text-ink-300">
            @{developer.handle}
          </div>
        </div>
        <Badge tone="outline">Level {level.level}</Badge>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-sand-300 pt-3">
        <div>
          <div className="font-display text-xl font-bold tabular-nums text-primary">
            {formatXp(developer.total_xp)}
          </div>
          <div className="font-mono text-[9px] uppercase tracking-[0.1em] text-ink-300">
            total XP · {formatXp(developer.weekly_xp)} this week
          </div>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={pending}
            onClick={() => {
              setEditing((current) => !current);
              setError(null);
              setInfo(null);
            }}
          >
            {editing ? "Close editor" : "Edit"}
          </Button>
          <Button type="button" size="sm" variant="danger" disabled={pending} onClick={remove}>
            {pending ? "Working…" : "Delete"}
          </Button>
        </div>
      </div>

      {error ? <FieldError>{error}</FieldError> : null}
      {info ? (
        <p role="status" className="mt-2 text-sm text-support-deep">
          {info}
        </p>
      ) : null}

      <div className="mt-3 border-t border-sand-300 pt-3">
        <button
          type="button"
          onClick={() => setShowXp((current) => !current)}
          aria-expanded={showXp}
          className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-primary hover:underline"
        >
          {showXp ? (
            <ChevronDown className="size-3.5" aria-hidden />
          ) : (
            <ChevronRight className="size-3.5" aria-hidden />
          )}
          XP audit ({xpEvents.length})
        </button>

        {showXp ? (
          xpEvents.length === 0 ? (
            <p className="mt-2 text-xs text-ink-400">No XP events recorded.</p>
          ) : (
            <ul className="mt-2 divide-y divide-sand-200 rounded-md border border-sand-300 bg-sand-100/60">
              {xpEvents.map((event) => (
                <li key={event.id} className="flex items-start gap-3 px-3 py-2">
                  <span className="w-16 shrink-0 font-mono text-xs font-semibold tabular-nums text-primary">
                    {event.xp > 0 ? "+" : ""}
                    {formatXp(event.xp)} XP
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs text-ink-700">{event.label}</span>
                    <span className="block font-mono text-[10px] uppercase tracking-[0.1em] text-ink-300">
                      {event.pathway_id} · {event.source} ·{" "}
                      {relativeTime(event.created_at, nowMs())}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )
        ) : null}
      </div>

      {editing ? (
        <form action={save} className="mt-4 space-y-3 border-t border-sand-300 pt-4">
          <div className="space-y-1.5">
            <Label htmlFor={`${developer.id}-full-name`}>Full name</Label>
            <Input
              id={`${developer.id}-full-name`}
              name="fullName"
              required
              maxLength={100}
              defaultValue={developer.full_name}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`${developer.id}-handle`}>Handle</Label>
            <Input
              id={`${developer.id}-handle`}
              name="handle"
              required
              minLength={2}
              maxLength={30}
              defaultValue={developer.handle}
            />
            <FieldHint>Use 2–30 letters, numbers, underscores, or hyphens.</FieldHint>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`${developer.id}-headline`}>Headline</Label>
            <Input
              id={`${developer.id}-headline`}
              name="headline"
              maxLength={160}
              defaultValue={developer.headline}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`${developer.id}-pathway`}>Primary pathway</Label>
            <Select
              id={`${developer.id}-pathway`}
              name="primaryPathway"
              defaultValue={developer.primary_pathway}
            >
              {pathways.map((pathway) => (
                <option key={pathway.id} value={pathway.id}>
                  {pathway.name}
                </option>
              ))}
            </Select>
          </div>
          <Button type="submit" size="sm" disabled={pending}>
            {pending ? "Saving…" : "Save changes"}
          </Button>
        </form>
      ) : null}
    </li>
  );
}
