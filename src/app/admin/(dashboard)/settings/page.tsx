import { auth } from "@/lib/auth";
import { withTenantDb, publicDb } from "@/db";
import { settings } from "@/db/tenant-schema";
import { tenants } from "@/db/public-schema";
import { eq } from "drizzle-orm";
import { SettingsClient } from "./SettingsClient";

function parseWhyItems(raw: string | null | undefined) {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
  } catch { /* */ }
  return [];
}

export default async function SettingsPage() {
  const session = await auth();

  const [[s], [tenant]] = await Promise.all([
    withTenantDb(session!.user.schemaName, (db) =>
      db.select().from(settings).limit(1)
    ),
    publicDb
      .select()
      .from(tenants)
      .where(eq(tenants.schemaName, session!.user.schemaName))
      .limit(1),
  ]);

  return (
    <SettingsClient
      defaults={{
        heroTitle: s?.heroTitle ?? "Bienvenidos",
        heroSubtitle: s?.heroSubtitle ?? "",
        heroImageUrl: s?.heroImageUrl ?? null,
        heroImageUrlMobile: s?.heroImageUrlMobile ?? null,
        heroVideoUrlMobile: s?.heroVideoUrlMobile ?? null,
        heroImagePosition: (s?.heroImagePosition as "top" | "center" | "bottom") ?? "center",
        categoriesStyle: (s?.categoriesStyle ?? "stories") as string,
        metaTitle: s?.metaTitle ?? "",
        metaDescription: s?.metaDescription ?? "",
        googleSiteVerification: s?.googleSiteVerification ?? "",
        instagramUrl: s?.instagramUrl ?? "",
        facebookUrl: s?.facebookUrl ?? "",
        tiktokUrl: s?.tiktokUrl ?? "",
        youtubeUrl: s?.youtubeUrl ?? "",
        footerText: s?.footerText ?? "",
        discountCode: s?.discountCode ?? "",
        discountCodePercent: s?.discountCodePercent ?? null,
        logoUrl: tenant?.logoUrl ?? null,
        whatsappNumber: tenant?.whatsappNumber ?? "",
        primaryColor: tenant?.primaryColor ?? "#1a1a1a",
        whyChooseEnabled: s?.whyChooseEnabled ?? false,
        whyChooseTitle: s?.whyChooseTitle ?? "¿Por qué elegirnos?",
        whyChooseItems: parseWhyItems(s?.whyChooseItems),
        footerBgColor: s?.footerBgColor ?? "#f9fafb",
      }}
    />
  );
}
