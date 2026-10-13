"use client";

import * as React from "react";
import { Lightbulb } from "lucide-react";
import { Card, Panel } from "@/components/ui/card";
import { FilterChips } from "@/components/ui/filter-bar";
import { InsightEmptyState, InsightGrid } from "./insight-card";
import { PageContainer, PageSection } from "@/components/shared/page-container";
import { PageHeader, SectionHeading } from "@/components/shared/section-heading";
import { StatCard } from "@/components/shared/stat-card";
import { services } from "@/lib/services";

type ToneFilter = "all" | "positive" | "watch" | "info";

export function InsightsView() {
  const [tone, setTone] = React.useState<ToneFilter>("all");
  const insights = services.insights.list();
  const visible = insights.filter((insight) => tone === "all" || insight.tone === tone);

  const strengths = insights.filter((insight) => insight.tone === "positive").length;
  const watches = insights.filter((insight) => insight.tone === "watch").length;
  const signals = insights.filter((insight) => insight.tone === "info").length;

  return (
    <PageContainer size="wide">
      <PageHeader
        eyebrow="Insights"
        title="Patterns, not verdicts"
        description="Each card describes something visible in the data and suggests what to do next. None of them are about a developer's worth."
      />

      <PageSection className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Strengths" value={strengths} tone="support" />
        <StatCard label="Watch items" value={watches} tone="gold" />
        <StatCard label="Signals" value={signals} />
      </PageSection>

      <PageSection>
        <Card className="p-4">
          <FilterChips
            label="Filter insights"
            value={tone}
            onChange={setTone}
            size="sm"
            options={[
              { value: "all" as const, label: "All", count: insights.length },
              { value: "positive" as const, label: "Strengths", count: strengths },
              { value: "watch" as const, label: "Watch", count: watches },
              { value: "info" as const, label: "Signals", count: signals },
            ]}
          />
        </Card>

        <div className="mt-4">
          {visible.length === 0 ? (
            <InsightEmptyState />
          ) : (
            <InsightGrid insights={visible} />
          )}
        </div>
      </PageSection>

      <PageSection>
        <Panel className="p-6 sm:p-8">
          <div className="flex items-center gap-2.5">
            <Lightbulb className="size-4 text-secondary" aria-hidden />
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-secondary-soft">
              How to read these
            </span>
          </div>
          <div className="mt-4 grid gap-6 lg:grid-cols-3">
            <div>
              <h2 className="font-display text-sm font-semibold tracking-tight text-sand-50">
                They are observations
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-sand-300/85">
                An insight describes a pattern in the data — four developers stuck on the same
                boundary, one developer quiet for a week. It does not grade anybody.
              </p>
            </div>
            <div>
              <h2 className="font-display text-sm font-semibold tracking-tight text-sand-50">
                They are actionable
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-sand-300/85">
                Every card has a next move attached: run a session, talk to somebody, schedule a
                topic. If there is nothing to do, it should not have been raised.
              </p>
            </div>
            <div>
              <h2 className="font-display text-sm font-semibold tracking-tight text-sand-50">
                They are temporary
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-sand-300/85">
                Quiet for a week is a signal, not a verdict. Once somebody ships again, the insight
                has done its job and should disappear.
              </p>
            </div>
          </div>
        </Panel>
      </PageSection>

      <PageSection>
        <SectionHeading
          eyebrow="Next cycle"
          title="What would make these more useful"
          description="Phase 2 replaces the seeded observations with real aggregates: time-to-first-mission, repeat blockers, and teaching demand per pathway."
        />
      </PageSection>
    </PageContainer>
  );
}