import type { MetadataRoute } from "next";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const host = (await headers()).get("host") || "";
  const base = `https://${host}`;

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin/", "/superadmin/", "/api/"],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
