import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { and, eq, sql } from "drizzle-orm";
import { withTenantTransaction } from "@/db";
import { orders } from "@/db/tenant-schema";
import { getTenantBySubdomain } from "@/lib/tenant";

interface OrderItem {
  title: string;
  quantity: number;
  price: number | null;
}

export async function POST(request: NextRequest) {
  const headersList = await headers();
  const subdomain = headersList.get("x-tenant-subdomain");
  if (!subdomain) return NextResponse.json({ error: "No tenant" }, { status: 400 });

  const tenant = await getTenantBySubdomain(subdomain);
  if (!tenant) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

  let body: {
    customerName?: string;
    customerPhone?: string;
    customerEmail?: string;
    items?: OrderItem[];
    total?: number;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { customerName, customerPhone, customerEmail, items, total } = body;
  if (!customerName || !customerPhone || !items?.length || total == null) {
    return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 });
  }

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const orderNumber = await withTenantTransaction(tenant.schemaName, async (db) => {
    const [row] = await db
      .select({ maxSeq: sql<number>`COALESCE(MAX(sequence), 0)` })
      .from(orders)
      .where(and(eq(orders.year, year), eq(orders.month, month)));

    const sequence = (row?.maxSeq ?? 0) + 1;
    const num = `${year}${String(month).padStart(2, "0")}-${String(sequence).padStart(4, "0")}`;

    await db.insert(orders).values({
      orderNumber: num,
      year,
      month,
      sequence,
      customerName,
      customerPhone,
      customerEmail: customerEmail || null,
      items: JSON.stringify(items),
      total: String(total),
    });

    return num;
  });

  return NextResponse.json({ orderNumber });
}
