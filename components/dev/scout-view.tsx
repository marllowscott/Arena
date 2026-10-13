"use client";

import * as React from "react";
import { BadgeCheck, Compass, Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, Panel } from "@/components/ui/card";
import { FilterChips } from "@/components/ui/filter-bar";
import { Input } from "@/components/ui/input";
import { StatCard } from "@/components/shared/stat-card";
import { OpportunityCard } from "@/components/dev/opportunity-card";
import { EmptyState } from "@/components/shared/empty-state";
import { PageContainer, PageSection } from "@/components/shared/page-container";
import { PageHeader, SectionHeading } from "@/components/shared/section-heading";
import { OPPORTUNITY_PIPELINE } from "@/lib/progression";
import { formatXp } from "@/lib/format";
import { services } from "@/lib/services";
import type { OpportunityType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useDevArena } from "@/hooks/dev-arena-provider";

type TypeFilter = OpportunityType | "all";

export function ScoutView() {
  const { opportunities } = useDevArena();
  const [type, setType] = React.useState<TypeFilter>("all");
  const [query, setQuery] = React.useState("");

  const needle = query.trim().toLowerCase();
  const visible = opportunities.filter((opportunity) => {
    if (type !== "all" && opportunity.type !== type) return false;
    if (!needle) return true;
    return [
      opportunity.organisation,
      opportunity.role,
      opportunity.summary,
      opportunity.location,
      ...opportunity.skills,
      ...opportunity.technologies,
    ]
      .join(" ")
      .toLowerCase()
      .includes(needle);
  });

  const verified = opportunities.filter((opportunity) => opportunity.verification === "verified").length;
  const xpOnTheTable = opportunities.reduce((sum, opportunity) => sum + opportunity.xpReward, 0);
  const shared = opportunities.reduce((sum, opportunity) => sum + opportunity.shares, 0);

  const typeOptions = [
    { value: "all" as const, label: "All" },
    ...Array.from(new Set(opportunities.map((opportunity) => opportunity.type))).map((item) => ({
      value: item,
      label: item,
    })),
  ];

  return (
    <PageContainer size="wide">
      <PageHeader
        eyebrow="Opportunities"
        title="Openings worth your time"
        description="Every listing here is checked at the source before it reaches the board. Researching one properly is worth more than reading ten."
        actions={
          <Badge tone="support">
            <BadgeCheck className="size-3" aria-hidden />
            {verified} verified
          </Badge>
        }
      />

      <PageSection className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Open listings" value={opportunities.length} icon={Compass} />
        <StatCard
          label="XP available"
          value={formatXp(xpOnTheTable)}
          hint="Across the whole board"
          tone="gold"
        />
        <StatCard label="Shared with the hub" value={shared} hint="Times somebody passed one on" tone="support" />
      </PageSection>

      <PageSection>
        <Panel className="p-5 sm:p-6">
          <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="eyebrow text-secondary-soft">The Scout pipeline</div>
              <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-sand-300/85">
                XP follows the work, not the tap. Each stage is worth more than the last, because the
                hard part is explaining it to somebody else.
              </p>
            </div>
          </div>
          <ol className="mt-5 flex flex-wrap items-center gap-x-1.5 gap-y-3">
            {OPPORTUNITY_PIPELINE.map((stage, index) => (
              <li key={stage.id} className="flex items-center gap-1.5">
                <div className="rounded-md border border-ink-700 bg-ink-850 px-3 py-2">
                  <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-secondary">
                    {stage.label}
                  </div>
                  <div className="mt-1 font-display text-sm font-semibold text-sand-100">
                    +{stage.xp} XP
                  </div>
                </div>
                {index < OPPORTUNITY_PIPELINE.length - 1 ? (
                  <span className="text-ink-300" aria-hidden>
                    →
                  </span>
                ) : null}
              </li>
            ))}
          </ol>
        </Panel>
      </PageSection>

      <PageSection>
        <Card className="p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <FilterChips label="Filter by type" options={typeOptions} value={type} onChange={setType} size="sm" />
            <div className="relative w-full lg:w-60">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-300"
                aria-hidden
              />
              <Input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search roles, skills, places"
                aria-label="Search opportunities"
                className="pl-9"
              />
            </div>
          </div>
        </Card>

        <div className="mt-4">
          {visible.length === 0 ? (
            <EmptyState
              icon={Compass}
              eyebrow="Nothing here"
              title="No opportunities match that"
              body="Clear the filters, or check back after the next verification pass."
              action={
                <Button
                  variant="secondary"
                  onClick={() => {
                    setType("all");
                    setQuery("");
                  }}
                >
                  <X className="size-4" aria-hidden />
                  Clear filters
                </Button>
              }
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {visible.map((opportunity, index) => (
                <div
                  key={opportunity.id}
                  className={cn("animate-fade-up", `stagger-${Math.min(index + 1, 5)}`)}
                >
                  <OpportunityCard opportunity={opportunity} />
                </div>
              ))}
            </div>
          )}
        </div>
      </PageSection>

      <PageSection>
        <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <SectionHeading
            eyebrow="Verification"
            title="How a listing earns the badge"
            description="Checked at the employer's own source, not an aggregator. Unverified listings stay visible so you can judge them yourself."
          />
          <div className="shrink-0 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-300">
            {services.pathways.byId("scout")?.promise}
          </div>
        </Card>
      </PageSection>
    </PageContainer>
  );
}