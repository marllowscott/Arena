import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface FilterLinkOption {
  value: string;
  label: string;
  count?: number;
}

/**
 * Server-rendered filter chips. Each option is a link, so a filtered view can
 * be bookmarked or shared and the list stays a server component.
 */
export function FilterLinks({
  options,
  basePath,
  params,
  paramName,
  label,
  size = "md",
  className,
}: {
  options: FilterLinkOption[];
  basePath: string;
  params: Record<string, string | string[] | undefined>;
  paramName: string;
  label: string;
  size?: "sm" | "md";
  className?: string;
}) {
  const current = params[paramName];
  const currentValue = Array.isArray(current) ? current[0] : current;

  return (
    <div role="group" aria-label={label} className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {options.map((option) => {
        const selected = option.value === (currentValue ?? "");
        const search = new URLSearchParams();
        for (const [key, value] of Object.entries(params)) {
          if (key === paramName) continue;
          const flat = Array.isArray(value) ? value[0] : value;
          if (flat) search.set(key, flat);
        }
        if (option.value) search.set(paramName, option.value);

        return (
          <Link
            key={option.value}
            href={`${basePath}?${search.toString()}`}
            aria-current={selected ? "true" : undefined}
            className={cn(
              buttonVariants({
                variant: selected ? "primary" : "secondary",
                size,
                tone: "tech",
              }),
              "transition-colors duration-150",
              !selected && "text-ink-500 hover:text-ink-800",
            )}
          >
            {option.label}
            {typeof option.count === "number" ? (
              <span
                className={cn(
                  "ml-1.5 tabular-nums",
                  selected ? "text-sand-200" : "text-ink-300",
                )}
              >
                {option.count}
              </span>
            ) : null}
          </Link>
        );
      })}
    </div>
  );
}
