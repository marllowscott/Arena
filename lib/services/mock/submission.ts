import type { Submission } from "@/lib/types";
import { submissions } from "@/lib/mock/submissions";
import type { SubmissionService } from "../contracts";

export const submissionService: SubmissionService = {
  all: (): Submission[] => submissions,

  queue: (): Submission[] =>
    submissions
      .filter((submission) => submission.status === "pending")
      .sort((a, b) => new Date(a.submittedAt).getTime() - new Date(b.submittedAt).getTime()),

  forDeveloper: (developerId: string): Submission[] =>
    submissions
      .filter((submission) => submission.developerId === developerId)
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()),

  forChallenge: (challengeId: string): Submission[] =>
    submissions.filter((submission) => submission.challengeId === challengeId),
};