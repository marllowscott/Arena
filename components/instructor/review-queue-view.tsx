"use client";

import * as React from "react";
import { ClipboardCheck, Inbox } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/shared/stat-card";
import { ReviewQueueItem } from "./review-queue-item";
import { EmptyState } from "@/components/shared/empty-state";
import { PageContainer, PageSection } from "@/components/shared/page-container";
import { PageHeader, SectionHeading } from "@/components/shared/section-heading";
import { DIFFICULTY_META, formatXp } from "@/lib/format";
import { services } from "@/lib/services";
import { useDevArena } from "@/hooks/dev-arena-provider";

export function ReviewQueueView() {
  const { submissions } = useDevArena();

  const pending = submissions
    .filter((submission) => submission.status === "pending")
    .sort((a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime());
  const decided = submissions.filter((submission) => submission.status !== "pending");
  const xpPending = pending.reduce((sum, submission) => sum + submission.suggestedXp, 0);

  const byDifficulty = ["advanced", "expert", "boss", "builder", "starter"] as const;
  const heaviest = byDifficulty
    .map((difficulty) => ({
      difficulty,
      submissions: pending.filter(
        (submission) => services.challenges.byId(submission.challengeId)?.difficulty === difficulty,
      ),
    }))
    .filter((row) => row.submissions.length > 0);

  return (
    <PageContainer size="wide">
      <PageHeader
        eyebrow="Review queue"
        title="Submissions"
        description="Oldest first. Every decision carries a note, because the note is the only feedback the developer gets."
      />

      <PageSection className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Waiting" value={pending.length} icon={ClipboardCheck} tone="primary" />
        <StatCard label="XP unreviewed" value={formatXp(xpPending)} hint="Suggested, not yet awarded" tone="gold" />
        <StatCard label="Decided" value={decided.length} icon={Inbox} hint="This session" tone="support" />
      </PageSection>

      {heaviest.length > 0 ? (
        <PageSection>
          <Card>
            <SectionHeading eyebrow="Queue shape" title="Where the work is" />
            <ul className="mt-4 space-y-2">
              {heaviest.map((row) => (
                <li key={row.difficulty} className="flex items-center justify-between gap-3">
                  <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-400">
                    {DIFFICULTY_META[row.difficulty].label}
                  </span>
                  <div className="flex flex-1 items-center gap-3">
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-sand-300">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${(row.submissions.length / Math.max(1, pending.length)) * 100}%` }}
                      />
                    </div>
                    <span className="w-8 shrink-0 text-right font-mono text-xs tabular-nums text-ink-600">
                      {row.submissions.length}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </PageSection>
      ) : null}

      <PageSection>
        <SectionHeading
          eyebrow="Waiting"
          title={`${pending.length} submission${pending.length === 1 ? "" : "s"} in the queue`}
        />
        <div className="mt-4 space-y-4">
          {pending.length === 0 ? (
            <EmptyState
              icon={ClipboardCheck}
              eyebrow="Clear"
              title="The queue is empty"
              body="Nothing is waiting. Approved work pays XP to the developer immediately, so there is no follow-up step."
            />
          ) : (
            pending.map((submission, index) => (
              <div key={submission.id} className={`animate-fade-up stagger-${Math.min(index + 1, 5)}`}>
                <ReviewQueueItem submission={submission} />
              </div>
            ))
          )}
        </div>
      </PageSection>

      {decided.length > 0 ? (
        <PageSection>
          <SectionHeading
            eyebrow="Decided"
            title="Already reviewed"
            description="Kept here so a decision can be traced without searching."
          />
          <div className="mt-4 space-y-4">
            {decided.map((submission) => {
              const challenge = services.challenges.byId(submission.challengeId);
              const developer = services.developers.byId(submission.developerId);
              return (
                <div key={submission.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-sand-300 bg-sand-50 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm text-ink-700">
                      <span className="font-medium">{developer?.name}</span> · {challenge?.title}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-ink-400">{submission.reviewerNote}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <Badge
                      tone={
                        submission.status === "approved"
                          ? "support"
                          : submission.status === "adjusted"
                            ? "gold"
                            : "primary"
                      }
                    >
                      {submission.status}
                    </Badge>
                    {submission.awardedXp !== null ? (
                      <span className="font-mono text-xs font-semibold tabular-nums text-ink-700">
                        {formatXp(submission.awardedXp)} XP
                      </span>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </PageSection>
      ) : null}
    </PageContainer>
  );
}