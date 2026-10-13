import { redirect } from "next/navigation";

/** Kept so old links keep working. Help requests are now Probe. */
export default async function HelpRequestPage({
  params,
}: {
  params: Promise<{ requestId: string }>;
}) {
  const { requestId } = await params;
  redirect(`/probe/${requestId}`);
}
