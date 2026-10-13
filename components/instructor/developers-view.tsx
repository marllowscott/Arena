"use client";

import * as React from "react";
import { ChevronDown, Search, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { XPProgressBar } from "@/components/ui/progress";
import { PathwayIcon, PATHWAY_ACCENT } from "@/components/shared/pathway-icon";
import { TitleBadge } from "@/components/shared/title-badge";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState } from "@/components/shared/empty-state";
import { PageContainer, PageSection } from "@/components/shared/page-container";
import { PageHeader } from "@/components/shared/section-heading";
import { FilterChips } from "@/components/ui/filter-bar";
import { formatXp, relativeTime } from "@/lib/format";
import { NOW_MS, services } from "@/lib/services";
import { cn } from "@/lib/utils";
import { useDevArena } from "@/hooks/dev-arena-provider";

type SortKey = "totalXp" | "weeklyXp" | "name";

export function DevelopersView() {
  const { submissions, helpRequests } = useDevArena();
  const [query, setQuery] = React.useState("");
  const [sort, setSort] = React.useState<SortKey>("totalXp");
  const [expanded, setExpanded] = React.useState<string | null>(null);

  const needle = query.trim().toLowerCase();
  const developers = services.developers.list().filter((developer) => {
    if (!needle) return true;
    return `${developer.name} ${developer.headline} ${developer.skills.join(" ")}`
      .toLowerCase()
      .includes(needle);
  });

  const ordered = [...developers].sort((a, b) => {
    if (sort === "name") return a.name.localeCompare(b.name);
    return b[sort] - a[sort];
  });

  const totalXp = services.developers.list().reduce((sum, d) => sum + d.totalXp, 0);
  const activeThisWeek = services.developers
    .list()
    .filter((developer) => NOW_MS - new Date(developer.lastActiveAt).getTime() < 7 * 86400000).length;

  return (
    <PageContainer size="wide">
      <PageHeader
        eyebrow="Developers"
        title="The roster"
        description="Where everyone stands, and what they are one mission away from. Progress is shown per pathway so nobody is reduced to a single number."
      />

      <PageSection className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Developers" value={services.developers.list().length} icon={Users} />
        <StatCard label="Active this week" value={activeThisWeek} tone="support" />
        <StatCard label="XP awarded this cycle" value={formatXp(totalXp)} tone="gold" />
      </PageSection>

      <PageSection>
        <Card className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-xs">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-300"
                aria-hidden
              />
              <Input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search developers"
                aria-label="Search developers"
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="eyebrow">Sort</span>
              <FilterChips
                label="Sort developers"
                options={[
                  { value: "totalXp", label: "Overall XP" },
                  { value: "weeklyXp", label: "This week" },
                  { value: "name", label: "Name" },
                ]}
                value={sort}
                onChange={setSort}
                size="sm"
              />
            </div>
          </div>
        </Card>

        <div className="mt-4 space-y-3">
          {ordered.length === 0 ? (
            <EmptyState icon={Users} title="Nobody matches" body="Clear the search to see the whole roster." />
          ) : (
            ordered.map((developer, index) => {
              const progress = services.developers.pathwayProgress(developer.id);
              const pending = submissions.filter(
                (submission) =>
                  submission.developerId === developer.id && submission.status === "pending",
              ).length;
              const approved = submissions.filter(
                (submission) =>
                  submission.developerId === developer.id &&
                  (submission.status === "approved" || submission.status === "adjusted"),
              ).length;
              const helped = helpRequests.filter((request) =>
                request.answers.some((answer) => answer.authorId === developer.id && answer.confirmed),
              ).length;
              const isOpen = expanded === developer.id;

              return (
                <Card
                  key={developer.id}
                  className={cn(
                    "overflow-hidden",
                    index < 6 && `animate-fade-up stagger-${index + 1}`,
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setExpanded(isOpen ? null : developer.id)}
                    aria-expanded={isOpen}
                    className="flex w-full items-start gap-4 p-4 text-left transition-colors hover:bg-sand-100/70"
                  >
                    <Avatar
                      initials={developer.initials}
                      name={developer.name}
                      from={developer.avatarFrom}
                      to={developer.avatarTo}
                      size="md"
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold text-ink-900">{developer.name}</span>
                        <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-300">
                          @{developer.handle}
                        </span>
                        {pending > 0 ? <Badge tone="gold" size="sm">{pending} pending</Badge> : null}
                      </div>
                      <p className="mt-1 line-clamp-1 text-xs text-ink-500">{developer.headline}</p>

                      <div className="mt-3 flex flex-wrap items-center gap-4">
                        {progress.map((item) => {
                          const pathway = services.pathways.byId(item.pathwayId)!;
                          const accent = PATHWAY_ACCENT[pathway.icon];
                          return (
                            <div key={pathway.id} className="min-w-[8rem] flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <span
                                  className={cn(
                                    "inline-flex items-center gap-1 font-mono text-[9px] uppercase tracking-[0.12em]",
                                    accent.text,
                                  )}
                                >
                                  <PathwayIcon name={pathway.icon} className="size-2.5" />
                                  {pathway.shortName}
                                </span>
                                <span className="font-mono text-[9px] tabular-nums text-ink-300">
                                  {formatXp(item.xp)}
                                </span>
                              </div>
                              <XPProgressBar
                                value={item.progress}
                                tone={accent.bar}
                                size="sm"
                                className="mt-1.5"
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <div className="font-display text-lg font-bold tabular-nums text-primary">
                        {formatXp(developer.totalXp)}
                      </div>
                      <div className="font-mono text-[9px] uppercase tracking-[0.1em] text-ink-300">
                        +{formatXp(developer.weeklyXp)} wk
                      </div>
                      <ChevronDown
                        className={cn(
                          "mt-2 ml-auto size-4 text-ink-300 transition-transform",
                          isOpen && "rotate-180",
                        )}
                        aria-hidden
                      />
                    </div>
                  </button>

                  {isOpen ? (
                    <div className="animate-fade-in grid gap-5 border-t border-sand-300 p-5 lg:grid-cols-3">
                      <div>
                        <div className="eyebrow mb-2">Record</div>
                        <dl className="space-y-1.5">
                          {[
                            ["Missions completed", approved],
                            ["Submissions pending", pending],
                            ["Developers helped", helped],
                            ["Streak", `${developer.streakDays}d`],
                            ["Weekly rank", `#${services.leaderboard.snapshot("movement", developer.id).entries.find((entry) => entry.developerId === developer.id)?.rank ?? "—"}`],
                          ].map(([label, value]) => (
                            <div key={String(label)} className="flex items-center justify-between gap-3">
                              <dt className="text-xs text-ink-400">{label}</dt>
                              <dd className="font-mono text-xs tabular-nums text-ink-700">{value}</dd>
                            </div>
                          ))}
                        </dl>
                        <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-300">
                          Last active {relativeTime(developer.lastActiveAt, NOW_MS)}
                        </p>
                      </div>

                      <div>
                        <div className="eyebrow mb-2">Titles</div>
                        <ul className="space-y-1.5">
                          {progress.map((item) => {
                            const pathway = services.pathways.byId(item.pathwayId)!;
                            return (
                              <li
                                key={pathway.id}
                                className="flex items-center justify-between gap-3"
                              >
                                <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-ink-300">
                                  {pathway.shortName}
                                </span>
                                <TitleBadge title={item.currentTitle} tone="neutral" />
                              </li>
                            );
                          })}
                        </ul>
                      </div>

                      <div>
                        <div className="eyebrow mb-2">Next up</div>
                        {progress
                          .filter((item) => item.nextTitle)
                          .map((item) => (
                            <p key={item.pathwayId} className="text-xs leading-relaxed text-ink-500">
                              <span className="text-ink-700">{item.nextTitle?.name}</span> ·{" "}
                              {formatXp(item.xpToNextTitle)} XP away
                            </p>
                          ))}
                        <p className="mt-3 text-xs leading-relaxed text-ink-400">
                          {developer.focus}
                        </p>
                      </div>
                    </div>
                  ) : null}
                </Card>
              );
            })
          )}
        </div>
      </PageSection>
    </PageContainer>
  );
}