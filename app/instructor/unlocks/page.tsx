import type { Metadata } from "next";
import { UnlocksView } from "@/components/instructor/unlocks-view";

export const metadata: Metadata = {
  title: "Unlocks & Titles",
  description: "Responsibilities and title confirmations.",
};

export default function UnlocksPage() {
  return <UnlocksView />;
}