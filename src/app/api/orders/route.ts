import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { and, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { withTenantTransaction } from "@/db";
import { orders } from "@/db/tenant-schema";
import { getTenantBySubdomain } from "@/lib/tenant";

const OrderItemSchema = z.object({
  title: z.string().min(1).max(200),
  quantity: z.number().int().min(1).max(999),
  price: z.number().nonnegative().nullable(),
  originalPrice: z.number().nonnegative().nullable().optional(),
  discountPercent: z.number().int().min(0).max(99).nullable().optional(),
});

const OrderBodySchema = z.object({
  customerName: z.string().min(2).max(120).trim(),
  customerPhone: z.string().regex(/^\+?[0-9]{7,20}$/, "Teléfono inválido").trim(),
  customerEmail: z.string().email("Email inválido").optional().or(z.literal("")),
  notes: z.string().max(300).optional(),
  items: z.array(OrderItemSchema).min(1).max(100),
  total: z.number().nonnegative(),
  couponCode: z.string().max(50).nullable().optional(),
  couponDiscount: z.number().nonnegative().nullable().optional(),
});

export async function POST(request: NextRequest) {
  const headersList = await headers();
  const subdomain = headersList.get("x-tenant-subdomain");
  if (!subdomain) return NextResponse.json({ error: "No tenant" }, { status: 400 });

  const tenant = await getTenantBySubdomain(subdomain);
  if (!tenant) return NextResponse.json({ error: "Tenant not found" }, { status: 404 });

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }

  const parsed = OrderBodySchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const { customerName, customerPhone, customerEmail, notes, items, total } = parsed.data;

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
      notes: notes || null,
      items: JSON.stringify(items),
      total: String(total),
    });

    return num;
  });

  return NextResponse.json({ orderNumber });
}
