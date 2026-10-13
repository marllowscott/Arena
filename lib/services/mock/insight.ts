import type { Insight } from "@/lib/types";
import { insights } from "@/lib/mock/insights";
import type { InsightService } from "../contracts";

export const insightService: InsightService = {
  list: (): Insight[] =>
    [...insights].sort((a, b) => {
      const rank = { watch: 0, info: 1, positive: 2 } as const;
      if (rank[a.tone] !== rank[b.tone]) return rank[a.tone] - rank[b.tone];
      return new Date(b.raisedAt).getTime() - new Date(a.raisedAt).getTime();
    }),
};