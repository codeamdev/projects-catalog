import { NextRequest, NextResponse } from "next/server";
import { eq, isNull } from "drizzle-orm";
import { withTenantDb } from "@/db";
import { subscribers, settings } from "@/db/tenant-schema";
import { getTenantBySubdomain } from "@/lib/tenant";
import { sendWelcomeEmail } from "@/lib/email";

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "BIENVENIDA-";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export async function POST(req: NextRequest) {
  const subdomain = req.headers.get("x-tenant-subdomain");
  if (!subdomain) return NextResponse.json({ error: "Tenant no encontrado" }, { status: 400 });

  const tenant = await getTenantBySubdomain(subdomain);
  if (!tenant) return NextResponse.json({ error: "Tenant no encontrado" }, { status: 404 });

  let body: { email?: string; name?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "JSON inválido" }, { status: 400 }); }

  const { email, name } = body;
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Email inválido" }, { status: 400 });
  }

  const [s] = await withTenantDb(tenant.schemaName, (db) =>
    db.select({
      welcomeEnabled: settings.welcomeEnabled,
      welcomeDiscountPercent: settings.welcomeDiscountPercent,
    }).from(settings).limit(1)
  );

  if (!s?.welcomeEnabled) {
    return NextResponse.json({ error: "Suscripción no disponible" }, { status: 400 });
  }

  const discountCode = generateCode();
  let finalCode = discountCode;

  try {
    // Check if already subscribed
    const [existing] = await withTenantDb(tenant.schemaName, (db) =>
      db.select({ discountCode: subscribers.discountCode, discountUsedAt: subscribers.discountUsedAt })
        .from(subscribers)
        .where(eq(subscribers.email, email))
        .limit(1)
    );

    if (existing) {
      // Already subscribed — return existing code (if not used)
      finalCode = existing.discountCode ?? discountCode;
    } else {
      await withTenantDb(tenant.schemaName, (db) =>
        db.insert(subscribers).values({
          email,
          name: name?.trim() || null,
          discountCode,
        })
      );

      // Send welcome email async (don't await to keep response fast)
      if (s.welcomeDiscountPercent) {
        const [newSub] = await withTenantDb(tenant.schemaName, (db) =>
          db.select({ unsubscribeToken: subscribers.unsubscribeToken })
            .from(subscribers).where(eq(subscribers.email, email)).limit(1)
        );
        if (newSub) {
          sendWelcomeEmail(
            { name: tenant.name, subdomain: tenant.subdomain, logoUrl: tenant.logoUrl ?? null, primaryColor: tenant.primaryColor ?? "#111827" },
            { email, name: name?.trim() || null, discountCode, unsubscribeToken: newSub.unsubscribeToken },
            s.welcomeDiscountPercent
          ).catch(() => { /* non-critical */ });
        }
      }
    }
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    discountCode: s.welcomeDiscountPercent ? finalCode : null,
    percent: s.welcomeDiscountPercent ?? null,
  });
}
