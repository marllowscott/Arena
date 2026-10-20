"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FieldError, Select } from "@/components/ui/input";
import { setTopicStatus } from "@/lib/arena/actions";

const STATUSES = ["draft", "open", "scheduled", "delivered", "archived"];

/**
 * Inline topic lifecycle control. Moving a developer proposal out of `draft`
 * is how it becomes a topic the team can claim.
 */
export function TopicStatusControl({
  topicId,
  status,
}: {
  topicId: string;
  status: string;
}) {
  const router = useRouter();
  const [next, setNext] = React.useState(status);
  const [lastStatus, setLastStatus] = React.useState(status);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [info, setInfo] = React.useState<string | null>(null);

  if (status !== lastStatus) {
    setLastStatus(status);
    setNext(status);
  }

  async function apply() {
    if (next === status) return;
    setPending(true);
    setError(null);
    setInfo(null);
    try {
      const result = await setTopicStatus(topicId, next);
      if (result.error) {
        setError(result.error);
        setNext(status);
        return;
      }
      setInfo(result.info ?? "Topic updated.");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        aria-label="Topic status"
        value={next}
        onChange={(event) => setNext(event.target.value)}
        className="h-8 w-40 text-xs"
      >
        {STATUSES.map((value) => (
          <option key={value} value={value}>
            {value}
          </option>
        ))}
      </Select>
      <Button
        type="button"
        size="sm"
        variant="secondary"
        tone="tech"
        disabled={pending || next === status}
        onClick={apply}
      >
        {pending ? "Saving" : "Apply"}
      </Button>
      {error ? <FieldError>{error}</FieldError> : null}
      {info ? <p className="text-xs text-support-deep">{info}</p> : null}
    </div>
  );
}
