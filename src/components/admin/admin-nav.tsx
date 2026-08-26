"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BedDouble,
  CalendarDays,
  Car,
  Compass,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  Settings,
  Sparkles,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface Badges {
  bookings: number;
  enquiries: number;
  transfers: number;
  messages: number;
}

const GROUPS = [
  {
    title: "Overview",
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
      { href: "/admin/calendar", label: "Calendar", icon: CalendarDays },
    ],
  },
  {
    title: "Bookings",
    items: [
      { href: "/admin/bookings", label: "Bookings", icon: BedDouble, badge: "bookings" },
      { href: "/admin/guests", label: "Guests", icon: Users },
    ],
  },
  {
    title: "Content",
    items: [
      { href: "/admin/accommodation", label: "Accommodation", icon: BedDouble },
      { href: "/admin/safaris", label: "Safaris", icon: Compass },
      { href: "/admin/transfers", label: "Transfers", icon: Car },
      { href: "/admin/amenities", label: "Amenities", icon: Sparkles },
    ],
  },
  {
    title: "Requests",
    items: [
      {
        href: "/admin/safaris/enquiries",
        label: "Safari enquiries",
        icon: Compass,
        badge: "enquiries",
      },
      {
        href: "/admin/transfers/requests",
        label: "Transfer requests",
        icon: Car,
        badge: "transfers",
      },
      { href: "/admin/messages", label: "Messages", icon: Mail, badge: "messages" },
    ],
  },
  {
    title: "Operations",
    items: [
      { href: "/admin/drivers", label: "Drivers & vehicles", icon: UserRound },
      { href: "/admin/settings", label: "Settings", icon: Settings },
    ],
  },
] as const;

export function AdminNav({
  user,
  badges,
}: {
  user: { email: string; fullName: string | null; role: string };
  badges: Badges;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile bar */}
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-line bg-sand px-4 py-3 lg:hidden">
        <Link href="/admin" className="font-display text-base font-semibold">
          Siriba Dashboard
        </Link>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-muted hover:bg-sand-deep"
        >
          <Menu size={20} strokeWidth={1.5} />
        </button>
      </div>

      {/* Backdrop */}
      {open && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-ink/40 lg:hidden"
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-line bg-white transition-transform duration-300 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-5">
          <Link href="/admin" onClick={() => setOpen(false)}>
            <p className="font-display text-base leading-tight font-semibold">
              Siriba Resort
            </p>
            <p className="mt-0.5 text-[0.6rem] tracking-[0.2em] text-ink-muted uppercase">
              Watamu · Dashboard
            </p>
          </Link>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted hover:bg-sand-deep lg:hidden"
          >
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {GROUPS.map((group) => (
            <div key={group.title} className="mb-5">
              <p className="px-3 pb-2 text-[0.62rem] font-medium tracking-[0.14em] text-ink-muted uppercase">
                {group.title}
              </p>
              <ul className="space-y-0.5">
                {group.items.map((item) => (
                  <li key={item.href}>
                    <NavLink
                      href={item.href}
                      label={item.label}
                      icon={item.icon}
                      exact={"exact" in item ? item.exact : false}
                      count={
                        "badge" in item
                          ? badges[item.badge as keyof Badges]
                          : undefined
                      }
                      onNavigate={() => setOpen(false)}
                    />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-t border-line px-3 py-4">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-ink-muted transition-colors hover:bg-sand-deep hover:text-ink"
          >
            <ExternalLink size={16} strokeWidth={1.5} />
            View website
          </a>

          <div className="mt-3 flex items-center gap-3 rounded-lg bg-sand px-3 py-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ocean text-xs font-medium text-white">
              {initials(user.fullName ?? user.email)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium">
                {user.fullName ?? user.email}
              </p>
              <p className="truncate text-[0.65rem] text-ink-muted capitalize">
                {user.role}
              </p>
            </div>
            <SignOutButton />
          </div>
        </div>
      </aside>
    </>
  );
}

function NavLink({
  href,
  label,
  icon: Icon,
  exact,
  count,
  onNavigate,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  exact?: boolean;
  count?: number;
  onNavigate: () => void;
}) {
  const pathname = usePathname();

  // `/admin/safaris` must not light up while you are on `/admin/safaris/enquiries`.
  const active = exact
    ? pathname === href
    : pathname === href ||
      (pathname.startsWith(`${href}/`) && !isSiblingSection(pathname, href));

  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
        active
          ? "bg-ocean-soft font-medium text-ocean-dark"
          : "text-ink-muted hover:bg-sand-deep hover:text-ink",
      )}
    >
      <Icon size={16} strokeWidth={1.5} />
      <span className="flex-1 truncate">{label}</span>
      {count !== undefined && count > 0 && (
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-terracotta px-1.5 text-[0.65rem] font-medium text-white tabular-nums">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}

/** True when the path belongs to a nested section with its own nav entry. */
function isSiblingSection(pathname: string, href: string): boolean {
  const nested = ["/enquiries", "/requests"];
  return nested.some((segment) => pathname.startsWith(`${href}${segment}`));
}

function SignOutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  return (
    <button
      type="button"
      aria-label="Sign out"
      title="Sign out"
      disabled={pending}
      onClick={async () => {
        setPending(true);
        await createSupabaseBrowserClient().auth.signOut();
        router.replace("/admin/login");
        router.refresh();
      }}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-white hover:text-[#a3402c] disabled:opacity-50"
    >
      <LogOut size={15} strokeWidth={1.5} />
    </button>
  );
}

function initials(value: string): string {
  const parts = value.replace(/@.*/, "").split(/[\s._-]+/).filter(Boolean);
  return (parts[0]?.[0] ?? "?").toUpperCase() + (parts[1]?.[0]?.toUpperCase() ?? "");
}
