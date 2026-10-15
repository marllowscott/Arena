import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { isActivePath, type NavItem } from "@/lib/nav";
import { cn } from "@/lib/utils";

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      href="/"
      prefetch
      className="group flex items-center gap-2.5 rounded-md py-1 pr-2 transition-opacity hover:opacity-90"
    >
      <Image src="/logo.svg" alt="" width={32} height={32} className="size-8 shrink-0" />
      {!compact ? (
        <span className="flex flex-col leading-none">
          <span className="font-display text-sm font-bold uppercase tracking-[0.16em] text-sand-50">
            Dev Arena
          </span>
          <span className="mt-1 font-mono text-[9px] uppercase tracking-[0.14em] text-ink-300">
            Mufakose Innovation Hub
          </span>
        </span>
      ) : null}
    </Link>
  );
}

export function NavList({
  items,
  onNavigate,
  collapsed = false,
}: {
  items: NavItem[];
  onNavigate?: () => void;
  collapsed?: boolean;
}) {
  const pathname = usePathname();

  return (
    <nav aria-label="Primary">
      <ul className="space-y-0.5">
        {items.map((item) => {
          const active = isActivePath(pathname, item.href);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                prefetch
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                title={collapsed ? item.label : undefined}
                className={cn(
                  "group relative flex items-center gap-3 rounded-md px-3 py-2.5 transition-colors duration-150",
                  active
                    ? "bg-ink-800 text-sand-50"
                    : "text-sand-300/80 hover:bg-ink-850 hover:text-sand-100",
                  collapsed && "justify-center px-2"
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-secondary transition-opacity",
                    active ? "opacity-100" : "opacity-0"
                  )}
                />
                <Icon
                  className={cn(
                    "size-[18px] shrink-0 transition-colors",
                    active ? "text-secondary" : "text-sand-300/70 group-hover:text-sand-200"
                  )}
                  aria-hidden
                />
                {!collapsed && (
                  <span className="flex min-w-0 flex-col leading-tight">
                    <span className="text-sm font-medium">{item.label}</span>
                    <span
                      className={cn(
                        "hidden truncate font-mono text-[9px] uppercase tracking-[0.1em] lg:block",
                        active ? "text-ink-200" : "text-ink-300/70"
                      )}
                    >
                      {item.hint}
                    </span>
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function SwitchAreaLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      prefetch
      className="flex h-10 items-center justify-between gap-2 rounded-md border border-ink-700 bg-ink-850 px-3 text-xs text-sand-300 transition-colors hover:border-ink-600 hover:text-sand-100"
    >
      <span className="font-mono text-[10px] uppercase tracking-[0.12em]">{label}</span>
      <ArrowUpRight className="size-3.5" aria-hidden />
    </Link>
  );
}