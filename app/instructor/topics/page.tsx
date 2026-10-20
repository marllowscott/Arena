import type { Metadata } from "next";
import { Presentation } from "lucide-react";
import { PageHeader } from "@/components/shared/section-heading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { TopicForm } from "@/components/instructor/topic-form";
import { TopicProposalManager } from "@/components/instructor/topic-proposal-manager";
import { FilterLinks } from "@/components/shared/filter-links";
import { SearchField } from "@/components/shared/search-field";
import { relativeTime } from "@/lib/format";
import { nowMs } from "@/lib/arena/clock";
import { claimsFor, listPathways, listTopics } from "@/lib/arena/data";
import { listProposalVotes } from "@/lib/arena/progression";
import { requireInstructor } from "@/lib/arena/session";

export const metadata: Metadata = {
  title: "Topics",
  description: "Post topics and review presentations.",
};

const TOPIC_FILTERS = ["all", "published", "draft", "proposals"] as const;

export default async function InstructorTopicsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await requireInstructor();
  const params = await searchParams;

  const [topics, pathways, votes] = await Promise.all([
    listTopics(),
    listPathways(),
    listProposalVotes(),
  ]);

  const query = (Array.isArray(params.q) ? params.q[0] : params.q ?? "").trim().toLowerCase();
  const filter = Array.isArray(params.filter) ? params.filter[0] : params.filter ?? "all";

  const interest = new Map<string, number>();
  for (const vote of votes) {
    interest.set(vote.proposal_id, (interest.get(vote.proposal_id) ?? 0) + 1);
  }

  const topicCards = await Promise.all(
    topics.map(async (topic) => ({
      topic,
      claimCount: (await claimsFor("topic", topic.id)).length,
      createdLabel: relativeTime(topic.created_at, nowMs()),
      interest: interest.get(topic.id) ?? 0,
    })),
  );

  const visible = topicCards.filter(({ topic }) => {
    if (filter === "published" && topic.status !== "open" && topic.status !== "scheduled") {
      return false;
    }
    if (filter === "draft" && topic.status !== "draft") return false;
    if (filter === "proposals" && topic.proposed_by === session.userId) return false;
    if (query) {
      const haystack = `${topic.title} ${topic.summary} ${topic.author_name ?? ""}`.toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });

  const filterOptions = TOPIC_FILTERS.map((value) => ({
    value,
    label:
      value === "all"
        ? "All"
        : value === "published"
          ? "Published"
          : value === "draft"
            ? "Drafts"
            : "Developer proposals",
    count:
      value === "all"
        ? topicCards.length
        : value === "published"
          ? topicCards.filter(({ topic }) => topic.status === "open" || topic.status === "scheduled")
              .length
          : value === "draft"
            ? topicCards.filter(({ topic }) => topic.status === "draft").length
            : topicCards.filter(({ topic }) => topic.proposed_by !== session.userId).length,
  }));

  return (
    <div className="px-4 py-8 sm:px-6">
      <PageHeader
        eyebrow="Content authority"
        title="Topics"
        description="Post a topic for developers to research and present. They claim it, prepare, and submit the presentation — you approve it in the review queue, and approval pays the topic's XP reward."
      />

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Post a topic</CardTitle>
            </CardHeader>
            <CardContent>
              <TopicForm pathwayOptions={pathways} />
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <div className="flex flex-col gap-3 rounded-lg border border-sand-300 bg-sand-50 p-4 shadow-subtle lg:flex-row lg:items-center lg:justify-between">
            <FilterLinks
              options={filterOptions}
              basePath="/instructor/topics"
              params={params}
              paramName="filter"
              label="Filter topics"
              size="sm"
            />
            <SearchField
              name="q"
              defaultValue={query}
              placeholder="Search topics"
              basePath="/instructor/topics"
              params={params}
              label="Search topics"
            />
          </div>

          <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-300">
            {visible.length} of {topicCards.length} topics
          </p>

          {visible.length === 0 ? (
            <div className="mt-4">
              <EmptyState
                icon={Presentation}
                eyebrow="Topics"
                title={topicCards.length === 0 ? "No topics yet" : "Nothing matches that filter"}
                body={
                  topicCards.length === 0
                    ? "Post the first topic. Developers claim it, prepare a short presentation, and submit it for your review."
                    : "Clear the search or pick a different filter to see the rest of the topics."
                }
              />
            </div>
          ) : (
            <ul className="mt-4 space-y-3">
              {visible.map(({ topic, claimCount, createdLabel, interest: votes }) => (
                <TopicProposalManager
                  key={topic.id}
                  topic={topic}
                  pathways={pathways}
                  claimCount={claimCount}
                  createdLabel={createdLabel}
                  interestCount={votes}
                  isDeveloperProposal={topic.proposed_by !== session.userId}
                />
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
