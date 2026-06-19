import { NextRequest, NextResponse } from "next/server";
import { and, eq, isNull } from "drizzle-orm";
import { withTenantDb } from "@/db";
import { subscribers, settings } from "@/db/tenant-schema";
import { getTenantBySubdomain } from "@/lib/tenant";

export async function POST(req: NextRequest) {
  const subdomain = req.headers.get("x-tenant-subdomain");
  if (!subdomain) return NextResponse.json({ valid: false });

  const tenant = await getTenantBySubdomain(subdomain);
  if (!tenant) return NextResponse.json({ valid: false });

  let body: { code?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ valid: false }); }

  const code = body.code?.trim().toUpperCase();
  if (!code) return NextResponse.json({ valid: false });

  const [s] = await withTenantDb(tenant.schemaName, (db) =>
    db.select({
      welcomeDiscountPercent: settings.welcomeDiscountPercent,
      discountCode: settings.discountCode,
      discountCodePercent: settings.discountCodePercent,
    }).from(settings).limit(1)
  );

  if (!s) return NextResponse.json({ valid: false });

  // Código general del catálogo
  if (s.discountCode?.toUpperCase() === code && s.discountCodePercent) {
    return NextResponse.json({ valid: true, percent: s.discountCodePercent, type: "general" });
  }

  // Código único por suscriptor
  const [sub] = await withTenantDb(tenant.schemaName, (db) =>
    db.select({ discountUsedAt: subscribers.discountUsedAt })
      .from(subscribers)
      .where(and(eq(subscribers.discountCode, code), isNull(subscribers.unsubscribedAt)))
      .limit(1)
  );

  if (!sub) return NextResponse.json({ valid: false });
  if (sub.discountUsedAt) {
    return NextResponse.json({ valid: false, error: "Este código ya fue utilizado en tu primera compra" });
  }

  return NextResponse.json({ valid: true, percent: s.welcomeDiscountPercent ?? 0, type: "subscriber" });
}
