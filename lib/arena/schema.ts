import "server-only";

import { createClient } from "@/lib/supabase/server";

/**
 * Capability probes.
 *
 * The deployed database does not carry every column the newest migration
 * set introduces — the probe workflow columns and `opportunities.listing_state`
 * arrive with migrations 0002 and 0010. Rather than crash a whole screen on
 * one absent column, the app asks the database what it can answer and uses
 * the widest shape it accepts.
 *
 * Each probe runs once per server process and the answer is reused.
 */

let listingStateProbe: Promise<boolean> | null = null;

/** Does `opportunities.listing_state` exist on this deployment? */
export async function supportsListingState(): Promise<boolean> {
  listingStateProbe ??= (async () => {
    const supabase = await createClient();
    const { error } = await supabase
      .from("opportunities")
      .select("id, listing_state")
      .limit(1);
    return !error;
  })();
  return listingStateProbe;
}

let probeColumnsProbe: Promise<boolean> | null = null;

/**
 * Does `help_requests` carry the workflow columns (urgency, tags, flagged,
 * accepted_by, …)? They arrive with migration 0002.
 */
export async function supportsProbeColumns(): Promise<boolean> {
  probeColumnsProbe ??= (async () => {
    const supabase = await createClient();
    const { error } = await supabase
      .from("help_requests")
      .select("id, urgency, tags, flagged, accepted_by")
      .limit(1);
    return !error;
  })();
  return probeColumnsProbe;
}

let helperEmbedProbe: Promise<boolean> | null = null;

/**
 * Can PostgREST resolve `help_requests.accepted_by` to a profile? The
 * foreign key arrives with migration 0002, and PostgREST only sees it once
 * its schema cache has been reloaded.
 */
export async function supportsHelperEmbed(): Promise<boolean> {
  helperEmbedProbe ??= (async () => {
    const supabase = await createClient();
    const { error } = await supabase
      .from("help_requests")
      .select("id, helper:profiles!help_requests_accepted_by_fkey (id)")
      .limit(1);
    return !error;
  })();
  return helperEmbedProbe;
}
