import {
  Bug,
  Compass,
  Hammer,
  LifeBuoy,
  Presentation,
  type LucideIcon,
} from "lucide-react";
import type { PathwayIconName } from "@/lib/types";

export const PATHWAY_ICONS: Record<PathwayIconName, LucideIcon> = {
  hammer: Hammer,
  bug: Bug,
  presentation: Presentation,
  lifebuoy: LifeBuoy,
  compass: Compass,
};

/** Pathway accent colours. Kept beside the icon map so cards stay consistent. */
export const PATHWAY_ACCENT: Record<
  PathwayIconName,
  { text: string; bg: string; border: string; bar: "primary" | "secondary" | "support" | "hush" }
> = {
  hammer: { text: "text-primary", bg: "bg-primary-tint", border: "border-primary-line", bar: "primary" },
  bug: { text: "text-secondary-muted", bg: "bg-secondary-tint", border: "border-secondary-line", bar: "secondary" },
  presentation: { text: "text-support-deep", bg: "bg-support-tint", border: "border-support/50", bar: "support" },
  lifebuoy: { text: "text-ink-600", bg: "bg-sand-200", border: "border-sand-400", bar: "primary" },
  compass: { text: "text-[#5c7a57]", bg: "bg-hush-tint", border: "border-hush-soft", bar: "hush" },
};

export function PathwayIcon({
  name,
  className,
}: {
  name: PathwayIconName;
  className?: string;
}) {
  const Icon = PATHWAY_ICONS[name];
  return <Icon className={className} aria-hidden />;
}