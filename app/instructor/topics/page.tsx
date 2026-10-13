import type { Metadata } from "next";
import { Presentation } from "lucide-react";
import { PageHeader } from "@/components/shared/section-heading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { TopicForm } from "@/components/instructor/topic-form";
import { formatXp, relativeTime } from "@/lib/format";
import { nowMs } from "@/lib/arena/clock";
import { claimsFor, listPathways, listTopics } from "@/lib/arena/data";
import { requireInstructor } from "@/lib/arena/session";
import type { TopicRow } from "@/lib/arena/data";

export const metadata: Metadata = {
  title: "Topics",
  description: "Post topics and review presentations.",
};

export default async function InstructorTopicsPage() {
  await requireInstructor();
  const [topics, pathways] = await Promise.all([listTopics(), listPathways()]);

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
          {topics.length === 0 ? (
            <EmptyState
              icon={Presentation}
              eyebrow="Topics"
              title="No topics yet"
              body="Post the first topic. Developers claim it, prepare a short presentation, and submit it for your review."
            />
          ) : (
            <ul className="space-y-3">
              {topics.map((topic) => (
                <TopicRowCard key={topic.id} topic={topic} />
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

async function TopicRowCard({ topic }: { topic: TopicRow }) {
  const claimRows = await claimsFor("topic", topic.id);
  return (
    <li className="rounded-lg border border-sand-300 bg-sand-50 p-4 shadow-subtle">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone="outline">{topic.pathway_id}</Badge>
        <Badge tone={topic.status === "open" ? "support" : "neutral"}>
          {topic.status}
        </Badge>
        <span className="font-mono text-xs font-semibold tabular-nums text-primary">
          +{formatXp(topic.xp_reward)} XP
        </span>
        <span className="ml-auto font-mono text-[10px] uppercase tracking-[0.1em] text-ink-400">
          {claimRows.length} {claimRows.length === 1 ? "claim" : "claims"} ·{" "}
          {relativeTime(topic.created_at, nowMs())}
        </span>
      </div>
      <h2 className="mt-2 font-display text-base font-semibold tracking-tight text-ink-900">
        {topic.title}
      </h2>
      <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-ink-500">
        {topic.summary}
      </p>
      {topic.author_name ? (
        <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-300">
          posted by {topic.author_name}
        </p>
      ) : null}
    </li>
  );
}
