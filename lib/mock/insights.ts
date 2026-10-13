import type { Insight } from "@/lib/types";
import { hoursAgo, daysAgo } from "./clock";

/**
 * Insights are observations about patterns, not verdicts about people. Every
 * card should leave the instructor with something to do, not someone to blame.
 */
export const insights: Insight[] = [
  {
    id: "ins-keith-imbalance",
    kind: "strong-builder",
    title: "Strong builder, quiet teacher",
    body: "Keith has completed 6 build missions but has never delivered a session. He is well placed to teach the deployment work he keeps doing twice.",
    tone: "positive",
    metric: "6 build missions · 0 sessions",
    developerIds: ["dev-keith"],
    pathwayId: "builder",
    raisedAt: hoursAgo(6),
  },
  {
    id: "ins-addisa-helper",
    kind: "consistent-helper",
    title: "Consistent helper",
    body: "Addisa helped 7 developers this week, mostly on query performance. Her Problem Solver XP is growing faster than her Builder XP.",
    tone: "positive",
    metric: "7 developers helped · 7 days",
    developerIds: ["dev-addisa"],
    pathwayId: "mentor",
    raisedAt: hoursAgo(2),
  },
  {
    id: "ins-api-stuck",
    kind: "stuck",
    title: "API integration is the wall",
    body: "3 developers are stuck on the same boundary: response shapes, error handling and row-level security. One focused session would clear all three.",
    tone: "watch",
    metric: "3 developers · 4 open requests",
    developerIds: ["dev-collins", "dev-william", "dev-rudo"],
    pathwayId: "problem-solver",
    raisedAt: hoursAgo(9),
  },
  {
    id: "ins-william-inactive",
    kind: "inactive",
    title: "Quiet for a week",
    body: "William has not completed an activity in 8 days. He left a help request 20 hours ago, so he is present but not progressing. Worth a direct conversation, not a reminder.",
    tone: "watch",
    metric: "8 days since last mission",
    developerIds: ["dev-william"],
    pathwayId: null,
    raisedAt: hoursAgo(3),
  },
  {
    id: "ins-collins-mentor",
    kind: "ready-for-unlock",
    title: "Collins is close to Guide",
    body: "140 XP from Guide in the Mentor pathway, with two confirmed help answers this month. Two unblocked developers would take him there.",
    tone: "positive",
    metric: "80 / 220 pathway XP",
    developerIds: ["dev-collins"],
    pathwayId: "mentor",
    raisedAt: hoursAgo(4),
  },
  {
    id: "ins-teaching-demand",
    kind: "teaching-demand",
    title: "React Native Navigation has no session",
    body: "12 developers have asked for this topic and it is not scheduled. Tafadzwa has volunteered to run it and is ready to deliver.",
    tone: "info",
    metric: "12 interested · 0 scheduled",
    developerIds: ["dev-tafadzwa"],
    pathwayId: "teacher",
    raisedAt: daysAgo(1),
  },
];

export const insightsByKind = {
  strongBuilder: insights.filter((insight) => insight.kind === "strong-builder"),
  consistentHelper: insights.filter((insight) => insight.kind === "consistent-helper"),
  stuck: insights.filter((insight) => insight.kind === "stuck"),
  inactive: insights.filter((insight) => insight.kind === "inactive"),
  readyForUnlock: insights.filter((insight) => insight.kind === "ready-for-unlock"),
};