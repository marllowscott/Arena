"use client";

import * as React from "react";
import { Info, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { FilterChips, TabBar } from "@/components/ui/filter-bar";
import { LeaderboardRow, MovementPill } from "@/components/shared/leaderboard-row";
import { EmptyState } from "@/components/shared/empty-state";
import { PageContainer, PageSection } from "@/components/shared/page-container";
import { PageHeader } from "@/components/shared/section-heading";
import { formatXp } from "@/lib/format";
import { LEADERBOARD_FILTERS, LEADERBOARD_TABS } from "@/lib/nav";
import { services } from "@/lib/services";
import type { LeaderboardTab } from "@/lib/types";
import { cn } from "@/lib/utils";

const TAB_COPY: Record<LeaderboardTab, { title: string; description: string }> = {
  movement: {
    title: "This week's climbers",
    description: "Ranked by XP earned since Monday. Movement is the change since last week.",
  },
  overall: {
    title: "Overall standing",
    description: "Every XP the hub has awarded. Titles and pathway XP decide this one.",
  },
  builder: {
    title: "Builder ladder",
    description: "Builder pathway XP only. Shipping work cannot be outranked by teaching.",
  },
  "problem-solver": {
    title: "Problem Solver ladder",
    description: "Problem Solver pathway XP only. Find causes, not symptoms.",
  },
  teacher: {
    title: "Teacher ladder",
    description: "Teacher pathway XP only. Clarity is the skill being measured.",
  },
  mentor: {
    title: "Mentor ladder",
    description: "Mentor pathway XP only. Awarded when a developer confirms your answer solved it.",
  },
  scout: {
    title: "Scout ladder",
    description: "Scout pathway XP only. Research that turns into somebody else's next step.",
  },
};

export function LeaderboardView() {
  const [tab, setTab] = React.useState<LeaderboardTab>("movement");
  const [lane, setLane] = React.useState<LeaderboardTab>("overall");

  /* The two time views rank on total XP. Picking a skill switches the board to
     that skill's own XP, which only makes sense as an all-time reading. */
  const board: LeaderboardTab = lane === "overall" ? tab : lane;
  const snapshot = services.leaderboard.snapshot(board);
  const { entries, currentEntry } = snapshot;
  const copy = TAB_COPY[board];
  const onSkillBoard = lane !== "overall";

  return (
    <PageContainer size="wide">
      <PageHeader
        eyebrow="Leaderboard"
        title={onSkillBoard ? TAB_COPY[lane].title : tab === "movement" ? "This week" : "All time"}
        description={
          onSkillBoard
            ? TAB_COPY[lane].description
            : "Ranked by XP. This week counts Monday onwards; all time counts everything the hub has awarded."
        }
        actions={
          <Badge tone="neutral">
            {entries.length} developers
          </Badge>
        }
      />

      <div className="mt-6">
        <TabBar
          label="Leaderboard views"
          options={LEADERBOARD_TABS}
          value={tab}
          onChange={setTab}
        />
      </div>

      <PageSection>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            <div>
              <h2 className="font-display text-lg font-semibold tracking-tight text-ink-900">
                {copy.title}
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-ink-400">{copy.description}</p>
            </div>

            <Card className="p-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="eyebrow">Skill</span>
                <FilterChips
                  label="Filter by skill"
                  size="sm"
                  options={LEADERBOARD_FILTERS}
                  value={lane}
                  onChange={setLane}
                />
              </div>
            </Card>

            {entries.length === 0 ? (
              <EmptyState
                icon={Trophy}
                title="No ranking here yet"
                body="Nobody has earned XP on this board this cycle. The first mission will change that."
              />
            ) : (
              <ol className="space-y-2">
                {entries.map((entry, index) => (
                  <li
                    key={entry.developerId}
                    className={cn("animate-fade-up", `stagger-${Math.min(index + 1, 5)}`)}
                  >
                    <LeaderboardRow
                      entry={entry}
                      metric={board === "movement" ? "weekly" : "total"}
                      showMovement={board === "movement"}
                    />
                  </li>
                ))}
              </ol>
            )}
          </div>

          <aside className="space-y-4">
            {currentEntry ? (
              <Card className="border-primary-line bg-primary-tint/40 p-5">
                <div className="eyebrow">Your position</div>
                <div className="mt-3 flex items-center gap-3">
                  <span className="font-display text-4xl font-bold tabular-nums text-primary">
                    #{currentEntry.rank}
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-ink-800">
                      {currentEntry.name}
                    </div>
                    <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-400">
                      {currentEntry.title}
                    </div>
                  </div>
                </div>

                <div className="mt-4 space-y-2 border-t border-primary-line/60 pt-3.5">
                  <div className="flex items-center justify-between font-mono text-[11px] tabular-nums">
                    <span className="text-ink-400">
                      {board === "movement" ? "XP this week" : "XP counted here"}
                    </span>
                    <span className="font-semibold text-ink-800">
                      {formatXp(board === "movement" ? currentEntry.weeklyXp : currentEntry.totalXp)}
                    </span>
                  </div>
                  {board === "movement" ? (
                    <div className="flex items-center justify-between font-mono text-[11px] tabular-nums">
                      <span className="text-ink-400">Movement</span>
                      <MovementPill movement={currentEntry.movement} />
                    </div>
                  ) : null}
                  <div className="flex items-center justify-between font-mono text-[11px] tabular-nums">
                    <span className="text-ink-400">Developers ahead</span>
                    <span className="font-semibold text-ink-800">
                      {Math.max(0, currentEntry.rank - 1)}
                    </span>
                  </div>
                </div>

                {currentEntry.rank > 1 ? (
                  <p className="mt-3 text-xs leading-relaxed text-ink-500">
                    The gap to the position above is{" "}
                    <span className="font-mono font-semibold text-primary">
                      {formatXp(
                        Math.max(
                          1,
                          (entries[Math.max(0, currentEntry.rank - 2)]?.weeklyXp ?? 0) -
                            currentEntry.weeklyXp,
                        ),
                      )}{" "}
                      XP
                    </span>{" "}
                    this week. One mission usually covers it.
                  </p>
                ) : (
                  <p className="mt-3 text-xs leading-relaxed text-ink-500">
                    You lead this board. The useful thing to do with that is help someone else move.
                  </p>
                )}
              </Card>
            ) : null}

            <Card className="p-5">
              <div className="flex items-center gap-2">
                <Info className="size-3.5 text-ink-300" aria-hidden />
                <span className="eyebrow">How this works</span>
              </div>
              <ul className="mt-3 space-y-2 text-xs leading-relaxed text-ink-400">
                <li>Movement is weekly XP only. It resets every Monday morning.</li>
                <li>Overall XP includes every pathway, so breadth counts.</li>
                <li>Pathway boards use pathway XP, so titles are never diluted.</li>
                <li>Nothing here is permanent. Boards move every week.</li>
              </ul>
            </Card>
          </aside>
        </div>
      </PageSection>
    </PageContainer>
  );
}