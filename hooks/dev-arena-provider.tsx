"use client";

import * as React from "react";
import type {
  Achievement,
  ActivityEvent,
  ArenaNotification,
  Challenge,
  Difficulty,
  Opportunity,
  OpportunityStage,
  PathwayId,
  ReviewOutcome,
  Submission,
  SubmissionDraft,
  Title,
  XpEvent,
  XpSource,
} from "@/lib/types";
import { OPPORTUNITY_PIPELINE, buildPathwayProgress, levelForXp, titleForXp } from "@/lib/progression";
import type { LevelProgress } from "@/lib/progression";
import type { HelpRequestDetail, TeachingProposalWithAuthor } from "@/lib/services/contracts";
import { CURRENT_DEVELOPER_ID, currentDeveloperFor, services } from "@/lib/services";

const STORAGE_KEY = "dev-arena.session.v1";
const IDENTITY_KEY = "dev-arena.identity.v1";

export interface XpGain {
  id: number;
  xp: number;
  label: string;
  pathwayId: PathwayId;
}

interface SessionState {
  /** Who is signed in. Set by the login screen, persisted with the session. */
  developerId: string;
  totalXp: number;
  weeklyXp: number;
  pathwayXp: Record<PathwayId, number>;
  xpEvents: XpEvent[];
  achievements: Achievement[];
  personalActivity: ActivityEvent[];
  hubActivity: ActivityEvent[];
  notifications: ArenaNotification[];
  submissions: Submission[];
  proposals: TeachingProposalWithAuthor[];
  helpRequests: HelpRequestDetail[];
  opportunities: Opportunity[];
  challenges: Challenge[];
  acceptedMissions: string[];
  xpGains: XpGain[];
  pendingReveal: Title | null;
  sequence: number;
}

function buildSession(developerId = CURRENT_DEVELOPER_ID): SessionState {
  const current = currentDeveloperFor(developerId);
  const id = current.developer.id;

  return {
    developerId: id,
    totalXp: current.developer.totalXp,
    weeklyXp: current.developer.weeklyXp,
    pathwayXp: { ...current.developer.pathwayXp },
    xpEvents: services.progress.xpEvents(id),
    achievements: services.progress.achievements(id),
    personalActivity: services.progress.personalActivity(id),
    hubActivity: services.progress.hubActivity(10),
    notifications: services.progress.notifications(id),
    submissions: services.submissions.all(),
    proposals: services.teaching.proposals(),
    helpRequests: services.help.list(),
    opportunities: services.opportunities.list(),
    challenges: services.challenges.list(),
    acceptedMissions: [],
    xpGains: [],
    pendingReveal: null,
    sequence: 0,
  };
}

function uid(prefix: string, sequence: number) {
  return `${prefix}-${Date.now().toString(36)}-${sequence}`;
}

export interface NewChallengeInput {
  title: string;
  pathwayId: PathwayId;
  difficulty: Difficulty;
  xp: number;
  estimatedEffort: string;
  summary: string;
  mission: string;
}

const DEFAULT_RUBRIC = [
  { id: "draft-works", label: "Works", description: "The solution runs as described.", weight: 40 },
  {
    id: "draft-explain",
    label: "Explained",
    description: "The reasoning is followable by another developer.",
    weight: 35,
  },
  {
    id: "draft-broken",
    label: "Diagnosed",
    description: "The failure is described accurately.",
    weight: 25,
  },
];

