import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { getCurrentTenant } from "@/lib/tenant";
import { getProducts } from "@/lib/products";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const tenant = await getCurrentTenant();
  if (!tenant) return [];

  const host = (await headers()).get("host") || "";
  const base = `https://${host}`;

  const products = await getProducts(tenant.schemaName);
  const activeProducts = products.filter((p) => p.active !== false);

  const productUrls: MetadataRoute.Sitemap = activeProducts.map((p) => ({
    url: `${base}/product/${p.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [
    {
      url: base,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    ...productUrls,
  ];
}
