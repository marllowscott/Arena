import Link from "next/link";
import {
  Award,
  BadgeCheck,
  Compass,
  Hammer,
  KeyRound,
  LifeBuoy,
  Lock,
  Presentation,
  Rocket,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, Panel } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { PathwayCard } from "@/components/shared/pathway-card";
import { PathwayIcon } from "@/components/shared/pathway-icon";
import { EmptyState } from "@/components/shared/empty-state";
import { PageContainer, PageSection } from "@/components/shared/page-container";
import { SectionHeading } from "@/components/shared/section-heading";
import { StatCard } from "@/components/shared/stat-card";
import { XPChip } from "@/components/shared/xp-progress-bar";
import { formatLongDate, formatXp, relativeTime } from "@/lib/format";
import { nowMs } from "@/lib/arena/clock";
import type { AchievementRow, DeveloperUnlockRow, UnlockRow } from "@/lib/arena/progression";
import type { ProfileRow, SubmissionRow } from "@/lib/arena/data";
import type { Pathway, PathwayProgress } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ProfilePhotoUpload } from "@/components/shared/profile-photo-upload";

const UNLOCK_ICON: Record<string, typeof Presentation> = {
  teaching: Presentation,
  reviews: BadgeCheck,
  scout: Compass,
  mentoring: LifeBuoy,
  arena: Hammer,
};

export interface ProfileViewProps {
  profile: ProfileRow;
  pathways: Pathway[];
  progress: PathwayProgress[];
  unlocks: UnlockRow[];
  earned: DeveloperUnlockRow[];
  achievements: AchievementRow[];
  xpEvents: Array<{
    id: string;
    xp: number;
    label: string;
    detail: string;
    source: string;
    pathwayId: string;
    createdAt: string;
  }>;
  submissions: SubmissionRow[];
  counts: {
    completed: number;
    pending: number;
    helped: number;
    topicsProposed: number;
    scoutXp: number;
  };
  avatarUrl?: string;
}

