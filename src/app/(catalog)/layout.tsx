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

      <footer className="mt-16 border-t border-gray-100 py-10" style={{ backgroundColor: s?.footerBgColor ?? "#f9fafb" }}>
        <div className="max-w-screen-xl mx-auto px-4 text-center">
          <p className="font-bold text-gray-900 mb-1">{tenant.name}</p>
          <p className="text-gray-400 text-sm">
            © {new Date().getFullYear()} {tenant.name}. Todos los derechos reservados.
          </p>
        </div>
      </footer>

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
