import { auth } from "@/lib/auth";
import { withTenantDb } from "@/db";
import { orders, products, categories } from "@/db/tenant-schema";
import { desc } from "drizzle-orm";
import { ReportsClient } from "./reports/ReportsClient";

export const dynamic = "force-dynamic";

type RawItem = { title: string; quantity: number; price: number | null };

function safeParseItems(raw: string): RawItem[] {
  try { return JSON.parse(raw) ?? []; } catch { return []; }
}

function monthLabel(year: number, month: number): string {
  return new Date(year, month - 1, 1).toLocaleString("es-CO", { month: "short", year: "2-digit" });
}

export default async function AdminDashboard() {
  const session = await auth();
  const schema = session!.user.schemaName;

  const [allOrders, allProducts, allCategories] = await withTenantDb(schema, async (db) => {
    const [o, p, c] = await Promise.all([
      db.select().from(orders).orderBy(desc(orders.createdAt)),
      db.select({ id: products.id, title: products.title, categoryId: products.categoryId }).from(products),
      db.select({ id: categories.id, name: categories.name }).from(categories),
    ]);
    return [o, p, c];
  });

  const now = new Date();

  // ── KPIs globales ─────────────────────────────────────────────
  const active = allOrders.filter((o) => o.status !== "cancelled");
  const totalOrders = allOrders.length;
  const totalRevenue = active.reduce((s, o) => s + Number(o.total), 0);
  const avgTicket = active.length > 0 ? totalRevenue / active.length : 0;
  const thisMonth = allOrders.filter(
    (o) => o.year === now.getFullYear() && o.month === now.getMonth() + 1
  );
  const thisMonthRevenue = thisMonth
    .filter((o) => o.status !== "cancelled")
    .reduce((s, o) => s + Number(o.total), 0);

  // ── Estado de pedidos ─────────────────────────────────────────
  const statusCounts: Record<string, number> = {};
  for (const o of allOrders) {
    statusCounts[o.status] = (statusCounts[o.status] ?? 0) + 1;
  }

  // ── Tendencia últimos 6 meses ─────────────────────────────────
  const monthsMap: Record<string, { orders: number; revenue: number }> = {};
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = monthLabel(d.getFullYear(), d.getMonth() + 1);
    monthsMap[key] = { orders: 0, revenue: 0 };
  }
  for (const o of allOrders) {
    const key = monthLabel(o.year, o.month);
    if (key in monthsMap) {
      monthsMap[key].orders++;
      if (o.status !== "cancelled") monthsMap[key].revenue += Number(o.total);
    }
  }
  const monthlyTrend = Object.entries(monthsMap).map(([label, v]) => ({ label, ...v }));

  // ── Productos más pedidos ─────────────────────────────────────
  const productMap: Record<string, { title: string; qty: number; revenue: number; orderCount: number }> = {};
  for (const o of allOrders) {
    if (o.status === "cancelled") continue;
    for (const item of safeParseItems(o.items)) {
      const key = item.title;
      if (!productMap[key]) productMap[key] = { title: item.title, qty: 0, revenue: 0, orderCount: 0 };
      productMap[key].qty += item.quantity;
      productMap[key].revenue += (item.price ?? 0) * item.quantity;
      productMap[key].orderCount++;
    }
  }
  const productStats = Object.values(productMap).sort((a, b) => b.qty - a.qty);

  const orderedTitles = new Set(Object.keys(productMap));
  const neverOrdered = allProducts.filter((p) => !orderedTitles.has(p.title)).map((p) => {
    const cat = allCategories.find((c) => c.id === p.categoryId);
    return { title: p.title, category: cat?.name ?? null };
  });

  // ── Top clientes ──────────────────────────────────────────────
  const customerMap: Record<string, { name: string; phone: string; orderCount: number; totalSpent: number }> = {};
  for (const o of allOrders) {
    if (o.status === "cancelled") continue;
    const key = o.customerPhone;
    if (!customerMap[key]) {
      customerMap[key] = { name: o.customerName, phone: o.customerPhone, orderCount: 0, totalSpent: 0 };
    }
    customerMap[key].orderCount++;
    customerMap[key].totalSpent += Number(o.total);
  }
  const topCustomers = Object.values(customerMap).sort((a, b) => b.orderCount - a.orderCount).slice(0, 10);

  // ── Días de la semana ─────────────────────────────────────────
  const dayNames = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
  const dayCount = [0, 0, 0, 0, 0, 0, 0];
  for (const o of allOrders) {
    dayCount[new Date(o.createdAt).getDay()]++;
  }
  const dayData = dayNames.map((label, i) => ({ label, count: dayCount[i] }));

  // ── Ventas por categoría ──────────────────────────────────────
  const productCatMap: Record<string, string> = {};
  for (const p of allProducts) {
    const cat = allCategories.find((c) => c.id === p.categoryId);
    if (cat) productCatMap[p.title] = cat.name;
  }
  const catRevMap: Record<string, { name: string; qty: number; revenue: number }> = {};
  for (const o of allOrders) {
    if (o.status === "cancelled") continue;
    for (const item of safeParseItems(o.items)) {
      const catName = productCatMap[item.title] ?? "Sin categoría";
      if (!catRevMap[catName]) catRevMap[catName] = { name: catName, qty: 0, revenue: 0 };
      catRevMap[catName].qty += item.quantity;
      catRevMap[catName].revenue += (item.price ?? 0) * item.quantity;
    }
  }
  const categoryStats = Object.values(catRevMap).sort((a, b) => b.revenue - a.revenue);

  return (
    <div className="space-y-6">
      {/* Saludo */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Hola, {session!.user.name || session!.user.email?.split("@")[0]} 👋
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">
          {now.toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long" })}
        </p>
      </div>

      <ReportsClient
        kpis={{ totalOrders, totalRevenue, avgTicket, thisMonth: thisMonth.length, thisMonthRevenue }}
        statusCounts={statusCounts}
        monthlyTrend={monthlyTrend}
        productStats={productStats}
        neverOrdered={neverOrdered}
        topCustomers={topCustomers}
        dayData={dayData}
        categoryStats={categoryStats}
      />
    </div>
  );
}
