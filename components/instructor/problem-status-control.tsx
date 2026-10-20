"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FieldError, Select } from "@/components/ui/input";
import { setProblemStatus } from "@/lib/arena/actions";

const STATUSES = ["open", "locked", "closed", "draft"];

/**
 * Inline visibility control for one problem. The instructor policy on
 * `challenges` is the boundary — this only chooses which status to write.
 */
export function ProblemStatusControl({
  problemId,
  status,
}: {
  problemId: string;
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
      const result = await setProblemStatus(problemId, next);
      if (result.error) {
        setError(result.error);
        setNext(status);
        return;
      }
      setInfo(result.info ?? "Problem updated.");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        aria-label="Problem status"
        value={next}
        onChange={(event) => setNext(event.target.value)}
        className="h-8 w-36 text-xs"
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
