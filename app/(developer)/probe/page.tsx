import type { Metadata } from "next";
import { ProbeView } from "@/components/dev/probe-view";
import { requireDeveloper } from "@/lib/arena/session";

export const metadata: Metadata = {
  title: "Problem reports",
  description: "Report a problem you are stuck on.",
};

export default async function ProbePage() {
  await requireDeveloper();
  return <ProbeView />;
}