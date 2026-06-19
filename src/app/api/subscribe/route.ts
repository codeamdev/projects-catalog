import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { withTenantDb } from "@/db";
import { subscribers, settings } from "@/db/tenant-schema";
import { getTenantBySubdomain } from "@/lib/tenant";
import { sendWelcomeEmail } from "@/lib/email";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 año

function generateCode(prefix: string): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";
  for (let i = 0; i < 6; i++) suffix += chars[Math.floor(Math.random() * chars.length)];
  return prefix ? `${prefix}-${suffix}` : suffix;
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
      welcomeCodePrefix: settings.welcomeCodePrefix,
      welcomeCodeSuffix: settings.welcomeCodeSuffix,
    }).from(settings).limit(1)
  );

  if (!s?.welcomeEnabled) {
    return NextResponse.json({ error: "Suscripción no disponible" }, { status: 400 });
  }

  const prefix = (s.welcomeCodePrefix ?? "DESC").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10);
  const rawSuffix = (s.welcomeCodeSuffix ?? "").toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 10);
  const discountCode = rawSuffix
    ? (prefix ? `${prefix}-${rawSuffix}` : rawSuffix)
    : generateCode(prefix);
  let finalCode = discountCode;

  try {
    const [existing] = await withTenantDb(tenant.schemaName, (db) =>
      db.select({ discountCode: subscribers.discountCode })
        .from(subscribers)
        .where(eq(subscribers.email, email))
        .limit(1)
    );

    if (existing) {
      finalCode = existing.discountCode ?? discountCode;
    } else {
      await withTenantDb(tenant.schemaName, (db) =>
        db.insert(subscribers).values({
          email,
          name: name?.trim() || null,
          discountCode,
        })
      );

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
          ).catch(() => { });
        }
      }
    }
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }

  const res = NextResponse.json({
    ok: true,
    discountCode: s.welcomeDiscountPercent ? finalCode : null,
    percent: s.welcomeDiscountPercent ?? null,
  });

  // Cookie de larga duración para no volver a mostrar el popup en este navegador
  res.cookies.set(`subscribed_${subdomain}`, "1", {
    maxAge: COOKIE_MAX_AGE,
    path: "/",
    sameSite: "lax",
    httpOnly: false,
  });

  return res;
}
