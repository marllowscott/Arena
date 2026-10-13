import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

/**
 * Server client. Reads the auth cookie so RLS applies to server-rendered reads
 * as well. This deliberately uses the publishable key, not the service role, so
 * a bug here cannot bypass RLS.
 */
export async function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY. Copy .env.local.example to .env.local.",
    );
  }

  const cookieStore = await cookies();

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          /* Called from a Server Component, where cookies are read-only. The
             middleware refreshes the session, so this is safe to ignore. */
        }
      },
    },
  });
}