interface ArenaContextValue extends SessionState {
  hydrated: boolean;
  /** Null until somebody signs in. The gate reads this. */
  identity: string | null;
  current: ReturnType<typeof services.developers.current>;
  pathways: ReturnType<typeof services.developers.pathwayProgress>;
  level: LevelProgress;
  isAccepted: (challengeId: string) => boolean;
  submissionFor: (challengeId: string) => Submission | undefined;
  unreadCount: number;
  acceptMission: (challengeId: string) => void;
  submitMission: (draft: SubmissionDraft) => { submissionId: string; xpPending: number };
  reviewSubmission: (outcome: ReviewOutcome) => void;
  respondToHelp: (helpRequestId: string, body: string) => void;
  confirmHelpAnswer: (helpRequestId: string, answerId: string) => void;
  acceptProbe: (helpRequestId: string) => void;
  releaseProbe: (helpRequestId: string) => void;
  voteProposal: (proposalId: string) => void;
  proposeTopic: (input: { title: string; pathwayId: PathwayId; summary: string }) => void;
  createChallenge: (input: NewChallengeInput) => void;
  advanceOpportunity: (opportunityId: string, stage: OpportunityStage) => void;
  markNotificationsRead: () => void;
  dismissReveal: () => void;
  resetDemo: () => void;
  signInAs: (developerId: string) => void;
  signOut: () => void;
}

const ArenaContext = React.createContext<ArenaContextValue | null>(null);

function readStoredSession(): Partial<SessionState> | null {
  if (typeof window === "undefined") return null;
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;
    const parsed = JSON.parse(saved) as Partial<SessionState>;
    if (!parsed || typeof parsed.totalXp !== "number") return null;
    return parsed;
  } catch {
    /* A corrupt or unavailable store is not worth failing the session over. */
    return null;
  }
}

function persistSession(state: SessionState) {
  try {
    const persistable: Record<string, unknown> = { ...state };
    /* `xpGains` and `pendingReveal` are per-visit UI, not session state. */
    delete persistable.xpGains;
    delete persistable.pendingReveal;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(persistable));
  } catch {
    /* Storage is optional. The session still works in memory. */
  }
}

/* Who is signed in, kept apart from the XP session. A stored XP total on its own
   must not count as a sign-in, so these are separate keys on purpose. */
function readIdentity(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(IDENTITY_KEY);
  } catch {
    return null;
  }
}

function writeIdentity(developerId: string | null) {
  try {
    if (developerId) window.localStorage.setItem(IDENTITY_KEY, developerId);
    else window.localStorage.removeItem(IDENTITY_KEY);
  } catch {
    /* Storage is optional. The session still works in memory. */
  }
}

/* -------------------------------------------------------------------------- */
/* Session store                                                              */
/* -------------------------------------------------------------------------- */

/* The saved session lives outside React, so `useSyncExternalStore` can hand the
 * server the seed snapshot during hydration and the real one immediately after.
 * Reading it into `useState` instead would render the restored session on the
 * very first client pass, which does not match the server HTML. */

const SERVER_SNAPSHOT = buildSession(CURRENT_DEVELOPER_ID);
let snapshot: SessionState = SERVER_SNAPSHOT;
let snapshotInitialised = false;
const listeners = new Set<() => void>();

function getSnapshot(): SessionState {
  if (!snapshotInitialised) {
    snapshotInitialised = true;
    const saved = readStoredSession();
    if (saved) {
      snapshot = {
        ...buildSession(saved.developerId ?? CURRENT_DEVELOPER_ID),
        ...saved,
        xpGains: [],
        pendingReveal: null,
      };
    }
  }
  return snapshot;
}

