import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/section-heading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileEditForm } from "@/components/shared/profile-edit-form";
import { profileFor } from "@/lib/arena/data";
import { listPathways } from "@/lib/arena/data";
import { requireInstructor } from "@/lib/arena/session";

export const metadata: Metadata = {
  title: "Profile",
  description: "Manage your instructor profile.",
};

export default async function InstructorProfilePage() {
  const session = await requireInstructor();
  const [profile, pathways] = await Promise.all([
    profileFor(session.userId),
    listPathways(),
  ]);
  if (!profile) throw new Error("Instructor profile is missing.");

  const typedPathways = pathways.map((p) => ({
    id: p.id,
    name: p.name,
    tagline: p.tagline,
    description: p.description,
    icon: p.icon,
    shortName: p.short_name,
    order: p.sort_order,
    promise: p.promise,
  }));

  return (
    <div className="px-4 py-8 sm:px-6">
      <PageHeader
        eyebrow="Account"
        title="Profile"
        description="Manage your name, handle, and profile details."
      />
      <div className="mt-8 max-w-xl">
        <Card>
          <CardHeader>
            <CardTitle>Edit profile</CardTitle>
          </CardHeader>
          <CardContent>
            <ProfileEditForm profile={profile} pathways={typedPathways} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}