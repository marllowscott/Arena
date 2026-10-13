import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Title } from "@/lib/types";

/**
 * Titles are always shown with their ladder position so progress feels
 * continuous rather than absolute.
 */
export function TitleBadge({
  title,
  tone = "outline",
  showTier = true,
  className,
}: {
  title: Title | string;
  tone?: "outline" | "solid" | "gold" | "neutral" | "dark";
  showTier?: boolean;
  className?: string;
}) {
  const tier = typeof title === "string" ? undefined : title.tier;
  const name = typeof title === "string" ? title : title.name;
  const total = typeof title === "string" ? undefined : LADDER_SIZE[title.pathwayId];

  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <Badge tone={tone} className="normal-case tracking-[0.08em]">
        {name}
      </Badge>
      {showTier && tier && total ? (
        <span className="font-mono text-[10px] tabular-nums text-ink-300">
          {String(tier).padStart(2, "0")}/{total}
        </span>
      ) : null}
    </span>
  );
}

const LADDER_SIZE: Record<Title["pathwayId"], number> = {
  builder: 6,
  "problem-solver": 6,
  teacher: 6,
  mentor: 6,
  scout: 6,
};