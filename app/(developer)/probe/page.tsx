import type { Metadata } from "next";
import { ProbeView } from "@/components/dev/probe-view";
import { listHelpRequests, listPathways, mentorXpFor } from "@/lib/arena/data";
import { requireDeveloper } from "@/lib/arena/session";

export const metadata: Metadata = {
  title: "Probe",
  description: "Ask for help and support other developers.",
};

export default async function ProbePage() {
  const session = await requireDeveloper();
  if (!session.profile) throw new Error("Developer profile is missing.");

  const [helpRequests, pathways, mentorXp] = await Promise.all([
    listHelpRequests(),
    listPathways(),
    mentorXpFor(session.userId),
  ]);

  return (
    <ProbeView
      helpRequests={helpRequests}
      pathways={pathways}
      developerId={session.userId}
      mentorXp={mentorXp}
    />
  );
}
