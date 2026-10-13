"use client";

import Link from "next/link";
import * as React from "react";
import {
  ArrowRight,
  BadgeCheck,
  ClipboardCheck,
  Compass,
  GraduationCap,
  KeyRound,
  LifeBuoy,
  Lightbulb,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, Panel } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { ReviewQueueItem } from "./review-queue-item";
import { InsightCard } from "./insight-card";
import { StatCard } from "@/components/shared/stat-card";
import { ActivityFeed } from "@/components/shared/activity-feed";
import { EmptyState } from "@/components/shared/empty-state";
import { PageContainer, PageSection } from "@/components/shared/page-container";
import { PageHeader, SectionHeading } from "@/components/shared/section-heading";
import { TeachingProposalCard } from "@/components/dev/teaching-proposal-card";
import { formatXp, relativeTime } from "@/lib/format";
import { NOW_MS, services } from "@/lib/services";
import { useDevArena } from "@/hooks/dev-arena-provider";

export function InstructorDashboard() {
  const { submissions, helpRequests, hubActivity } = useDevArena();

  const queue = submissions
    .filter((submission) => submission.status === "pending")
    .sort(
      (a, b) =>
        new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime(),
    );
  const teaching = services.teaching
    .proposals()
    .filter((proposal) => proposal.status === "open" || proposal.status === "shortlisted")
    .slice(0, 3);
  const opportunities = services.opportunities
    .list()
    .filter((opportunity) => opportunity.verification !== "verified")
    .slice(0, 4);
  const flagged = helpRequests.filter((request) => request.flagged);
  const insights = services.insights.list();
  const approaching = insights.filter((insight) => insight.kind === "ready-for-unlock");

  const attention = {
    submissions: queue.length,
    teaching: services.teaching
      .proposals()
      .filter((proposal) => proposal.status === "open" || proposal.status === "shortlisted").length,
    opportunities: opportunities.length,
    help: flagged.length,
    titles: approaching.length,
  };
  const total =
    attention.submissions +
    attention.teaching +
    attention.opportunities +
    attention.help +
    attention.titles;

  const xpPending = queue.reduce((sum, submission) => sum + submission.suggestedXp, 0);

  return (
    <PageContainer size="wide">
      <PageHeader
        eyebrow="Instructor"
        title="Dashboard"
        description="Everything below is waiting on a decision from you. Nothing here is a report."
        actions={
          <Link
            href="/instructor/review-queue"
            className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 font-mono text-[11px] uppercase tracking-[0.14em] text-sand-50 transition-colors hover:bg-primary-strong"
          >
            <ClipboardCheck className="size-4" aria-hidden />
            Open review queue
          </Link>
        }
      />

      <PageSection className="mt-6">
        <Panel className="isolate p-6 sm:p-8">
          <div className="arena-grid pointer-events-none absolute inset-0 -z-10 opacity-60" aria-hidden />
          <div
            className="pointer-events-none absolute -right-20 -top-24 -z-10 size-72 rounded-full bg-primary/35 blur-3xl"
            aria-hidden
          />

          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="eyebrow text-secondary-soft">Needs your attention</div>
              <p className="mt-2 font-display text-4xl font-bold uppercase tracking-tight text-sand-50 sm:text-5xl">
                {total} items
              </p>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-sand-300/85">
                {queue.length > 0
                  ? `${formatXp(xpPending)} XP is waiting on review across ${queue.length} submissions.`
                  : "Nothing is waiting on review right now."}
              </p>
            </div>

            <ul className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              {[
                { label: "Review", value: attention.submissions, icon: ClipboardCheck, href: "#review" },
                { label: "Teaching", value: attention.teaching, icon: GraduationCap, href: "#teaching" },
                { label: "Scout", value: attention.opportunities, icon: Compass, href: "#scout" },
                { label: "Help", value: attention.help, icon: LifeBuoy, href: "#help" },
                { label: "Titles", value: attention.titles, icon: KeyRound, href: "#titles" },
              ].map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    className="flex flex-col gap-1 rounded-md border border-ink-700 bg-ink-850 px-3 py-2.5 transition-colors hover:border-secondary/60"
                  >
                    <item.icon className="size-3.5 text-secondary" aria-hidden />
                    <span className="font-display text-xl font-bold tabular-nums text-sand-50">
                      {item.value}
                    </span>
                    <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-ink-300">
                      {item.label}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </Panel>
      </PageSection>

      <PageSection className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-10 lg:col-span-2">
          <section id="review" className="scroll-mt-20">
            <SectionHeading
              eyebrow="Review queue"
              title="Submissions waiting on you"
              description="Oldest first. Approve, adjust the figure, or return it with a note."
              action={
                <Link
                  href="/instructor/review-queue"
                  className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-primary hover:underline"
                >
                  Full queue
                  <ArrowRight className="size-3.5" aria-hidden />
                </Link>
              }
            />
            <div className="mt-4 space-y-4">
              {queue.length === 0 ? (
                <EmptyState
                  icon={ClipboardCheck}
                  eyebrow="Clear"
                  title="Nothing to review"
                  body="Every submission has been decided. New work appears here the moment a developer submits."
                />
              ) : (
                queue.slice(0, 3).map((submission) => (
                  <ReviewQueueItem key={submission.id} submission={submission} />
                ))
              )}
            </div>
          </section>

          <section id="teaching" className="scroll-mt-20">
            <SectionHeading
              eyebrow="Teaching"
              title="Proposals with demand behind them"
              description="Interest is measured by votes. Scheduling one converts demand into a session."
              action={
                <Link
                  href="/instructor/challenges"
                  className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.12em] text-primary hover:underline"
                >
                  Mission catalogue
                  <ArrowRight className="size-3.5" aria-hidden />
                </Link>
              }
            />
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {teaching.map((proposal) => (
                <TeachingProposalCard key={proposal.id} proposal={proposal} compact />
              ))}
            </div>
          </section>

          <section id="scout" className="scroll-mt-20">
            <SectionHeading
              eyebrow="Scout"
              title="Listings that need verification"
              description="Check each one at the employer's own source before it reaches the board."
            />
            <div className="mt-4 space-y-3">
              {opportunities.length === 0 ? (
                <EmptyState
                  icon={BadgeCheck}
                  eyebrow="Clear"
                  title="Every listing is verified"
                  body="Nothing on the board is unverified right now."
                />
              ) : (
                opportunities.map((opportunity) => (
                  <Card key={opportunity.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone={opportunity.verification === "pending" ? "gold" : "neutral"}>
                          {opportunity.verification}
                        </Badge>
                        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-300">
                          {opportunity.type}
                        </span>
                      </div>
                      <p className="mt-1.5 text-sm font-medium text-ink-800">{opportunity.role}</p>
                      <p className="text-xs text-ink-400">
                        {opportunity.organisation} · {opportunity.location} · source: {opportunity.source}
                      </p>
                    </div>
                    <div className="shrink-0 text-left sm:text-right">
                      <div className="font-mono text-xs font-semibold tabular-nums text-primary">
                        {formatXp(opportunity.xpReward)} XP
                      </div>
                      <p className="font-mono text-[9px] uppercase tracking-[0.1em] text-ink-300">
                        closes in{" "}
                        {Math.max(
                          0,
                          Math.round((new Date(opportunity.deadline).getTime() - NOW_MS) / 86400000),
                        )}
                        d
                      </p>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </section>
        </div>

        <aside className="space-y-8">
          <section id="help" className="scroll-mt-20">
            <SectionHeading eyebrow="Help" title="Flagged activity" />
            <div className="mt-4 space-y-3">
              {flagged.length === 0 ? (
                <Card className="p-4">
                  <p className="text-sm leading-relaxed text-ink-400">
                    No flagged threads. Anything with a leaked key or a customer identifier lands
                    here.
                  </p>
                </Card>
              ) : (
                flagged.map((request) => (
                  <Card key={request.id} className="border-primary-line p-4">
                    <div className="flex items-center gap-2">
                      <Badge tone="primary">{request.developerName}</Badge>
                      <time
                        dateTime={request.createdAt}
                        className="font-mono text-[9px] uppercase tracking-[0.1em] text-ink-300"
                      >
                        {relativeTime(request.createdAt, NOW_MS)}
                      </time>
                    </div>
                    <p className="mt-2 text-sm font-medium text-ink-800">{request.title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-ink-500">{request.flagReason}</p>
                    <Link
                      href={`/help/${request.id}`}
                      className="mt-3 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-primary hover:underline"
                    >
                      Open thread
                      <ArrowRight className="size-3" aria-hidden />
                    </Link>
                  </Card>
                ))
              )}
            </div>
          </section>

          <section id="titles" className="scroll-mt-20">
            <SectionHeading
              eyebrow="Titles"
              title="Approaching an important title"
              action={
                <Link
                  href="/instructor/unlocks"
                  className="font-mono text-[10px] uppercase tracking-[0.12em] text-primary hover:underline"
                >
                  Manage
                </Link>
              }
            />
            <div className="mt-4 space-y-3">
              {approaching.length === 0 ? (
                <Card className="p-4">
                  <p className="text-sm leading-relaxed text-ink-400">
                    Nobody is one mission away from a title that needs your confirmation.
                  </p>
                </Card>
              ) : (
                approaching.map((insight) => {
                  const developer = services.developers.byId(insight.developerIds[0]);
                  return (
                    <Card key={insight.id} className="p-4">
                      <div className="flex items-center gap-2.5">
                        <Avatar
                          initials={developer?.initials ?? "??"}
                          size="sm"
                          from={developer?.avatarFrom}
                          to={developer?.avatarTo}
                        />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-ink-800">
                            {developer?.name}
                          </p>
                          <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-ink-300">
                            {insight.metric}
                          </p>
                        </div>
                      </div>
                      <p className="mt-2.5 text-xs leading-relaxed text-ink-500">{insight.body}</p>
                    </Card>
                  );
                })
              )}
            </div>
          </section>

          <section id="insights" className="scroll-mt-20">
            <SectionHeading
              eyebrow="Insights"
              title="Patterns worth a conversation"
              action={
                <Link
                  href="/instructor/insights"
                  className="font-mono text-[10px] uppercase tracking-[0.12em] text-primary hover:underline"
                >
                  All
                </Link>
              }
            />
            <div className="mt-4 space-y-3">
              {insights.slice(0, 2).map((insight) => (
                <InsightCard key={insight.id} insight={insight} compact />
              ))}
            </div>
          </section>

          <section>
            <SectionHeading eyebrow="Hub activity" title="What just happened" />
            <Card className="mt-4 p-4">
              <ActivityFeed events={hubActivity} limit={6} dense />
            </Card>
          </section>
        </aside>
      </PageSection>

      <PageSection>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Pending submissions"
            value={queue.length}
            hint={`${formatXp(xpPending)} XP unreviewed`}
            icon={ClipboardCheck}
            tone="primary"
          />
          <StatCard
            label="Verified listings"
            value={`${services.opportunities.list().length - opportunities.length}/${services.opportunities.list().length}`}
            icon={Compass}
            tone="support"
          />
          <StatCard
            label="Open proposals"
            value={attention.teaching}
            icon={GraduationCap}
            tone="gold"
          />
          <StatCard
            label="Insights raised"
            value={insights.length}
            icon={Lightbulb}
            hint="Observations, not verdicts"
          />
        </div>
      </PageSection>
    </PageContainer>
  );
}