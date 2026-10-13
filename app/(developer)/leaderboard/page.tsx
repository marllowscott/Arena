import type { Metadata } from "next";
import { Trophy } from "lucide-react";
import { PageHeader } from "@/components/shared/section-heading";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { formatXp, relativeTime } from "@/lib/format";
import { levelForXp } from "@/lib/progression";
import { nowMs } from "@/lib/arena/clock";
import { leaderboard } from "@/lib/arena/data";
import { requireDeveloper } from "@/lib/arena/session";

export const metadata: Metadata = {
  title: "Leaderboard",
  description: "Where you stand among the developers.",
};

export default async function LeaderboardPage() {
  const session = await requireDeveloper();
  const profile = session.profile!;
  const entries = await leaderboard();

  if (entries.length === 0) {
    return (
      <div className="px-4 py-8 sm:px-6">
        <EmptyState
          icon={Trophy}
          title="No developers yet"
          body="The leaderboard populates as developers join and earn XP."
        />
      </div>
    );
  }

  const myRank = entries.findIndex((entry) => entry.id === profile.id) + 1;

  return (
    <div className="px-4 py-8 sm:px-6">
      <PageHeader
        eyebrow="Standings"
        title="Leaderboard"
        description="Ranked by total XP. XP is awarded by the instructor when work is approved — never for claiming, clicking or submitting alone."
        meta={
          myRank > 0 ? (
            <Badge tone="primary" size="lg">
              You are #{myRank}
            </Badge>
          ) : undefined
        }
      />

      <ol className="mt-8 space-y-2">
        {entries.map((entry, index) => {
          const rank = index + 1;
          const level = levelForXp(entry.total_xp);
          const isMe = entry.id === profile.id;

          return (
            <li key={entry.id}>
              <div
                className={`flex items-center gap-3 rounded-lg border px-4 py-3 ${
                  isMe
                    ? "border-primary-line bg-primary-tint shadow-subtle"
                    : "border-sand-300 bg-sand-50 shadow-subtle"
                }`}
              >
                <span
                  className={`w-10 shrink-0 text-center font-display text-lg font-bold tabular-nums ${
                    rank <= 3 ? "text-secondary-muted" : "text-ink-300"
                  }`}
                >
                  {rank}
                </span>
                <Avatar
                  initials={entry.full_name
                    .split(/\s+/)
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((part) => part[0]?.toUpperCase() ?? "")
                    .join("") || entry.handle.slice(0, 2).toUpperCase()}
                  name={entry.full_name}
                  from={entry.avatar_from}
                  to={entry.avatar_to}
                  size="sm"
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-ink-800">
                    {entry.full_name}
                    {isMe ? " (you)" : ""}
                  </div>
                  <div className="truncate font-mono text-[10px] uppercase tracking-[0.1em] text-ink-300">
                    @{entry.handle} · Level {level.level}
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="font-display text-base font-bold tabular-nums text-primary">
                    {formatXp(entry.total_xp)}
                  </div>
                  <div className="font-mono text-[9px] uppercase tracking-[0.1em] text-ink-300">
                    XP · +{formatXp(entry.weekly_xp)} wk
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-300">
        Last updated {relativeTime(new Date().toISOString(), nowMs())}
      </p>
    </div>
  );
}
