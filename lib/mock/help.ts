import type { HelpRequest } from "@/lib/types";
import { hoursAgo, daysAgo } from "./clock";

/**
 * Ownership is optional in the seed: most probes are unclaimed, and a couple are
 * deliberately mid-help so the accept flow has something real to render.
 */
type SeedProbe = Omit<HelpRequest, "acceptedBy" | "acceptedAt"> &
  Partial<Pick<HelpRequest, "acceptedBy" | "acceptedAt">>;

const seed: SeedProbe[] = [
  {
    id: "help-orders-undefined",
    developerId: "dev-collins",
    title: "Why is my API request returning undefined?",
    body: "The orders request resolves but `data.orders` is undefined. I can see the response in the network tab and the array is right there. I have tried optional chaining and a console.log on the response object.",
    pathwayId: "problem-solver",
    tags: ["react-native", "api"],
    technologies: ["React Native", "TypeScript"],
    createdAt: hoursAgo(4),
    status: "open",
    urgency: "blocking",
    answers: [
      {
        id: "ans-1",
        authorId: "dev-keith",
        body: "Print the raw response before you touch a key on it. If your interceptor unwraps `.data` already then you are reading one level too deep — `data.orders` would be undefined while `orders` is right there.",
        createdAt: hoursAgo(3),
        confirmed: false,
        helpfulCount: 2,
      },
      {
        id: "ans-2",
        authorId: "dev-nigel",
        body: "We hit this with the same client. Our interceptor returns `response.data`, so the hook gets the object directly. Check whether your fetch wrapper unwraps it.",
        createdAt: hoursAgo(2),
        confirmed: false,
        helpfulCount: 1,
      },
    ],
    confirmedAnswerId: null,
    flagged: false,
    flagReason: null,
  },
  {
    id: "help-swift-flicker",
    developerId: "dev-farai",
    title: "SwiftUI list reloads and flickers on every keystroke",
    body: "The search list redraws the whole section for each character typed. I know the filter runs on the main actor, but I cannot work out where the invalidation is happening.",
    pathwayId: "problem-solver",
    tags: ["performance", "swiftui"],
    technologies: ["Swift", "SwiftUI"],
    createdAt: hoursAgo(9),
    status: "open",
    urgency: "normal",
    answers: [
      {
        id: "ans-3",
        authorId: "dev-rutendo",
        body: "Check whether the array identity changes on every pass. If your filtered result is a new array each render, SwiftUI treats the whole section as changed. Equatable on the model, or a stable key path, fixes it.",
        createdAt: hoursAgo(7),
        confirmed: false,
        helpfulCount: 3,
      },
    ],
    confirmedAnswerId: null,
    flagged: false,
    flagReason: null,
  },
  {
    id: "help-rls-empty",
    developerId: "dev-william",
    title: "Row level security returns zero rows even though the data exists",
    body: "My policy looks right and I confirmed there are rows in the table from the SQL editor. The client gets an empty array every time. I am calling through the anon key.",
    pathwayId: "problem-solver",
    tags: ["supabase", "rls", "auth"],
    technologies: ["Supabase", "PostgreSQL"],
    createdAt: hoursAgo(20),
    status: "flagged",
    urgency: "blocking",
    answers: [],
    confirmedAnswerId: null,
    flagged: true,
    flagReason:
      "Pasted snippet included a service role key. Key rotated before the thread continued.",
  },
  {
    id: "help-union-narrowing",
    developerId: "dev-tafadzwa",
    title: "TypeScript loses the union narrowing after a map",
    body: "I narrow a discriminated union with a switch, then map over the array and the narrowing disappears. The types go back to the full union inside the callback.",
    pathwayId: "problem-solver",
    tags: ["typescript"],
    technologies: ["TypeScript"],
    createdAt: daysAgo(2),
    status: "solved",
    urgency: "normal",
    answers: [
      {
        id: "ans-4",
        authorId: "dev-collins",
        body: "Narrow into a local const first, then map over that. The narrowing lives on the const, not on the expression you keep re-reading. If you want the narrowing to survive inside the callback, narrow the variable rather than the property.",
        createdAt: daysAgo(2),
        confirmed: true,
        helpfulCount: 6,
      },
      {
        id: "ans-5",
        authorId: "dev-keith",
        body: "A type predicate on a helper also works if you need it to flow through.",
        createdAt: daysAgo(2),
        confirmed: false,
        helpfulCount: 2,
      },
    ],
    confirmedAnswerId: "ans-4",
    flagged: false,
    flagReason: null,
  },
  {
    id: "help-airflow-double-run",
    developerId: "dev-rudo",
    title: "My Airflow DAG runs twice when the worker retries",
    body: "The task writes to the reporting table and a retry writes it again. The upsert should handle it but the row count still doubles for one specific table.",
    pathwayId: "problem-solver",
    tags: ["data", "airflow"],
    technologies: ["Python", "Airflow", "PostgreSQL"],
    createdAt: daysAgo(1),
    status: "open",
    urgency: "normal",
    answers: [],
    confirmedAnswerId: null,
    flagged: false,
    flagReason: null,
    acceptedBy: "dev-keith",
    acceptedAt: hoursAgo(3),
  },
  {
    id: "help-expo-prebuild",
    developerId: "dev-blessing",
    title: "Expo prebuild deletes my native folder changes",
    body: "I patched a native module directly and the next prebuild wiped it. I know there is a config plugin but I cannot work out which hook to use.",
    pathwayId: "builder",
    tags: ["expo", "react-native"],
    technologies: ["Expo", "React Native"],
    createdAt: daysAgo(3),
    status: "open",
    urgency: "normal",
    answers: [
      {
        id: "ans-6",
        authorId: "dev-takura",
        body: "Anything you want to survive a prebuild has to be declared as a plugin. Write a small local plugin with an `withX` hook and add it to app.json — it runs on every prebuild and reapplies your patch.",
        createdAt: daysAgo(3),
        confirmed: false,
        helpfulCount: 4,
      },
    ],
    confirmedAnswerId: null,
    flagged: false,
    flagReason: null,
    acceptedBy: "dev-takura",
    acceptedAt: daysAgo(2),
  },
];

export const helpRequests: HelpRequest[] = seed.map((request) => ({
  ...request,
  acceptedBy: request.acceptedBy ?? null,
  acceptedAt: request.acceptedAt ?? null,
}));

export const helpRequestsById = Object.fromEntries(
  helpRequests.map((request) => [request.id, request]),
);