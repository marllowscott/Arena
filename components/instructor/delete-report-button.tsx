"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { deleteProblemReport } from "@/lib/arena/actions";

export function DeleteReportButton({ reportId }: { reportId: string }) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function remove() {
    if (!window.confirm("Delete this problem report? This cannot be undone.")) return;
    setPending(true);
    setError(null);
    try {
      const result = await deleteProblemReport(reportId);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mt-3">
      <Button type="button" size="sm" variant="danger" disabled={pending} onClick={remove}>
        {pending ? "Deleting…" : "Delete report"}
      </Button>
      {error ? <p className="mt-1 text-xs text-primary">{error}</p> : null}
    </div>
  );
}