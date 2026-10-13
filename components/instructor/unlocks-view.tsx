"use client";

import * as React from "react";
import { CheckCircle2, KeyRound, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, Panel } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { PathwayIcon, PATHWAY_ACCENT } from "@/components/shared/pathway-icon";
import { PageContainer, PageSection } from "@/components/shared/page-container";
import { PageHeader, SectionHeading } from "@/components/shared/section-heading";
import { StatCard } from "@/components/shared/stat-card";
import { formatXp } from "@/lib/format";
import { services } from "@/lib/services";
import type { Unlock } from "@/lib/types";
import { cn } from "@/lib/utils";

export function UnlocksView() {
  const [confirmed, setConfirmed] = React.useState<string[]>([]);

  const catalogue = services.unlocks.catalogue();
  const developers = services.developers.list();

  const earnedEntries = developers.flatMap((developer) =>
    services.unlocks.earned(developer.id).map((unlock) => ({ unlock, developer })),
  );

  function toggleConfirm(key: string) {
    setConfirmed((prev) =>
      prev.includes(key) ? prev.filter((item) => item !== key) : [...prev, key],
    );
  }

  return (
    <PageContainer size="wide">
      <PageHeader
        eyebrow="Unlocks and titles"
        title="Responsibilities and confirmations"
        description="Unlocks are permissions you hand out. Titles come from XP, except the important ones, which you confirm."
      />

      <PageSection className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatCard label="Unlock types" value={catalogue.length} icon={KeyRound} />
        <StatCard label="Unlocks earned" value={earnedEntries.length} tone="support" />
        <StatCard label="Titles needing confirmation" value={4} tone="gold" hint="Tier four and above" />
      </PageSection>

      <PageSection>
        <SectionHeading
          eyebrow="Unlock catalogue"
          title="What each unlock means"
          description="Requirements are the bar, not the badge. Somebody should be able to ask for one and get a straight answer."
        />

        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {catalogue.map((unlock: Unlock) => {
            const holders = earnedEntries.filter((entry) => entry.unlock.id === unlock.id);
            return (
              <Card key={unlock.id} className="flex flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-display text-sm font-semibold tracking-tight text-ink-900">
                    {unlock.title}
                  </h3>
                  <Badge tone={holders.length > 0 ? "support" : "neutral"} size="sm">
                    {holders.length > 0 ? `${holders.length} held` : "available"}
                  </Badge>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-ink-500">{unlock.description}</p>

                <ul className="mt-3 space-y-1.5">
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

                {holders.length > 0 ? (
                  <div className="mt-4 flex items-center gap-2 border-t border-sand-300 pt-3">
                    {holders.map((entry) => (
                      <Avatar
                        key={entry.unlock.id + entry.developer.id}
                        initials={entry.developer.initials}
                        name={entry.developer.name}
                        from={entry.developer.avatarFrom}
                        to={entry.developer.avatarTo}
                        size="sm"
                        className="size-6 text-[9px]"
                      />
                    ))}
                    <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-300">
                      holding it
                    </span>
                  </div>
                ) : null}
              </Card>
            );
          })}
        </div>
      </PageSection>

      <PageSection>
        <SectionHeading
          eyebrow="Title ladders"
          title="Every rung, and who is near it"
          description="Tiers one to three land automatically from XP. Tier four and above wait for your confirmation."
        />

        <div className="mt-4 space-y-4">
          {services.pathways.list().map((pathway) => {
            const accent = PATHWAY_ACCENT[pathway.icon];
            const ladder = services.pathways.titles(pathway.id);

            return (
              <Panel key={pathway.id} className="p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={cn(
                        "inline-flex size-9 items-center justify-center rounded-md border",
                        accent.bg,
                        accent.border,
                        accent.text,
                      )}
                    >
                      <PathwayIcon name={pathway.icon} className="size-4" />
                    </span>
                    <div>
                      <h3 className="font-display text-sm font-semibold tracking-tight text-sand-50">
                        {pathway.name}
                      </h3>
                      <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-ink-300">
                        {ladder.length} rungs · top rung at {formatXp(ladder[ladder.length - 1].xpRequired)} XP
                      </p>
                    </div>
                  </div>
                </div>

                <ul className="mt-4 divide-y divide-ink-700">
                  {ladder.map((title) => {
                    const near = developers
                      .map((developer) => ({
                        developer,
                        gap: developer.pathwayXp[pathway.id] - title.xpRequired,
                      }))
                      .filter((row) => row.gap >= 0 && row.gap <= 120)
                      .sort((a, b) => a.gap - b.gap)
                      .slice(0, 3);

                    const key = title.id;
                    const isConfirmed = confirmed.includes(key);

                    return (
                      <li key={title.id} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-[10px] tabular-nums text-secondary">
                              {String(title.tier).padStart(2, "0")}
                            </span>
                            <span className="font-display text-sm font-medium text-sand-100">
                              {title.name}
                            </span>
                            {title.requiresConfirmation ? (
                              <Badge tone={isConfirmed ? "support" : "gold"} size="sm">
                                {isConfirmed ? "confirmed" : "needs confirmation"}
                              </Badge>
                            ) : null}
                          </div>
                          <p className="mt-0.5 text-xs italic text-ink-300">“{title.motto}”</p>
                        </div>

                        <div className="flex items-center gap-4">
                          <span className="font-mono text-[11px] tabular-nums text-sand-300">
                            {formatXp(title.xpRequired)} XP
                          </span>
                          <div className="flex -space-x-1.5">
                            {near.map((row) => (
                              <Avatar
                                key={row.developer.id}
                                initials={row.developer.initials}
                                name={`${row.developer.name} · ${formatXp(row.gap)} XP above`}
                                from={row.developer.avatarFrom}
                                to={row.developer.avatarTo}
                                size="sm"
                                className="size-6 text-[9px] ring-2 ring-ink-900"
                              />
                            ))}
                          </div>
                          {title.requiresConfirmation ? (
                            <Button
                              size="sm"
                              tone="tech"
                              variant={isConfirmed ? "success" : "outline"}
                              onClick={() => toggleConfirm(key)}
                            >
                              {isConfirmed ? (
                                <CheckCircle2 className="size-3.5" aria-hidden />
                              ) : (
                                <ShieldCheck className="size-3.5" aria-hidden />
                              )}
                              {isConfirmed ? "Confirmed" : "Confirm"}
                            </Button>
                          ) : null}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </Panel>
            );
          })}
        </div>
      </PageSection>

      <PageSection>
        <Card className="p-5">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-ink-300" aria-hidden />
            <p className="text-sm leading-relaxed text-ink-500">
              Confirmations in this build are session-only. Persisting a confirmation requires the
              database write that lands in Phase 2, along with the audit trail that says who
              confirmed what and when.
            </p>
          </div>
        </Card>
      </PageSection>
    </PageContainer>
  );
}