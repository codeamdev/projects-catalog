import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { publicDb, withTenantDb } from "@/db";
import { subscribers } from "@/db/tenant-schema";
import { tenants } from "@/db/public-schema";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    return new NextResponse("Token inválido", { status: 400 });
  }

  // Find which tenant has this subscriber (brute-force across all schemas)
  const allTenants = await publicDb.select({ schemaName: tenants.schemaName }).from(tenants);

  for (const t of allTenants) {
    const [sub] = await withTenantDb(t.schemaName, (db) =>
      db.select({ id: subscribers.id, unsubscribedAt: subscribers.unsubscribedAt })
        .from(subscribers)
        .where(eq(subscribers.unsubscribeToken, token))
        .limit(1)
    );
    if (sub) {
      if (!sub.unsubscribedAt) {
        await withTenantDb(t.schemaName, (db) =>
          db.update(subscribers)
            .set({ unsubscribedAt: new Date() })
            .where(eq(subscribers.unsubscribeToken, token))
        );
      }
      return new NextResponse(
        `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Baja exitosa</title></head>
<body style="font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f9fafb;">
  <div style="text-align:center;padding:48px 32px;">
    <div style="font-size:48px;margin-bottom:16px;">✅</div>
    <h1 style="color:#111827;font-size:24px;margin:0 0 8px;">Baja registrada</h1>
    <p style="color:#6b7280;font-size:15px;">Ya no recibirás correos de este catálogo.</p>
  </div>
</body></html>`,
        { headers: { "Content-Type": "text/html" } }
      );
    }
  }

  return new NextResponse("Token no encontrado", { status: 404 });
}