/** Stable reference — React compares this against the client snapshot. */
function getServerSnapshot(): SessionState {
  return SERVER_SNAPSHOT;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function commit(next: SessionState) {
  snapshot = next;
  persistSession(next);
  listeners.forEach((listener) => listener());
}

/** Accepts a recipe, matching the `useState` shape the actions were written in. */
function update(recipe: (prev: SessionState) => SessionState) {
  commit(recipe(snapshot));
}

export function DevArenaProvider({ children }: { children: React.ReactNode }) {
  const state = React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const hydrated = React.useSyncExternalStore(
    subscribe,
    () => snapshotInitialised && readStoredSession() !== null,
    () => false,
  );
  const identity = React.useSyncExternalStore(subscribe, readIdentity, () => null);

  /* The signed-in identity, rather than the hard-coded default. Everything in
     this provider reads this instead, so signing in as somebody else is a state
     change rather than a code change. */
  const me = state.developerId;

  const current = React.useMemo(() => {
    const base = currentDeveloperFor(state.developerId);
    return {
      ...base,
      developer: { ...base.developer, totalXp: state.totalXp, weeklyXp: state.weeklyXp },
    };
  }, [state.developerId, state.totalXp, state.weeklyXp]);

  const pathways = React.useMemo(
    () =>
      services.pathways.list().map((pathway) =>
        buildPathwayProgress({
          developerId: me,
          pathwayId: pathway.id,
          xp: state.pathwayXp[pathway.id],
          titles: services.pathways.titles(pathway.id),
          recentAchievement: recentAchievementFor(me, pathway.id),
        }),
      ),
    [state.pathwayXp, me],
  );

  const challenges = state.challenges;

  /* --------------------------------------------------------------------- */
  /* XP engine — mock. Phase 2 replaces this block with a database RPC.     */
  /* --------------------------------------------------------------------- */
  function award(input: {
    xp: number;
    source: XpSource;
    pathwayId: PathwayId;
    label: string;
    detail: string;
  }) {
    update((prev) => {
      const sequence = prev.sequence + 1;
      const now = new Date().toISOString();

      const titles = services.pathways.titles(input.pathwayId);
      const titleBefore = titleForXp(titles, prev.pathwayXp[input.pathwayId]);
      const titleAfter = titleForXp(titles, prev.pathwayXp[input.pathwayId] + input.xp);

      const event: XpEvent = {
        id: uid("xp", sequence),
        developerId: me,
        source: input.source,
        xp: input.xp,
        pathwayId: input.pathwayId,
        label: input.label,
        detail: input.detail,
        createdAt: now,
      };

      const activity: ActivityEvent = {
        id: uid("act", sequence),
        developerId: me,
        kind: input.source === "help" ? "help" : input.source === "teaching" ? "teaching" : input.source === "scout" ? "scout" : "challenge",
        message: input.detail,
        xp: input.xp,
        referenceId: null,
        createdAt: now,
      };

      const notification: ArenaNotification = {
        id: uid("nt", sequence),
        developerId: me,
        kind: input.source === "teaching" ? "teaching" : input.source === "scout" ? "scout" : "xp",
        headline: `+${input.xp} XP`,
        body: input.detail,
        xp: input.xp,
        href: null,
        createdAt: now,
        read: false,
      };

      const unlockedAchievement: Achievement[] =
        titleAfter.id !== titleBefore.id
          ? [
              {
                id: uid("ach", sequence),
                developerId: me,
                kind: "title",
                title: titleAfter.name,
                detail: `Unlocked in ${services.pathways.byId(input.pathwayId)?.name}. ${titleAfter.motto}`,
                xp: 0,
                icon: "trophy",
                earnedAt: now,
                referenceId: titleAfter.id,
              },
            ]
          : [];

      return {
        ...prev,
        sequence,
        totalXp: prev.totalXp + input.xp,
        weeklyXp: prev.weeklyXp + input.xp,
        pathwayXp: { ...prev.pathwayXp, [input.pathwayId]: prev.pathwayXp[input.pathwayId] + input.xp },
        xpEvents: [event, ...prev.xpEvents],
        personalActivity: [activity, ...prev.personalActivity],
        hubActivity: [activity, ...prev.hubActivity].slice(0, 12),
        notifications: [notification, ...prev.notifications],
        achievements: [...unlockedAchievement, ...prev.achievements],
        xpGains: [
          ...prev.xpGains,
          { id: sequence, xp: input.xp, label: input.label, pathwayId: input.pathwayId },
        ].slice(-3),
        pendingReveal: titleAfter.id !== titleBefore.id ? titleAfter : prev.pendingReveal,
      };
    });
  }

  /* --------------------------------------------------------------------- */

  function acceptMission(challengeId: string) {
    update((prev) =>
      prev.acceptedMissions.includes(challengeId)
        ? prev
        : { ...prev, acceptedMissions: [...prev.acceptedMissions, challengeId] },
    );
  }

  function submitMission(draft: SubmissionDraft) {
    const challenge = services.challenges.byId(draft.challengeId);
    const id = uid("sub", state.sequence + 1);
    const submission: Submission = {
      id,
      challengeId: draft.challengeId,
      developerId: me,
      status: "pending",
      solution: draft.solution,
      evidence: draft.evidence,
      explainIt: draft.explainIt,
      whatBroke: draft.whatBroke,
      howFixed: draft.howFixed,
      suggestedXp: challenge?.xp ?? 0,
      awardedXp: null,
      reviewerNote: null,
      submittedAt: new Date().toISOString(),
      reviewedAt: null,
      rubric: challenge?.rubric ?? [],
    };

    update((prev) => ({
      ...prev,
      submissions: [submission, ...prev.submissions],
      acceptedMissions: prev.acceptedMissions.includes(draft.challengeId)
        ? prev.acceptedMissions
        : [...prev.acceptedMissions, draft.challengeId],
      notifications: [
        {
          id: id.replace("sub", "nt"),
          developerId: me,
          kind: "review",
          headline: "Mission submitted",
          body: `${challenge?.title ?? "Mission"} is with the instructor. XP lands when it is approved.`,
          xp: null,
          href: challenge ? `/arena/${challenge.slug}` : "/arena",
          createdAt: new Date().toISOString(),
          read: false,
        },
        ...prev.notifications,
      ],
    }));

    return { submissionId: id, xpPending: submission.suggestedXp };
  }

  function reviewSubmission(outcome: ReviewOutcome) {
    update((prev) => {
      const submission = prev.submissions.find((item) => item.id === outcome.submissionId);
      if (!submission) return prev;
      const challenge = services.challenges.byId(submission.challengeId);
      const isDeveloper = submission.developerId === me;
      const now = new Date().toISOString();

      const updated: Submission = {
        ...submission,
        status: outcome.status,
        awardedXp: outcome.status === "returned" ? null : outcome.awardedXp,
        reviewerNote: outcome.reviewerNote,
        reviewedAt: now,
      };

      let next: SessionState = {
        ...prev,
        sequence: prev.sequence + 1,
        submissions: prev.submissions.map((item) =>
          item.id === outcome.submissionId ? updated : item,
        ),
        notifications: [
          {
            id: uid("nt", prev.sequence + 1),
            developerId: submission.developerId,
            kind: "review",
            headline:
              outcome.status === "returned"
                ? "Mission returned"
                : `+${outcome.awardedXp} XP`,
            body:
              outcome.status === "returned"
                ? `${challenge?.title ?? "Mission"} was returned for another pass. ${outcome.reviewerNote}`
                : `${challenge?.title ?? "Mission"} reviewed. ${outcome.reviewerNote}`,
            xp: outcome.status === "returned" ? null : outcome.awardedXp,
            href: challenge ? `/arena/${challenge.slug}` : "/arena",
            createdAt: now,
            read: false,
          },
          ...prev.notifications,
        ],
      };

      if (outcome.status === "approved" || outcome.status === "adjusted") {
        const pathwayId = challenge?.pathwayId ?? "builder";
        const titles = services.pathways.titles(pathwayId);
        const titleBefore = titleForXp(titles, prev.pathwayXp[pathwayId]);
        const titleAfter = titleForXp(titles, prev.pathwayXp[pathwayId] + outcome.awardedXp);
        const xpEvent: XpEvent = {
          id: uid("xp", prev.sequence + 1),
          developerId: submission.developerId,
          source: "challenge",
          xp: outcome.awardedXp,
          pathwayId,
          label: challenge?.title ?? "Mission",
          detail:
            outcome.status === "adjusted"
              ? `Approved with adjusted XP. ${outcome.reviewerNote}`
              : `Approved. ${outcome.reviewerNote}`,
          createdAt: now,
        };

        next = {
          ...next,
          totalXp: isDeveloper ? next.totalXp + outcome.awardedXp : next.totalXp,
          weeklyXp: isDeveloper ? next.weeklyXp + outcome.awardedXp : next.weeklyXp,
          pathwayXp: isDeveloper
            ? { ...next.pathwayXp, [pathwayId]: next.pathwayXp[pathwayId] + outcome.awardedXp }
            : next.pathwayXp,
          xpEvents: isDeveloper ? [xpEvent, ...next.xpEvents] : next.xpEvents,
          achievements:
            isDeveloper && titleAfter.id !== titleBefore.id
              ? [
                  {
                    id: uid("ach", prev.sequence + 1),
                    developerId: me,
                    kind: "title",
                    title: titleAfter.name,
                    detail: `Unlocked in ${services.pathways.byId(pathwayId)?.name}. ${titleAfter.motto}`,
                    xp: 0,
                    icon: "trophy",
                    earnedAt: now,
                    referenceId: titleAfter.id,
                  },
                  ...next.achievements,
                ]
              : next.achievements,
          pendingReveal:
            isDeveloper && titleAfter.id !== titleBefore.id ? titleAfter : next.pendingReveal,
          xpGains: isDeveloper
            ? [
                ...next.xpGains,
                {
                  id: prev.sequence + 1,
                  xp: outcome.awardedXp,
                  label: challenge?.title ?? "Mission",
                  pathwayId,
                },
              ].slice(-3)
            : next.xpGains,
        };
      }

      return next;
    });
  }

  /* Taking a probe. The database enforces exclusivity with a compare-and-set on
     `accepted_by is null`; this guard is the local mirror of that rule so the UI
     can grey the button out without a round trip. */
  function acceptProbe(helpRequestId: string) {
    const request = state.helpRequests.find((item) => item.id === helpRequestId);
    if (!request) return;
    if (request.developerId === me) return;
    if (request.status !== "open" || request.flagged) return;
    if (request.acceptedBy) return;

    update((prev) => ({
      ...prev,
      helpRequests: prev.helpRequests.map((item) =>
        item.id === helpRequestId
          ? { ...item, acceptedBy: me, acceptedAt: new Date().toISOString() }
          : item,
      ),
      notifications: [
        {
          id: uid("nt", prev.sequence + 1),
          developerId: request.developerId,
          kind: "help",
          headline: "Somebody is on it",
          body: "A developer accepted your probe and will get back to you.",
          xp: null,
          href: `/probe/${helpRequestId}`,
          createdAt: new Date().toISOString(),
          read: false,
        },
        ...prev.notifications,
      ],
    }));
  }

  /* Dropping off a probe. Without this, accepting and then going quiet would
     block the asker indefinitely. */
  function releaseProbe(helpRequestId: string) {
    const request = state.helpRequests.find((item) => item.id === helpRequestId);
    if (!request || request.acceptedBy !== me) return;

    update((prev) => ({
      ...prev,
      helpRequests: prev.helpRequests.map((item) =>
        item.id === helpRequestId ? { ...item, acceptedBy: null, acceptedAt: null } : item,
      ),
    }));
  }

  function respondToHelp(helpRequestId: string, body: string) {
    update((prev) => {
      const request = prev.helpRequests.find((item) => item.id === helpRequestId);
      if (!request) return prev;
      const now = new Date().toISOString();
      return {
        ...prev,
        helpRequests: prev.helpRequests.map((item) =>
          item.id === helpRequestId
            ? {
                ...item,
                answers: [
                  ...item.answers,
                  {
                    id: uid("ans", prev.sequence + 1),
                    authorId: me,
                    body,
                    createdAt: now,
                    confirmed: false,
                    helpfulCount: 0,
                  },
                ],
              }
            : item,
        ),
      };
    });
  }

  function confirmHelpAnswer(helpRequestId: string, answerId: string) {
    const request = state.helpRequests.find((item) => item.id === helpRequestId);
    const answer = request?.answers.find((item) => item.id === answerId);
    if (!request || !answer || request.developerId !== me) return;

    update((prev) => ({
      ...prev,
      helpRequests: prev.helpRequests.map((item) =>
        item.id === helpRequestId
          ? {
              ...item,
              status: "solved",
              confirmedAnswerId: answerId,
              answers: item.answers.map((candidate) => ({
                ...candidate,
                confirmed: candidate.id === answerId,
              })),
            }
          : item,
      ),
      notifications:
        answer.authorId === me
          ? prev.notifications
          : [
              {
                id: uid("nt", prev.sequence + 1),
                developerId: answer.authorId,
                kind: "help",
                headline: "Your answer helped",
                body: `${request.developerName} confirmed your answer solved the problem.`,
                xp: null,
                href: `/help/${helpRequestId}`,
                createdAt: new Date().toISOString(),
                read: false,
              },
              ...prev.notifications,
            ],
    }));

    // Mentor XP for the developer who answered. The mock awards 8 XP per
    // confirmation; Phase 2 moves this into the database with the confirmation.
    if (answer.authorId !== me) {
      award({
        xp: 8,
        source: "help",
        pathwayId: "mentor",
        label: "Help confirmed",
        detail: `${request.developerName} confirmed your answer solved the problem.`,
      });
    }
  }

  function voteProposal(proposalId: string) {
    const proposal = state.proposals.find((item) => item.id === proposalId);
    if (!proposal) return;
    const alreadyVoted = proposal.voterIds.includes(me);

    update((prev) => ({
      ...prev,
      proposals: prev.proposals.map((item) =>
        item.id === proposalId
          ? {
              ...item,
              hasVoted: !alreadyVoted,
              interestedCount: item.interestedCount + (alreadyVoted ? -1 : 1),
              voterIds: alreadyVoted
                ? item.voterIds.filter((id) => id !== me)
                : [...item.voterIds, me],
            }
          : item,
      ),
    }));

    if (!alreadyVoted) {
      award({
        xp: 2,
        source: "teaching",
        pathwayId: "teacher",
        label: "Teaching demand",
        detail: `You voted for ${proposal.title}.`,
      });
    }
  }

  function proposeTopic(input: { title: string; pathwayId: PathwayId; summary: string }) {
    const developer = services.developers.current().developer;
    const proposal: TeachingProposalWithAuthor = {
      id: uid("tp", state.sequence + 1),
      title: input.title.trim(),
      pathwayId: input.pathwayId,
      proposedById: me,
      summary: input.summary.trim(),
      outcomes: ["Session brief pending instructor review"],
      voterIds: [me],
      interestedCount: 1,
      status: "open",
      sessionDate: null,
      xpReward: 60,
      createdAt: new Date().toISOString(),
      reviewedBy: null,
      authorName: developer.name,
      authorInitials: developer.initials,
      hasVoted: true,
    };

    update((prev) => ({ ...prev, proposals: [proposal, ...prev.proposals] }));

    award({
      xp: 5,
      source: "teaching",
      pathwayId: "teacher",
      label: "Topic proposed",
      detail: `You proposed ${proposal.title} for the next session.`,
    });
  }

  function createChallenge(input: NewChallengeInput) {
    const pathway = services.pathways.byId(input.pathwayId);
    const pathwayLabel = pathway?.shortName ?? input.pathwayId;
    const draft: Challenge = {
      id: uid("ch", state.sequence + 1),
      slug: `${input.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-draft`,
      title: input.title.trim(),
      codename: input.title.trim(),
      summary: input.summary.trim(),
      pathwayId: input.pathwayId,
      difficulty: input.difficulty,
      xp: input.xp,
      estimatedEffort: input.estimatedEffort,
      deadline: new Date(Date.now() + 14 * 86400000).toISOString(),
      status: "locked",
      tags: [pathwayLabel.toLowerCase(), "draft"],
      mission: input.mission.trim(),
      whyItMatters:
        "Written by the instructor. Fill this in before the mission is published to the Arena.",
      requirements: [],
      evidence: [],
      explainPrompt: "How does your solution work?",
      brokePrompt: "What broke, and how did you fix it?",
      rubric: DEFAULT_RUBRIC,
      completions: 0,
      recommendationReason: "Draft mission.",
      recommended: false,
    };

    update((prev) => ({ ...prev, challenges: [draft, ...prev.challenges] }));
  }

  function advanceOpportunity(opportunityId: string, stage: OpportunityStage) {
    const opportunity = state.opportunities.find((item) => item.id === opportunityId);
    if (!opportunity) return;
    const fromIndex = OPPORTUNITY_PIPELINE.findIndex((item) => item.id === opportunity.stage);
    const toIndex = OPPORTUNITY_PIPELINE.findIndex((item) => item.id === stage);
    if (toIndex <= fromIndex) return;

    const earned = OPPORTUNITY_PIPELINE[toIndex].xp - OPPORTUNITY_PIPELINE[fromIndex].xp;

    update((prev) => ({
      ...prev,
      opportunities: prev.opportunities.map((item) =>
        item.id === opportunityId
          ? { ...item, stage, stageProgress: (toIndex + 1) / OPPORTUNITY_PIPELINE.length }
          : item,
      ),
    }));

    if (earned > 0) {
      const stageLabel = OPPORTUNITY_PIPELINE[toIndex].label;
      award({
        xp: earned,
        source: "scout",
        pathwayId: "scout",
        label: stageLabel,
        detail: `You moved an opportunity to ${stageLabel.toLowerCase()}.`,
      });
    }
  }

  function markNotificationsRead() {
    update((prev) => ({
      ...prev,
      notifications: prev.notifications.map((notification) => ({ ...notification, read: true })),
    }));
  }

  function dismissReveal() {
    update((prev) => ({ ...prev, pendingReveal: null }));
  }

  function resetDemo() {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    commit(buildSession(me));
  }

  /* Switching identity rebuilds the whole session from that developer's seed.
     XP earned as somebody else is deliberately not carried across. */
  function signInAs(developerId: string) {
    writeIdentity(developerId);
    commit(buildSession(developerId));
  }

  function signOut() {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    writeIdentity(null);
    commit(buildSession());
  }

  const value: ArenaContextValue = {
    ...state,
    hydrated,
    identity,
    current,
    pathways,
    challenges,
    level: levelForXp(state.totalXp),
    unreadCount: state.notifications.filter((notification) => !notification.read).length,
    isAccepted: (challengeId) => state.acceptedMissions.includes(challengeId),
    submissionFor: (challengeId) =>
      state.submissions.find(
        (submission) =>
          submission.challengeId === challengeId && submission.developerId === me,
      ),
    acceptMission,
    submitMission,
    reviewSubmission,
    respondToHelp,
    confirmHelpAnswer,
    acceptProbe,
    releaseProbe,
    voteProposal,
    proposeTopic,
    createChallenge,
    advanceOpportunity,
    markNotificationsRead,
    dismissReveal,
    resetDemo,
    signInAs,
    signOut,
  };

  return <ArenaContext.Provider value={value}>{children}</ArenaContext.Provider>;
}

function recentAchievementFor(developerId: string, pathwayId: PathwayId) {
  /* Only the demo identity has hand-written highlights. Everyone else gets the
     neutral line, so switching identity does not invent achievements. */
  if (developerId !== CURRENT_DEVELOPER_ID) {
    return "Progress recorded this cycle.";
  }

  const highlights: Record<PathwayId, string> = {
    builder: "Shipped the settings migration with no downtime.",
    "problem-solver": "Found the session refresh defect nobody could reproduce.",
    teacher: "Ran Git Rebase Without Fear for six developers.",
    mentor: "Unblocked Tafadzwa on a TypeScript union.",
    scout: "Caught a closed listing on the Scout board.",
  };
  return highlights[pathwayId];
}

export function useDevArena() {
  const context = React.useContext(ArenaContext);
  if (!context) {
    throw new Error("useDevArena must be used inside <DevArenaProvider>");
  }
  return context;
}