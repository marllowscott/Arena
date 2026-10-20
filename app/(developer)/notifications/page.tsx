import type { Metadata } from "next";
import { NotificationsView } from "@/components/dev/notifications-view";
import { notificationsFor } from "@/lib/arena/data";
import { requireDeveloper } from "@/lib/arena/session";

export const metadata: Metadata = {
  title: "Notifications",
  description: "XP awards, title unlocks and answers you confirmed.",
};

export default async function NotificationsPage() {
  const session = await requireDeveloper();
  const profile = session.profile!;

  const notifications = await notificationsFor(profile.id, 50);
  const unreadCount = notifications.filter((notification) => !notification.read).length;

  return (
    <NotificationsView notifications={notifications} unreadCount={unreadCount} />
  );
}
