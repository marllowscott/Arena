"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label, Select, Textarea } from "@/components/ui/input";
import {
  deleteCuratedOpportunity,
  saveCuratedOpportunity,
} from "@/lib/arena/actions";
import type { OpportunityRow } from "@/lib/arena/data";

const LISTING_STATES = ["all", "published", "draft", "archived"] as const;

function localDateTime(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 16);
}

export function CuratedOpportunityManager({
  opportunities,
  supportsListingState = true,
}: {
  opportunities: OpportunityRow[];
  supportsListingState?: boolean;
}) {
  const router = useRouter();
  const [selected, setSelected] = React.useState<OpportunityRow | null>(null);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [info, setInfo] = React.useState<string | null>(null);
  const [query, setQuery] = React.useState("");
  const [listingState, setListingState] = React.useState<string>("all");

  const visible = opportunities.filter((opportunity) => {
    if (listingState !== "all" && opportunity.listing_state !== listingState) return false;
    if (!query.trim()) return true;
    const haystack = `${opportunity.role} ${opportunity.organisation} ${opportunity.type} ${opportunity.summary}`.toLowerCase();
    return haystack.includes(query.trim().toLowerCase());
  });

  async function save(formData: FormData) {
    setPending(true);
    setError(null);
    setInfo(null);
    try {
      const result = await saveCuratedOpportunity(formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      setInfo(result.info ?? "Curated opportunity saved.");
      setSelected(null);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  async function remove(opportunity: OpportunityRow) {
    if (!window.confirm(`Permanently delete "${opportunity.role}" at ${opportunity.organisation}?`)) {
      return;
    }

    setPending(true);
    setError(null);
    setInfo(null);
    try {
      const result = await deleteCuratedOpportunity(opportunity.id);
      if (result.error) {
        setError(result.error);
        return;
      }
      setInfo(result.info ?? "Curated opportunity deleted.");
      setSelected(null);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="mt-8 rounded-lg border border-sand-300 bg-sand-50 p-5 shadow-subtle sm:p-6">
      <div className="eyebrow">Hub-managed listings</div>
      <h2 className="mt-1 font-display text-lg font-semibold text-ink-900">
        {selected ? "Edit curated opportunity" : "Add curated opportunity"}
      </h2>
      <p className="mt-1 text-sm text-ink-500">
        These listings are published by the instructor and never award Scout XP. Drafts and
        archived listings are hidden from developers.
      </p>

      <form
        key={selected?.id ?? "new-curated-opportunity"}
        action={save}
        className="mt-4 grid gap-3 sm:grid-cols-2"
      >
        <input type="hidden" name="opportunityId" value={selected?.id ?? ""} />
        <div className="space-y-1.5">
          <Label htmlFor="curated-organisation">Organisation</Label>
          <Input
            id="curated-organisation"
            name="organisation"
            required
            maxLength={160}
            defaultValue={selected?.organisation ?? ""}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="curated-role">Role or title</Label>
          <Input
            id="curated-role"
            name="role"
            required
            maxLength={200}
            defaultValue={selected?.role ?? ""}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="curated-type">Type</Label>
          <Input
            id="curated-type"
            name="type"
            required
            maxLength={80}
            defaultValue={selected?.type ?? "job"}
            placeholder="job, hackathon, scholarship"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="curated-location">Location</Label>
          <Input
            id="curated-location"
            name="location"
            maxLength={160}
            defaultValue={selected?.location ?? ""}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="curated-apply-url">Application link</Label>
          <Input
            id="curated-apply-url"
            name="applyUrl"
            type="url"
            maxLength={2000}
            defaultValue={selected?.apply_url ?? ""}
            placeholder="https://example.org/apply"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="curated-closes-at">Closing date (optional)</Label>
          <Input
            id="curated-closes-at"
            name="closesAt"
            type="datetime-local"
            defaultValue={localDateTime(selected?.closes_at ?? null)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="curated-listing-state">Visibility</Label>
          <Select
            id="curated-listing-state"
            name="listingState"
            disabled={!supportsListingState}
            defaultValue={selected?.listing_state ?? "published"}
          >
            <option value="draft">Draft / unpublished</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </Select>
          {!supportsListingState ? (
            <p className="text-xs text-ink-400">
              Every listing is published on this deployment.
            </p>
          ) : null}
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="curated-summary">Description</Label>
          <Textarea
            id="curated-summary"
            name="summary"
            required
            maxLength={5000}
            rows={3}
            defaultValue={selected?.summary ?? ""}
          />
        </div>

        {error ? <FieldError className="sm:col-span-2">{error}</FieldError> : null}
        {info ? (
          <p role="status" className="text-sm text-support-deep sm:col-span-2">
            {info}
          </p>
        ) : null}

        <div className="flex gap-2 sm:col-span-2">
          <Button type="submit" disabled={pending}>
            {pending ? "Saving…" : selected ? "Save changes" : "Add opportunity"}
          </Button>
          {selected ? (
            <Button
              type="button"
              variant="secondary"
              disabled={pending}
              onClick={() => {
                setSelected(null);
                setError(null);
                setInfo(null);
              }}
            >
              Cancel
            </Button>
          ) : null}
        </div>
      </form>

      <div className="mt-6 border-t border-sand-300 pt-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <h3 className="font-display text-base font-semibold text-ink-900">
            Curated opportunities
          </h3>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-300"
                aria-hidden
              />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search listings"
                aria-label="Search curated opportunities"
                className="h-9 pl-9 text-sm"
              />
            </div>
            <Select
              value={listingState}
              onChange={(event) => setListingState(event.target.value)}
              aria-label="Filter curated opportunities by state"
              className="h-9 w-40 text-sm"
              disabled={!supportsListingState}
            >
              {LISTING_STATES.map((value) => (
                <option key={value} value={value}>
                  {value === "all" ? "All states" : value}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-300">
          {visible.length} of {opportunities.length} listings
        </p>
        {visible.length === 0 ? (
          <p className="mt-3 text-sm text-ink-400">
            {opportunities.length === 0
              ? "No curated listings yet."
              : "No listings match that search."}
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-sand-300">
            {visible.map((opportunity) => (
              <li key={opportunity.id} className="flex flex-wrap items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium text-ink-800">{opportunity.role}</div>
                  <div className="truncate text-xs text-ink-500">
                    {opportunity.organisation} · {opportunity.type} · {opportunity.listing_state}
                  </div>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={pending}
                  onClick={() => {
                    setSelected(opportunity);
                    setError(null);
                    setInfo(null);
                  }}
                >
                  Edit
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="danger"
                  disabled={pending}
                  onClick={() => remove(opportunity)}
                >
                  Delete
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
