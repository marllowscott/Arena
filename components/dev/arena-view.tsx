"use client";

import Link from "next/link";
import * as React from "react";
import { Search, Swords, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FilterChips } from "@/components/ui/filter-bar";
import { Input } from "@/components/ui/input";
import { ChallengeCard } from "@/components/shared/challenge-card";
import { DifficultyLadder } from "@/components/shared/difficulty-badge";
import { EmptyState } from "@/components/shared/empty-state";
import { PageContainer, PageSection } from "@/components/shared/page-container";
import { PageHeader } from "@/components/shared/section-heading";
import { DIFFICULTY_META, formatXp, relativeTime } from "@/lib/format";
import { NOW_MS, services } from "@/lib/services";
import type { ChallengeFilter } from "@/lib/services/contracts";
import type { Difficulty, PathwayId } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useDevArena } from "@/hooks/dev-arena-provider";

type PathwayFilter = PathwayId | "all";
type DifficultyFilter = Difficulty | "all";

export function ArenaView() {
  const { submissions } = useDevArena();
  const [pathway, setPathway] = React.useState<PathwayFilter>("all");
  const [difficulty, setDifficulty] = React.useState<DifficultyFilter>("all");
  const [query, setQuery] = React.useState("");

  const filter: ChallengeFilter = {
    pathwayId: pathway === "all" ? undefined : pathway,
    difficulty: difficulty === "all" ? undefined : difficulty,
    query: query.trim() || undefined,
  };

  const all = services.challenges.list();
  const visible = services.challenges.list(filter);

  const pathwayOptions = [
    { value: "all" as const, label: "All pathways" },
    ...services.pathways.list().map((item) => ({
      value: item.id,
      label: item.shortName,
      count: all.filter((challenge) => challenge.pathwayId === item.id).length,
    })),
  ];

  const difficultyOptions = [
    { value: "all" as const, label: "Any difficulty" },
    ...(Object.keys(DIFFICULTY_META) as Difficulty[]).map((item) => ({
      value: item,
      label: DIFFICULTY_META[item].label,
      count: all.filter((challenge) => challenge.difficulty === item).length,
    })),
  ];

  const totalXp = visible.reduce((sum, challenge) => sum + challenge.xp, 0);

  return (
    <PageContainer size="wide">
      <PageHeader
        eyebrow="Problems"
        title="Problems open right now"
        description="Each one is real work. Pick the problem that matches what you are already stuck on."
        actions={
          <>
            <Badge tone="neutral">{visible.length} problems</Badge>
            <Badge tone="gold">{formatXp(totalXp)} XP available</Badge>
          </>
        }
      />

      <Card className="mt-6 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <FilterChips
            label="Filter by pathway"
            options={pathwayOptions}
            value={pathway}
            onChange={setPathway}
          />
          <div className="flex items-center gap-2">
            <FilterChips
              label="Filter by difficulty"
              options={difficultyOptions}
              value={difficulty}
              onChange={setDifficulty}
              size="sm"
              className="hidden xl:flex"
            />
            <div className="relative w-full lg:w-56">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-300"
                aria-hidden
              />
              <Input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search problems"
                aria-label="Search problems"
                className="pl-9"
              />
            </div>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-sand-300 pt-3 xl:hidden">
          <span className="eyebrow mr-1">Difficulty</span>
          <FilterChips
            label="Filter by difficulty"
            options={difficultyOptions}
            value={difficulty}
            onChange={setDifficulty}
            size="sm"
          />
        </div>
      </Card>

      <PageSection>
        {visible.length === 0 ? (
          <EmptyState
            icon={Swords}
            eyebrow="No match"
            title="No problems match those filters"
            body="Widen the filters, or clear the search. New problems drop at the start of each cycle."
            action={
              <Button
                variant="secondary"
                onClick={() => {
                  setPathway("all");
                  setDifficulty("all");
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
            {visible.map((challenge, index) => {
              const submission = submissions.find(
                (item) => item.challengeId === challenge.id && item.status === "pending",
              );
              const done = submissions.some(
                (item) =>
                  item.challengeId === challenge.id &&
                  (item.status === "approved" || item.status === "adjusted"),
              );

              return (
                <div
                  key={challenge.id}
                  className={cn("animate-fade-up", `stagger-${Math.min(index + 1, 5)}`)}
                >
                  <ChallengeCard
                    challenge={challenge}
                    status={
                      done ? (
                        <Badge tone="support" size="lg">
                          Completed · +{formatXp(challenge.xp)} XP
                        </Badge>
                      ) : submission ? (
                        <Badge tone="gold" size="lg">
                          Under review · {relativeTime(submission.submittedAt, NOW_MS)}
                        </Badge>
                      ) : null
                    }
                  />
                </div>
              );
            })}
          </div>
        )}
      </PageSection>

      <PageSection>
        <Card className="p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-base font-semibold tracking-tight text-ink-900">
                How XP scales
              </h2>
              <p className="mt-1 max-w-xl text-sm leading-relaxed text-ink-400">
                Difficulty sets the reward before you accept the problem, so the risk is never a
                surprise. Expert reviews can adjust the figure up or down.
              </p>
            </div>
            <Link
              href="/instructor/challenges"
              className="shrink-0 font-mono text-[11px] uppercase tracking-[0.12em] text-primary hover:underline"
            >
              Problem catalogue
            </Link>
          </div>
          <div className="mt-4 border-t border-sand-300 pt-4">
            <DifficultyLadder />
          </div>
        </Card>
      </PageSection>
    </PageContainer>
  );
}