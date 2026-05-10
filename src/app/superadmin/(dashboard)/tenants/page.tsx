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
                <th className="text-left px-6 py-3 font-medium text-gray-500 hidden md:table-cell">Color</th>
                <th className="text-left px-6 py-3 font-medium text-gray-500">Estado</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {tenantList.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-900">{t.name}</p>
                    <p className="text-xs text-gray-400 sm:hidden">{t.subdomain}</p>
                  </td>
                  <td className="px-6 py-4 hidden sm:table-cell text-gray-600">{t.subdomain}</td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-5 h-5 rounded-full border border-gray-200"
                        style={{ background: t.primaryColor }}
                      />
                      <span className="text-gray-500 font-mono text-xs">{t.primaryColor}</span>
                    </div>
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
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
