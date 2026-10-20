import { Card } from "@/components/ui/card";

export default function ProbeLoading() {
  return (
    <div className="px-4 py-8 sm:px-6" role="status" aria-busy="true">
      <p className="sr-only">Loading persisted Probes…</p>
      <div className="h-8 w-48 animate-pulse rounded bg-sand-300" />
      <div className="mt-3 h-4 w-2/3 animate-pulse rounded bg-sand-200" />
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <Card key={index} className="h-24 animate-pulse bg-sand-200" />
        ))}
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <Card key={index} className="h-64 animate-pulse bg-sand-200" />
        ))}
      </div>
    </div>
  );
}
