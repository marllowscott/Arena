"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FieldError, Label, Textarea } from "@/components/ui/input";
import { reviewDevShopRedemption } from "@/lib/arena/actions";

interface Redemption {
  id: string;
  developer_id: string;
  reward_name: string;
  points_cost: number;
  request_note: string;
  status: "requested" | "approved" | "fulfilled" | "declined";
  instructor_note: string;
  created_at: string;
  updated_at: string;
}

const statusLabels: Record<Redemption["status"], string> = {
  requested: "Awaiting review",
  approved: "Approved · arranging",
  fulfilled: "Fulfilled",
  declined: "Declined · points refunded",
};

export function DevShopRequestReview({
  redemption,
  developerName,
  developerHandle,
}: {
  redemption: Redemption;
  developerName: string;
  developerHandle: string;
}) {
  const router = useRouter();
  const [note, setNote] = React.useState(redemption.instructor_note);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function decide(status: "approved" | "fulfilled" | "declined") {
    setPending(true);
    setError(null);
    try {
      const result = await reviewDevShopRedemption(redemption.id, status, note);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <li>
      <Card className="p-5">
        <div className="flex flex-wrap items-start gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <h3 className="font-display font-semibold text-ink-900">{redemption.reward_name}</h3>
              <span className="rounded-md bg-secondary-tint px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.08em] text-secondary-strong">
                {redemption.points_cost} Dev Points
              </span>
            </div>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-400">
              {developerName}
              {developerHandle ? ` · @${developerHandle}` : ""} · {statusLabels[redemption.status]}
            </p>
          </div>
          <time
            dateTime={redemption.created_at}
            className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-300"
          >
            {new Intl.DateTimeFormat("en", {
              dateStyle: "medium",
              timeZone: "UTC",
            }).format(new Date(redemption.created_at))}
          </time>
        </div>

        {redemption.request_note ? (
          <div className="mt-4 rounded-md border border-sand-200 bg-sand-100 p-3">
            <div className="eyebrow">Requested focus</div>
            <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-ink-600">
              {redemption.request_note}
            </p>
          </div>
        ) : null}

        {redemption.status === "requested" || redemption.status === "approved" ? (
          <>
            <div className="mt-4 space-y-1.5">
              <Label htmlFor={`shop-instructor-note-${redemption.id}`}>
                Note to developer
              </Label>
              <Textarea
                id={`shop-instructor-note-${redemption.id}`}
                value={note}
                onChange={(event) => setNote(event.target.value)}
                maxLength={1000}
                rows={2}
                placeholder="Share next steps, scheduling details, or why the request cannot be fulfilled."
              />
            </div>
            {error ? <FieldError className="mt-2">{error}</FieldError> : null}
            <div className="mt-3 flex flex-wrap gap-2">
              {redemption.status === "requested" ? (
                <Button
                  size="sm"
                  variant="success"
                  onClick={() => decide("approved")}
                  disabled={pending}
                >
                  <BadgeCheck className="size-4" aria-hidden />
                  Approve request
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="success"
                  onClick={() => decide("fulfilled")}
                  disabled={pending}
                >
                  <CheckCircle2 className="size-4" aria-hidden />
                  Mark fulfilled
                </Button>
              )}
              <Button
                size="sm"
                variant="danger"
                onClick={() => decide("declined")}
                disabled={pending}
              >
                <XCircle className="size-4" aria-hidden />
                Decline and refund points
              </Button>
            </div>
          </>
        ) : redemption.instructor_note ? (
          <p className="mt-3 border-l-2 border-primary-line pl-3 text-sm text-ink-600">
            Instructor note: {redemption.instructor_note}
          </p>
        ) : null}
      </Card>
    </li>
  );
}
