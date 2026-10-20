"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label, Select, Textarea } from "@/components/ui/input";
import { proposeTopic } from "@/lib/arena/actions";
import type { PathwayRow } from "@/lib/arena/data";

export function TopicProposalForm({ pathways }: { pathways: PathwayRow[] }) {
  const router = useRouter();
  const formRef = React.useRef<HTMLFormElement>(null);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [info, setInfo] = React.useState<string | null>(null);

  async function submit(formData: FormData) {
    setPending(true);
    setError(null);
    setInfo(null);
    try {
      const result = await proposeTopic(formData);
      if (result.error) setError(result.error);
      if (result.info) setInfo(result.info);
      if (result.ok) {
        router.refresh();
        formRef.current?.reset();
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <form
      ref={formRef}
      action={submit}
      className="mt-6 space-y-4 rounded-lg border border-sand-300 bg-sand-50 p-5 shadow-subtle"
    >
      <div>
        <h2 className="font-display text-lg font-semibold text-ink-900">
          Propose a topic
        </h2>
        <p className="mt-1 text-sm text-ink-500">
          Suggest a session for the instructor to review. Approved proposals appear on the topics
          board.
        </p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="proposal-title">Topic</Label>
        <Input
          id="proposal-title"
          name="title"
          required
          minLength={6}
          maxLength={200}
          placeholder="React Query Caching"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="proposal-pathway">Pathway it supports</Label>
        <Select id="proposal-pathway" name="pathwayId" defaultValue="teacher" required>
          {pathways.map((pathway) => (
            <option key={pathway.id} value={pathway.id}>
              {pathway.name}
            </option>
          ))}
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="proposal-summary">What should the session cover?</Label>
        <Textarea
          id="proposal-summary"
          name="summary"
          required
          minLength={20}
          maxLength={5000}
          placeholder="Describe what developers should learn and why it would be useful."
        />
      </div>
      {error ? <FieldError>{error}</FieldError> : null}
      {info ? (
        <p
          role="status"
          className="rounded-md border border-support/50 bg-support-tint px-3 py-2 text-sm text-support-deep"
        >
          {info}
        </p>
      ) : null}
      <Button type="submit" disabled={pending}>
        <Send className="size-4" aria-hidden />
        {pending ? "Submitting…" : "Submit proposal"}
      </Button>
    </form>
  );
}
