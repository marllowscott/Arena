import type {
  Achievement,
  ActivityEvent,
  ArenaNotification,
  XpEvent,
} from "@/lib/types";
import {
  achievements,
  hubActivity,
  notifications,
  personalActivity,
  xpEvents,
} from "@/lib/mock/activity";
import type { ProgressService } from "../contracts";

export const progressService: ProgressService = {
  xpEvents: (developerId: string): XpEvent[] =>
    xpEvents
      .filter((event) => event.developerId === developerId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),

  personalActivity: (developerId: string): ActivityEvent[] =>
    [...personalActivity]
      .filter((event) => event.developerId === developerId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),

  hubActivity: (limit = 10): ActivityEvent[] =>
    [...hubActivity]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit),

  notifications: (developerId: string): ArenaNotification[] =>
    notifications
      .filter((notification) => notification.developerId === developerId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),

  achievements: (developerId: string): Achievement[] =>
    achievements
      .filter((achievement) => achievement.developerId === developerId)
      .sort((a, b) => new Date(b.earnedAt).getTime() - new Date(a.earnedAt).getTime()),
};