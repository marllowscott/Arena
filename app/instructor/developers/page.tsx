import type { Metadata } from "next";
import { Users } from "lucide-react";
import { PageHeader } from "@/components/shared/section-heading";
import { EmptyState } from "@/components/shared/empty-state";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatXp, relativeTime } from "@/lib/format";
import { levelForXp } from "@/lib/progression";
import { nowMs } from "@/lib/arena/clock";
import { leaderboard, xpEventsFor } from "@/lib/arena/data";
import { requireInstructor } from "@/lib/arena/session";

export const metadata: Metadata = {
  title: "Developers",
  description: "Developer progress across the roster.",
};

export default async function InstructorDevelopersPage() {
  await requireInstructor();
  const roster = await leaderboard();

  if (roster.length === 0) {
    return (
      <div className="px-4 py-8 sm:px-6">
        <EmptyState
          icon={Users}
          title="No developers yet"
          body="Developers appear here as soon as they create an account and claim their first activity."
        />
      </div>
    );
  }

  return (
    <div className="px-4 py-8 sm:px-6">
      <PageHeader
        eyebrow="Roster"
        title="Developers"
        description="Every profile, ranked by total XP. XP only moves when you approve work — so this board is a record of reviewed output."
      />

      <ul className="mt-8 grid gap-4 md:grid-cols-2">
        {roster.map((developer, index) => (
          <DeveloperCard
            key={developer.id}
            developer={developer}
            rank={index + 1}
          />
        ))}
      </ul>
    </div>
  );
}

async function DeveloperCard({
  developer,
  rank,
}: {
  developer: Awaited<ReturnType<typeof leaderboard>>[number];
  rank: number;
}) {
  const recentXp = await xpEventsFor(developer.id, 3);
  const level = levelForXp(developer.total_xp);

  return (
    <li className="rounded-lg border border-sand-300 bg-sand-50 p-4 shadow-subtle">
      <div className="flex items-center gap-3">
        <span className="font-display text-lg font-bold tabular-nums text-ink-300">
          #{rank}
        </span>
        <Avatar
          initials={developer.full_name
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0]?.toUpperCase() ?? "")
            .join("") || developer.handle.slice(0, 2).toUpperCase()}
          name={developer.full_name}
          from={developer.avatar_from}
          to={developer.avatar_to}
          size="md"
        />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium text-ink-900">
            {developer.full_name}
          </div>
          <div className="truncate font-mono text-[10px] uppercase tracking-[0.1em] text-ink-300">
            @{developer.handle}
          </div>
        </div>
        <Badge tone="outline">Level {level.level}</Badge>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-sand-300 pt-3">
        <div>
          <div className="font-display text-xl font-bold tabular-nums text-primary">
            {formatXp(developer.total_xp)}
          </div>
          <div className="font-mono text-[9px] uppercase tracking-[0.1em] text-ink-300">
            total XP · +{formatXp(developer.weekly_xp)} this week
          </div>
        </div>
        <div className="text-right">
          {recentXp.length > 0 ? (
            <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-400">
              last award{" "}
              {relativeTime(recentXp[0].created_at, nowMs())}
            </div>
          ) : (
            <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-400">
              no XP yet
            </div>
          )}
        </div>
      </div>
    </li>
  );
}
