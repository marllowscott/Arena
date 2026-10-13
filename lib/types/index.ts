/**
 * DEV ARENA — Domain model
 *
 * These types are the contract between the UI and whatever data source sits
 * behind it. Phase 1 serves them from `lib/services/mock`. Phase 2 will serve
 * the same shapes from Supabase repositories. Nothing in the UI should need to
 * change when that swap happens.
 */

export type Role = "developer" | "instructor";

export type PathwayId =
  | "builder"
  | "problem-solver"
  | "teacher"
  | "mentor"
  | "scout";

export type Difficulty = "starter" | "builder" | "advanced" | "expert" | "boss";

/* -------------------------------------------------------------------------- */
/* Identity                                                                   */
/* -------------------------------------------------------------------------- */

export interface Developer {
  id: string;
  name: string;
  handle: string;
  initials: string;
  role: Role;
  headline: string;
  primaryPathway: PathwayId;
  totalXp: number;
  weeklyXp: number;
  joinedAt: string;
  lastActiveAt: string;
  streakDays: number;
  focus: string;
  skills: string[];
  /** Two hex tokens used for the generated avatar tile. */
  avatarFrom: string;
  avatarTo: string;
  /** Supabase Storage public URL for uploaded avatar, if any. */
  avatarUrl?: string | null;
}

export interface Pathway {
  id: PathwayId;
  name: string;
  tagline: string;
  description: string;
  /** Key resolved to a Lucide icon by `components/shared/pathway-icon.tsx`. */
  icon: PathwayIconName;
  /** Short label used on cards and chips, e.g. "Problem Solver". */
  shortName: string;
  order: number;
  /** What this pathway is for, in one line. */
  promise: string;
}

export type PathwayIconName =
  | "hammer"
  | "bug"
  | "presentation"
  | "lifebuoy"
  | "compass";

export interface PathwayProgress {
  developerId: string;
  pathwayId: PathwayId;
  /** Pathway XP. Tracked separately from overall XP. */
  xp: number;
  currentTitle: Title;
  nextTitle: Title | null;
  /** 0 → 1 through the current title band. */
  progress: number;
  xpToNextTitle: number;
  recentAchievement: string;
}

export interface Title {
  id: string;
  pathwayId: PathwayId;
  name: string;
  /** 1-based position in the ladder. */
  tier: number;
  xpRequired: number;
  motto: string;
  /** Important titles require instructor confirmation before they are public. */
  requiresConfirmation: boolean;
}

/* -------------------------------------------------------------------------- */
/* XP                                                                         */
/* -------------------------------------------------------------------------- */

export type XpSource =
  | "challenge"
  | "teaching"
  | "help"
  | "scout"
  | "competition"
  | "adjustment";

export interface XpEvent {
  id: string;
  developerId: string;
  source: XpSource;
  xp: number;
  pathwayId: PathwayId;
  label: string;
  detail: string;
  createdAt: string;
}

/* -------------------------------------------------------------------------- */
/* Arena                                                                      */
/* -------------------------------------------------------------------------- */

export type ChallengeStatus =
  | "open"
  | "in-progress"
  | "submitted"
  | "under-review"
  | "completed"
  | "locked";

export type EvidenceKind = "repository" | "demo" | "screenshot" | "video" | "file";

export interface EvidenceRequirement {
  id: string;
  kind: EvidenceKind;
  label: string;
  required: boolean;
  hint: string;
}

export interface RubricCriterion {
  id: string;
  label: string;
  description: string;
  /** Relative weight, used to explain a suggested XP figure. */
  weight: number;
}

export interface Challenge {
  id: string;
  slug: string;
  title: string;
  /** Mission codename, e.g. "The Broken Gate". */
  codename: string;
  summary: string;
  pathwayId: PathwayId;
  difficulty: Difficulty;
  xp: number;
  estimatedEffort: string;
  deadline: string;
  status: ChallengeStatus;
  tags: string[];
  /** Mission briefing — what needs to be done. */
  mission: string;
  /** Why it matters — what skill it develops. */
  whyItMatters: string;
  requirements: string[];
  evidence: EvidenceRequirement[];
  explainPrompt: string;
  brokePrompt: string;
  rubric: RubricCriterion[];
  completions: number;
  /** Short reason shown on recommended mission cards. */
  recommendationReason: string;
  recommended: boolean;
}

export type SubmissionStatus = "pending" | "approved" | "adjusted" | "returned";

export interface EvidenceItem {
  id: string;
  kind: EvidenceKind;
  label: string;
  value: string;
}

export interface Submission {
  id: string;
  challengeId: string;
  developerId: string;
  status: SubmissionStatus;
  solution: string;
  evidence: EvidenceItem[];
  explainIt: string;
  whatBroke: string;
  howFixed: string;
  suggestedXp: number;
  awardedXp: number | null;
  reviewerNote: string | null;
  submittedAt: string;
  reviewedAt: string | null;
  rubric: RubricCriterion[];
}

/* -------------------------------------------------------------------------- */
/* Scout                                                                      */
/* -------------------------------------------------------------------------- */

export type OpportunityType =
  | "job"
  | "internship"
  | "apprenticeship"
  | "hackathon"
  | "scholarship"
  | "training"
  | "programme";

export type OpportunityStage =
  | "discover"
  | "verify"
  | "research"
  | "explain"
  | "share"
  | "act";

export type VerificationStatus = "verified" | "pending" | "unverified";

