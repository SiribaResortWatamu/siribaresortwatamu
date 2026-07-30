"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaChartPie, FaKey, FaVanShuttle, FaArrowRightFromBracket } from "react-icons/fa6";
import { signOutAction } from "@/lib/actions/admin";

const NAV_ITEMS = [
  { href: "/admin", label: "Overview", icon: FaChartPie },
  { href: "/admin/bookings", label: "Reservations", icon: FaKey },
  { href: "/admin/safaris", label: "Safaris", icon: FaVanShuttle },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-64 shrink-0 flex-col bg-ink text-white">
      <div className="border-b border-white/10 px-6 py-8 text-center">
        <h1 className="font-display text-xl tracking-widest">SIRIBA</h1>
        <span className="text-xs uppercase tracking-widest text-white/60">Management</span>
      </div>

      <nav className="flex-1 py-6">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 border-l-4 px-6 py-3 text-sm font-medium transition-colors ${
                active
                  ? "border-terracotta bg-white/10 text-white"
                  : "border-transparent text-white/70 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon /> {label}
            </Link>
          );
        })}
      </nav>

      <form action={signOutAction} className="border-t border-white/10 p-6">
        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-full border border-white/30 py-2.5 text-sm font-medium transition-colors hover:bg-white hover:text-ink"
        >
          <FaArrowRightFromBracket /> Logout
        </button>
      </form>
    </aside>
  );
}
