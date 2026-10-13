import type { Pathway, PathwayId, Title } from "@/lib/types";
import { pathways, titles } from "@/lib/mock/pathways";
import type { PathwayService } from "../contracts";

export const pathwayService: PathwayService = {
  list: (): Pathway[] => pathways,
  byId: (id: PathwayId) => pathways.find((pathway) => pathway.id === id) ?? null,
  titles: (pathwayId?: PathwayId): Title[] =>
    pathwayId ? titles.filter((title) => title.pathwayId === pathwayId) : titles,
};