export function ProfileView({
  profile,
  pathways,
  progress,
  unlocks,
  earned,
  achievements,
  xpEvents,
  submissions,
  counts,
  avatarUrl,
}: ProfileViewProps) {
  const initials =
    profile.full_name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || profile.handle.slice(0, 2).toUpperCase();

  const primaryProgress =
    progress.find((item) => item.pathwayId === profile.primary_pathway) ?? progress[0];
  const primaryPathway =
    pathways.find((pathway) => pathway.id === profile.primary_pathway) ?? pathways[0];

  const earnedIds = new Set(earned.map((entry) => entry.unlock_id));
  const locked = unlocks.filter((unlock) => !earnedIds.has(unlock.id));

  const completed = submissions.filter(
    (submission) => submission.status === "approved" || submission.status === "adjusted",
  );
  const pending = submissions.filter((submission) => submission.status === "pending");

  return (
    <PageContainer size="wide">
      <Panel className="isolate">
        <div className="arena-grid pointer-events-none absolute inset-0 -z-10 opacity-70" aria-hidden />
        <div
          className="pointer-events-none absolute -right-24 -top-28 -z-10 size-80 rounded-full bg-primary/30 blur-3xl"
          aria-hidden
        />

        <div className="flex flex-col gap-6 p-6 sm:p-8 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-5">
            <div className="relative">
              <Avatar
                initials={initials}
                name={profile.full_name}
                from={profile.avatar_from}
                to={profile.avatar_to}
                size="xl"
                ring
                className="shadow-raised"
                src={avatarUrl}
              />
              <div className="mt-3">
                <ProfilePhotoUpload avatarUrl={avatarUrl} />
              </div>
            </div>
            <div>
              <div className="eyebrow text-secondary-soft">Your record</div>
              <h1 className="mt-1.5 font-display text-3xl font-bold tracking-tight text-sand-50">
                {profile.full_name}
              </h1>
              <p className="mt-1.5 max-w-md text-sm leading-relaxed text-sand-300/85">
                {profile.headline || "No headline yet."}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {primaryPathway ? (
                  <Badge tone="dark" size="lg" className="gap-1.5">
                    <PathwayIcon name={primaryPathway.icon} className="size-3.5 text-secondary" />
                    {primaryPathway.name}
                  </Badge>
                ) : null}
                {primaryProgress ? (
                  <Badge tone="dark" size="lg">
                    {primaryProgress.currentTitle.name}
                  </Badge>
                ) : null}
                {earned.map((entry) => {
                  const unlock = unlocks.find((item) => item.id === entry.unlock_id);
                  return (
                    <Badge key={entry.unlock_id} tone="gold" size="lg">
                      {unlock?.title ?? entry.unlock_id}
                    </Badge>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="shrink-0 lg:text-right">
            <div className="eyebrow text-secondary-soft">Total XP</div>
            <div className="font-display text-5xl font-bold tabular-nums text-sand-50">
              {formatXp(profile.total_xp)}
            </div>
            <div className="mt-1 font-mono text-[11px] uppercase tracking-[0.12em] text-sand-400">
              {formatXp(profile.weekly_xp)} XP this week · {profile.streak_days} day streak
            </div>
            {primaryProgress ? (
              <div className="mt-3 w-full lg:w-56">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink-800">
                  <div
                    className="h-full rounded-full bg-secondary"
                    style={{ width: `${Math.round(primaryProgress.progress * 100)}%` }}
                  />
                </div>
                <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-sand-400">
                  {primaryProgress.nextTitle
                    ? `${formatXp(primaryProgress.xpToNextTitle)} XP to ${primaryProgress.nextTitle.name}`
                    : "Top of the ladder"}
                </p>
              </div>
            ) : null}
          </div>
        </div>

        <div className="grid gap-px border-t border-ink-700 bg-ink-700 sm:grid-cols-3">
          <div className="bg-ink-900 px-6 py-4">
            <div className="eyebrow text-secondary-soft">Focus</div>
            <p className="mt-1.5 text-sm text-sand-200">
              {profile.focus || "Not set yet."}
            </p>
          </div>
          <div className="bg-ink-900 px-6 py-4">
            <div className="eyebrow text-secondary-soft">Next title</div>
            <p className="mt-1.5 text-sm text-sand-200">
              {primaryProgress?.nextTitle?.name ?? "Top of ladder"} ·{" "}
              {formatXp(primaryProgress?.xpToNextTitle ?? 0)} XP away
            </p>
          </div>
          <div className="bg-ink-900 px-6 py-4">
            <div className="eyebrow text-secondary-soft">Skills</div>
            <p className="mt-1.5 text-sm text-sand-200">
              {profile.skills.length > 0 ? profile.skills.join(" · ") : "None recorded yet."}
            </p>
          </div>
        </div>
      </Panel>

      <PageSection>
        <SectionHeading
          eyebrow="In review"
          title="Waiting on the instructor"
          description="Approved work pays out immediately. Returned work comes back with a note explaining what to change."
        />

        <div className="mt-4">
          {pending.length === 0 ? (
            <Card className="p-5">
              <p className="text-sm text-ink-400">Nothing waiting on a decision.</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {pending.map((submission) => (
                <Card key={submission.id} className="p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-display text-sm font-semibold tracking-tight text-ink-900">
                        {submission.challenge_title ?? submission.topic_title ?? "Submission"}
                      </h3>
                      <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-300">
                        submitted {relativeTime(submission.submitted_at, nowMs())}
                      </p>
                    </div>
                    <XPChip value={submission.suggested_xp} size="lg" />
                  </div>
                  <p className="mt-3 text-sm leading-relaxed text-ink-500">
                    {submission.explain_it}
                  </p>
                </Card>
              ))}
            </div>
          )}
        </div>
      </PageSection>

      <PageSection>
        <SectionHeading
          eyebrow="XP history"
          title="Every point, and where it came from"
          description="The full log. Nothing here is estimated."
        />

        <Card className="mt-4">
          {xpEvents.length === 0 ? (
            <p className="p-4 text-sm text-ink-400">No XP recorded yet.</p>
          ) : (
            <ul className="divide-y divide-sand-200">
              {xpEvents.map((event) => (
                <li key={event.id} className="flex items-center gap-3 p-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-ink-800">{event.label}</p>
                    <p className="truncate font-mono text-[10px] uppercase tracking-[0.1em] text-ink-300">
                      {event.source} · {relativeTime(event.createdAt, nowMs())}
                    </p>
                  </div>
                  <span className="shrink-0 font-display text-sm font-semibold tabular-nums text-primary">
                    +{formatXp(event.xp)} XP
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </PageSection>

      <PageSection>
        <SectionHeading
          eyebrow="Pathways"
          title="Five ladders, tracked separately"
          description="Titles come from pathway XP. Moving on one never costs you standing on another."
        />
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {progress.map((item, index) => {
            const pathway = pathways.find((row) => row.id === item.pathwayId);
            if (!pathway) return null;
            return (
              <div key={pathway.id} className={cn("animate-fade-up", `stagger-${index + 1}`)}>
                <PathwayCard pathway={pathway} progress={item} />
              </div>
            );
          })}
        </div>
      </PageSection>

      <PageSection>
        <SectionHeading
          eyebrow="Achievements"
          title="The record"
          description="Counts, not badges. Every number here came from work somebody checked."
        />
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard
            label="Problems completed"
            value={counts.completed}
            icon={Rocket}
            tone="primary"
          />
          <StatCard label="Developers helped" value={counts.helped} icon={LifeBuoy} tone="support" />
          <StatCard
            label="Topics proposed"
            value={counts.topicsProposed}
            icon={Presentation}
            tone="gold"
          />
          <StatCard
            label="Opportunity XP"
            value={formatXp(counts.scoutXp)}
            icon={Compass}
            hint="Scout pathway XP earned"
          />
          <StatCard
            label="Unlocks"
            value={`${earned.length}/${unlocks.length}`}
            icon={KeyRound}
            tone="gold"
          />
        </div>

        {achievements.length > 0 ? (
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {achievements.map((achievement) => (
              <Card key={achievement.id} className="flex items-start gap-3 p-4">
                <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-md border border-primary-line bg-primary-tint text-primary">
                  <Sparkles className="size-4" aria-hidden />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="truncate font-display text-sm font-semibold tracking-tight text-ink-900">
                      {achievement.title}
                    </h3>
                    {achievement.xp > 0 ? <XPChip value={achievement.xp} size="sm" /> : null}
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-ink-400">{achievement.detail}</p>
                  <time
                    dateTime={achievement.earned_at}
                    className="mt-2 block font-mono text-[10px] uppercase tracking-[0.1em] text-ink-300"
                  >
                    {relativeTime(achievement.earned_at, nowMs())}
                  </time>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <EmptyState
            className="mt-4"
            icon={Sparkles}
            title="No achievements yet"
            body="Complete a mission and the first entry writes itself."
          />
        )}
      </PageSection>

      <PageSection>
        <SectionHeading
          eyebrow="Unlocks"
          title="Responsibilities you carry"
          description="Unlocks are permissions, not trophies. Each one means people will ask you for this."
        />

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <div className="space-y-3">
            {earned.length > 0 ? (
              earned.map((entry) => {
                const unlock = unlocks.find((item) => item.id === entry.unlock_id);
                if (!unlock) return null;
                const Icon = UNLOCK_ICON[unlock.scope] ?? BadgeCheck;
                return (
                  <Card key={entry.unlock_id} className="border-secondary-line bg-secondary-tint/40 p-5">
                    <div className="flex items-start gap-3">
                      <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-md border border-secondary-line bg-sand-50 text-secondary-muted">
                        <Icon className="size-4" aria-hidden />
                      </span>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-display text-sm font-semibold tracking-tight text-ink-900">
                            {unlock.title}
                          </h3>
                          <Badge tone="gold" size="sm">
                            Earned
                          </Badge>
                        </div>
                        <p className="mt-1 text-xs leading-relaxed text-ink-500">
                          {unlock.description}
                        </p>
                        <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-300">
                          {relativeTime(entry.granted_at, nowMs())}
                        </p>
                      </div>
                    </div>
                  </Card>
                );
              })
            ) : (
              <EmptyState
                icon={KeyRound}
                title="No unlocks yet"
                body="Unlocks arrive when a responsibility is handed to you."
              />
            )}
          </div>

          <Card className="p-5">
            <div className="eyebrow mb-3">Still locked</div>
            <ul className="divide-y divide-sand-200">
              {locked.map((unlock) => (
                <li key={unlock.id} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-2">
                    <Lock className="size-3.5 shrink-0 text-ink-300" aria-hidden />
                    <h3 className="text-sm font-medium text-ink-600">{unlock.title}</h3>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-ink-400">{unlock.description}</p>
                  <ul className="mt-2 space-y-1">
                    {unlock.requirements.map((requirement) => (
                      <li
                        key={requirement}
                        className="flex items-start gap-2 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-300"
                      >
                        <span className="mt-1.5 size-1 shrink-0 rounded-full bg-sand-400" aria-hidden />
                        {requirement}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </PageSection>

      <PageSection>
        <SectionHeading
          eyebrow="Portfolio"
          title="Completed work and the evidence behind it"
          description="This is the page somebody reads when they ask what you can actually do."
        />

        {completed.length === 0 ? (
          <EmptyState
            className="mt-4"
            icon={Award}
            eyebrow="Nothing here yet"
            title="Complete a mission to start your record"
            body="Approved submissions land here with their evidence links, so the work speaks for itself."
            action={
              <Link
                href="/arena"
                className="inline-flex h-10 items-center rounded-md bg-primary px-4 font-mono text-[11px] uppercase tracking-[0.14em] text-sand-50 transition-colors hover:bg-primary-strong"
              >
                Open the Arena
              </Link>
            }
          />
        ) : (
          <div className="mt-4 space-y-4">
            {completed.map((submission) => (
              <Card key={submission.id} className="p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone="outline">
                        {submission.challenge_id ? "Problem" : "Topic presentation"}
                      </Badge>
                      {submission.status === "adjusted" ? (
                        <Badge tone="gold">Adjusted</Badge>
                      ) : null}
                    </div>
                    <h3 className="mt-2 font-display text-base font-semibold tracking-tight text-ink-900">
                      {submission.challenge_title ?? submission.topic_title ?? "Submission"}
                    </h3>
                    <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-ink-500">
                      {submission.solution}
                    </p>
                  </div>
                  <div className="shrink-0 text-left sm:text-right">
                    <XPChip value={submission.awarded_xp ?? submission.suggested_xp} size="lg" />
                    <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-300">
                      {formatLongDate(submission.reviewed_at ?? submission.submitted_at)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid gap-4 border-t border-sand-300 pt-4 lg:grid-cols-3">
                  <div>
                    <div className="eyebrow mb-1.5">Evidence</div>
                    {submission.evidence.length === 0 ? (
                      <p className="text-xs text-ink-400">No links attached.</p>
                    ) : (
                      <ul className="space-y-1">
                        {submission.evidence.map((item) => (
                          <li key={item} className="truncate text-xs text-ink-500">
                            {item}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div>
                    <div className="eyebrow mb-1.5">How it works</div>
                    <p className="text-xs leading-relaxed text-ink-500">{submission.explain_it}</p>
                  </div>
                  <div>
                    <div className="eyebrow mb-1.5">What broke</div>
                    <p className="text-xs leading-relaxed text-ink-500">
                      {submission.what_broke || "Not applicable."}
                    </p>
                  </div>
                </div>

                {submission.reviewer_note ? (
                  <p className="mt-4 rounded-md border border-sand-300 bg-sand-100/70 px-3 py-2.5 text-xs leading-relaxed text-ink-500">
                    <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-ink-300">
                      Review note ·{" "}
                    </span>
                    {submission.reviewer_note}
                  </p>
                ) : null}
              </Card>
            ))}
          </div>
        )}
      </PageSection>
    </PageContainer>
  );
}
