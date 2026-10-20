import type { Metadata } from "next";
import { Store } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/section-heading";
import { DevShopRequestReview } from "@/components/instructor/dev-shop-request-review";
import { DevShopRewardManager } from "@/components/instructor/dev-shop-reward-manager";
import { FilterLinks } from "@/components/shared/filter-links";
import { createClient } from "@/lib/supabase/server";
import { requireInstructor } from "@/lib/arena/session";

export const metadata: Metadata = {
  title: "Dev Shop Requests",
  description: "Review and fulfill developer learning reward requests.",
};

const REQUEST_FILTERS = ["all", "requested", "approved", "fulfilled", "declined"] as const;

export default async function InstructorDevShopPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireInstructor();
  const params = await searchParams;
  const supabase = await createClient();
  const [redemptionsResult, rewardsResult] = await Promise.all([
    supabase
      .from("dev_shop_redemptions")
      .select(
        "id, developer_id, reward_name, points_cost, request_note, status, instructor_note, created_at, updated_at",
      )
      .order("created_at", { ascending: false })
      .limit(200),
    supabase
      .from("dev_shop_rewards")
      .select("id, name, category, description, details, points_cost, active, sort_order")
      .order("sort_order"),
  ]);

  if (redemptionsResult.error) {
    throw new Error(`Could not load Dev Shop requests: ${redemptionsResult.error.message}`);
  }
  if (rewardsResult.error) {
    throw new Error(`Could not load Dev Shop rewards: ${rewardsResult.error.message}`);
  }
  const redemptions = redemptionsResult.data;

  const filter = Array.isArray(params.status) ? params.status[0] : params.status ?? "all";
  const visible = redemptions.filter(
    (redemption) => filter === "all" || redemption.status === filter,
  );

  const filterOptions = REQUEST_FILTERS.map((value) => ({
    value,
    label:
      value === "all"
        ? "All"
        : value === "requested"
          ? "Awaiting review"
          : value === "approved"
            ? "Approved"
            : value === "fulfilled"
              ? "Fulfilled"
              : "Declined",
    count:
      value === "all"
        ? redemptions.length
        : redemptions.filter((redemption) => redemption.status === value).length,
  }));

  const developerIds = [...new Set(redemptions.map((redemption) => redemption.developer_id))];
  const { data: profiles, error: profilesError } = developerIds.length
    ? await supabase
        .from("profiles")
        .select("id, full_name, handle")
        .in("id", developerIds)
    : { data: [], error: null };

  if (profilesError) {
    throw new Error(`Could not load developer details for shop requests: ${profilesError.message}`);
  }
  const profilesById = new Map(profiles.map((profile) => [profile.id, profile]));

  return (
    <div className="px-4 py-8 sm:px-6">
      <PageHeader
        eyebrow="Instructor workspace"
        title="Dev Shop requests"
        description="Manage rewards and their point prices, then review requests, coordinate sessions or resources, and mark them fulfilled. Declining a request returns its Dev Points to the developer."
      />

      <DevShopRewardManager rewards={rewardsResult.data} />

      <section className="mt-8">
        <div className="flex flex-col gap-3 rounded-lg border border-sand-300 bg-sand-50 p-4 shadow-subtle lg:flex-row lg:items-center lg:justify-between">
          <h2 className="font-display text-lg font-semibold text-ink-900">Recent requests</h2>
          <FilterLinks
            options={filterOptions}
            basePath="/instructor/dev-shop"
            params={params}
            paramName="status"
            label="Filter requests by status"
            size="sm"
          />
        </div>
        {visible.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              icon={Store}
              eyebrow="Dev Shop"
              title={redemptions.length === 0 ? "No requests yet" : "Nothing with that status"}
              body={
                redemptions.length === 0
                  ? "Developer reward requests will appear here."
                  : "Pick a different status to see the rest of the requests."
              }
            />
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {visible.map((redemption) => {
              const developer = profilesById.get(redemption.developer_id);
              return (
                <DevShopRequestReview
                  key={redemption.id}
                  redemption={redemption}
                  developerName={developer?.full_name ?? "Developer"}
                  developerHandle={developer?.handle ?? ""}
                />
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
