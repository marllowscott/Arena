import { notFound } from "next/navigation";
import { HelpDetail } from "@/components/dev/help-detail";
import { getHelpRequest } from "@/lib/arena/data";
import { requireDeveloper } from "@/lib/arena/session";

export default async function ProbePage({ params }: { params: Promise<{ requestId: string }> }) {
  const session = await requireDeveloper();
  const { requestId } = await params;
  const request = await getHelpRequest(requestId);
  if (!request) notFound();
  return <HelpDetail request={request} developerId={session.userId} />;
}
