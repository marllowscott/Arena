"use client";

import * as React from "react";
import { Building2, Database, RotateCcw, Save, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, Panel } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { DifficultyLadder } from "@/components/shared/difficulty-badge";
import { Input, Label, Select } from "@/components/ui/input";
import { PageContainer, PageSection } from "@/components/shared/page-container";
import { PageHeader, SectionHeading } from "@/components/shared/section-heading";
import { INSTRUCTOR } from "@/lib/services";
import { services } from "@/lib/services";
import { useDevArena } from "@/hooks/dev-arena-provider";
import { ProfilePhotoUpload } from "@/components/shared/profile-photo-upload";

export function SettingsView({
  avatarUrl,
  avatarName,
  avatarInitials,
  avatarFrom,
  avatarTo,
}: {
  avatarUrl: string | null;
  avatarName: string;
  avatarInitials: string;
  avatarFrom: string;
  avatarTo: string;
}) {
  const { resetDemo } = useDevArena();
  const [hubName, setHubName] = React.useState<string>(INSTRUCTOR.hub);
  const [reviewWindow, setReviewWindow] = React.useState("48 hours");
  const [sessionLength, setSessionLength] = React.useState("60 minutes");
  const [saved, setSaved] = React.useState(false);
  const [resetDone, setResetDone] = React.useState(false);

  const developers = services.developers.list();

  return (
    <PageContainer size="wide">
      <PageHeader
        eyebrow="Settings"
        title="Hub configuration"
        description="The rules of the arena. Changing these affects everybody, so they are deliberately few."
      />

      <PageSection className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <SectionHeading
            eyebrow="General"
            title="Hub and cycle"
            description="Saved to the database in Phase 2. For now the values below are session-only."
          />

          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Label htmlFor="instructor-avatar">Profile image</Label>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar
                    initials={avatarInitials}
                    name={avatarName}
                    from={avatarFrom}
                    to={avatarTo}
                    size="xl"
                    ring
                    className="shadow-raised"
                    src={avatarUrl ?? undefined}
                  />
                </div>
                <div className="flex flex-col justify-end">
                  <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-400">
                    PNG, JPG, WebP, AVIF · max 2 MB
                  </p>
                  <div className="mt-2">
                    <ProfilePhotoUpload avatarUrl={avatarUrl} />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="hub">Hub name</Label>
              <Input
                id="hub"
                value={hubName}
                onChange={(event) => {
                  setHubName(event.target.value);
                  setSaved(false);
                }}
              />
            </div>
            <div>
              <Label htmlFor="review">Review window</Label>
              <Select
                id="review"
                value={reviewWindow}
                onChange={(event) => {
                  setReviewWindow(event.target.value);
                  setSaved(false);
                }}
              >
                <option>24 hours</option>
                <option>48 hours</option>
                <option>1 week</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="session">Teaching session length</Label>
              <Select
                id="session"
                value={sessionLength}
                onChange={(event) => {
                  setSessionLength(event.target.value);
                  setSaved(false);
                }}
              >
                <option>30 minutes</option>
                <option>60 minutes</option>
                <option>90 minutes</option>
              </Select>
            </div>
            <div>
              <Label htmlFor="instructor">Lead instructor</Label>
              <Input id="instructor" value={`${INSTRUCTOR.name} · ${INSTRUCTOR.title}`} readOnly />
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3 border-t border-sand-300 pt-4">
            <Button tone="tech" onClick={() => setSaved(true)}>
              <Save className="size-4" aria-hidden />
              Save settings
            </Button>
            {saved ? (
              <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-support-deep">
                Saved for this session
              </span>
            ) : null}
          </div>
        </Card>

        <Card className="p-6">
          <SectionHeading eyebrow="Roster" title="At a glance" />
          <dl className="mt-4 space-y-2.5">
            {[
              ["Developers", developers.length],
              ["Pathways", services.pathways.list().length],
              ["Titles", services.pathways.titles().length],
              ["Missions", services.challenges.list().length],
              ["Unlock types", services.unlocks.catalogue().length],
            ].map(([label, value]) => (
              <div key={String(label)} className="flex items-center justify-between gap-3">
                <dt className="text-xs text-ink-400">{label}</dt>
                <dd className="font-mono text-xs tabular-nums text-ink-700">{value}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-4 flex items-center gap-2 border-t border-sand-300 pt-3">
            <Building2 className="size-3.5 text-ink-300" aria-hidden />
            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-300">
              Single hub · multi-hub arrives later
            </span>
          </div>
        </Card>
      </PageSection>

      <PageSection>
        <Card className="p-6">
          <SectionHeading
            eyebrow="XP bands"
            title="Difficulty determines reward"
            description="Set per difficulty. A review can still adjust an individual award."
          />
          <div className="mt-4 border-t border-sand-300 pt-4">
            <DifficultyLadder />
          </div>
        </Card>
      </PageSection>

      <PageSection>
        <Panel className="p-6 sm:p-8">
          <div className="flex items-center gap-2.5">
            <Database className="size-4 text-secondary" aria-hidden />
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-secondary-soft">
              Phase 1 boundary
            </span>
          </div>
          <h2 className="mt-3 font-display text-lg font-semibold tracking-tight text-sand-50">
            What is real and what is mocked
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-sand-300/85">
            Phase 1 is a complete frontend with a mock data layer behind the service contracts.
            Nothing here talks to a network.
          </p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-md border border-ink-700 bg-ink-850 p-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-3.5 text-support" aria-hidden />
                <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-support">
                  Real in this build
                </span>
              </div>
              <ul className="mt-3 space-y-1.5 text-xs leading-relaxed text-sand-300/85">
                <li>Navigation, routing and every screen.</li>
                <li>The XP engine, including title unlocks.</li>
                <li>Submission, review and award flow.</li>
                <li>Help confirmations and mentor XP.</li>
                <li>Session persistence in the browser.</li>
              </ul>
            </div>
            <div className="rounded-md border border-ink-700 bg-ink-850 p-4">
              <div className="flex items-center gap-2">
                <Database className="size-3.5 text-secondary" aria-hidden />
                <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-secondary">
                  Arrives in Phase 2
                </span>
              </div>
              <ul className="mt-3 space-y-1.5 text-xs leading-relaxed text-sand-300/85">
                <li>Authentication and row-level security.</li>
                <li>Server-side XP functions.</li>
                <li>Real file and evidence storage.</li>
                <li>Live notifications.</li>
                <li>Leaderboard queries against real data.</li>
              </ul>
            </div>
          </div>
        </Panel>
      </PageSection>

      <PageSection>
        <Card className="border-primary-line p-6">
          <SectionHeading
            eyebrow="Demo session"
            title="Reset local state"
            description="Submissions you sent, XP you earned, votes you cast and drafts you created live in this browser. Reset puts everything back to the seeded hub."
          />
          <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-sand-300 pt-4">
            <Button
              variant="danger"
              tone="tech"
              onClick={() => {
                resetDemo();
                setResetDone(true);
                setSaved(false);
              }}
            >
              <RotateCcw className="size-4" aria-hidden />
              Reset demo data
            </Button>
            {resetDone ? (
              <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-support-deep">
                Reset to the seeded hub
              </span>
            ) : null}
            <Badge tone="neutral" className="ml-auto">
              Local storage only
            </Badge>
          </div>
        </Card>
      </PageSection>
    </PageContainer>
  );
}