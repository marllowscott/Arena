import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser client. The publishable key is public by design, so every table this
 * app touches must be protected by RLS. Nothing in the browser may write an XP
 * value directly — awards go through the `award_xp` Postgres function.
 */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY. Copy .env.local.example to .env.local.",
    );
  }

  return createBrowserClient(url, key);
}
