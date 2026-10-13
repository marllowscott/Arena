"use client";

import * as React from "react";
import { HandHelping, LifeBuoy, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, Panel } from "@/components/ui/card";
import { FilterChips } from "@/components/ui/filter-bar";
import { StatCard } from "@/components/shared/stat-card";
import { ProbeCard } from "@/components/dev/probe-card";
import { EmptyState } from "@/components/shared/empty-state";
import { PageContainer, PageSection } from "@/components/shared/page-container";
import { PageHeader, SectionHeading } from "@/components/shared/section-heading";
import { services } from "@/lib/services";
import { cn } from "@/lib/utils";
import { useDevArena } from "@/hooks/dev-arena-provider";

type Scope = "open" | "taken" | "mine" | "solved" | "all";

export function ProbeView() {
  const { helpRequests, current } = useDevArena();
  const [scope, setScope] = React.useState<Scope>("open");

  const developerId = current.developer.id;

  const isOpen = (status: string) => status === "open" || status === "flagged";
  const visible = helpRequests.filter((request) => {
    if (scope === "open") return isOpen(request.status) && !request.acceptedBy;
    if (scope === "taken") return Boolean(request.acceptedBy);
    if (scope === "mine") return request.developerId === developerId;
    if (scope === "solved") return request.status === "solved";
    return true;
  });

  const unclaimed = helpRequests.filter((request) => isOpen(request.status) && !request.acceptedBy);
  const taken = helpRequests.filter((request) => Boolean(request.acceptedBy));
  const answered = helpRequests.reduce((sum, request) => sum + request.answers.length, 0);
  const mentorProgress = services.developers
    .pathwayProgress(developerId)
    .find((item) => item.pathwayId === "mentor");

  const scopeOptions = [
    { value: "open" as const, label: "Unclaimed", count: unclaimed.length },
    { value: "taken" as const, label: "Being helped", count: taken.length },
    { value: "mine" as const, label: "My probes", count: helpRequests.filter((r) => r.developerId === developerId).length },
    { value: "solved" as const, label: "Solved", count: helpRequests.filter((r) => r.status === "solved").length },
    { value: "all" as const, label: "All" },
  ];

  return (
    <PageContainer size="wide">
      <PageHeader
        eyebrow="Probe"
        title="Stuck on something? Post it. Somebody will take it."
        description="Post what you are actually stuck on, including the error. One developer accepts a probe, helps, and you confirm when it works. A confirmed answer pays Mentor XP."
        actions={
          <Badge tone="gold">
            <HandHelping className="size-3" aria-hidden />
            +8 XP per confirmed answer
          </Badge>
        }
      />

      <PageSection className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Unclaimed probes" value={unclaimed.length} icon={LifeBuoy} tone="primary" />
        <StatCard label="Answers written" value={answered} icon={Sparkles} tone="support" />
        <StatCard
          label="Your Mentor XP"
          value={mentorProgress?.xp ?? 0}
          hint={
            mentorProgress?.nextTitle
              ? `${mentorProgress.xpToNextTitle} XP to ${mentorProgress.nextTitle.name}`
              : "Ladder complete"
          }
          tone="gold"
        />
      </PageSection>

      <PageSection>
        <Card className="p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <FilterChips label="Filter probes" options={scopeOptions} value={scope} onChange={setScope} />
            <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-300">
              {visible.length} shown
            </p>
          </div>
        </Card>

        <div className="mt-4">
          {visible.length === 0 ? (
            <EmptyState
              icon={LifeBuoy}
              eyebrow="Quiet"
              title={scope === "open" ? "Nothing is waiting for help" : "Nothing here"}
              body={
                scope === "open"
                  ? "Every probe is either taken or resolved. Post your own if you are stuck."
                  : "Try a different filter."
              }
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {visible.map((request, index) => (
                <div key={request.id} className={cn("animate-fade-up", `stagger-${Math.min(index + 1, 5)}`)}>
                  <ProbeCard request={request} isMine={request.developerId === developerId} />
                </div>
              ))}
            </div>
          )}
        </div>
      </PageSection>

      <PageSection>
        <Panel className="grid gap-6 p-6 sm:p-8 lg:grid-cols-2">
          <div>
            <div className="eyebrow text-secondary-soft">The loop</div>
            <h2 className="mt-2 font-display text-xl font-semibold tracking-tight text-sand-50">
              One helper per probe, and why
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-sand-300/85">
              Accepting a probe takes exclusive ownership of it. That stops three people writing three
              partial answers and nobody reading them, and it gives the person who asked a single
              thread to follow. Drop it any time and it goes back on the board.
            </p>
          </div>
          <ol className="space-y-3">
            {[
              {
                title: "Somebody posts what they are stuck on",
                body: "Their words, their context, their error message. Not a question mark — the actual problem.",
              },
              {
                title: "One developer accepts it",
                body: "Ownership is exclusive, so the asker knows who to wait for and the board stays honest.",
              },
              {
                title: "They confirm the answer that worked",
                body: "The helper gets 8 Mentor XP and the thread becomes a record somebody else can find.",
              },
            ].map((step, index) => (
              <li key={step.title} className="flex gap-3">
                <span className="mt-0.5 font-mono text-[11px] text-secondary">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <p className="text-sm font-medium text-sand-100">{step.title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-ink-300">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </Panel>
      </PageSection>

      <PageSection>
        <SectionHeading
          eyebrow="Safety"
          title="Flag anything that should not be public"
          description="A probe containing a key, a customer name or anything else sensitive should be flagged. The instructor rotates the key and the thread continues privately."
        />
      </PageSection>
    </PageContainer>
  );
}
