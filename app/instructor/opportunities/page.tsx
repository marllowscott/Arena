import type { Metadata } from "next";
import { Compass } from "lucide-react";
import { PageHeader } from "@/components/shared/section-heading";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { OpportunityStatusBadge } from "@/components/arena/status-badge";
import { OpportunityVerification } from "@/components/instructor/opportunity-verification";
import { formatXp, relativeTime } from "@/lib/format";
import { nowMs } from "@/lib/arena/clock";
import { listOpportunities, pendingOpportunities } from "@/lib/arena/data";
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
              <li
                key={opportunity.id}
                className="flex flex-wrap items-center gap-3 rounded-md border border-sand-300 bg-sand-50 px-4 py-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-ink-800">
                    {opportunity.role}
                  </div>
                  <div className="truncate font-mono text-[10px] uppercase tracking-[0.1em] text-ink-300">
                    {opportunity.organisation} · {opportunity.submitter_name ?? "developer"} ·{" "}
                    {relativeTime(opportunity.created_at, nowMs())}
                  </div>
                </div>
                <OpportunityStatusBadge reviewStatus={opportunity.review_status} />
                {opportunity.review_status === "approved" && opportunity.xp_reward > 0 ? (
                  <span className="font-mono text-xs font-semibold tabular-nums text-primary">
                    +{formatXp(opportunity.xp_reward)} XP
                  </span>
                ) : null}
              </li>
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
