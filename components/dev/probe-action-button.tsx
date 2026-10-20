"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { acceptProbe, confirmProbeAnswer, releaseProbe, moderateProbe } from "@/lib/arena/actions";
import { Button } from "@/components/ui/button";

type Action =
  | { kind: "accept"; requestId: string }
  | { kind: "release"; requestId: string }
  | { kind: "confirm"; requestId: string; answerId: string }
  | { kind: "unflag"; requestId: string };

export function ProbeActionButton({
  action,
  children,
  variant = "secondary",
}: {
  action: Action;
  children: React.ReactNode;
  variant?: React.ComponentProps<typeof Button>["variant"];
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  function run() {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result =
        action.kind === "accept"
          ? await acceptProbe(action.requestId)
          : action.kind === "release"
            ? await releaseProbe(action.requestId)
            : action.kind === "confirm"
              ? await confirmProbeAnswer(action.requestId, action.answerId)
              : await moderateProbe(action.requestId, false);
      if (result.error) {
        setError(result.error);
        return;
      }
      setSuccess(result.info ?? "Action completed.");
      router.refresh();
    });
  }

  return (
    <div>
      <Button type="button" variant={variant} disabled={pending} onClick={run}>
        {pending ? "Working…" : children}
      </Button>
      {error ? (
        <p role="alert" className="mt-1.5 text-xs font-medium text-primary">
          {error}
        </p>
      ) : null}
      {success ? (
        <p role="status" className="mt-1.5 text-xs font-medium text-support-deep">
          {success}
        </p>
      ) : null}
    </div>
  );
}
