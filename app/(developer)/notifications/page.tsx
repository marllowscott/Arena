import type { Metadata } from "next";
import { NotificationsView } from "@/components/dev/notifications-view";

export const metadata: Metadata = {
  title: "Notifications",
  description: "XP awards, title unlocks and answers you confirmed.",
};

export default function NotificationsPage() {
  return <NotificationsView />;
}