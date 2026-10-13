import type { TeachingProposal } from "@/lib/types";
import { teachingProposals } from "@/lib/mock/teaching";
import { developersById } from "@/lib/mock/developers";
import { CURRENT_DEVELOPER_ID } from "@/lib/mock/pathways";
import type { TeachingProposalWithAuthor, TeachingService } from "../contracts";

function decorate(proposal: TeachingProposal): TeachingProposalWithAuthor {
  const author = developersById[proposal.proposedById];
  return {
    ...proposal,
    authorName: author?.name ?? "A developer",
    authorInitials: author?.initials ?? "??",
    hasVoted: proposal.voterIds.includes(CURRENT_DEVELOPER_ID),
  };
}

export const teachingService: TeachingService = {
  proposals: (): TeachingProposalWithAuthor[] =>
    [...teachingProposals]
      .sort((a, b) => {
        const rank = { open: 0, shortlisted: 1, scheduled: 2, delivered: 3, declined: 4 };
        if (rank[a.status] !== rank[b.status]) return rank[a.status] - rank[b.status];
        return b.interestedCount - a.interestedCount;
      })
      .map(decorate),

  byId: (id) => {
    const proposal = teachingProposals.find((item) => item.id === id);
    return proposal ? decorate(proposal) : null;
  },
};