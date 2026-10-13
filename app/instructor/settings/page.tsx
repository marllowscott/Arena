import type { Metadata } from "next";
import { SettingsView } from "@/components/instructor/settings-view";
import { requireInstructor } from "@/lib/arena/session";

export const metadata: Metadata = {
  title: "Settings",
  description: "Hub configuration and demo session controls.",
};

export default async function SettingsPage() {
  const session = await requireInstructor();
  const profile = session.profile;
  if (!profile) throw new Error("Instructor profile is missing.");

  return (
    <SettingsView
      avatarUrl={profile.avatar_url}
      avatarName={profile.full_name}
      avatarInitials={profile.full_name.slice(0, 1).toUpperCase()}
      avatarFrom={profile.avatar_from}
      avatarTo={profile.avatar_to}
    />
  );
}