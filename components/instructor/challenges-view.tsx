"use client";

import Link from "next/link";
import * as React from "react";
import { Plus, Search, Target, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FilterChips } from "@/components/ui/filter-bar";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { DifficultyBadge } from "@/components/shared/difficulty-badge";
import { PathwayIcon, PATHWAY_ACCENT } from "@/components/shared/pathway-icon";
import { EmptyState } from "@/components/shared/empty-state";
import { PageContainer, PageSection } from "@/components/shared/page-container";
import { PageHeader, SectionHeading } from "@/components/shared/section-heading";
import { TeachingProposalCard } from "@/components/dev/teaching-proposal-card";
import { DIFFICULTY_META, formatXp } from "@/lib/format";
import { services } from "@/lib/services";
import type { Difficulty, PathwayId } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useDevArena } from "@/hooks/dev-arena-provider";

const DEFAULT_XP: Record<Difficulty, number> = {
  starter: 20,
  builder: 45,
  advanced: 90,
  expert: 200,
  boss: 320,
};

export function ChallengesView() {
  const { challenges, createChallenge, proposals } = useDevArena();
  const [pathway, setPathway] = React.useState<PathwayId | "all">("all");
  const [query, setQuery] = React.useState("");
  const [open, setOpen] = React.useState(false);

  const [title, setTitle] = React.useState("");
  const [summary, setSummary] = React.useState("");
  const [mission, setMission] = React.useState("");
  const [newPathway, setNewPathway] = React.useState<PathwayId>("builder");
  const [difficulty, setDifficulty] = React.useState<Difficulty>("advanced");
  const [effort, setEffort] = React.useState("2h");
  const [errors, setErrors] = React.useState<string[]>([]);
  const [drafts, setDrafts] = React.useState<string[]>([]);

  const needle = query.trim().toLowerCase();
  const visible = challenges.filter((challenge) => {
    if (pathway !== "all" && challenge.pathwayId !== pathway) return false;
    if (!needle) return true;
    return `${challenge.title} ${challenge.summary} ${challenge.tags.join(" ")}`
      .toLowerCase()
      .includes(needle);
  });

  const pending = proposals.filter((proposal) => proposal.status === "open" || proposal.status === "shortlisted");
  const xpPool = challenges.filter((c) => c.status !== "locked").reduce((sum, c) => sum + c.xp, 0);

  function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next: string[] = [];
    if (title.trim().length < 6) next.push("Give the mission a name of at least six characters.");
    if (summary.trim().length < 20) next.push("The summary needs a sentence a developer can judge.");
    if (mission.trim().length < 30) next.push("The mission needs enough detail to be actionable.");
    setErrors(next);
    if (next.length > 0) return;

    createChallenge({
      title,
      summary,
      mission,
      pathwayId: newPathway,
      difficulty,
      xp: DEFAULT_XP[difficulty],
      estimatedEffort: effort,
    });
    setDrafts((prev) => [title.trim(), ...prev]);
    setTitle("");
    setSummary("");
    setMission("");
    setOpen(false);
  }

  return (
    <PageContainer size="wide">
      <PageHeader
        eyebrow="Challenges"
        title="Mission catalogue"
        description="Every open mission, what it pays, and how hard it is. Difficulty sets the reward before a developer accepts."
        actions={
          <>
            <Badge tone="neutral">{challenges.length} missions</Badge>
            <Badge tone="gold">{formatXp(xpPool)} XP in circulation</Badge>
          </>
        }
      />

      {drafts.length > 0 ? (
        <Card className="mt-6 border-secondary-line bg-secondary-tint/40 p-4">
          <p className="text-sm leading-relaxed text-ink-600">
            <span className="font-medium text-secondary-muted">
              {drafts.length} draft{drafts.length === 1 ? "" : "s"} created.
            </span>{" "}
            Drafts stay in this session. Publishing to the Arena — with requirements, evidence and a
            public briefing — arrives with the backend.
          </p>
        </Card>
      ) : null}

      <PageSection>
        <SectionHeading
          eyebrow="Teaching demand"
          title="Proposals waiting on a scheduling decision"
          description="Scheduled sessions become missions. That is how a proposal turns into XP somebody can earn."
        />
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {pending.slice(0, 3).map((proposal) => (
            <TeachingProposalCard key={proposal.id} proposal={proposal} compact />
          ))}
        </div>
      </PageSection>

      <PageSection>
        <Card className="p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <FilterChips
              label="Filter by pathway"
              value={pathway}
              onChange={setPathway}
              size="sm"
              options={[
                { value: "all" as const, label: "All" },
                ...services.pathways.list().map((item) => ({ value: item.id, label: item.shortName })),
              ]}
            />
            <div className="flex items-center gap-2">
              <div className="relative w-full lg:w-56">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-300"
                  aria-hidden
                />
                <Input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search missions"
                  aria-label="Search missions"
                  className="pl-9"
                />
              </div>
              <Button
                tone="tech"
                size="sm"
                variant={open ? "secondary" : "primary"}
                onClick={() => setOpen((value) => !value)}
                aria-expanded={open}
              >
                <Plus className="size-3.5" aria-hidden />
                New mission
              </Button>
            </div>
          </div>
        </Card>

        {open ? (
          <Card className="mt-4 animate-fade-up p-6">
            <form onSubmit={handleCreate} noValidate>
              <SectionHeading
                eyebrow="New mission"
                title="Draft a brief"
                description="Title, pathway, difficulty and the mission itself. Rubric and evidence requirements default to the standard set."
              />

              <div className="mt-5 grid gap-5 lg:grid-cols-2">
                <div className="lg:col-span-2">
                  <Label htmlFor="m-title">Mission title</Label>
                  <Input
                    id="m-title"
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="The Silent Retry"
                  />
                </div>

                <div>
                  <Label htmlFor="m-pathway">Pathway</Label>
                  <Select
                    id="m-pathway"
                    value={newPathway}
                    onChange={(event) => setNewPathway(event.target.value as PathwayId)}
                  >
                    {services.pathways.list().map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </Select>
                </div>

                <div>
                  <Label htmlFor="m-difficulty">Difficulty</Label>
                  <Select
                    id="m-difficulty"
                    value={difficulty}
                    onChange={(event) => setDifficulty(event.target.value as Difficulty)}
                  >
                    {(Object.keys(DIFFICULTY_META) as Difficulty[]).map((item) => (
                      <option key={item} value={item}>
                        {DIFFICULTY_META[item].label} · {DIFFICULTY_META[item].range}
                      </option>
                    ))}
                  </Select>
                  <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-300">
                    Pays {DEFAULT_XP[difficulty]} XP
                  </p>
                </div>

                <div>
                  <Label htmlFor="m-effort">Estimated effort</Label>
                  <Input
                    id="m-effort"
                    value={effort}
                    onChange={(event) => setEffort(event.target.value)}
                    placeholder="2h"
                    className="font-mono"
                  />
                </div>

                <div className="lg:col-span-2">
                  <Label htmlFor="m-summary">One line summary</Label>
                  <Input
                    id="m-summary"
                    value={summary}
                    onChange={(event) => setSummary(event.target.value)}
                    placeholder="What is broken, and why it matters right now."
                  />
                </div>

                <div className="lg:col-span-2">
                  <Label htmlFor="m-mission">The mission</Label>
                  <Textarea
                    id="m-mission"
                    value={mission}
                    onChange={(event) => setMission(event.target.value)}
                    placeholder="What has to be true for this mission to be complete."
                    className="min-h-28"
                  />
                </div>
              </div>

              {errors.length > 0 ? (
                <ul role="alert" className="mt-4 space-y-1">
                  {errors.map((message) => (
                    <li key={message} className="text-sm font-medium text-primary">
                      {message}
                    </li>
                  ))}
                </ul>
              ) : null}

              <div className="mt-5 flex items-center gap-2 border-t border-sand-300 pt-4">
                <Button type="submit" tone="tech">
                  Save draft
                </Button>
                <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                  <X className="size-4" aria-hidden />
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        ) : null}

        <div className="mt-4">
          {visible.length === 0 ? (
            <EmptyState icon={Target} title="No missions match" body="Clear the filters to see the whole catalogue." />
          ) : (
            <div className="space-y-3">
              {visible.map((challenge, index) => {
                const pathway = services.pathways.byId(challenge.pathwayId)!;
                const accent = PATHWAY_ACCENT[pathway.icon];
                return (
                  <Card
                    key={challenge.id}
                    className={cn(
                      "flex flex-col gap-4 p-4 lg:flex-row lg:items-center lg:justify-between",
                      index < 5 && `animate-fade-up stagger-${index + 1}`,
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <DifficultyBadge difficulty={challenge.difficulty} xp={challenge.xp} />
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-xs border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em]",
                            accent.bg,
                            accent.border,
                            accent.text,
                          )}
                        >
                          <PathwayIcon name={pathway.icon} className="size-2.5" />
                          {pathway.shortName}
                        </span>
                        {challenge.status === "locked" ? (
                          <Badge tone="primary" size="sm">
                            Draft
                          </Badge>
                        ) : null}
                      </div>
                      <p className="mt-2 text-sm font-semibold text-ink-900">{challenge.title}</p>
                      <p className="mt-1 max-w-3xl text-xs leading-relaxed text-ink-500">
                        {challenge.summary}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-6">
                      <div className="text-center">
                        <div className="font-display text-base font-semibold tabular-nums text-ink-800">
                          {challenge.estimatedEffort}
                        </div>
                        <div className="font-mono text-[9px] uppercase tracking-[0.1em] text-ink-300">
                          effort
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="font-display text-base font-semibold tabular-nums text-ink-800">
                          {challenge.completions}
                        </div>
                        <div className="font-mono text-[9px] uppercase tracking-[0.1em] text-ink-300">
                          done
                        </div>
                      </div>
                      {challenge.status !== "locked" ? (
                        <Link
                          href={`/arena/${challenge.slug}`}
                          className="font-mono text-[10px] uppercase tracking-[0.12em] text-primary hover:underline"
                        >
                          Open
                        </Link>
                      ) : null}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </PageSection>
    </PageContainer>
  );
}