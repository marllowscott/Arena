import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { HelpDetail } from "@/components/dev/help-detail";
import { services } from "@/lib/services";

export function generateStaticParams() {
  return services.help.list().map((request) => ({ requestId: request.id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ requestId: string }>;
}): Promise<Metadata> {
  const { requestId } = await params;
  const request = services.help.byId(requestId);
  if (!request) return { title: "Probe not found" };
  return { title: request.title, description: request.body.slice(0, 120) };
}

export default async function ProbePage({ params }: { params: Promise<{ requestId: string }> }) {
  const { requestId } = await params;
  const request = services.help.byId(requestId);
  if (!request) notFound();
  return <HelpDetail requestId={requestId} />;
}
