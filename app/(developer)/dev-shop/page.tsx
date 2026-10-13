import type { Metadata } from "next";
import { Coins, Gift, Sparkles } from "lucide-react";
import { DevShopView } from "@/components/dev/dev-shop-view";
import { PageHeader } from "@/components/shared/section-heading";
import { Card } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { requireDeveloper } from "@/lib/arena/session";
import { XP_PER_DEV_POINT } from "@/lib/progression";

export const metadata: Metadata = {
  title: "Dev Shop",
  description: "Track Dev Points and request learning rewards.",
};

export default async function DevShopPage() {
  const session = await requireDeveloper();
  const profile = session.profile;
  if (!profile) throw new Error("Developer profile is missing.");

  const supabase = await createClient();
  const [rewardsResult, redemptionsResult] = await Promise.all([
    supabase
      .from("dev_shop_rewards")
      .select("id, name, category, description, details, points_cost, active, sort_order")
      .eq("active", true)
      .order("sort_order"),
    supabase
      .from("dev_shop_redemptions")
      .select(
        "id, reward_name, points_cost, request_note, status, instructor_note, created_at, updated_at",
      )
      .eq("developer_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  if (rewardsResult.error) {
    throw new Error(`Could not load Dev Shop rewards: ${rewardsResult.error.message}`);
  }
  if (redemptionsResult.error) {
    throw new Error(`Could not load Dev Shop requests: ${redemptionsResult.error.message}`);
  }

  const earnedPoints = Math.floor(profile.total_xp / XP_PER_DEV_POINT);
  const spentPoints = redemptionsResult.data.reduce(
    (sum, redemption) =>
      sum + (redemption.status === "declined" ? 0 : redemption.points_cost),
    0,
  );
  const availablePoints = Math.max(0, earnedPoints - spentPoints);
  const xpTowardNextPoint = profile.total_xp % XP_PER_DEV_POINT;

  return (
    <div className="px-4 py-8 sm:px-6">
      <PageHeader
        eyebrow="Progress unlocks learning"
        title="Dev Shop"
        description="Your XP shows how far you've grown. Dev Points let you request extra learning opportunities—XP and levels are never spent."
      />

      <section className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.8fr)]">
        <Card className="p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-md bg-secondary-tint text-secondary-strong">
              <Coins className="size-5" aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <div className="eyebrow">Your Dev Points</div>
              <div className="mt-1 font-display text-3xl font-bold tabular-nums text-ink-900">
                {availablePoints}
              </div>
              <p className="mt-1 text-xs leading-relaxed text-ink-500">
                {earnedPoints} earned from {profile.total_xp.toLocaleString()} lifetime XP ·{" "}
                {spentPoints} spent or reserved
              </p>
            </div>
          </div>
          <div className="mt-5">
            <div className="mb-1.5 flex justify-between gap-3 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-400">
              <span>Progress to your next Dev Point</span>
              <span>{xpTowardNextPoint}/{XP_PER_DEV_POINT} XP</span>
            </div>
            <div
              className="h-2 overflow-hidden rounded-full bg-sand-200"
              role="progressbar"
              aria-label="XP progress toward next Dev Point"
              aria-valuemin={0}
              aria-valuemax={XP_PER_DEV_POINT}
              aria-valuenow={xpTowardNextPoint}
            >
              <div
                className="h-full rounded-full bg-primary transition-[width]"
                style={{
                  width: `${(xpTowardNextPoint / XP_PER_DEV_POINT) * 100}%`,
                }}
              />
            </div>
            <p className="mt-2 text-xs text-ink-500">
              Earn 1 Dev Point for every {XP_PER_DEV_POINT} XP approved by your instructor.
            </p>
          </div>
        </Card>

        <Card className="flex items-start gap-3 p-5 sm:p-6">
          <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-md bg-primary-tint text-primary">
            <Sparkles className="size-5" aria-hidden />
          </span>
          <div>
            <h2 className="font-display text-base font-semibold text-ink-900">
              Points are progress, not a shortcut
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-ink-500">
              Redeeming points requests extra guidance or resources. You still earn XP by doing
              and explaining the work, and your XP and level never go down when you redeem.
            </p>
          </div>
        </Card>
      </section>

      <section className="mt-10">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <div className="eyebrow">Spend points on your next step</div>
            <h2 className="mt-1 font-display text-lg font-semibold text-ink-900">
              Learning rewards
            </h2>
          </div>
          <Gift className="size-5 text-primary" aria-hidden />
        </div>
        {rewardsResult.data.length === 0 ? (
          <Card className="p-6 text-sm text-ink-500">
            No rewards are available right now. Check back later.
          </Card>
        ) : (
          <DevShopView
            rewards={rewardsResult.data}
            redemptions={redemptionsResult.data}
            availablePoints={availablePoints}
          />
        )}
      </section>
    </div>
  );
}
