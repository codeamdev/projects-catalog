"use client";

import { useState } from "react";
import {
  ShoppingBag, TrendingUp, Users, DollarSign,
  PackageSearch, Star, AlertCircle, Calendar,
} from "lucide-react";

// ── Tipos ──────────────────────────────────────────────────────
interface Kpis {
  totalOrders: number;
  totalRevenue: number;
  avgTicket: number;
  thisMonth: number;
  thisMonthRevenue: number;
}
interface MonthPoint { label: string; orders: number; revenue: number }
interface ProductStat { title: string; qty: number; revenue: number; orderCount: number }
interface CustomerStat { name: string; phone: string; orderCount: number; totalSpent: number }
interface DayPoint { label: string; count: number }
interface CategoryStat { name: string; qty: number; revenue: number }

interface Props {
  kpis: Kpis;
  statusCounts: Record<string, number>;
  monthlyTrend: MonthPoint[];
  productStats: ProductStat[];
  neverOrdered: { title: string; category: string | null }[];
  topCustomers: CustomerStat[];
  dayData: DayPoint[];
  categoryStats: CategoryStat[];
}

type Tab = "orders" | "products" | "customers";

// ── Helpers ────────────────────────────────────────────────────
const fmt = (n: number) =>
  `$${new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 }).format(n)}`;

const STATUS_LABEL: Record<string, string> = {
  pending: "Sin aceptar", accepted: "Aceptado", preparing: "Preparando",
  shipped: "Enviado", received: "Recibido", cancelled: "Cancelado",
};
const STATUS_COLOR: Record<string, string> = {
  pending: "bg-yellow-400", accepted: "bg-blue-500", preparing: "bg-orange-400",
  shipped: "bg-indigo-500", received: "bg-green-500", cancelled: "bg-red-400",
};

