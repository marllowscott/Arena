import type { Metadata } from "next";
import { Compass } from "lucide-react";
import { PageHeader } from "@/components/shared/section-heading";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { OpportunityStatusBadge } from "@/components/arena/status-badge";
import { OpportunityForm } from "@/components/arena/opportunity-form";
import { FilterLinks } from "@/components/shared/filter-links";
import { SearchField } from "@/components/shared/search-field";
import { relativeTime } from "@/lib/format";
import { nowMs } from "@/lib/arena/clock";
import { listOpportunities } from "@/lib/arena/data";
import { requireDeveloper } from "@/lib/arena/session";

export const metadata: Metadata = {
  title: "Opportunities",
  description: "Find jobs, hackathons and programmes — or submit one for verification.",
};

export default async function OpportunitiesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requireDeveloper();
  const profile = session.profile!;
  const params = await searchParams;

  const opportunities = await listOpportunities();

  /* The board shows verified opportunities. Your own submissions show
     their verification state so you can see what the instructor did. */
  const board = opportunities.filter(
    (opportunity) =>
      opportunity.review_status === "approved" ||
      opportunity.submitted_by === null,
  );
  const mine = opportunities.filter(
    (opportunity) => opportunity.submitted_by === profile.id,
  );

  const query = (Array.isArray(params.q) ? params.q[0] : params.q ?? "").trim().toLowerCase();
  const type = Array.isArray(params.type) ? params.type[0] : params.type ?? "all";

  const types = [...new Set(board.map((opportunity) => opportunity.type))].sort();

  const visible = board.filter((opportunity) => {
    if (type !== "all" && opportunity.type !== type) return false;
    if (!query) return true;
    return `${opportunity.role} ${opportunity.organisation} ${opportunity.summary ?? ""}`
      .toLowerCase()
      .includes(query);
  });

  const typeOptions = [
    { value: "all", label: "All types", count: board.length },
    ...types.map((value) => ({
      value,
      label: value,
      count: board.filter((opportunity) => opportunity.type === value).length,
    })),
  ];

  return (
    <div className="px-4 py-8 sm:px-6">
      <PageHeader
        eyebrow="Scout"
        title="Opportunities"
        description="Jobs, internships, hackathons, scholarships and programmes. Submit useful ones — the instructor verifies them, and verification pays XP."
        className="text-ink-950"
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="flex flex-col gap-3 rounded-lg border border-sand-300 bg-sand-50 p-4 shadow-subtle lg:flex-row lg:items-center lg:justify-between">
            <FilterLinks
              options={typeOptions}
              basePath="/opportunities"
              params={params}
              paramName="type"
              label="Filter opportunities by type"
              size="sm"
            />
            <SearchField
              name="q"
              defaultValue={query}
              placeholder="Search role or organisation"
              basePath="/opportunities"
              params={params}
              label="Search opportunities"
            />
          </div>

          <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-300">
            {visible.length} of {board.length} listings
          </p>

          {visible.length === 0 ? (
            <EmptyState
              icon={Compass}
              eyebrow="Board"
              title={board.length === 0 ? "Nothing verified yet" : "Nothing matches that filter"}
              body={
                board.length === 0
                  ? "Verified opportunities appear here. Submit one below and the instructor will check it."
                  : "Clear the search or pick a different type."
              }
            />
          ) : (
            <ul className="mt-4 space-y-3">
              {visible.map((opportunity) => (
                <li
                  key={opportunity.id}
                  className="rounded-lg border border-sand-300 bg-sand-50 p-4 shadow-subtle"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone="neutral">{opportunity.type}</Badge>
                    {opportunity.location ? (
                      <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-300">
                        {opportunity.location}
                      </span>
                    ) : null}
                    {opportunity.closes_at ? (
                      <time
                        dateTime={opportunity.closes_at}
                        className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-300"
                      >
                        Closes {new Date(opportunity.closes_at).toLocaleDateString()}
                      </time>
                    ) : null}
                    {opportunity.verification === "verified" ? (
                      <Badge tone="support" size="sm">
                        Verified
                      </Badge>
                    ) : null}
                  </div>
                  <h2 className="mt-2 font-display text-base font-semibold tracking-tight text-ink-900">
                    {opportunity.role}
                  </h2>
                  <p className="text-sm text-ink-500">{opportunity.organisation}</p>
                  {opportunity.summary ? (
                    <p className="mt-1.5 text-sm leading-relaxed text-ink-500">
                      {opportunity.summary}
                    </p>
                  ) : null}
                  {opportunity.apply_url ? (
                    <a
                      href={opportunity.apply_url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-block font-mono text-[10px] uppercase tracking-[0.14em] text-primary hover:underline"
                    >
                      Apply or view →
                    </a>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-6">
          <section className="rounded-lg border border-sand-300 bg-sand-50 p-5 shadow-subtle">
            <h2 className="font-display text-base font-semibold tracking-tight text-ink-900">
              Submit an opportunity
            </h2>
            <div className="mt-4">
              <OpportunityForm />
            </div>
          </section>

          <section>
            <h2 className="font-display text-base font-semibold tracking-tight text-ink-900">
              Your submissions
            </h2>
            {mine.length === 0 ? (
              <p className="mt-2 text-sm text-ink-400">
                Opportunities you submit appear here with their verification state.
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {mine.map((opportunity) => (
                  <li
                    key={opportunity.id}
                    className="rounded-md border border-sand-300 bg-sand-50 px-3 py-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-medium text-ink-800">
                        {opportunity.role}
                      </span>
                      <OpportunityStatusBadge reviewStatus={opportunity.review_status} />
                    </div>
                    <div className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-300">
                      {opportunity.organisation} ·{" "}
                      {relativeTime(opportunity.created_at, nowMs())}
                    </div>
                    {opportunity.review_note ? (
                      <p className="mt-1.5 text-xs text-ink-500">
                        {opportunity.review_note}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
