"use client";

import Link from "next/link";
import * as React from "react";
import { ArrowRight, CheckCircle2, Clock, Compass, ListChecks, Lightbulb } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PageContainer, PageSection } from "@/components/shared/page-container";
import { formatXp, relativeTime } from "@/lib/format";
import { XP_PER_LEVEL } from "@/lib/progression";
import { NOW_MS, services } from "@/lib/services";
import { useDevArena } from "@/hooks/dev-arena-provider";
import { cn } from "@/lib/utils";

function greeting() {
  const hour = new Date(NOW_MS).getUTCHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

/**
 * Four blocks, in the order the questions get asked: who am I, how close am I,
 * what should I do, and what have I earned lately. Everything else — pathways,
 * achievements, unlocks, the full XP history — lives on the profile page.
 */
export function DeveloperDashboard() {
  const { current, level, personalActivity, submissions, proposals, helpRequests, opportunities } =
    useDevArena();
  const developer = current.developer;
  const firstName = developer.name.split(" ")[0];

  const openProblems = services.challenges.list().filter((challenge) => challenge.status === "open");

  const pending = submissions.filter(
    (submission) =>
      submission.developerId === developer.id && submission.status === "pending",
  );

  const openQuestions = helpRequests.filter((request) => request.status === "open");
  const needingVerification = opportunities.filter(
    (opportunity) => opportunity.verification !== "verified",
  );

  const nextActions = [
    {
      href: "/arena",
      label: "Solve a Problem",
      detail: `${openProblems.length} open`,
      icon: ListChecks,
      primary: true,
    },
    {
      href: "/topics",
      label: "Present a Topic",
      detail: proposals.some((proposal) => proposal.status === "open")
        ? "Open for votes"
        : `${openQuestions.length} question${openQuestions.length === 1 ? "" : "s"} waiting`,
      icon: Lightbulb,
      primary: false,
    },
    {
      href: "/opportunities",
      label: "Find an Opportunity",
      detail: `${opportunities.length} listed${
        needingVerification.length > 0 ? ` · ${needingVerification.length} to verify` : ""
      }`,
      icon: Compass,
      primary: false,
    },
  ];

  const earned = personalActivity.filter((event) => event.xp !== null).slice(0, 5);

  return (
    <PageContainer>
      {/* Who am I, and how close am I to the next level. */}
      <section className="animate-fade-up">
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink-900 sm:text-3xl">
          {greeting()}, {firstName}
        </h1>

        <Card className="mt-4 p-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="font-display text-lg font-semibold tracking-tight text-ink-900">
                Level {level.level}
              </div>
              <div className="mt-0.5 font-mono text-[11px] uppercase tracking-[0.12em] text-ink-400">
                {formatXp(developer.totalXp)} XP
              </div>
            </div>
            <div className="text-right">
              <div className="font-display text-lg font-semibold tracking-tight text-primary">
                Level {level.level + 1}
              </div>
              <div className="mt-0.5 font-mono text-[11px] uppercase tracking-[0.12em] text-ink-400">
                {formatXp(level.floor)} / {formatXp(level.ceiling)} XP
              </div>
            </div>
          </div>

          <div
            className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-sand-300"
            role="progressbar"
            aria-valuenow={level.level}
            aria-valuemin={level.floor}
            aria-valuemax={level.ceiling}
            aria-label={`Level ${level.level} progress`}
          >
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-500"
              style={{ width: `${Math.round(level.progress * 100)}%` }}
            />
          </div>

          <p className="mt-2.5 text-xs text-ink-400">
            {formatXp(level.xpToNext)} XP to Level {level.level + 1} · {XP_PER_LEVEL} XP per level
          </p>
        </Card>
      </section>

      {/* What can I do next. Three links, one primary. */}
      <PageSection>
        <h2 className="font-display text-base font-semibold tracking-tight text-ink-900">
          Next activities
        </h2>

        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {nextActions.map((action, index) => (
            <Link
              key={action.href}
              href={action.href}
              className={cn(
                "group flex items-center gap-3 rounded-lg border p-4 transition-colors animate-fade-up",
                `stagger-${index + 1}`,
                action.primary
                  ? "border-primary bg-primary text-sand-50 hover:bg-primary/90"
                  : "border-sand-400 bg-sand-50 text-ink-800 hover:border-ink-300",
              )}
            >
              <action.icon
                className={cn("size-5 shrink-0", action.primary ? "text-sand-200" : "text-primary")}
                aria-hidden
              />
              <div className="min-w-0 flex-1">
                <div className="truncate font-display text-sm font-semibold">{action.label}</div>
                <div
                  className={cn(
                    "truncate font-mono text-[10px] uppercase tracking-[0.1em]",
                    action.primary ? "text-sand-300" : "text-ink-400",
                  )}
                >
                  {action.detail}
                </div>
              </div>
              <ArrowRight
                className={cn(
                  "size-4 shrink-0 transition-transform group-hover:translate-x-0.5",
                  action.primary ? "text-sand-300" : "text-ink-300",
                )}
                aria-hidden
              />
            </Link>
          ))}
        </div>
      </PageSection>

      {/* What is waiting on me. */}
      {pending.length > 0 ? (
        <PageSection>
          <h2 className="font-display text-base font-semibold tracking-tight text-ink-900">
            In review
          </h2>
          <Card className="mt-3 divide-y divide-sand-200">
            {pending.map((submission) => {
              const problem = services.challenges.byId(submission.challengeId);
              return (
                <div
                  key={submission.id}
                  className="flex flex-wrap items-center justify-between gap-2 p-4"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    <Clock className="size-4 shrink-0 text-ink-300" aria-hidden />
                    <span className="truncate text-sm text-ink-800">
                      {problem?.title ?? "Problem"}
                    </span>
                  </div>
                  <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-400">
                    submitted {relativeTime(submission.submittedAt, NOW_MS)} ·{" "}
                    {formatXp(submission.suggestedXp)} XP on approval
                  </span>
                </div>
              );
            })}
          </Card>
        </PageSection>
      ) : null}

      {/* What I earned lately. */}
      <PageSection>
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-base font-semibold tracking-tight text-ink-900">
            Recent XP
          </h2>
          <Link
            href="/profile"
            className="font-mono text-[10px] uppercase tracking-[0.12em] text-primary hover:underline"
          >
            Full history
          </Link>
        </div>

        <Card className="mt-3">
          {earned.length === 0 ? (
            <p className="p-4 text-sm text-ink-400">
              Nothing yet. Solve a problem or answer a question to start.
            </p>
          ) : (
            <ul className="divide-y divide-sand-200">
              {earned.map((event) => {
                const author = event.developerId === developer.id ? developer : null;
                return (
                  <li key={event.id} className="flex items-center gap-3 p-4">
                    <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-support-tint text-support-deep">
                      <CheckCircle2 className="size-4" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-ink-800">{event.message}</p>
                      <p className="truncate font-mono text-[10px] uppercase tracking-[0.1em] text-ink-300">
                        {relativeTime(event.createdAt, NOW_MS)}
                        {author ? ` · ${author.handle}` : ""}
                      </p>
                    </div>
                    <span className="shrink-0 font-display text-sm font-semibold tabular-nums text-support-deep">
                      +{formatXp(event.xp ?? 0)} XP
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </PageSection>
    </PageContainer>
  );
}
