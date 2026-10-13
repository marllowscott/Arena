import type {
  Achievement,
  ActivityEvent,
  ArenaNotification,
  Challenge,
  ChallengeStatus,
  Developer,
  DeveloperSummary,
  Difficulty,
  HelpRequest,
  InstructorAttention,
  LeaderboardEntry,
  LeaderboardTab,
  Opportunity,
  OpportunityStage,
  Pathway,
  PathwayId,
  PathwayProgress,
  ReviewOutcome,
  Submission,
  SubmissionDraft,
  TeachingProposal,
  Title,
  Unlock,
  DeveloperUnlock,
  Insight,
  XpEvent,
} from "@/lib/types";
import type { OPPORTUNITY_PIPELINE } from "@/lib/progression";

/**
 * SERVICE BOUNDARY
 *
 * Phase 1: every contract below is satisfied by the read-only mock repositories
 * in `./mock`. Phase 2: each mock file is replaced by a Supabase repository
 * returning the same shapes. Components do not change; only this layer does.
 *
 * Mutations are intentionally *not* part of these read contracts. They live on
 * the session provider (`hooks/dev-arena-provider.tsx`), which is the one place
 * that knows about local optimistic state until the database exists.
 */

export interface DeveloperRecord extends Developer {
  pathwayXp: Record<PathwayId, number>;
  weeklyMovement: number;
}

export interface CurrentDeveloper {
  developer: DeveloperRecord;
  pathways: PathwayProgress[];
  primaryPathway: Pathway;
  currentTitle: Title;
  nextTitle: Title | null;
  xpToNextTitle: number;
  /** Pathway XP is tracked separately from overall XP. */
  pathwayXpTotal: number;
}

export interface ChallengeFilter {
  pathwayId?: PathwayId;
  difficulty?: Difficulty;
  status?: ChallengeStatus;
  query?: string;
}

export interface LeaderboardSnapshot {
  tab: LeaderboardTab;
  entries: LeaderboardEntry[];
  currentEntry: LeaderboardEntry | null;
}

export interface SubmissionResult {
  submission: Submission;
  xpPending: number;
}

export interface TeachingProposalWithAuthor extends TeachingProposal {
  authorName: string;
  authorInitials: string;
  hasVoted: boolean;
}

export interface HelpRequestDetail extends HelpRequest {
  developerName: string;
  developerInitials: string;
  /** Name of the developer who accepted, when the probe is being helped. */
  acceptedByName: string | null;
  acceptedByInitials: string | null;
}

export interface DeveloperService {
  list(): DeveloperRecord[];
  current(): CurrentDeveloper;
  byId(id: string): DeveloperRecord | null;
  pathwayProgress(developerId: string): PathwayProgress[];
  summary(developerId: string): DeveloperSummary;
  attention(): InstructorAttention;
}

export interface PathwayService {
  list(): Pathway[];
  byId(id: PathwayId): Pathway | null;
  titles(pathwayId?: PathwayId): Title[];
}

export interface ChallengeService {
  list(filter?: ChallengeFilter): Challenge[];
  byId(id: string): Challenge | null;
  bySlug(slug: string): Challenge | null;
  recommended(limit?: number): Challenge[];
}

export interface SubmissionService {
  all(): Submission[];
  queue(): Submission[];
  forDeveloper(developerId: string): Submission[];
  forChallenge(challengeId: string): Submission[];
}

export interface OpportunityService {
  list(filter?: { type?: string; query?: string }): Opportunity[];
  byId(id: string): Opportunity | null;
  pipeline: typeof OPPORTUNITY_PIPELINE;
}

export interface TeachingService {
  proposals(): TeachingProposalWithAuthor[];
  byId(id: string): TeachingProposalWithAuthor | null;
}

export interface HelpService {
  list(filter?: { pathwayId?: PathwayId; status?: HelpRequest["status"] }): HelpRequestDetail[];
  byId(id: string): HelpRequestDetail | null;
}

export interface ProgressService {
  xpEvents(developerId: string): XpEvent[];
  personalActivity(developerId: string): ActivityEvent[];
  hubActivity(limit?: number): ActivityEvent[];
  notifications(developerId: string): ArenaNotification[];
  achievements(developerId: string): Achievement[];
}

export interface InsightService {
  list(): Insight[];
}

export interface UnlockService {
  catalogue(): Unlock[];
  earned(developerId: string): DeveloperUnlock[];
  locked(developerId: string): Unlock[];
}

export interface LeaderboardService {
  snapshot(tab: LeaderboardTab, currentDeveloperId?: string): LeaderboardSnapshot;
}

export interface ArenaServices {
  developers: DeveloperService;
  pathways: PathwayService;
  challenges: ChallengeService;
  submissions: SubmissionService;
  opportunities: OpportunityService;
  teaching: TeachingService;
  help: HelpService;
  progress: ProgressService;
  insights: InsightService;
  unlocks: UnlockService;
  leaderboard: LeaderboardService;
}

/** Mutation payloads. Implemented locally in Phase 1, by RPC in Phase 2. */
export type SubmissionReviewCommand = ReviewOutcome;
export type MissionSubmissionCommand = SubmissionDraft;
export type HelpAnswerCommand = { helpRequestId: string; body: string };
export type HelpConfirmCommand = { helpRequestId: string; answerId: string };
export type ProposalVoteCommand = { proposalId: string };
export type OpportunityStageCommand = { opportunityId: string; stage: OpportunityStage };
export type TitleConfirmCommand = { developerId: string; titleId: string };