import type { Metadata } from "next";
import { Compass } from "lucide-react";
import { PageHeader } from "@/components/shared/section-heading";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { OpportunityVerification } from "@/components/instructor/opportunity-verification";
import {
  listOpportunities,
  pendingOpportunities,
} from "@/lib/arena/data";
import { requireInstructor } from "@/lib/arena/session";

export const metadata: Metadata = {
  title: "Opportunities",
  description: "Verify developer-submitted opportunities.",
};

export default async function InstructorOpportunitiesPage() {
  await requireInstructor();
  const [pending, all] = await Promise.all([
    pendingOpportunities(),
    listOpportunities(),
  ]);

  /* Submissions by developers, newest first. Curated rows (no author)
     are reference data and never need verification. */
  const decided = all
    .filter(
      (opportunity) =>
        opportunity.submitted_by !== null &&
        opportunity.review_status !== "pending",
    )
    .slice(0, 20);

  return (
    <div className="px-4 py-8 sm:px-6">
      <PageHeader
        eyebrow="Verification authority"
        title="Opportunities"
        description="Developers submit jobs, hackathons, scholarships and programmes. You verify the listing is real and open — verification is what awards the Scout XP."
      />

      <section className="mt-8">
        <h2 className="font-display text-lg font-semibold tracking-tight text-ink-900">
          Awaiting verification
        </h2>
        {pending.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              icon={Compass}
              eyebrow="Verification"
              title="Nothing to verify"
              body="When a developer submits an opportunity, it lands here with a link you can check."
            />
          </div>
        ) : (
          <ul className="mt-4 space-y-4">
            {pending.map((opportunity) => (
              <OpportunityVerification key={opportunity.id} opportunity={opportunity} />
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <h2 className="font-display text-lg font-semibold tracking-tight text-ink-900">
          Recent decisions
        </h2>
        {decided.length === 0 ? (
          <p className="mt-3 text-sm text-ink-400">
            Verified and rejected submissions will appear here.
          </p>
        ) : (
          <ul className="mt-4 space-y-2">
            {decided.map((opportunity) => (
              <OpportunityVerification
                key={opportunity.id}
                opportunity={opportunity}
                allowReview={false}
              />
            ))}
          </ul>
        )}
      </section>

      <p className="mt-6 text-xs leading-relaxed text-ink-400">
        <Badge tone="outline">Note</Badge>{" "}
        Approved listings appear on the developer board and pay the XP you
        set at verification time.
      </p>
    </div>
  );
}
