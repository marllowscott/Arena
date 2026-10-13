"use client";

import * as React from "react";
import { GraduationCap, Send, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, Panel } from "@/components/ui/card";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { TeachingProposalCard } from "@/components/dev/teaching-proposal-card";
import { EmptyState } from "@/components/shared/empty-state";
import { PageContainer, PageSection } from "@/components/shared/page-container";
import { PageHeader, SectionHeading } from "@/components/shared/section-heading";
import { formatXp } from "@/lib/format";
import { NOW_MS, services } from "@/lib/services";
import type { PathwayId } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useDevArena } from "@/hooks/dev-arena-provider";

export function TeachView({ embedded = false }: { embedded?: boolean }) {
  const { proposals, proposeTopic, current, pathways } = useDevArena();
  const [open, setOpen] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [summary, setSummary] = React.useState("");
  const [pathwayId, setPathwayId] = React.useState<PathwayId>("teacher");
  const [error, setError] = React.useState<string | null>(null);
  const [confirmation, setConfirmation] = React.useState<string | null>(null);

  const ranked = [...proposals].sort((a, b) => b.interestedCount - a.interestedCount);
  const demanded = ranked.filter((proposal) => proposal.status === "open").slice(0, 3);
  const scheduled = ranked.filter(
    (proposal) => proposal.status === "scheduled" || proposal.status === "delivered",
  );
  const myProposals = ranked.filter((proposal) => proposal.proposedById === current.developer.id);
  const teacherProgress = pathways.find((item) => item.pathwayId === "teacher")!;

  function handlePropose(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (title.trim().length < 6) {
      setError("Give the topic a real name. Six characters minimum.");
      return;
    }
    if (summary.trim().length < 20) {
      setError("One or two sentences on what the session would cover.");
      return;
    }
    proposeTopic({ title, summary, pathwayId });
    setConfirmation(title.trim());
    setTitle("");
    setSummary("");
    setError(null);
    setOpen(false);
  }

  return (
    <PageContainer size="wide" className={embedded ? "pt-4" : undefined}>
      <PageHeader
        eyebrow="Topics"
        title="What should we learn?"
        description="Propose a topic, vote for the ones you want, and the instructor turns demand into a session. Teaching counts as real work here."
        actions={
          <Button
            size="lg"
            tone="tech"
            variant={open ? "secondary" : "primary"}
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
          >
            <GraduationCap className="size-4" aria-hidden />
            {open ? "Cancel proposal" : "Propose a topic"}
          </Button>
        }
      />

      {confirmation ? (
        <Card className="mt-6 border-support/50 bg-support-tint/60 p-4">
          <p className="text-sm leading-relaxed text-ink-700">
            <span className="font-medium text-support-deep">Proposed.</span> “{confirmation}” is on
            the board. It becomes an official session when the instructor schedules it.
          </p>
        </Card>
      ) : null}

      {open ? (
        <Card className="mt-6 animate-fade-up p-6">
          <form onSubmit={handlePropose} noValidate>
            <SectionHeading
              eyebrow="New proposal"
              title="What should the next session cover?"
              description="Keep it to one topic. A session that tries to teach everything teaches nothing."
            />

            <div className="mt-5 grid gap-5 lg:grid-cols-2">
              <div className="lg:col-span-2">
                <Label htmlFor="topic">Topic</Label>
                <Input
                  id="topic"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="React Query Caching"
                  aria-invalid={error && !title.trim() ? true : undefined}
                />
              </div>
              <div>
                <Label htmlFor="pathway">Pathway it feeds</Label>
                <Select
                  id="pathway"
                  value={pathwayId}
                  onChange={(event) => setPathwayId(event.target.value as PathwayId)}
                >
                  {services.pathways.list().map((pathway) => (
                    <option key={pathway.id} value={pathway.id}>
                      {pathway.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="lg:col-span-2">
                <Label htmlFor="summary">What the session covers</Label>
                <Textarea
                  id="summary"
                  value={summary}
                  onChange={(event) => setSummary(event.target.value)}
                  placeholder="Caching that behaves the way the UI expects, including invalidation after a mutation…"
                  className="min-h-24"
                />
                <p className="mt-1.5 text-xs leading-relaxed text-ink-400">
                  Proposal XP pays out when you deliver the session, not when you propose it.
                </p>
              </div>
            </div>

            {error ? (
              <p role="alert" className="mt-4 text-sm font-medium text-primary">
                {error}
              </p>
            ) : null}

            <div className="mt-5 flex items-center gap-2 border-t border-sand-300 pt-4">
              <Button type="submit" tone="tech">
                <Send className="size-4" aria-hidden />
                Submit proposal
              </Button>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </Card>
      ) : null}

      <PageSection className="mt-7">
        <SectionHeading
          eyebrow="Most wanted"
          title="What the room is asking for"
          description="Ranked by how many developers want it. Voting costs nothing and tells the instructor what to schedule."
        />
        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {demanded.map((proposal, index) => (
            <div key={proposal.id} className={cn("animate-fade-up", `stagger-${index + 1}`)}>
              <TeachingProposalCard proposal={proposal} />
            </div>
          ))}
        </div>
      </PageSection>

      <PageSection className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <SectionHeading
            eyebrow="Your teaching"
            title="Topics you have on the board"
            description="A proposal that nobody votes for is a signal, not a failure. It usually means the framing is wrong."
          />
          {myProposals.length > 0 ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {myProposals.map((proposal) => (
                <TeachingProposalCard key={proposal.id} proposal={proposal} compact />
              ))}
            </div>
          ) : (
            <EmptyState
              className="mt-4"
              icon={GraduationCap}
              title="You have not proposed anything"
              body="You have taught once already. The next topic is usually the thing that cost you an afternoon."
              action={
                <Button onClick={() => setOpen(true)} tone="tech">
                  Propose a topic
                </Button>
              }
            />
          )}
        </div>

        <aside className="space-y-4">
          <Panel className="p-5">
            <div className="eyebrow text-secondary-soft">Your Teacher pathway</div>
            <div className="mt-2 font-display text-3xl font-bold tabular-nums text-sand-50">
              {formatXp(teacherProgress.xp)}
              <span className="ml-1.5 text-sm font-medium text-sand-300">XP</span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-sand-300/85">
              {teacherProgress.currentTitle.name} → {teacherProgress.nextTitle?.name} ·{" "}
              {formatXp(teacherProgress.xpToNextTitle)} XP away
            </p>
            <p className="mt-3 border-t border-ink-700 pt-3 text-xs leading-relaxed text-ink-300">
              Teaching XP is separate from Builder XP. A month of teaching never costs you standing
              on the Builder ladder.
            </p>
          </Panel>

          <Card className="p-5">
            <div className="flex items-center gap-2">
              <Users className="size-3.5 text-ink-300" aria-hidden />
              <span className="eyebrow">How a session happens</span>
            </div>
            <ol className="mt-3 space-y-2.5">
              {[
                "A developer proposes a topic.",
                "The room votes. Demand is measured, not argued.",
                "The instructor shortlists and schedules.",
                "You deliver the session.",
                "Teaching XP and an unlock if you earned one.",
              ].map((step, index) => (
                <li key={step} className="flex items-start gap-2.5 text-xs leading-relaxed text-ink-400">
                  <span className="mt-0.5 font-mono text-[10px] text-secondary">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </Card>

          {scheduled.length > 0 ? (
            <Card className="p-5">
              <div className="eyebrow mb-3">Scheduled and delivered</div>
              <ul className="space-y-2.5">
                {scheduled.map((proposal) => (
                  <li key={proposal.id} className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm text-ink-700">{proposal.title}</p>
                      <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-300">
                        {proposal.status === "delivered"
                          ? "Delivered"
                          : proposal.sessionDate
                            ? `In ${Math.max(1, Math.round((new Date(proposal.sessionDate).getTime() - NOW_MS) / 86400000))} days`
                            : "Scheduled"}
                      </p>
                    </div>
                    <Badge tone={proposal.status === "delivered" ? "neutral" : "support"} size="sm">
                      {proposal.status}
                    </Badge>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}
        </aside>
      </PageSection>
    </PageContainer>
  );
}