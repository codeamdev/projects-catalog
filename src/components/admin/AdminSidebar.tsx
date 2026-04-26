"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/products", label: "Productos" },
  { href: "/admin/categories", label: "Categorías" },
  { href: "/admin/orders", label: "Pedidos" },
  { href: "/admin/settings", label: "Ajustes" },
];

export function AdminSidebar({ tenantName }: { tenantName: string }) {
  const pathname = usePathname();

  return (
    <aside className="w-56 bg-white border-r flex flex-col">
      <div className="px-5 py-5 border-b">
        <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Catálogo</p>
        <p className="font-semibold text-gray-900 text-sm leading-tight">{tenantName}</p>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map(({ href, label }) => {
          const active =
            href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="px-3 py-4 border-t">
        <Link
          href="/"
          target="_blank"
          className="block px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-50 mb-1"
        >
          Ver catálogo →
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/admin/login" })}
          className="w-full text-left px-3 py-2 rounded-lg text-sm text-red-500 hover:bg-red-50 transition-colors"
        >
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
