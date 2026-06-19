import { auth } from "@/lib/auth";
import { withTenantDb } from "@/db";
import { subscribers } from "@/db/tenant-schema";
import { desc } from "drizzle-orm";
import { SubscribersTable } from "./SubscribersTable";

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
        <SubscribersTable subscribers={allSubscribers} />
      </div>
    </div>
  );
}
