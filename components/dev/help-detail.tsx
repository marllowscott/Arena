"use client";

import Link from "next/link";
import * as React from "react";
import {
  ArrowLeft,
  CheckCircle2,
  HandHelping,
  MessageSquare,
  Send,
  ShieldAlert,
  ThumbsUp,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, Panel } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Label, Textarea } from "@/components/ui/input";
import { PathwayIcon, PATHWAY_ACCENT } from "@/components/shared/pathway-icon";
import { EmptyState } from "@/components/shared/empty-state";
import { PageContainer } from "@/components/shared/page-container";
import { relativeTime } from "@/lib/format";
import { NOW_MS, services } from "@/lib/services";
import { cn } from "@/lib/utils";
import { useDevArena } from "@/hooks/dev-arena-provider";

export function HelpDetail({ requestId }: { requestId: string }) {
  const { helpRequests, respondToHelp, confirmHelpAnswer, acceptProbe, releaseProbe, current } =
    useDevArena();
  const request = helpRequests.find((item) => item.id === requestId);
  const [body, setBody] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  if (!request) {
    return (
      <PageContainer size="narrow">
        <EmptyState
          icon={MessageSquare}
          eyebrow="Not found"
          title="That help request does not exist"
          body="It may have been removed. The Probe board still has open probes."
          action={
            <Link
              href="/probe"
              className="inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-medium text-sand-50 transition-colors hover:bg-primary-strong"
            >
              Back to Probe
            </Link>
          }
        />
      </PageContainer>
    );
  }

  const developerId = current.developer.id;
  const isMine = request.developerId === developerId;
  const iAccepted = request.acceptedBy === developerId;
  const helper = request.acceptedBy ? services.developers.byId(request.acceptedBy) : null;
  const pathway = services.pathways.byId(request.pathwayId)!;
  const accent = PATHWAY_ACCENT[pathway.icon];
  const author = services.developers.byId(request.developerId);
  const activeRequestId = request.id;

  function submitAnswer(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (body.trim().length < 20) {
      setError("Write enough that they can act on it without asking again.");
      return;
    }
    respondToHelp(activeRequestId, body.trim());
    setBody("");
    setError(null);
  }

  return (
    <PageContainer size="wide">
      <Link
        href="/probe"
        className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.12em] text-ink-400 transition-colors hover:text-ink-700"
      >
        <ArrowLeft className="size-3.5" aria-hidden />
        Back to Probe
      </Link>

      <div className="mt-5 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="p-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={request.status === "solved" ? "support" : "outline"}>
                {request.status}
              </Badge>
              {request.urgency === "blocking" && request.status !== "solved" ? (
                <Badge tone="primary">Blocking</Badge>
              ) : null}
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-xs border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em]",
                  accent.bg,
                  accent.border,
                  accent.text,
                )}
              >
                <PathwayIcon name={pathway.icon} className="size-3" />
                {pathway.name}
              </span>
            </div>

            <div className="mt-4 flex items-center gap-2.5">
              <Avatar
                initials={author?.initials ?? "??"}
                name={author?.name}
                from={author?.avatarFrom}
                to={author?.avatarTo}
                size="sm"
              />
              <div>
                <div className="eyebrow">{isMine ? "You are stuck" : `${request.developerName} is stuck`}</div>
                <time
                  dateTime={request.createdAt}
                  className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-300"
                >
                  {relativeTime(request.createdAt, NOW_MS)}
                </time>
              </div>
            </div>

            <h1 className="mt-4 font-display text-xl font-bold tracking-tight text-ink-900 sm:text-2xl">
              {request.title}
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-ink-600">{request.body}</p>

            <div className="mt-4 flex flex-wrap gap-1.5">
              {[...request.technologies, ...request.tags].map((tag) => (
                <span
                  key={tag}
                  className="rounded-xs bg-sand-200 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-400"
                >
                  {tag}
                </span>
              ))}
            </div>
          </Card>

          {request.flagged ? (
            <Card className="border-primary-line bg-primary-tint/40 p-5">
              <div className="flex items-start gap-3">
                <ShieldAlert className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
                <div>
                  <h2 className="font-display text-sm font-semibold tracking-tight text-ink-900">
                    Flagged by the instructor
                  </h2>
                  <p className="mt-1 text-sm leading-relaxed text-ink-500">{request.flagReason}</p>
                </div>
              </div>
            </Card>
          ) : null}

          <div>
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="font-display text-lg font-semibold tracking-tight text-ink-900">
                Answers
              </h2>
              <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-300">
                {request.answers.length} so far
              </span>
            </div>

            {request.answers.length === 0 ? (
              <EmptyState
                className="mt-4"
                icon={MessageSquare}
                title="No answers yet"
                body={
                  isMine
                    ? "Someone will pick this up. Reposting rarely helps — the board is checked throughout the day."
                    : "This one is unanswered. First answer gets confirmed most often."
                }
              />
            ) : (
              <ol className="mt-4 space-y-3">
                {request.answers.map((answer) => {
                  const answerAuthor = services.developers.byId(answer.authorId);
                  const confirmed = answer.confirmed;
                  return (
                    <li key={answer.id}>
                      <Card
                        className={cn(
                          "p-5",
                          confirmed && "border-support/60 bg-support-tint/40",
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2.5">
                            <Avatar
                              initials={answerAuthor?.initials ?? "??"}
                              name={answerAuthor?.name}
                              from={answerAuthor?.avatarFrom}
                              to={answerAuthor?.avatarTo}
                              size="sm"
                            />
                            <div>
                              <div className="text-sm font-medium text-ink-800">
                                {answerAuthor?.name ?? "A developer"}
                                {answer.authorId === developerId ? (
                                  <span className="ml-2 font-mono text-[9px] uppercase tracking-[0.12em] text-secondary-muted">
                                    You
                                  </span>
                                ) : null}
                              </div>
                              <time
                                dateTime={answer.createdAt}
                                className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-300"
                              >
                                {relativeTime(answer.createdAt, NOW_MS)}
                              </time>
                            </div>
                          </div>
                          <span className="inline-flex items-center gap-1 font-mono text-[10px] tabular-nums text-ink-300">
                            <ThumbsUp className="size-3" aria-hidden />
                            {answer.helpfulCount}
                          </span>
                        </div>

                        <p className="mt-3 text-sm leading-relaxed text-ink-600">{answer.body}</p>

                        {confirmed ? (
                          <div className="mt-4 flex items-center gap-2 border-t border-support/40 pt-3">
                            <CheckCircle2 className="size-4 text-support-deep" aria-hidden />
                            <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-support-deep">
                              This solved my problem · +8 Mentor XP
                            </span>
                          </div>
                        ) : isMine && request.status !== "solved" ? (
                          <div className="mt-4 border-t border-sand-300 pt-3">
                            <Button
                              variant="success"
                              size="sm"
                              tone="tech"
                              onClick={() => confirmHelpAnswer(request.id, answer.id)}
                            >
                              <CheckCircle2 className="size-3.5" aria-hidden />
                              This solved my problem
                            </Button>
                            <p className="mt-2 text-xs leading-relaxed text-ink-400">
                              Confirming pays the author 8 Mentor XP. Be honest — a wrong confirmation
                              teaches everyone the wrong thing.
                            </p>
                          </div>
                        ) : null}
                      </Card>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        </div>

        <aside className="lg:col-span-1">
          <div className="space-y-4 lg:sticky lg:top-20">
            {/* Ownership panel. Accepting is the gate to answering, so it sits
                above the composer rather than being one more button in a list. */}
            {!isMine && request.status !== "solved" && !request.flagged ? (
              request.acceptedBy ? (
                <Card className="p-5">
                  <div className="flex items-center gap-2">
                    <HandHelping className="size-4 text-primary" aria-hidden />
                    <span className="eyebrow">Being helped</span>
                  </div>
                  <div className="mt-3 flex items-center gap-2.5">
                    <Avatar
                      initials={request.acceptedByInitials ?? "??"}
                      name={request.acceptedByName ?? undefined}
                      from={helper?.avatarFrom}
                      to={helper?.avatarTo}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium text-ink-800">
                        {iAccepted
                          ? "You accepted this probe"
                          : `${request.acceptedByName} accepted this probe`}
                      </div>
                      {request.acceptedAt ? (
                        <time
                          dateTime={request.acceptedAt}
                          className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-300"
                        >
                          {relativeTime(request.acceptedAt, NOW_MS)}
                        </time>
                      ) : null}
                    </div>
                  </div>
                  {iAccepted ? (
                    <Button
                      variant="secondary"
                      size="sm"
                      tone="tech"
                      className="mt-4 w-full"
                      onClick={() => releaseProbe(request.id)}
                    >
                      Drop this probe
                    </Button>
                  ) : (
                    <p className="mt-3 border-t border-sand-300 pt-3 text-xs leading-relaxed text-ink-400">
                      One helper per probe. Write your answer below only if you accepted it.
                    </p>
                  )}
                </Card>
              ) : (
                <Card className="border-primary-line bg-primary-tint/40 p-5">
                  <div className="flex items-center gap-2">
                    <HandHelping className="size-4 text-primary" aria-hidden />
                    <span className="eyebrow">Unclaimed</span>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-ink-600">
                    {request.developerName} is waiting. Accept it to take ownership and write the
                    answer.
                  </p>
                  <Button tone="tech" className="mt-4 w-full" onClick={() => acceptProbe(request.id)}>
                    <HandHelping className="size-4" aria-hidden />
                    Help with this
                  </Button>
                  <p className="mt-3 border-t border-primary-line/60 pt-3 text-xs leading-relaxed text-ink-400">
                    First to accept owns it. You can drop it later and it goes back on the board.
                  </p>
                </Card>
              )
            ) : null}

            {!isMine && request.status !== "solved" && iAccepted ? (
              <Card className="p-5">
                <div className="eyebrow mb-3">Write an answer</div>
                <form onSubmit={submitAnswer} noValidate>
                  <Label htmlFor="answer">Your answer</Label>
                  <Textarea
                    id="answer"
                    value={body}
                    onChange={(event) => setBody(event.target.value)}
                    placeholder="Ask what they expected to see, then point at the layer where it differs…"
                    className="min-h-32"
                    aria-invalid={error ? true : undefined}
                  />
                  {error ? (
                    <p role="alert" className="mt-1.5 text-xs font-medium text-primary">
                      {error}
                    </p>
                  ) : null}
                  <Button type="submit" tone="tech" className="mt-4 w-full">
                    <Send className="size-4" aria-hidden />
                    Post answer
                  </Button>
                </form>
                <p className="mt-3 border-t border-sand-300 pt-3 text-xs leading-relaxed text-ink-400">
                  {request.developerName} confirms the answer that worked. That confirmation is what
                  pays you.
                </p>
              </Card>
            ) : null}

            {isMine && request.status !== "solved" ? (
              <Panel className="p-5">
                <div className="eyebrow text-secondary-soft">Waiting on you</div>
                <p className="mt-2 font-display text-sm font-medium leading-snug text-sand-100">
                  {request.answers.length === 0
                    ? "Nobody has answered yet. Try the Probe board in an hour before you escalate."
                    : "One of these helped you. Confirm it so the author gets paid."}
                </p>
                <p className="mt-3 border-t border-ink-700 pt-3 text-xs leading-relaxed text-ink-300">
                  Confirmations are the only source of Mentor XP on this platform.
                </p>
              </Panel>
            ) : null}

            {request.status === "solved" ? (
              <Card className="border-support/50 bg-support-tint/50 p-5">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-support-deep" aria-hidden />
                  <span className="eyebrow">Resolved</span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-ink-600">
                  This thread is closed. It stays here as a record so the next developer with the same
                  problem can find it.
                </p>
              </Card>
            ) : null}

            <Card className="p-5">
              <div className="eyebrow mb-3">Answer well</div>
              <ul className="space-y-2 text-xs leading-relaxed text-ink-400">
                <li>Ask one question before you give an answer.</li>
                <li>Explain the mechanism, not just the patch.</li>
                <li>Say what you are not sure about.</li>
                <li>Never paste a key or a customer identifier.</li>
              </ul>
            </Card>
          </div>
        </aside>
      </div>
    </PageContainer>
  );
}