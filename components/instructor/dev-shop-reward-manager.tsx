"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label, Textarea } from "@/components/ui/input";
import { saveDevShopReward, setDevShopRewardActive } from "@/lib/arena/actions";

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

export function DevShopRewardManager({ rewards }: { rewards: ShopReward[] }) {
  const router = useRouter();
  const [selected, setSelected] = React.useState<ShopReward | null>(null);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [info, setInfo] = React.useState<string | null>(null);

  async function save(formData: FormData) {
    setPending(true);
    setError(null);
    setInfo(null);
    try {
      const result = await saveDevShopReward(formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      setInfo(result.info ?? "Reward saved.");
      setSelected(null);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  async function toggleActive(reward: ShopReward) {
    setPending(true);
    setError(null);
    setInfo(null);
    try {
      const result = await setDevShopRewardActive(reward.id, !reward.active);
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
    <section className="mt-8 rounded-lg border border-sand-300 bg-sand-50 p-5 shadow-subtle sm:p-6">
      <div>
        <div className="eyebrow">Catalog management</div>
        <h2 className="mt-1 font-display text-lg font-semibold text-ink-900">
          {selected ? "Edit reward" : "Add a reward"}
        </h2>
        <p className="mt-1 text-sm text-ink-500">
          Set the Dev Point price. Inactive rewards are hidden from developers but remain in
          request history.
        </p>
      </div>

      <form key={selected?.id ?? "new-reward"} action={save} className="mt-4 grid gap-3 sm:grid-cols-2">
        <input type="hidden" name="rewardId" value={selected?.id ?? ""} />
        <div className="space-y-1.5">
          <Label htmlFor="reward-name">Product or reward name</Label>
          <Input id="reward-name" name="name" required maxLength={120} defaultValue={selected?.name ?? ""} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="reward-category">Category</Label>
          <Input id="reward-category" name="category" required maxLength={80} defaultValue={selected?.category ?? ""} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="reward-cost">Point cost</Label>
          <Input
            id="reward-cost"
            name="pointsCost"
            type="number"
            min={1}
            max={100000}
            step={1}
            required
            defaultValue={selected?.points_cost ?? 1}
          />
        </div>
        <label className="flex items-center gap-2 self-end pb-2 text-sm text-ink-700">
          <input
            type="checkbox"
            name="active"
            defaultChecked={selected?.active ?? true}
            className="size-4 accent-primary"
          />
          Available to developers
        </label>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="reward-description">Short description</Label>
          <Textarea
            id="reward-description"
            name="description"
            required
            maxLength={500}
            rows={2}
            defaultValue={selected?.description ?? ""}
          />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="reward-details">Request details</Label>
          <Textarea
            id="reward-details"
            name="details"
            required
            maxLength={1000}
            rows={3}
            defaultValue={selected?.details ?? ""}
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
            {pending ? "Saving…" : selected ? "Save changes" : "Add reward"}
          </Button>
          {selected ? (
            <Button
              type="button"
              variant="secondary"
              disabled={pending}
              onClick={() => {
                setSelected(null);
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
        <h3 className="font-display text-base font-semibold text-ink-900">Current rewards</h3>
        <ul className="mt-3 divide-y divide-sand-300">
          {rewards.map((reward) => (
            <li key={reward.id} className="flex flex-wrap items-center gap-3 py-3">
              <div className="min-w-0 flex-1">
                <div className="font-medium text-ink-800">{reward.name}</div>
                <div className="mt-0.5 text-xs text-ink-500">
                  {reward.category} · {reward.points_cost} {reward.points_cost === 1 ? "point" : "points"} ·{" "}
                  {reward.active ? "Available" : "Inactive"}
                </div>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={pending}
                onClick={() => {
                  setSelected(reward);
                  setError(null);
                  setInfo(null);
                }}
              >
                Edit
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={pending}
                onClick={() => toggleActive(reward)}
              >
                {reward.active ? "Deactivate" : "Activate"}
              </Button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
