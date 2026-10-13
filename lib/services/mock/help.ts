import type { HelpRequest, PathwayId } from "@/lib/types";
import { helpRequests } from "@/lib/mock/help";
import { developersById } from "@/lib/mock/developers";
import type { HelpRequestDetail, HelpService } from "../contracts";

function decorate(request: HelpRequest): HelpRequestDetail {
  const developer = developersById[request.developerId];
  const helper = request.acceptedBy ? developersById[request.acceptedBy] : undefined;
  return {
    ...request,
    developerName: developer?.name ?? "A developer",
    developerInitials: developer?.initials ?? "??",
    acceptedByName: helper?.name ?? null,
    acceptedByInitials: helper?.initials ?? null,
  };
}

export const helpService: HelpService = {
  list: (filter = {}): HelpRequestDetail[] =>
    helpRequests
      .filter((request) => {
        if (filter.pathwayId && request.pathwayId !== filter.pathwayId) return false;
        if (filter.status && request.status !== filter.status) return false;
        return true;
      })
      .sort((a, b) => {
        const rank: Record<HelpRequest["status"], number> = { open: 0, flagged: 1, solved: 2, closed: 3 };
        if (rank[a.status] !== rank[b.status]) return rank[a.status] - rank[b.status];
        if (a.urgency !== b.urgency) return a.urgency === "blocking" ? -1 : 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      })
      .map(decorate),

  byId: (id) => {
    const request = helpRequests.find((item) => item.id === id);
    return request ? decorate(request) : null;
  },
};

export type { PathwayId };