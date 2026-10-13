"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Menu, ShieldCheck, UserRound, X, ChevronLeft, ChevronRight, GripVertical } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { BrandMark, NavList, SwitchAreaLink } from "./sidebar-parts";
import { formatXp } from "@/lib/format";
import { levelForXp } from "@/lib/progression";
import { developerNav, instructorNav, isActivePath, type NavItem } from "@/lib/nav";
import { logout } from "@/lib/arena/actions";
import { cn } from "@/lib/utils";
import { useSidebarState } from "./sidebar-state";
import { ProfilePhotoUpload } from "@/components/shared/profile-photo-upload";

interface ShellIdentity {
  name: string;
  handle: string;
  initials: string;
  avatarFrom: string;
  avatarTo: string;
  avatarUrl?: string;
  totalXp: number;
  weeklyXp: number;
  unreadCount: number;
  title: string;
  pathwayName: string;
  progress: number;
  xpToNext: number;
  profileHref: string;
}

function SignOutButton() {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);
  return (
    <button
      type="button"
      disabled={pending}
      onClick={async () => {
        setPending(true);
        await logout();
        router.refresh();
      }}
      className="flex h-10 items-center justify-between gap-2 rounded-md border border-ink-700 bg-ink-850 px-3 text-xs text-sand-300 transition-colors hover:border-ink-600 hover:text-sand-100 disabled:opacity-50"
    >
      <span className="font-mono text-[10px] uppercase tracking-[0.12em]">Sign out</span>
      <LogOut className="size-3.5" aria-hidden />
    </button>
  );
}

function MobileDrawer({
  open,
  onClose,
  items,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  items: NavItem[];
  footer: React.ReactNode;
}) {
  const closeRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    if (open) closeRef.current?.focus();
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-60 lg:hidden">
      <button
        type="button"
        aria-label="Close navigation"
        onClick={onClose}
        className="animate-fade-in absolute inset-0 h-full w-full cursor-default bg-ink-950/60 backdrop-blur-sm"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Navigation"
        className="animate-fade-in absolute inset-y-0 left-0 flex w-[min(22rem,85vw)] flex-col overflow-y-auto bg-ink-900 shadow-deep"
      >
        <div className="flex items-center justify-between gap-2 border-b border-ink-700 px-4 py-4">
          <BrandMark />
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            className="inline-flex size-9 items-center justify-center rounded-md border border-ink-700 text-sand-300 transition-colors hover:border-ink-600 hover:text-sand-100"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>

        <div className="flex-1 px-3 py-4">
          <NavList items={items} onNavigate={onClose} />
        </div>

        <div className="space-y-2 border-t border-ink-700 px-3 py-4">{footer}</div>
      </div>
    </div>
  );
}

