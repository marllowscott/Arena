import type { Pathway, Title } from "@/lib/types";

export const CURRENT_DEVELOPER_ID = "dev-collins";

export const pathways: Pathway[] = [
  {
    id: "builder",
    name: "Builder",
    shortName: "Builder",
    tagline: "Ship applications, features and deployments.",
    description:
      "Builder measures whether you can take a brief from idea to something that actually runs. Features, deployments, and the discipline to finish what you start.",
    icon: "hammer",
    order: 0,
    promise: "Ship work that runs in production.",
  },
  {
    id: "problem-solver",
    name: "Problem Solver",
    shortName: "Solver",
    tagline: "Debugging, logic and difficult technical problems.",
    description:
      "Problem Solver is earned by finding causes rather than symptoms. The bugs nobody wanted, the logic nobody could follow, the ticket everyone avoided.",
    icon: "bug",
    order: 1,
    promise: "Find the cause, not just the symptom.",
  },
  {
    id: "teacher",
    name: "Teacher",
    shortName: "Teacher",
    tagline: "Explaining and teaching technical concepts.",
    description:
      "Teacher rewards clarity. If you can explain a hard idea so a teammate can act on it, you have done the harder half of the work.",
    icon: "presentation",
    order: 2,
    promise: "Make it clear enough for someone else.",
  },
  {
    id: "mentor",
    name: "Mentor",
    shortName: "Mentor",
    tagline: "Helping other developers and supporting their growth.",
    description:
      "Mentor is measured in unblocked developers. Someone completed a mission because you answered the question they were stuck on.",
    icon: "lifebuoy",
    order: 3,
    promise: "Unblock a developer today.",
  },
  {
    id: "scout",
    name: "Scout",
    shortName: "Scout",
    tagline: "Finding and understanding career opportunities.",
    description:
      "Scout rewards research that turns into action. Verified opportunities, explained clearly, shared with the people who need them.",
    icon: "compass",
    order: 4,
    promise: "Turn research into a next step.",
  },
];

interface TitleSeed {
  name: string;
  xpRequired: number;
  motto: string;
}

const titleLadders: Record<Pathway["id"], TitleSeed[]> = {
  builder: [
    { name: "Novice Builder", xpRequired: 0, motto: "Every project starts as a rough draft." },
    { name: "Code Smith", xpRequired: 600, motto: "Shape the idea. Ship the first version." },
    { name: "Forge Master", xpRequired: 2000, motto: "Heat, hammer, repeat. Features survive it." },
    { name: "Architect", xpRequired: 4500, motto: "Structure outlives the thing it holds." },
    { name: "Master Architect", xpRequired: 8000, motto: "Systems other developers can extend." },
    { name: "Legendary Builder", xpRequired: 14000, motto: "Shipped more than most teams planned." },
  ],
  "problem-solver": [
    { name: "Bug Hunter", xpRequired: 0, motto: "Something is wrong. Find it." },
    { name: "Fixer", xpRequired: 200, motto: "You found it. Now fix it properly." },
    { name: "Debugger", xpRequired: 900, motto: "Problems don't disappear. You solve them." },
    { name: "Problem Slayer", xpRequired: 2200, motto: "The hard ones stop being hard." },
    { name: "Logic Master", xpRequired: 4500, motto: "The bug was never where you expected." },
    { name: "Code Exorcist", xpRequired: 8000, motto: "Nothing survives contact with your stack trace." },
  ],
  teacher: [
    { name: "Explainer", xpRequired: 0, motto: "Clear is kinder than correct." },
    { name: "Instructor", xpRequired: 250, motto: "You can teach what you just learned." },
    { name: "Knowledge Smith", xpRequired: 800, motto: "Hammer knowledge into usable shape." },
    { name: "Concept Master", xpRequired: 1800, motto: "Complexity explained simply." },
    { name: "Dev Sage", xpRequired: 3500, motto: "Asked when the answer matters." },
    { name: "Master Teacher", xpRequired: 6000, motto: "Developers become teachers here." },
  ],
  mentor: [
    { name: "Helper", xpRequired: 0, motto: "Answer the question you once asked." },
    { name: "Guide", xpRequired: 220, motto: "Point the way, then step back." },
    { name: "Mentor", xpRequired: 1000, motto: "Someone grew because you showed up." },
    { name: "Trusted Mentor", xpRequired: 2500, motto: "People bring you the hard problems." },
    { name: "Dev Guardian", xpRequired: 5000, motto: "The team's safety net, by choice." },
    { name: "Master Mentor", xpRequired: 9000, motto: "Developers become mentors here." },
  ],
  scout: [
    { name: "Explorer", xpRequired: 0, motto: "Look before you leap." },
    { name: "Scout", xpRequired: 250, motto: "You found the trail others missed." },
    { name: "Opportunity Hunter", xpRequired: 900, motto: "Verified leads, real doors." },
    { name: "Pathfinder", xpRequired: 2000, motto: "Mapped the route for others." },
    { name: "Career Navigator", xpRequired: 4000, motto: "Turns research into direction." },
    { name: "Opportunity Master", xpRequired: 7000, motto: "The room asks you where to apply." },
  ],
};

/**
 * Titles are seed data, not UI constants. Tier 4 and above require instructor
 * confirmation before they become public — see the Unlocks & Titles screen.
 */
export const titles: Title[] = pathways.flatMap((pathway) =>
  titleLadders[pathway.id].map((seed, index) => ({
    id: `${pathway.id}-t${index + 1}`,
    pathwayId: pathway.id,
    name: seed.name,
    tier: index + 1,
    xpRequired: seed.xpRequired,
    motto: seed.motto,
    requiresConfirmation: index + 1 >= 4,
  })),
);

export function titlesForPathway(pathwayId: Pathway["id"]) {
  return titles.filter((title) => title.pathwayId === pathwayId);
}

export function pathwayById(id: Pathway["id"]) {
  return pathways.find((pathway) => pathway.id === id)!;
}

export const INSTRUCTOR = {
  id: "ins-tapiwa",
  name: "Tapiwa Marange",
  handle: "tapiwa",
  initials: "TM",
  role: "instructor" as const,
  title: "Head Instructor",
  hub: "Mufakose Innovation Hub",
  avatarFrom: "#241B12",
  avatarTo: "#97A87A",
} as const;