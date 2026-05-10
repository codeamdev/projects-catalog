import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { publicDb } from "@/db";
import { tenants } from "@/db/public-schema";

export type { Tenant } from "@/db/public-schema";

export async function getTenantBySubdomain(subdomain: string) {
  const result = await publicDb
    .select()
    .from(tenants)
    .where(eq(tenants.subdomain, subdomain))
    .limit(1);

  return result[0] ?? null;
}

export async function getCurrentTenant() {
  const headersList = await headers();
  const subdomain = headersList.get("x-tenant-subdomain");
  if (!subdomain) return null;
  return getTenantBySubdomain(subdomain);
}
