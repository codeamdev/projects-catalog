"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { Menu, X, LineChart, Package, Tag, ClipboardList, Settings, ExternalLink, LogOut, SlidersHorizontal, Users, Mail } from "lucide-react";

const NAV = [
  { href: "/admin", label: "Informes", icon: LineChart, exact: true },
  { href: "/admin/products", label: "Productos", icon: Package },
  { href: "/admin/categories", label: "Categorías", icon: Tag },
  { href: "/admin/filters", label: "Filtros", icon: SlidersHorizontal },
  { href: "/admin/orders", label: "Pedidos", icon: ClipboardList },
  { href: "/admin/subscribers", label: "Suscriptores", icon: Users },
  { href: "/admin/emails", label: "Correos", icon: Mail },
  { href: "/admin/settings", label: "Ajustes", icon: Settings },
];

function SidebarContent({
  tenantName,
  onClose,
}: {
  tenantName: string;
  onClose?: () => void;
}) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full">
      {/* Branding */}
      <div className="px-5 py-5 border-b border-gray-100 flex items-center justify-between">
        <div>
          <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-0.5">Catálogo</p>
          <p className="font-semibold text-gray-900 text-sm leading-tight truncate max-w-[140px]">
            {tenantName}
          </p>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors lg:hidden">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                active
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-gray-500 hover:bg-indigo-50 hover:text-indigo-700"
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-gray-100 space-y-0.5">
        <Link
          href="/"
          target="_blank"
          onClick={onClose}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          Ver catálogo
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/admin/login" })}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-500 hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}

export function AdminShell({
  tenantName,
  children,
}: {
  tenantName: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Cierra el drawer al navegar
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* ── Sidebar desktop ──────────────────────────── */}
      <aside className="hidden lg:flex lg:flex-col lg:w-60 bg-white border-r border-gray-100 fixed inset-y-0 left-0 z-20">
        <SidebarContent tenantName={tenantName} />
      </aside>

      {/* ── Drawer mobile ────────────────────────────── */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          {/* Panel */}
          <aside className="relative w-72 max-w-[85vw] bg-white flex flex-col shadow-2xl">
            <SidebarContent tenantName={tenantName} onClose={() => setOpen(false)} />
          </aside>
        </div>
      )}

      {/* ── Contenido principal ──────────────────────── */}
      <div className="flex-1 lg:ml-60 flex flex-col min-h-screen">
        {/* Topbar mobile */}
        <header className="lg:hidden sticky top-0 z-30 bg-white border-b border-gray-100 px-4 h-14 flex items-center gap-3">
          <button
            onClick={() => setOpen(true)}
            className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors"
            aria-label="Abrir menú"
          >
            <Menu className="w-5 h-5" />
          </button>
          <p className="font-semibold text-gray-900 text-sm truncate">{tenantName}</p>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