// ── Subcomponentes ─────────────────────────────────────────────
function KpiCard({
  label, value, sub, icon: Icon, accent,
}: {
  label: string; value: string; sub?: string;
  icon: React.ComponentType<{ className?: string }>; accent: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <div className="flex items-start justify-between mb-3">
        <p className="text-sm text-gray-500">{label}</p>
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${accent}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

function HBar({ label, value, max, fmtValue }: { label: string; value: number; max: number; fmtValue: string }) {
  const pct = max > 0 ? Math.max(2, (value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-500 w-24 flex-shrink-0 truncate">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-2 min-w-0">
        <div className="bg-indigo-500 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs font-semibold text-gray-700 w-20 text-right flex-shrink-0">{fmtValue}</span>
    </div>
  );
}

function BarChart({ data, valueKey, fmtFn }: {
  data: Record<string, number | string>[];
  valueKey: string;
  fmtFn: (n: number) => string;
}) {
  const max = Math.max(...data.map((d) => Number(d[valueKey])), 1);
  return (
    <div className="flex items-end gap-1.5 h-32">
      {data.map((d) => {
        const val = Number(d[valueKey]);
        const pct = max > 0 ? (val / max) * 100 : 0;
        return (
          <div key={d.label} className="flex-1 flex flex-col items-center gap-1">
            <span className="text-[9px] text-gray-400">{val > 0 ? fmtFn(val) : ""}</span>
            <div className="w-full flex items-end" style={{ height: "80px" }}>
              <div
                className={`w-full rounded-t-md transition-all ${val > 0 ? "bg-indigo-500" : "bg-gray-100"}`}
                style={{ height: `${Math.max(pct, val > 0 ? 4 : 0)}%` }}
              />
            </div>
            <span className="text-[10px] text-gray-500 text-center leading-tight">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Componente principal ───────────────────────────────────────
export function ReportsClient({
  kpis, statusCounts, monthlyTrend, productStats,
  neverOrdered, topCustomers, dayData, categoryStats,
}: Props) {
  const [tab, setTab] = useState<Tab>("orders");

  const totalStatusCount = Object.values(statusCounts).reduce((s, v) => s + v, 0);

  return (
    <div className="space-y-5">
      {/* Tabs */}
      <div className="overflow-x-auto no-scrollbar">
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit min-w-full sm:min-w-0">
        {([
          { key: "orders", label: "Pedidos" },
          { key: "products", label: "Productos" },
          { key: "customers", label: "Clientes" },
        ] as { key: Tab; label: string }[]).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              tab === key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      </div>

      {/* ══════════════════════════════════════════════
          TAB: PEDIDOS
      ══════════════════════════════════════════════ */}
      {tab === "orders" && (
        <div className="space-y-5">
          {/* KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KpiCard
              label="Pedidos totales"
              value={String(kpis.totalOrders)}
              sub="desde siempre"
              icon={ShoppingBag}
              accent="bg-blue-50 text-blue-600"
            />
            <KpiCard
              label="Ingresos totales"
              value={fmt(kpis.totalRevenue)}
              sub="pedidos no cancelados"
              icon={DollarSign}
              accent="bg-green-50 text-green-600"
            />
            <KpiCard
              label="Ticket promedio"
              value={fmt(kpis.avgTicket)}
              sub="por pedido"
              icon={TrendingUp}
              accent="bg-purple-50 text-purple-600"
            />
            <KpiCard
              label="Este mes"
              value={String(kpis.thisMonth)}
              sub={fmt(kpis.thisMonthRevenue) + " en ingresos"}
              icon={Calendar}
              accent="bg-orange-50 text-orange-500"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Tendencia mensual */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
              <h2 className="font-semibold text-gray-900 text-sm">Pedidos últimos 6 meses</h2>
              <BarChart
                data={monthlyTrend.map((m) => ({ label: m.label, orders: m.orders, revenue: m.revenue }))}
                valueKey="orders"
                fmtFn={String}
              />
            </div>

            {/* Ingresos mensuales */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
              <h2 className="font-semibold text-gray-900 text-sm">Ingresos últimos 6 meses</h2>
              <BarChart
                data={monthlyTrend.map((m) => ({ label: m.label, orders: m.orders, revenue: m.revenue }))}
                valueKey="revenue"
                fmtFn={(n) => `$${new Intl.NumberFormat("es-CO", { notation: "compact", maximumFractionDigits: 1 }).format(n)}`}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Estado de pedidos */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
              <h2 className="font-semibold text-gray-900 text-sm">Distribución por estado</h2>
              {totalStatusCount === 0 ? (
                <p className="text-sm text-gray-400 py-4 text-center">Sin pedidos aún.</p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(statusCounts)
                    .sort(([, a], [, b]) => b - a)
                    .map(([status, count]) => (
                      <div key={status} className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_COLOR[status] ?? "bg-gray-400"}`} />
                        <span className="text-xs text-gray-600 w-28 flex-shrink-0">
                          {STATUS_LABEL[status] ?? status}
                        </span>
                        <div className="flex-1 bg-gray-100 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${STATUS_COLOR[status] ?? "bg-gray-400"}`}
                            style={{ width: `${(count / totalStatusCount) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-gray-700 w-8 text-right">{count}</span>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Días de la semana */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
              <h2 className="font-semibold text-gray-900 text-sm">Pedidos por día de la semana</h2>
              <BarChart
                data={dayData.map((d) => ({ label: d.label, count: d.count }))}
                valueKey="count"
                fmtFn={String}
              />
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════
          TAB: PRODUCTOS
      ══════════════════════════════════════════════ */}
      {tab === "products" && (
        <div className="space-y-5">
          {/* Más pedidos */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-50">
              <Star className="w-4 h-4 text-amber-500" />
              <h2 className="font-semibold text-gray-900 text-sm">Más pedidos</h2>
            </div>
            {productStats.length === 0 ? (
              <p className="text-sm text-gray-400 py-10 text-center">No hay pedidos registrados.</p>
            ) : (
              <div className="divide-y divide-gray-50">
                {productStats.slice(0, 15).map((p, i) => (
                  <div key={p.title} className="flex items-center gap-4 px-5 py-3">
                    <span className={`text-sm font-bold w-6 text-center ${i < 3 ? "text-amber-500" : "text-gray-300"}`}>
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{p.title}</p>
                      <p className="text-xs text-gray-400">{p.orderCount} pedido{p.orderCount !== 1 ? "s" : ""}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-gray-900">{p.qty} uds.</p>
                      {p.revenue > 0 && (
                        <p className="text-xs text-gray-400">{fmt(p.revenue)}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Ingresos por producto */}
          {productStats.some((p) => p.revenue > 0) && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
              <h2 className="font-semibold text-gray-900 text-sm">Ingresos por producto (top 10)</h2>
              <div className="space-y-3">
                {[...productStats]
                  .sort((a, b) => b.revenue - a.revenue)
                  .slice(0, 10)
                  .map((p) => {
                    const maxRev = productStats.reduce((m, x) => Math.max(m, x.revenue), 0);
                    return (
                      <HBar
                        key={p.title}
                        label={p.title}
                        value={p.revenue}
                        max={maxRev}
                        fmtValue={fmt(p.revenue)}
                      />
                    );
                  })}
              </div>
            </div>
          )}

          {/* Productos por categoría */}
          {categoryStats.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
              <h2 className="font-semibold text-gray-900 text-sm">Ventas por categoría</h2>
              <div className="space-y-3">
                {categoryStats.map((c) => {
                  const maxRev = categoryStats[0].revenue;
                  return (
                    <HBar
                      key={c.name}
                      label={c.name}
                      value={c.revenue}
                      max={maxRev}
                      fmtValue={`${c.qty} uds.`}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Nunca pedidos */}
          {neverOrdered.length > 0 && (
            <div className="bg-white rounded-2xl border border-orange-100">
              <div className="flex items-center gap-2 px-5 py-4 border-b border-orange-50">
                <AlertCircle className="w-4 h-4 text-orange-400" />
                <h2 className="font-semibold text-gray-900 text-sm">
                  Nunca pedidos ({neverOrdered.length})
                </h2>
              </div>
              <div className="divide-y divide-gray-50 max-h-72 overflow-y-auto">
                {neverOrdered.map((p) => (
                  <div key={p.title} className="flex items-center justify-between px-5 py-2.5">
                    <p className="text-sm text-gray-700 truncate">{p.title}</p>
                    {p.category && (
                      <span className="text-xs text-gray-400 ml-3 flex-shrink-0">{p.category}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════
          TAB: CLIENTES
      ══════════════════════════════════════════════ */}
      {tab === "customers" && (
        <div className="space-y-5">
          {/* KPI resumen */}
          <div className="grid grid-cols-2 gap-3">
            <KpiCard
              label="Clientes únicos"
              value={String(topCustomers.length)}
              sub="por número de teléfono"
              icon={Users}
              accent="bg-blue-50 text-blue-600"
            />
            <KpiCard
              label="Clientes frecuentes"
              value={String(topCustomers.filter((c) => c.orderCount >= 2).length)}
              sub="con 2 o más pedidos"
              icon={Star}
              accent="bg-amber-50 text-amber-500"
            />
          </div>

          {/* Tabla top clientes */}
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-50">
              <Users className="w-4 h-4 text-blue-500" />
              <h2 className="font-semibold text-gray-900 text-sm">Top clientes</h2>
            </div>
            {topCustomers.length === 0 ? (
              <p className="text-sm text-gray-400 py-10 text-center">Sin pedidos registrados.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                    <tr>
                      <th className="text-left px-5 py-3">#</th>
                      <th className="text-left px-5 py-3">Cliente</th>
                      <th className="text-left px-5 py-3 hidden sm:table-cell">Teléfono</th>
                      <th className="text-center px-5 py-3">Pedidos</th>
                      <th className="text-right px-5 py-3">Total gastado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {topCustomers.map((c, i) => (
                      <tr key={c.phone} className="hover:bg-gray-50">
                        <td className="px-5 py-3">
                          <span className={`text-sm font-bold ${i < 3 ? "text-amber-500" : "text-gray-300"}`}>
                            {i + 1}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <p className="font-medium text-gray-900">{c.name}</p>
                          <p className="text-xs text-gray-400 sm:hidden">{c.phone}</p>
                        </td>
                        <td className="px-5 py-3 text-gray-500 hidden sm:table-cell">{c.phone}</td>
                        <td className="px-5 py-3 text-center">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                            c.orderCount >= 3
                              ? "bg-amber-100 text-amber-700"
                              : c.orderCount >= 2
                              ? "bg-blue-100 text-blue-700"
                              : "bg-gray-100 text-gray-600"
                          }`}>
                            {c.orderCount}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right font-semibold text-gray-900">
                          {c.totalSpent > 0 ? fmt(c.totalSpent) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Ideas futuras */}
          <div className="bg-gray-50 border border-dashed border-gray-200 rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2">
              <PackageSearch className="w-4 h-4 text-gray-400" />
              <h3 className="text-sm font-semibold text-gray-600">Próximas métricas</h3>
            </div>
            <ul className="space-y-2 text-sm text-gray-500">
              <li className="flex items-start gap-2">
                <span className="text-gray-300 mt-0.5">·</span>
                <span><strong>Tasa de retención</strong> — % de clientes que repiten compra vs. compradores únicos.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gray-300 mt-0.5">·</span>
                <span><strong>Horario pico</strong> — A qué hora del día llegan más pedidos (requiere guardar hora exacta).</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gray-300 mt-0.5">·</span>
                <span><strong>Exportar a Excel</strong> — Descargar el informe completo de pedidos con filtros por fecha.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-gray-300 mt-0.5">·</span>
                <span><strong>Comparativa de periodos</strong> — Este mes vs. mes anterior en ingresos y cantidad.</span>
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
