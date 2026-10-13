import type { Metadata } from "next";
import { Store } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/section-heading";
import { DevShopRequestReview } from "@/components/instructor/dev-shop-request-review";
import { createClient } from "@/lib/supabase/server";
import { requireInstructor } from "@/lib/arena/session";

export const metadata: Metadata = {
  title: "Dev Shop Requests",
  description: "Review and fulfill developer learning reward requests.",
};

export default async function InstructorDevShopPage() {
  await requireInstructor();
  const supabase = await createClient();
  const { data: redemptions, error } = await supabase
    .from("dev_shop_redemptions")
    .select(
      "id, developer_id, reward_name, points_cost, request_note, status, instructor_note, created_at, updated_at",
    )
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw new Error(`Could not load Dev Shop requests: ${error.message}`);

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
        description="Review reward requests, coordinate sessions or resources, and mark them fulfilled. Declining a request returns its Dev Points to the developer."
      />

      <section className="mt-8">
        <h2 className="font-display text-lg font-semibold text-ink-900">Recent requests</h2>
        {redemptions.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              icon={Store}
              eyebrow="Dev Shop"
              title="No requests yet"
              body="Developer reward requests will appear here."
            />
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {redemptions.map((redemption) => {
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
