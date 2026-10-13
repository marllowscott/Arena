import { Badge } from "@/components/ui/badge";
import { DIFFICULTY_META, formatXp } from "@/lib/format";
import type { Difficulty } from "@/lib/types";

const TONES: Record<Difficulty, "neutral" | "support" | "gold" | "primary" | "dark"> = {
  starter: "support",
  builder: "neutral",
  advanced: "gold",
  expert: "primary",
  boss: "dark",
};

export function DifficultyBadge({
  difficulty,
  xp,
  showXp = true,
  className,
}: {
  difficulty: Difficulty;
  xp?: number;
  showXp?: boolean;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ""}`}>
      <Badge tone={TONES[difficulty]}>{DIFFICULTY_META[difficulty].label}</Badge>
      {showXp && typeof xp === "number" ? (
        <span className="font-mono text-[11px] font-semibold tabular-nums text-primary">
          +{formatXp(xp)} XP
        </span>
      ) : null}
    </span>
  );
}

export function DifficultyLadder() {
  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">
      {(Object.keys(DIFFICULTY_META) as Difficulty[]).map((difficulty) => (
        <div key={difficulty} className="flex items-center justify-between gap-2">
          <dt>
            <DifficultyBadge difficulty={difficulty} showXp={false} />
          </dt>
          <dd className="font-mono text-[10px] tabular-nums text-ink-300">
            {DIFFICULTY_META[difficulty].range}
          </dd>
        </div>
      ))}
    </dl>
  );
}