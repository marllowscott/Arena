import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/section-heading";
import { ProbeModerationManager } from "@/components/instructor/probe-moderation-manager";
import { listFlaggedHelpRequests } from "@/lib/arena/data";
import { requireInstructor } from "@/lib/arena/session";

export const metadata: Metadata = {
  title: "Probe moderation",
  description: "Review developer-reported privacy concerns in Probe threads.",
};

export default async function InstructorProbesPage() {
  await requireInstructor();
  const requests = await listFlaggedHelpRequests();

  return (
    <div className="px-4 py-8 sm:px-6">
      <PageHeader
        eyebrow="Instructor moderation"
        title="Flagged probes"
        description="Flagged threads are hidden from the public board and visible only to the asker, accepted helper, and instructors. Review sensitive content before clearing a restriction."
      />
      <ProbeModerationManager requests={requests} />
    </div>
  );
}
