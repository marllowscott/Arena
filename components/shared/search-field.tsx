import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * A GET search field. It submits to the current path and keeps the other
 * filters in the query string, so searching never loses the active view.
 */
export function SearchField({
  name,
  defaultValue,
  placeholder,
  basePath,
  params,
  label,
}: {
  name: string;
  defaultValue?: string;
  placeholder?: string;
  basePath: string;
  params: Record<string, string | string[] | undefined>;
  label: string;
}) {
  const hidden = Object.entries(params).filter(([key]) => key !== name);

  return (
    <form method="get" action={basePath} className="flex items-center gap-2">
      {hidden.map(([key, value]) => {
        const flat = Array.isArray(value) ? value[0] : value;
        if (!flat) return null;
        return <input key={key} type="hidden" name={key} value={flat} />;
      })}
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-300"
          aria-hidden
        />
        <Input
          type="search"
          name={name}
          defaultValue={defaultValue ?? ""}
          placeholder={placeholder}
          aria-label={label}
          className="pl-9"
        />
      </div>
      <Button type="submit" variant="secondary" tone="tech" size="md">
        Filter
      </Button>
    </form>
  );
}
