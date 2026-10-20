import type { Metadata } from "next";
import { Bell } from "lucide-react";
import { PageHeader } from "@/components/shared/section-heading";
import { EmptyState } from "@/components/shared/empty-state";
import { HubSettingsForm } from "@/components/instructor/hub-settings-form";
import { AnnouncementManager } from "@/components/instructor/announcement-manager";
import { readHubAnnouncements, readHubSettings } from "@/lib/arena/hub";
import { hasAdminCredentials } from "@/lib/supabase/admin";
import { requireInstructor } from "@/lib/arena/session";

export const metadata: Metadata = {
  title: "Hub settings",
  description: "Hub-wide settings and announcements.",
};

export default async function InstructorSettingsPage() {
  await requireInstructor();

  const [settings, announcements] = await Promise.all([
    readHubSettings(),
    readHubAnnouncements(),
  ]);

  const configured = hasAdminCredentials();

  return (
    <div className="px-4 py-8 sm:px-6">
      <PageHeader
        eyebrow="Configuration"
        title="Hub settings"
        description="The details that apply to everybody, and the announcements that sit above every developer dashboard."
      />

      {!configured ? (
        <div className="mt-8">
          <EmptyState
            icon={Bell}
            eyebrow="Configuration"
            title="Service-role key required"
            body="Hub settings and announcements live in app_config, which is locked away from browser clients. Set SUPABASE_SERVICE_ROLE_KEY in .env.local to manage them."
          />
        </div>
      ) : null}

      <section className="mt-8">
        <h2 className="font-display text-lg font-semibold tracking-tight text-ink-900">
          Hub details
        </h2>
        <p className="mt-1 text-sm text-ink-500">
          The name the hub goes by and the defaults a session runs on.
        </p>
        <HubSettingsForm settings={settings} />
      </section>

      <AnnouncementManager announcements={announcements} />
    </div>
  );
}
