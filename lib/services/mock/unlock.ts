import type { DeveloperUnlock, Unlock } from "@/lib/types";
import {
  lockedUnlocksFor,
  unlockCatalogue,
  unlocksFor,
} from "@/lib/mock/unlocks";
import type { UnlockService } from "../contracts";

export const unlockService: UnlockService = {
  catalogue: (): Unlock[] => unlockCatalogue,
  earned: (developerId: string): DeveloperUnlock[] => unlocksFor(developerId),
  locked: (developerId: string): Unlock[] => lockedUnlocksFor(developerId),
};