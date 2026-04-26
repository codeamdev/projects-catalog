import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { withTenantDb } from "@/db";
import { products, categories, productImages } from "@/db/tenant-schema";
import { ProductForm } from "@/components/admin/ProductForm";
import { updateProduct, deleteProduct } from "@/app/api/admin/actions";

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const schema = session!.user.schemaName;

  const [product, images, cats] = await withTenantDb(schema, async (db) => {
    return Promise.all([
      db.select().from(products).where(eq(products.id, id)).limit(1).then((r) => r[0] ?? null),
      db.select().from(productImages).where(eq(productImages.productId, id)).orderBy(productImages.order),
      db.select({ id: categories.id, name: categories.name }).from(categories).orderBy(categories.name),
    ]);
  });

  if (!product) notFound();

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Editar producto</h1>
      <ProductForm
        categories={cats}
        action={updateProduct.bind(null, id)}
        deleteAction={deleteProduct.bind(null, id)}
        defaultValues={{
          title: product.title,
          description: product.description,
          price: product.price,
          category_id: product.categoryId,
          active: product.active,
          featured: product.featured,
          discountPercent: product.discountPercent,
          tags: product.tags.join(", "),
          imageUrls: images.map((i) => i.url).join("\n"),
        }}
      />
    </div>
  );
}
