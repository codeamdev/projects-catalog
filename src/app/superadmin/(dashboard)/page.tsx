import Link from "next/link";
import { getDashboardStats } from "@/app/api/superadmin/actions";

export default async function SuperAdminDashboard() {
  const stats = await getDashboardStats();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Visión global de todos los tenants</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <div className="bg-white rounded-2xl border p-6">
          <p className="text-sm text-gray-500 mb-1">Total tenants</p>
          <p className="text-4xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-2xl border p-6">
          <p className="text-sm text-gray-500 mb-1">Activos</p>
          <p className="text-4xl font-bold text-green-600">{stats.active}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Tenants recientes</h2>
          <Link
            href="/superadmin/tenants"
            className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            Ver todos →
          </Link>
        </div>
        {stats.recent.length === 0 ? (
          <div className="px-6 py-10 text-center text-gray-400 text-sm">
            Aún no hay tenants.{" "}
            <Link href="/superadmin/tenants/new" className="text-gray-900 font-medium underline">
              Crear el primero
            </Link>
          </div>
        ) : (
          <ul className="divide-y">
            {stats.recent.map((t) => (
              <li key={t.id} className="px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ background: t.primaryColor }}
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{t.name}</p>
                    <p className="text-xs text-gray-400">{t.subdomain}</p>
                  </div>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    t.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {t.active ? "Activo" : "Inactivo"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
