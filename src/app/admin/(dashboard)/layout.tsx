import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { publicDb } from "@/db";
import { tenants } from "@/db/public-schema";
import { AdminShell } from "@/components/admin/AdminShell";
import { SessionGuard } from "@/components/admin/SessionGuard";
import { Toaster } from "sonner";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/admin/login");

  const [tenant] = await publicDb
    .select({ publishedUntil: tenants.publishedUntil, active: tenants.active })
    .from(tenants)
    .where(eq(tenants.schemaName, session.user.schemaName))
    .limit(1);

  const now = new Date();
  const until = tenant?.publishedUntil ? new Date(tenant.publishedUntil) : null;
  const daysLeft = until ? Math.ceil((until.getTime() - now.getTime()) / 86400000) : null;
  const expired = daysLeft !== null && daysLeft <= 0;
  const expiringSoon = daysLeft !== null && daysLeft > 0 && daysLeft <= 30;

  return (
    <>
      <AdminShell tenantName={session.user.tenantName}>
        {/* Banner de aviso de plan */}
        {expired && (
          <div className="bg-red-50 border-b border-red-200 px-4 py-3 flex items-center gap-3">
            <span className="text-red-500 text-lg">⚠</span>
            <div>
              <p className="text-sm font-semibold text-red-700">Tu suscripción ha vencido</p>
              <p className="text-xs text-red-600 mt-0.5">
                El catálogo público no está disponible. Contactá al administrador para renovar el servicio.
              </p>
            </div>
          </div>
        )}
        {expiringSoon && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 flex items-center gap-3">
            <span className="text-amber-500 text-lg">⚡</span>
            <div>
              <p className="text-sm font-semibold text-amber-700">
                Tu plan vence en {daysLeft} día{daysLeft !== 1 ? "s" : ""}
              </p>
              <p className="text-xs text-amber-600 mt-0.5">
                Vence el {until!.toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })}. Contactá al administrador para renovar.
              </p>
            </div>
          </div>
        )}
        {children}
      </AdminShell>
      <SessionGuard expires={session.expires} loginPath="/admin/login" />
      <Toaster position="top-right" richColors closeButton />
    </>
  );
}
