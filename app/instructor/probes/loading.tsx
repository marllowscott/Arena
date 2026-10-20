import { Card } from "@/components/ui/card";

export default function InstructorProbesLoading() {
  return (
    <div className="px-4 py-8 sm:px-6" role="status" aria-busy="true">
      <p className="sr-only">Loading moderation reports…</p>
      <div className="h-8 w-56 animate-pulse rounded bg-sand-300" />
      <div className="mt-3 h-4 w-2/3 animate-pulse rounded bg-sand-200" />
      <div className="mt-8 space-y-4">
        {Array.from({ length: 2 }, (_, index) => (
          <Card key={index} className="h-52 animate-pulse bg-sand-200" />
        ))}
      </div>
    </div>
  );
}