export interface Opportunity {
  id: string;
  organisation: string;
  role: string;
  type: OpportunityType;
  location: string;
  mode: "remote" | "hybrid" | "onsite";
  deadline: string;
  summary: string;
  skills: string[];
  technologies: string[];
  verification: VerificationStatus;
  verifiedBy: string | null;
  xpReward: number;
  stage: OpportunityStage;
  /** 0 → 1 across the six stage pipeline. */
  stageProgress: number;
  discoveredByCount: number;
  shares: number;
  source: string;
}

/* -------------------------------------------------------------------------- */
/* Teach                                                                      */
/* -------------------------------------------------------------------------- */

export type ProposalStatus =
  | "open"
  | "shortlisted"
  | "scheduled"
  | "declined"
  | "delivered";

export interface TeachingProposal {
  id: string;
  title: string;
  pathwayId: PathwayId;
  proposedById: string;
  summary: string;
  outcomes: string[];
  /** Developer ids who have voted. */
  voterIds: string[];
  interestedCount: number;
  status: ProposalStatus;
  sessionDate: string | null;
  xpReward: number;
  createdAt: string;
  reviewedBy: string | null;
}

/* -------------------------------------------------------------------------- */
/* Help                                                                       */
/* -------------------------------------------------------------------------- */

export type HelpStatus = "open" | "solved" | "closed" | "flagged";

export interface HelpAnswer {
  id: string;
  authorId: string;
  body: string;
  createdAt: string;
  confirmed: boolean;
  helpfulCount: number;
}

export interface HelpRequest {
  id: string;
  developerId: string;
  title: string;
  body: string;
  pathwayId: PathwayId;
  tags: string[];
  technologies: string[];
  createdAt: string;
  status: HelpStatus;
  urgency: "normal" | "blocking";
  answers: HelpAnswer[];
  confirmedAnswerId: string | null;
  flagged: boolean;
  flagReason: string | null;
  /** Set when a developer takes ownership. Exclusive: only one at a time. */
  acceptedBy: string | null;
  acceptedAt: string | null;
}

/* -------------------------------------------------------------------------- */
/* Progress surfaces                                                          */
/* -------------------------------------------------------------------------- */

export type AchievementKind =
  | "challenge"
  | "help"
  | "teaching"
  | "scout"
  | "project"
  | "title"
  | "streak";

export interface Achievement {
  id: string;
  developerId: string;
  kind: AchievementKind;
  title: string;
  detail: string;
  xp: number;
  icon: string;
  earnedAt: string;
  referenceId: string | null;
}

export type NotificationKind =
  | "xp"
  | "title"
  | "challenge"
  | "teaching"
  | "help"
  | "scout"
  | "review"
  | "system";

/** Named `ArenaNotification` to stay clear of the DOM `Notification` API. */
export interface ArenaNotification {
  id: string;
  developerId: string;
  kind: NotificationKind;
  headline: string;
  body: string;
  xp: number | null;
  href: string | null;
  createdAt: string;
  read: boolean;
}

export type { ArenaNotification as Notification };

export type InsightKind =
  | "strong-builder"
  | "consistent-helper"
  | "stuck"
  | "inactive"
  | "ready-for-unlock"
  | "teaching-demand";

export interface Insight {
  id: string;
  kind: InsightKind;
  title: string;
  body: string;
  /** Observations, never verdicts. */
  tone: "positive" | "watch" | "info";
  metric: string;
  developerIds: string[];
  pathwayId: PathwayId | null;
  raisedAt: string;
}

export type UnlockScope =
  | "teaching"
  | "reviews"
  | "scout"
  | "mentoring"
  | "arena";

export interface Unlock {
  id: string;
  title: string;
  description: string;
  scope: UnlockScope;
  requirements: string[];
  icon: string;
}

export interface DeveloperUnlock extends Unlock {
  developerId: string;
  earnedAt: string;
}

export type ActivityKind =
  | "challenge"
  | "help"
  | "teaching"
  | "scout"
  | "title"
  | "unlock";

export interface ActivityEvent {
  id: string;
  developerId: string;
  kind: ActivityKind;
  /** Rendered as "<Name> completed The Broken Gate." */
  message: string;
  xp: number | null;
  referenceId: string | null;
  createdAt: string;
}

export interface LeaderboardEntry {
  developerId: string;
  name: string;
  handle: string;
  initials: string;
  avatarFrom: string;
  avatarTo: string;
  title: string;
  pathwayId: PathwayId;
  totalXp: number;
  weeklyXp: number;
  movement: number;
  rank: number;
  previousRank: number;
  isCurrentDeveloper: boolean;
}

/* -------------------------------------------------------------------------- */
/* Instructor                                                                 */
/* -------------------------------------------------------------------------- */

export type LeaderboardTab = "movement" | "overall" | PathwayId;

export interface InstructorAttention {
  submissions: number;
  teaching: number;
  opportunities: number;
  help: number;
  titles: number;
  total: number;
}

export interface SubmissionDraft {
  challengeId: string;
  solution: string;
  evidence: EvidenceItem[];
  explainIt: string;
  whatBroke: string;
  howFixed: string;
}

export interface ReviewOutcome {
  submissionId: string;
  status: "approved" | "adjusted" | "returned";
  awardedXp: number;
  reviewerNote: string;
}

export interface DeveloperSummary {
  developer: Developer;
  pathways: PathwayProgress[];
  completedChallenges: number;
  pendingSubmissions: number;
  peopleHelped: number;
  topicsTaught: number;
  opportunitiesDiscovered: number;
  unlocks: DeveloperUnlock[];
  nextTitle: string;
  xpToNextTitle: number;
  lastActiveAt: string;
  flags: string[];
}