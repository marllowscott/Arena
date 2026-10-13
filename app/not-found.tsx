import Link from "next/link";
import { Compass } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { paths } from "@/lib/nav";
import { cn } from "@/lib/utils";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[70dvh] w-full max-w-2xl flex-col items-center justify-center px-6 text-center">
      <span className="inline-flex size-12 items-center justify-center rounded-full border border-sand-400 bg-sand-50">
        <Compass className="size-5 text-ink-400" aria-hidden />
      </span>
      <p className="eyebrow mt-5">404 · Off the map</p>
      <h1 className="mt-3 font-display text-3xl font-bold tracking-tight text-ink-900">
        That screen does not exist
      </h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-ink-500">
        The link may be old, or the mission may have been closed. Everything below still works.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
        {paths.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(buttonVariants({ variant: "secondary", size: "sm", tone: "tech" }))}
          >
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}