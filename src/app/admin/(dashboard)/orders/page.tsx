import { auth } from "@/lib/auth";
import { withTenantDb } from "@/db";
import { orders } from "@/db/tenant-schema";
import { desc } from "drizzle-orm";
import { updateOrderStatus } from "@/app/api/admin/actions";

type OrderStatus = "pending" | "accepted" | "preparing" | "shipped" | "received" | "cancelled";

async function updateOrderStatusAction(orderId: string, status: OrderStatus): Promise<void> {
  "use server";
  await updateOrderStatus(orderId, status);
}

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "No aceptado",
  accepted: "Aceptado",
  preparing: "Preparando orden",
  shipped: "Enviado",
  received: "Recibido por el cliente",
  cancelled: "Cancelado",
};

const STATUS_COLOR: Record<OrderStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  accepted: "bg-blue-100 text-blue-800",
  preparing: "bg-orange-100 text-orange-800",
  shipped: "bg-indigo-100 text-indigo-800",
  received: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-500",
};

// Flujo lineal: qué acciones están disponibles en cada estado
const ACTIONS: Record<OrderStatus, { label: string; next: OrderStatus; style: string }[]> = {
  pending: [
    { label: "Aceptar", next: "accepted", style: "bg-blue-50 text-blue-700 hover:bg-blue-100" },
    { label: "Cancelar", next: "cancelled", style: "bg-red-50 text-red-500 hover:bg-red-100" },
  ],
  accepted: [
    { label: "Preparar", next: "preparing", style: "bg-orange-50 text-orange-700 hover:bg-orange-100" },
    { label: "Cancelar", next: "cancelled", style: "bg-red-50 text-red-500 hover:bg-red-100" },
  ],
  preparing: [
    { label: "Marcar enviado", next: "shipped", style: "bg-indigo-50 text-indigo-700 hover:bg-indigo-100" },
    { label: "Cancelar", next: "cancelled", style: "bg-red-50 text-red-500 hover:bg-red-100" },
  ],
  shipped: [
    { label: "Recibido por cliente", next: "received", style: "bg-green-50 text-green-700 hover:bg-green-100" },
    { label: "Cancelar", next: "cancelled", style: "bg-red-50 text-red-500 hover:bg-red-100" },
  ],
  received: [],
  cancelled: [
    { label: "Reactivar", next: "pending", style: "bg-gray-100 text-gray-600 hover:bg-gray-200" },
  ],
};

const $ = (n: number) =>
  `$${new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 }).format(n)}`;

export default async function OrdersPage() {
  const session = await auth();
  const rows = await withTenantDb(session!.user.schemaName, (db) =>
    db.select().from(orders).orderBy(desc(orders.createdAt))
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Pedidos</h1>
        <span className="text-sm text-gray-400">{rows.length} en total</span>
      </div>

      {rows.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
          <p className="text-4xl mb-3">📋</p>
          <p className="text-gray-500 font-medium">Todavía no hay pedidos</p>
          <p className="text-gray-400 text-sm mt-1">
            Cuando un cliente envíe un pedido por WhatsApp, aparecerá aquí.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((order) => {
            let parsedItems: { title: string; quantity: number; price: number | null }[] = [];
            try { parsedItems = JSON.parse(order.items); } catch { /* noop */ }

            const status = (order.status as OrderStatus) ?? "pending";
            const actions = ACTIONS[status] ?? [];

            return (
              <div
                key={order.id}
                className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4"
              >
                {/* Encabezado */}
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <p className="text-base font-bold text-gray-900 font-mono">
                      #{order.orderNumber}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(order.createdAt).toLocaleString("es-CO", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>
                  </div>

                  {/* Estado */}
                  <span
                    className={`text-xs font-semibold px-3 py-1.5 rounded-full ${
                      STATUS_COLOR[status] ?? "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {STATUS_LABEL[status] ?? status}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Cliente */}
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Cliente
                    </p>
                    <p className="text-sm font-medium text-gray-900">{order.customerName}</p>
                    <p className="text-sm text-gray-500">{order.customerPhone}</p>
                    {order.customerEmail && (
                      <p className="text-sm text-gray-400">{order.customerEmail}</p>
                    )}
                  </div>

                  {/* Items */}
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      Productos
                    </p>
                    <ul className="space-y-0.5">
                      {parsedItems.map((item, i) => (
                        <li key={i} className="text-sm text-gray-700 flex justify-between">
                          <span>
                            {item.title}{" "}
                            <span className="text-gray-400">×{item.quantity}</span>
                          </span>
                          {item.price != null && (
                            <span className="text-gray-500 text-xs">
                              {$(item.price * item.quantity)}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                    <p className="text-sm font-bold text-gray-900 pt-1 border-t border-gray-100">
                      Total: {$(Number(order.total))}
                    </p>
                  </div>
                </div>

                {/* Acciones de estado */}
                {actions.length > 0 && (
                  <div className="flex gap-2 pt-1 border-t border-gray-50 flex-wrap">
                    {actions.map(({ label, next, style }) => (
                      <form key={next} action={updateOrderStatusAction.bind(null, order.id, next)}>
                        <button
                          type="submit"
                          className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${style}`}
                        >
                          {label}
                        </button>
                      </form>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
