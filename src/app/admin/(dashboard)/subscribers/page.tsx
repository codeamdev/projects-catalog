import { auth } from "@/lib/auth";
import { withTenantDb } from "@/db";
import { subscribers } from "@/db/tenant-schema";
import { isNull, isNotNull, desc } from "drizzle-orm";

function fmtDate(d: Date | null | undefined) {
  if (!d) return "—";
  return new Intl.DateTimeFormat("es-AR", { day: "numeric", month: "short", year: "numeric" }).format(new Date(d));
}

export default async function SubscribersPage() {
  const session = await auth();
  const schema = session!.user.schemaName;

  const allSubscribers = await withTenantDb(schema, (db) =>
    db.select().from(subscribers).orderBy(desc(subscribers.subscribedAt))
  );

  const active = allSubscribers.filter((s) => !s.unsubscribedAt);
  const codeUsed = allSubscribers.filter((s) => s.discountUsedAt);

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Suscriptores</h1>
        <p className="text-sm text-gray-400 mt-1">Clientes que se suscribieron desde el popup de bienvenida</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total", value: allSubscribers.length, icon: "📋" },
          { label: "Activos", value: active.length, icon: "✅" },
          { label: "Código usado", value: codeUsed.length, icon: "🏷️" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="text-2xl mb-1">{s.icon}</p>
            <p className="text-3xl font-bold text-gray-900">{s.value}</p>
            <p className="text-sm text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {allSubscribers.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-4xl mb-3">📭</p>
            <p className="text-gray-500 font-medium">Aún no hay suscriptores</p>
            <p className="text-gray-400 text-sm mt-1">Activá el popup de bienvenida en Ajustes</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Nombre</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Email</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Código</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Usado</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Fecha</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {allSubscribers.map((s) => (
                  <tr key={s.id} className={s.unsubscribedAt ? "opacity-40" : "hover:bg-gray-50/50"}>
                    <td className="px-5 py-3.5 font-medium text-gray-800">{s.name || <span className="text-gray-300">—</span>}</td>
                    <td className="px-5 py-3.5 text-gray-600">{s.email}</td>
                    <td className="px-5 py-3.5">
                      {s.discountCode
                        ? <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded-md text-gray-700">{s.discountCode}</span>
                        : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-5 py-3.5">
                      {s.discountUsedAt
                        ? <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-full">✓ {fmtDate(s.discountUsedAt)}</span>
                        : <span className="text-gray-300 text-xs">No</span>}
                    </td>
                    <td className="px-5 py-3.5 text-gray-400 text-xs">{fmtDate(s.subscribedAt)}</td>
                    <td className="px-5 py-3.5">
                      {s.unsubscribedAt
                        ? <span className="text-xs text-gray-400">Dado de baja</span>
                        : <span className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">Activo</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
