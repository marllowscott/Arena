"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FieldError, FieldHint, Input, Label, Select, Textarea } from "@/components/ui/input";
import { deleteTopic, setTopicStatus, updateTopic } from "@/lib/arena/actions";
import { TopicStatusControl } from "@/components/instructor/topic-status-control";
import type { PathwayRow, TopicRow } from "@/lib/arena/data";

function localDateTime(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 16);
}

export function TopicProposalManager({
  topic,
  pathways,
  claimCount,
  createdLabel,
  interestCount = 0,
  isDeveloperProposal = false,
}: {
  topic: TopicRow;
  pathways: PathwayRow[];
  claimCount: number;
  createdLabel: string;
  interestCount?: number;
  isDeveloperProposal?: boolean;
}) {
  const router = useRouter();
  const [expanded, setExpanded] = React.useState(false);
  const [editing, setEditing] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [info, setInfo] = React.useState<string | null>(null);

  async function save(formData: FormData) {
    setPending(true);
    setError(null);
    setInfo(null);
    try {
      const result = await updateTopic(topic.id, formData);
      if (result.error) setError(result.error);
      if (result.info) setInfo(result.info);
      if (result.ok) {
        setEditing(false);
        setExpanded(true);
        router.refresh();
      }
    } finally {
      setPending(false);
    }
  }

  async function remove() {
    if (
      !window.confirm(
        `Delete "${topic.title}" and its student presentations? Any XP already awarded remains in the XP history.`,
      )
    ) {
      return;
    }

    setPending(true);
    setError(null);
    setInfo(null);
    try {
      const result = await deleteTopic(topic.id);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  async function publish() {
    setPending(true);
    setError(null);
    setInfo(null);
    try {
      const result = await setTopicStatus(topic.id, "open");
      if (result.error) {
        setError(result.error);
        return;
      }
      setInfo(result.info ?? "Topic published.");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <li className="rounded-lg border border-sand-300 bg-sand-50 p-4 shadow-subtle">
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-sand-400 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-ink-600">
          {topic.pathway_id}
        </span>
        <span className="rounded-full border border-sand-400 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-ink-600">
          {topic.status === "open"
            ? "proposal / published"
            : topic.status === "draft"
              ? "draft · unpublished"
              : topic.status}
        </span>
        {isDeveloperProposal ? (
          <span className="rounded-full border border-secondary-line bg-secondary-tint px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-secondary-muted">
            developer proposal
          </span>
        ) : null}
        <span className="font-mono text-xs font-semibold tabular-nums text-primary">
          +{topic.xp_reward} XP
        </span>
        <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.1em] text-ink-400">
          {claimCount} {claimCount === 1 ? "claim" : "claims"} · {interestCount}{" "}
          {interestCount === 1 ? "interested" : "interested"} · {createdLabel}
        </span>
      </div>

      <h2 className="mt-2 font-display text-base font-semibold tracking-tight text-ink-900">
        {topic.title}
      </h2>
      <p className={`mt-1 text-sm leading-relaxed text-ink-500 ${expanded ? "" : "line-clamp-2"}`}>
        {topic.summary}
      </p>
      <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-400">
        Proposed by {topic.author_name ?? "Unknown developer"}
        {topic.author_handle ? ` (@${topic.author_handle})` : ""}
      </p>

      <div className="mt-4 flex flex-wrap gap-2 border-t border-sand-300 pt-3">
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={() => {
            setExpanded((current) => !current);
            setEditing(false);
            setError(null);
          }}
        >
          {expanded ? "Close details" : "Open details"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="danger"
          disabled={pending}
          onClick={remove}
        >
          {pending ? "Deleting…" : "Delete topic"}
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={() => {
            setExpanded(true);
            setEditing((current) => !current);
            setError(null);
            setInfo(null);
          }}
        >
          {editing ? "Close editor" : "Edit topic"}
        </Button>
        {topic.status === "draft" ? (
          <Button
            type="button"
            size="sm"
            variant="success"
            disabled={pending}
            onClick={publish}
          >
            {pending ? "Publishing…" : "Publish"}
          </Button>
        ) : null}
      </div>

      <div className="mt-3 border-t border-sand-300 pt-3">
        <TopicStatusControl topicId={topic.id} status={topic.status} />
      </div>

      {error ? <FieldError className="mt-2">{error}</FieldError> : null}
      {info ? (
        <p role="status" className="mt-2 text-sm text-support-deep">
          {info}
        </p>
      ) : null}

      {expanded && !editing ? (
        <div className="mt-4 space-y-3 border-t border-sand-300 pt-4">
          <div>
            <h3 className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-400">
              Full proposal
            </h3>
            <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-ink-700">
              {topic.summary}
            </p>
          </div>
          {topic.outcomes.length > 0 ? (
            <div>
              <h3 className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-400">
                Learning outcomes
              </h3>
              <ul className="mt-1 list-inside list-disc space-y-1 text-sm text-ink-700">
                {topic.outcomes.map((outcome, index) => (
                  <li key={`${index}-${outcome}`}>{outcome}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {topic.session_date ? (
            <p className="text-sm text-ink-600">
              Session date: {new Date(topic.session_date).toLocaleString()}
            </p>
          ) : null}
        </div>
      ) : null}

      {editing ? (
        <form action={save} className="mt-4 space-y-3 border-t border-sand-300 pt-4">
          <div className="space-y-1.5">
            <Label htmlFor={`${topic.id}-title`}>Topic title</Label>
            <Input
              id={`${topic.id}-title`}
              name="title"
              required
              maxLength={200}
              defaultValue={topic.title}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`${topic.id}-summary`}>Description</Label>
            <Textarea
              id={`${topic.id}-summary`}
              name="summary"
              required
              maxLength={5000}
              defaultValue={topic.summary}
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor={`${topic.id}-pathway`}>Pathway</Label>
              <Select
                id={`${topic.id}-pathway`}
                name="pathwayId"
                defaultValue={topic.pathway_id}
              >
                {pathways.map((pathway) => (
                  <option key={pathway.id} value={pathway.id}>
                    {pathway.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`${topic.id}-xp`}>XP reward</Label>
              <Input
                id={`${topic.id}-xp`}
                name="xpReward"
                type="number"
                min={5}
                max={500}
                required
                defaultValue={topic.xp_reward}
              />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor={`${topic.id}-status`}>Status</Label>
              <Select id={`${topic.id}-status`} name="status" defaultValue={topic.status}>
                <option value="draft">Draft / unpublished</option>
                <option value="open">Open / published</option>
                <option value="scheduled">Scheduled</option>
                <option value="delivered">Delivered</option>
                <option value="archived">Archived</option>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`${topic.id}-session-date`}>Session date (optional)</Label>
              <Input
                id={`${topic.id}-session-date`}
                name="sessionDate"
                type="datetime-local"
                defaultValue={localDateTime(topic.session_date)}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`${topic.id}-outcomes`}>Learning outcomes (one per line)</Label>
            <Textarea
              id={`${topic.id}-outcomes`}
              name="outcomes"
              defaultValue={topic.outcomes.join("\n")}
            />
            <FieldHint>Leave blank if the proposal has not been reviewed yet.</FieldHint>
          </div>
          <Button type="submit" size="sm" disabled={pending}>
            {pending ? "Saving…" : "Save topic"}
          </Button>
        </form>
      ) : null}
    </li>
  );
}
