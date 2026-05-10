"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const NAV = [
  { href: "/superadmin", label: "Dashboard", exact: true },
  { href: "/superadmin/tenants", label: "Tenants" },
];

export function SuperAdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 bg-gray-900 text-white flex flex-col">
      <div className="px-5 py-5 border-b border-gray-700">
        <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Super Admin</p>
        <p className="font-semibold text-white text-sm">Panel Global</p>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map(({ href, label, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-gray-700 text-white"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="px-3 py-4 border-t border-gray-700">
        <button
          onClick={() => signOut({ callbackUrl: "/superadmin/login" })}
          className="w-full text-left px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-gray-800 transition-colors"
        >
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
