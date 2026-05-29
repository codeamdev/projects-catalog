"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { LayoutDashboard, Building2 } from "lucide-react";

const NAV = [
  { href: "/superadmin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/superadmin/tenants", label: "Tenants", icon: Building2 },
];

export function SuperAdminSidebar() {
  const pathname = usePathname();

  return (
    <>
      {/* ── Sidebar desktop ── */}
      <aside className="hidden lg:flex lg:flex-col w-56 bg-gray-900 text-white flex-shrink-0">
        <div className="px-5 py-5 border-b border-gray-700">
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Super Admin</p>
          <p className="font-semibold text-white text-sm">Panel Global</p>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  active
                    ? "bg-gray-700 text-white"
                    : "text-gray-400 hover:bg-gray-800 hover:text-white"
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="px-3 py-4 border-t border-gray-700">
          <button
            onClick={() => signOut({ callbackUrl: "/superadmin/login" })}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:bg-gray-800 transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ── Topbar mobile ── */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-30 bg-gray-900 text-white px-4 h-14 flex items-center justify-between gap-4 border-b border-gray-700">
        <p className="text-sm font-semibold text-white">Super Admin</p>
        <nav className="flex items-center gap-1">
          {NAV.map(({ href, label, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  active
                    ? "bg-gray-700 text-white"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                {label}
              </Link>
            );
          })}
          <button
            onClick={() => signOut({ callbackUrl: "/superadmin/login" })}
            className="px-3 py-1.5 rounded-lg text-xs text-red-400 hover:text-red-300 transition-colors"
          >
            Salir
          </button>
        </nav>
      </header>
    </>
  );
}
