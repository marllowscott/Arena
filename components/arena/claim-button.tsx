"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Check, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { claim, unclaim } from "@/lib/arena/actions";
import { cn } from "@/lib/utils";

/**
 * Claim / unclaim toggle for a challenge or topic. The claim itself is
 * written by the server action and enforced by RLS — this button only
 * reflects state that the database returned.
 */
export function ClaimButton({
  kind,
  activityId,
  claimed,
  compact = false,
}: {
  kind: "challenge" | "topic";
  activityId: string;
  claimed: boolean;
  compact?: boolean;
}) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);

  async function toggle() {
    setPending(true);
    try {
      await (claimed ? unclaim(kind, activityId) : claim(kind, activityId));
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <Button
      type="button"
      size={compact ? "sm" : "md"}
      variant={claimed ? "secondary" : "primary"}
      tone="tech"
      onClick={toggle}
      disabled={pending}
      aria-pressed={claimed}
      className={cn(compact && "h-7 px-2.5 text-[10px]")}
    >
      {claimed ? <Check className="size-4" aria-hidden /> : <Plus className="size-4" aria-hidden />}
      {claimed ? "Claimed" : kind === "topic" ? "Claim topic" : "Claim problem"}
    </Button>
  );
}
