import type { Metadata } from "next";
import { ProbeView } from "@/components/dev/probe-view";
import { listPathways } from "@/lib/arena/data";
import { requireDeveloper } from "@/lib/arena/session";

export const metadata: Metadata = {
  title: "Problem reports",
  description: "Report a problem you are stuck on.",
};

export default async function ProbePage() {
  const session = await requireDeveloper();
  if (!session.profile) throw new Error("Developer profile is missing.");

  const pathways = await listPathways();

  return <ProbeView pathways={pathways} />;
}