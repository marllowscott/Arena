import type { Opportunity } from "@/lib/types";
import { opportunities } from "@/lib/mock/opportunities";
import { OPPORTUNITY_PIPELINE } from "@/lib/progression";
import type { OpportunityService } from "../contracts";

export const opportunityService: OpportunityService = {
  pipeline: OPPORTUNITY_PIPELINE,

  list: (filter = {}): Opportunity[] => {
    const needle = filter.query?.trim().toLowerCase() ?? "";
    return opportunities
      .filter((opportunity) => {
        if (filter.type && filter.type !== "all" && opportunity.type !== filter.type) return false;
        if (!needle) return true;
        return [
          opportunity.organisation,
          opportunity.role,
          opportunity.summary,
          opportunity.location,
          ...opportunity.skills,
          ...opportunity.technologies,
        ]
          .join(" ")
          .toLowerCase()
          .includes(needle);
      })
      .sort((a, b) => {
        if (a.verification !== b.verification) return a.verification === "verified" ? -1 : 1;
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      });
  },

  byId: (id) => opportunities.find((opportunity) => opportunity.id === id) ?? null,
};