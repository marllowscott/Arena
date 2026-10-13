import type { Metadata } from "next";
import { InsightsView } from "@/components/instructor/insights-view";

export const metadata: Metadata = {
  title: "Insights",
  description: "Patterns across developer activity.",
};

export default function InsightsPage() {
  return <InsightsView />;
}