import type { Metadata } from "next";
import { ProfileView } from "@/components/dev/profile-view";
import { requireDeveloper } from "@/lib/arena/session";

export const metadata: Metadata = {
  title: "Profile",
  description: "Pathways, achievements, unlocks and your completed work.",
};

export default async function ProfilePage() {
  const session = await requireDeveloper();
  return <ProfileView avatarUrl={session.profile!.avatar_url ?? undefined} />;
}