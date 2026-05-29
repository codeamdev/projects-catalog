import Link from "next/link";
import { getTenants, toggleTenantActive } from "@/app/api/superadmin/actions";
import { ToggleTenantButton } from "./ToggleTenantButton";

export default async function TenantsPage() {
  const tenantList = await getTenants();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tenants</h1>
          <p className="text-sm text-gray-500 mt-1">{tenantList.length} registrado{tenantList.length !== 1 ? "s" : ""}</p>
        </div>
        <Link
          href="/superadmin/tenants/new"
          className="bg-gray-900 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-700 transition-colors"
        >
          + Nuevo tenant
        </Link>
      </div>

      <div className="bg-white rounded-2xl border overflow-hidden">
        {tenantList.length === 0 ? (
          <div className="px-6 py-16 text-center text-gray-400 text-sm">
            No hay tenants aún.{" "}
            <Link href="/superadmin/tenants/new" className="text-gray-900 font-medium underline">
              Crear el primero
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="text-left px-6 py-3 font-medium text-gray-500">Nombre</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500 hidden sm:table-cell">Subdominio</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500 hidden lg:table-cell">Vencimiento</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Estado</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {tenantList.map((t) => {
                const now = new Date();
                const until = t.publishedUntil ? new Date(t.publishedUntil) : null;
                const expired = until ? until < now : false;
                const expiringSoon = until && !expired ? until < new Date(Date.now() + 30 * 86400000) : false;
                return (
                <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900">{t.name}</p>
                    <p className="text-xs text-gray-400 sm:hidden">{t.subdomain}</p>
                  </td>
                  <td className="px-6 py-4 hidden sm:table-cell text-gray-600">{t.subdomain}</td>
                  <td className="px-6 py-4 hidden lg:table-cell">
                    {until ? (
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        expired        ? "bg-red-100 text-red-700" :
                        expiringSoon   ? "bg-amber-100 text-amber-700" :
                                         "bg-gray-100 text-gray-600"
                      }`}>
                        {expired ? "Vencido" : until.toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-300">Sin límite</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <ToggleTenantButton
                      id={t.id}
                      active={t.active}
                      toggleAction={toggleTenantActive}
                    />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/superadmin/tenants/${t.id}`}
                      className="text-gray-500 hover:text-gray-900 font-medium transition-colors"
                    >
                      Editar
                    </Link>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
