import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentTenant } from "@/lib/tenant";
import { getProductBySlug } from "@/lib/products";
import { ProductDetail } from "@/components/catalog/ProductDetail";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const tenant = await getCurrentTenant();
  if (!tenant) return {};
  const product = await getProductBySlug(tenant.schemaName, slug);
  if (!product) return {};
  return {
    title: `${product.title} | ${tenant.name}`,
    description: product.description ?? undefined,
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tenant = await getCurrentTenant();
  if (!tenant) notFound();

  const product = await getProductBySlug(tenant.schemaName, slug);
  if (!product) notFound();

  return (
    <section className="max-w-5xl mx-auto px-4 py-10">
      <ProductDetail product={product} />
    </section>
  );
}