function ShellFrame({
  items,
  topBarExtra,
  footer,
  children,
}: {
  items: NavItem[];
  topBarExtra: React.ReactNode;
  footer: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [drawer, setDrawer] = React.useState({ path: pathname, open: false });
  if (drawer.path !== pathname) {
    setDrawer({ path: pathname, open: false });
  }
  const open = drawer.path === pathname && drawer.open;

  const { state: sidebarState, toggle: toggleSidebar } = useSidebarState();

  const section =
    items.find((item) => isActivePath(pathname, item.href))?.label ?? items[0].label;

  return (
    <div className="min-h-dvh lg:flex">
      <aside
        className="sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-ink-800 bg-ink-900 px-3 py-4 lg:flex"
        style={{ width: sidebarState.collapsed ? 64 : sidebarState.width }}
      >
        <div className="px-1 pb-5">
          {!sidebarState.collapsed && <BrandMark />}
        </div>

        <div className="flex-1 overflow-y-auto">
          <NavList items={items} collapsed={sidebarState.collapsed} />
        </div>

        <div className="space-y-2 pt-4">
          {!sidebarState.collapsed && footer}
          {sidebarState.collapsed && (
            <div className="px-2">
              <button
                type="button"
                onClick={toggleSidebar}
                aria-label="Expand sidebar"
                className="w-full inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-xs text-sand-300 transition-colors hover:bg-ink-850 hover:text-sand-100"
              >
                <ChevronRight className="size-4" aria-hidden />
              </button>
            </div>
          )}
        </div>

        {/* Resize handle */}
        {!sidebarState.collapsed && (
          <div
            className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-primary/50"
            onMouseDown={(e) => {
              e.preventDefault();
              const startX = e.clientX;
              const startWidth = sidebarState.width;

              const onMouseMove = (moveEvent: MouseEvent) => {
                const newWidth = startWidth + (moveEvent.clientX - startX);
                if (newWidth >= 200 && newWidth <= 400) {
                  document.body.style.cursor = "col-resize";
                  document.body.style.userSelect = "none";
                  window.dispatchEvent(
                    new CustomEvent("sidebar-width-change", { detail: newWidth })
                  );
                }
              };

              const onMouseUp = () => {
                document.removeEventListener("mousemove", onMouseMove);
                document.removeEventListener("mouseup", onMouseUp);
                document.body.style.cursor = "";
                document.body.style.userSelect = "";
              };

              document.addEventListener("mousemove", onMouseMove);
              document.addEventListener("mouseup", onMouseUp);
            }}
          >
            <GripVertical className="mx-auto mt-8 size-4 text-ink-600" aria-hidden />
          </div>
        )}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 border-b border-sand-300 bg-sand-100/85 backdrop-blur-md">
          <div className="flex h-14 items-center gap-3 px-4 sm:px-6">
            <button
              type="button"
              onClick={() => setDrawer({ path: pathname, open: true })}
              aria-label="Open navigation"
              aria-expanded={open}
              className="inline-flex size-9 items-center justify-center rounded-md border border-sand-400 bg-sand-50 text-ink-600 transition-colors hover:border-ink-300 lg:hidden"
            >
              <Menu className="size-4" aria-hidden />
            </button>

            <button
              type="button"
              onClick={toggleSidebar}
              aria-label={sidebarState.collapsed ? "Expand sidebar" : "Collapse sidebar"}
              className="hidden size-9 items-center justify-center rounded-md border border-sand-400 bg-sand-50 text-ink-600 transition-colors hover:border-ink-300 lg:inline-flex"
            >
              {sidebarState.collapsed ? (
                <ChevronRight className="size-4" aria-hidden />
              ) : (
                <ChevronLeft className="size-4" aria-hidden />
              )}
            </button>

            <span className="eyebrow min-w-0 flex-1 truncate">{section}</span>

            <div className="flex items-center gap-2 sm:gap-3">{topBarExtra}</div>
          </div>
        </header>

        <main className="min-w-0 flex-1">{children}</main>
      </div>

      <MobileDrawer
        open={open}
        onClose={() => setDrawer({ path: pathname, open: false })}
        items={items}
        footer={footer}
      />
    </div>
  );
}

function IdentityPanel({ identity }: { identity: ShellIdentity }) {
  return (
    <>
      <Link
        href={identity.profileHref}
        className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-ink-300 transition-colors hover:bg-ink-850 hover:text-sand-100"
      >
        <UserRound className="size-4" aria-hidden />
        Your record
      </Link>
      <SignOutButton />
    </>
  );
}

function TopBar({ identity }: { identity: ShellIdentity }) {
  const level = levelForXp(identity.totalXp);
  return (
    <>
      <Link
        href={identity.profileHref}
        className="flex items-center gap-2.5 rounded-md py-1 pl-1 pr-2 transition-colors hover:bg-sand-200/70"
      >
        <Avatar
          initials={identity.initials}
          name={identity.name}
          from={identity.avatarFrom}
          to={identity.avatarTo}
          size="sm"
          src={identity.avatarUrl}
        />
        <div className="hidden min-w-0 sm:block">
          <div className="truncate text-xs font-medium text-ink-800">{identity.name}</div>
          <div className="truncate font-mono text-[9px] uppercase tracking-[0.12em] text-ink-400">
            Level {level.level} · {identity.pathwayName}
          </div>
        </div>
      </Link>

      <ProfilePhotoUpload avatarUrl={identity.avatarUrl} compact />

      <div className="hidden items-center rounded-md border border-sand-400 bg-sand-50 px-3 py-1.5 sm:flex">
        <div className="text-right">
          <div className="font-display text-sm font-bold leading-none tabular-nums text-primary">
            {formatXp(identity.totalXp)}
          </div>
          <div className="mt-1 font-mono text-[9px] uppercase tracking-[0.1em] text-ink-300">
            XP{identity.weeklyXp > 0 ? ` · +${formatXp(identity.weeklyXp)} wk` : ""}
          </div>
        </div>
      </div>

      {identity.unreadCount > 0 ? (
        <Badge tone="primary" className="hidden md:inline-flex">
          {identity.unreadCount} new
        </Badge>
      ) : null}
    </>
  );
}

export function DeveloperShell({
  identity,
  children,
}: {
  identity: ShellIdentity;
  children: React.ReactNode;
}) {
  return (
    <ShellFrame
      items={developerNav}
      footer={<IdentityPanel identity={identity} />}
      topBarExtra={<TopBar identity={identity} />}
    >
      {children}
    </ShellFrame>
  );
}

export function InstructorShell({
  identity,
  children,
}: {
  identity: ShellIdentity;
  children: React.ReactNode;
}) {
  return (
    <ShellFrame
      items={instructorNav}
      footer={
        <>
          <div className="rounded-lg border border-ink-700 bg-ink-850 p-3.5">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="size-4 text-secondary" aria-hidden />
              <div>
                <div className="text-sm font-medium text-sand-50">Instructor</div>
                <div className="font-mono text-[9px] uppercase tracking-[0.12em] text-ink-300">
                  Review authority
                </div>
              </div>
            </div>
          </div>
          <SignOutButton />
        </>
      }
      topBarExtra={<TopBar identity={identity} />}
    >
      {children}
    </ShellFrame>
  );
}

export function ShellSwitchArea({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  return <SwitchAreaLink href={href} label={label} />;
}

export { cn as shellCn };
