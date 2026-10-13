"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { BookOpen, CalendarDays, Check, Coins, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FieldError, Label, Textarea } from "@/components/ui/input";
import { requestDevShopReward } from "@/lib/arena/actions";

interface ShopReward {
  id: string;
  name: string;
  category: string;
  description: string;
  details: string;
  points_cost: number;
  active: boolean;
  sort_order: number;
}

interface ShopRedemption {
  id: string;
  reward_name: string;
  points_cost: number;
  request_note: string;
  status: "requested" | "approved" | "fulfilled" | "declined";
  instructor_note: string;
  created_at: string;
  updated_at: string;
}

const rewardIcons = [BookOpen, Users, CalendarDays];

const statusLabels: Record<ShopRedemption["status"], string> = {
  requested: "Awaiting instructor",
  approved: "Approved · arranging",
  fulfilled: "Fulfilled",
  declined: "Declined · points refunded",
};

export function DevShopView({
  rewards,
  redemptions,
  availablePoints,
}: {
  rewards: ShopReward[];
  redemptions: ShopRedemption[];
  availablePoints: number;
}) {
  const router = useRouter();

  return (
    <div>
      <ul className="grid gap-4 lg:grid-cols-3">
        {rewards.map((reward, index) => (
          <RewardCard
            key={reward.id}
            reward={reward}
            Icon={rewardIcons[index % rewardIcons.length]}
            canAfford={availablePoints >= reward.points_cost}
            onRequested={() => router.refresh()}
          />
        ))}
      </ul>

      <section className="mt-10">
        <h2 className="font-display text-lg font-semibold text-ink-900">Your requests</h2>
        {redemptions.length === 0 ? (
          <Card className="mt-3 p-5 text-sm text-ink-500">
            You have not requested a reward yet. Your regular learning resources and help remain
            available without points.
          </Card>
        ) : (
          <ul className="mt-3 divide-y divide-sand-200 rounded-md border border-sand-300 bg-sand-50">
            {redemptions.map((redemption) => (
              <li key={redemption.id} className="flex flex-wrap items-start gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-ink-900">{redemption.reward_name}</div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-400">
                    <span>{statusLabels[redemption.status]}</span>
                    <span>{redemption.points_cost} Dev Points</span>
                    <time dateTime={redemption.created_at}>
                      {new Intl.DateTimeFormat("en", {
                        dateStyle: "medium",
                        timeZone: "UTC",
                      }).format(new Date(redemption.created_at))}
                    </time>
                  </div>
                  {redemption.request_note ? (
                    <p className="mt-2 whitespace-pre-wrap text-sm text-ink-500">
                      {redemption.request_note}
                    </p>
                  ) : null}
                  {redemption.instructor_note ? (
                    <p className="mt-2 border-l-2 border-primary-line pl-3 text-sm text-ink-600">
                      Instructor: {redemption.instructor_note}
                    </p>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function RewardCard({
  reward,
  Icon,
  canAfford,
  onRequested,
}: {
  reward: ShopReward;
  Icon: typeof BookOpen;
  canAfford: boolean;
  onRequested: () => void;
}) {
  const [note, setNote] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  async function requestReward(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await requestDevShopReward(reward.id, note);
      if (result.error) {
        setError(result.error);
        return;
      }
      setSuccess(result.info ?? "Request sent.");
      setNote("");
      onRequested();
    } finally {
      setPending(false);
    }
  }

  return (
    <li>
      <Card className="flex h-full flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-md bg-primary-tint text-primary">
            <Icon className="size-5" aria-hidden />
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-md bg-secondary-tint px-2.5 py-1 font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-secondary-strong">
            <Coins className="size-3.5" aria-hidden />
            {reward.points_cost} {reward.points_cost === 1 ? "point" : "points"}
          </span>
        </div>
        <div className="eyebrow mt-4">{reward.category}</div>
        <h3 className="mt-1 font-display text-base font-semibold text-ink-900">{reward.name}</h3>
        <p className="mt-2 text-sm leading-relaxed text-ink-600">{reward.description}</p>
        <p className="mt-2 flex-1 text-xs leading-relaxed text-ink-400">{reward.details}</p>

        <form onSubmit={requestReward} className="mt-4">
          <Label htmlFor={`shop-note-${reward.id}`}>
            Topic or details <span className="font-sans normal-case tracking-normal">(optional)</span>
          </Label>
          <Textarea
            id={`shop-note-${reward.id}`}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            maxLength={1000}
            rows={3}
            placeholder="What would you like to focus on?"
            className="mt-1.5 min-h-20 text-xs"
          />
          {error ? <FieldError className="mt-2">{error}</FieldError> : null}
          {success ? (
            <p role="status" className="mt-2 flex items-center gap-1.5 text-xs text-support-deep">
              <Check className="size-3.5" aria-hidden />
              {success}
            </p>
          ) : null}
          <Button
            type="submit"
            variant="primary"
            className="mt-3 w-full"
            disabled={!canAfford || pending}
          >
            {pending ? "Sending request…" : canAfford ? "Request reward" : "More points needed"}
          </Button>
          {!canAfford ? (
            <p className="mt-2 text-center font-mono text-[10px] uppercase tracking-[0.08em] text-ink-400">
              Need {reward.points_cost} Dev Points
            </p>
          ) : null}
        </form>
      </Card>
    </li>
  );
}
