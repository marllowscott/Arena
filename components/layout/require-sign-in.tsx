"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useDevArena } from "@/hooks/dev-arena-provider";

/**
 * The gate. Until somebody picks an identity there is no session, so every
 * screen that assumes one is unreachable. Reads the identity straight out of the
 * session store, so a signed-in developer never sees a loading frame.
 */
export function RequireSignIn({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { identity } = useDevArena();

  React.useEffect(() => {
    if (!identity) router.replace("/login");
  }, [identity, router]);

  if (!identity) return null;
  return <>{children}</>;
}
