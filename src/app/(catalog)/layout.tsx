import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentTenant } from "@/lib/tenant";
import { withTenantDb } from "@/db";
import { settings } from "@/db/tenant-schema";
import { CartButton } from "@/components/cart/CartButton";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { WhatsAppButton } from "@/components/catalog/WhatsAppButton";

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await getCurrentTenant();
  if (!tenant?.logoUrl) return {};
  return { icons: { icon: tenant.logoUrl } };
}

export default async function CatalogLayout({ children }: { children: React.ReactNode }) {
  const tenant = await getCurrentTenant();
  if (!tenant) notFound();

  const [s] = await withTenantDb(tenant.schemaName, (db) =>
    db.select({ discountCode: settings.discountCode, discountCodePercent: settings.discountCodePercent, footerBgColor: settings.footerBgColor }).from(settings).limit(1)
  );

  return (
    <div
      className="min-h-screen bg-white"
      style={{ "--primary": tenant.primaryColor } as React.CSSProperties}
    >
      {/* Navbar mínimo — transparente sobre el hero */}
      <header className="fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-4 sm:px-6 h-20">
        <Link href="/" className="flex items-center gap-2">
          {tenant.logoUrl ? (
            <img src={tenant.logoUrl} alt={tenant.name} className="h-16 w-auto object-contain drop-shadow-md" />
          ) : (
            <span className="text-base font-bold text-white drop-shadow-md">
              {tenant.name}
            </span>
          )}
        </Link>
      </header>

      <main>{children}</main>

      {(() => {
        const bg = s?.footerBgColor ?? "#f9fafb";
        const h = bg.replace("#", "");
        const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
        const dark = (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.5;
        return (
          <footer className="mt-16 border-t py-10" style={{ backgroundColor: bg, borderColor: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)" }}>
            <div className="max-w-screen-xl mx-auto px-4 text-center">
              <p className="font-bold mb-1" style={{ color: dark ? "#ffffff" : "#111827" }}>{tenant.name}</p>
              <p className="text-sm" style={{ color: dark ? "#a1a1aa" : "#6b7280" }}>
                © {new Date().getFullYear()} {tenant.name}. Todos los derechos reservados.
              </p>
            </div>
          </footer>
        );
      })()}

      {tenant.whatsappNumber && <WhatsAppButton whatsappNumber={tenant.whatsappNumber} />}
      <CartButton />
      <CartDrawer
        tenantName={tenant.name}
        tenantSubdomain={tenant.subdomain}
        whatsappNumber={tenant.whatsappNumber}
        discountCode={s?.discountCode ?? null}
        discountCodePercent={s?.discountCodePercent ?? null}
      />
    </div>
  );
}
