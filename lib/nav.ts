import {
  ClipboardCheck,
  Compass,
  LayoutDashboard,
  LifeBuoy,
  ListChecks,
  Presentation,
  Store,
  Target,
  Trophy,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Shown under the label on wide sidebars. */
  hint: string;
}

/** Developer experience: five destinations, one per activity. */
export const developerNav: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, hint: "What to do next" },
  { href: "/arena", label: "Problems", icon: ListChecks, hint: "Solve something" },
  { href: "/topics", label: "Topics", icon: Presentation, hint: "Research and present" },
  { href: "/opportunities", label: "Opportunities", icon: Compass, hint: "Find openings" },
  { href: "/dev-shop", label: "Dev Shop", icon: Store, hint: "Progress unlocks learning" },
  { href: "/leaderboard", label: "Leaderboard", icon: Trophy, hint: "Where you stand" },
];

/** Instructor experience: the review authority. */
export const instructorNav: NavItem[] = [
  { href: "/instructor", label: "Dashboard", icon: LayoutDashboard, hint: "Needs attention" },
  { href: "/instructor/review-queue", label: "Review Queue", icon: ClipboardCheck, hint: "Submissions" },
  { href: "/instructor/probes", label: "Probe moderation", icon: LifeBuoy, hint: "Privacy reports" },
  { href: "/instructor/challenges", label: "Problems", icon: Target, hint: "Problem catalogue" },
  { href: "/instructor/topics", label: "Topics", icon: Presentation, hint: "Topics and presentations" },
  { href: "/instructor/opportunities", label: "Opportunities", icon: Compass, hint: "Verification" },
  { href: "/instructor/developers", label: "Developers", icon: Users, hint: "Progress" },
  { href: "/instructor/dev-shop", label: "Dev Shop", icon: Store, hint: "Reward requests" },
];

export function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href === "/instructor") return pathname === "/instructor";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/* Leaderboard tabs kept for the roster views. One ladder over total
   XP, with optional pathway filters on the instructor side. */
export type LeaderboardTab = "movement" | "overall" | "builder" | "problem-solver" | "teacher" | "mentor" | "scout";

export const LEADERBOARD_TABS: Array<{ value: LeaderboardTab; label: string }> = [
  { value: "movement", label: "This week" },
  { value: "overall", label: "All time" },
];

export const LEADERBOARD_FILTERS: Array<{ value: LeaderboardTab; label: string }> = [
  { value: "overall", label: "Everyone" },
  { value: "builder", label: "Builder" },
  { value: "problem-solver", label: "Problem Solver" },
  { value: "teacher", label: "Teacher" },
  { value: "mentor", label: "Mentor" },
  { value: "scout", label: "Scout" },
];

/** Used by the 404 screen so it can never link to a dead route. */
export const paths = developerNav;
