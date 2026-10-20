import type { Metadata } from "next";
import { Presentation } from "lucide-react";
import { PageHeader } from "@/components/shared/section-heading";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { ClaimButton } from "@/components/arena/claim-button";
import { TopicStatusBadge } from "@/components/arena/status-badge";
import { SubmissionStatusBadge } from "@/components/arena/status-badge";
import { EvidenceForm } from "@/components/arena/evidence-form";
import { TopicProposalForm } from "@/components/dev/topic-proposal-form";
import { TopicVoteButton } from "@/components/dev/topic-vote-button";
import { FilterLinks } from "@/components/shared/filter-links";
import { SearchField } from "@/components/shared/search-field";
import { formatXp, relativeTime } from "@/lib/format";
import { nowMs } from "@/lib/arena/clock";
import {
  claimsFor,
  listPathways,
  listTopics,
  myClaim,
  mySubmissions,
} from "@/lib/arena/data";
import { listProposalVotes } from "@/lib/arena/progression";
import { requireDeveloper } from "@/lib/arena/session";
import type { SubmissionRow, TopicRow } from "@/lib/arena/data";

export const metadata: Metadata = {
  title: "Topics",
  description: "Research and present a topic. XP on instructor approval.",
};

const TOPIC_FILTERS = ["all", "open", "scheduled", "delivered"] as const;

export default async function TopicsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requireDeveloper();
  const profile = session.profile!;
  const params = await searchParams;

  const [topics, pathways, mySubs, votes] = await Promise.all([
    listTopics(),
    listPathways(),
    mySubmissions(profile.id),
    listProposalVotes(),
  ]);

  const interest = new Map<string, number>();
  const myVotes = new Set<string>();
  for (const vote of votes) {
    interest.set(vote.proposal_id, (interest.get(vote.proposal_id) ?? 0) + 1);
    if (vote.voter_id === profile.id) myVotes.add(vote.proposal_id);
  }

  const pathwayName = (id: string) =>
    pathways.find((pathway) => pathway.id === id)?.short_name ?? id;

  const query = (Array.isArray(params.q) ? params.q[0] : params.q ?? "").trim().toLowerCase();
  const filter = Array.isArray(params.filter) ? params.filter[0] : params.filter ?? "all";

  const visible = topics.filter((topic) => {
    if (filter !== "all" && topic.status !== filter) return false;
    if (!query) return true;
    return `${topic.title} ${topic.summary}`.toLowerCase().includes(query);
  });

  const filterOptions = TOPIC_FILTERS.map((value) => ({
    value,
    label: value === "all" ? "All" : value,
    count:
      value === "all"
        ? topics.length
        : topics.filter((topic) => topic.status === value).length,
  }));

  return (
    <div className="px-4 py-8 sm:px-6">
      <PageHeader
        eyebrow="Teach"
        title="Topics"
        description="Suggest a topic for the instructor to review, or research a posted topic and submit a presentation."
      />

      <TopicProposalForm pathways={pathways} />

      <div className="mt-8 flex flex-col gap-3 rounded-lg border border-sand-300 bg-sand-50 p-4 shadow-subtle lg:flex-row lg:items-center lg:justify-between">
        <FilterLinks
          options={filterOptions}
          basePath="/topics"
          params={params}
          paramName="filter"
          label="Filter topics"
          size="sm"
        />
        <SearchField
          name="q"
          defaultValue={query}
          placeholder="Search topics"
          basePath="/topics"
          params={params}
          label="Search topics"
        />
      </div>

      <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-300">
        {visible.length} of {topics.length} topics
      </p>

      {visible.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            icon={Presentation}
            eyebrow="Topics"
            title={topics.length === 0 ? "No topics yet" : "Nothing matches that filter"}
            body={
              topics.length === 0
                ? "The instructor posts topics for the team to research and present."
                : "Clear the search or pick a different filter."
            }
          />
        </div>
      ) : (
        <ul className="mt-4 space-y-4">
          {visible.map((topic: TopicRow) => (
            <TopicCard
              key={topic.id}
              topic={topic}
              pathwayName={pathwayName(topic.pathway_id)}
              userId={profile.id}
              mySubmissions={mySubs}
              interestCount={interest.get(topic.id) ?? 0}
              hasVoted={myVotes.has(topic.id)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

async function TopicCard({
  topic,
  pathwayName,
  userId,
  mySubmissions,
  interestCount,
  hasVoted,
}: {
  topic: TopicRow;
  pathwayName: string;
  userId: string;
  mySubmissions: SubmissionRow[];
  interestCount: number;
  hasVoted: boolean;
}) {
  const [claimRow, claimRows] = await Promise.all([
    myClaim("topic", topic.id, userId),
    claimsFor("topic", topic.id),
  ]);
  const claimed = claimRow !== null;
  const myPresentation = mySubmissions.find(
    (submission: SubmissionRow) => submission.topic_id === topic.id,
  );

  return (
    <li className="rounded-lg border border-sand-300 bg-sand-50 p-5 shadow-subtle">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="outline">{pathwayName}</Badge>
        <TopicStatusBadge status={topic.status} />
        <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-300">
          {topic.author_name ? `by ${topic.author_name}` : ""} ·{" "}
          {relativeTime(topic.created_at, nowMs())}
        </span>
        <span className="ml-auto font-mono text-xs font-semibold tabular-nums text-primary">
          +{formatXp(topic.xp_reward)} XP
        </span>
      </div>

      <h2 className="mt-2.5 font-display text-base font-semibold tracking-tight text-ink-900">
        {topic.title}
      </h2>
      <p className="mt-1 max-w-3xl text-sm leading-relaxed text-ink-500">
        {topic.summary}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-sand-300 pt-3">
        <ClaimButton kind="topic" activityId={topic.id} claimed={claimed} compact />
        <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-300">
          {claimRows.length} {claimRows.length === 1 ? "claim" : "claims"}
        </span>
        {myPresentation ? (
          <SubmissionStatusBadge status={myPresentation.status} />
        ) : null}
        <span className="ml-auto">
          <TopicVoteButton
            proposalId={topic.id}
            interestCount={interestCount}
            hasVoted={hasVoted}
          />
        </span>
      </div>

      {claimed && !myPresentation ? (
        <div className="mt-4 rounded-md border border-sand-300 bg-sand-100/60 p-4">
          <h3 className="font-display text-sm font-semibold text-ink-900">
            Present this topic
          </h3>
          <p className="mt-1 text-xs text-ink-500">
            Prepare your material, then submit the presentation summary and
            any recording or slides.
          </p>
          <div className="mt-4">
            <EvidenceForm
              mode="topic"
              activityId={topic.id}
              xp={topic.xp_reward}
            />
          </div>
        </div>
      ) : null}

      {myPresentation?.reviewer_note ? (
        <blockquote className="mt-3 rounded-md border-l-2 border-secondary bg-sand-100 px-3 py-2 text-sm italic text-ink-600">
          {myPresentation.reviewer_note}
        </blockquote>
      ) : null}
    </li>
  );
}
