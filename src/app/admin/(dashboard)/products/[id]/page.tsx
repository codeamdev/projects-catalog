import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { withTenantDb } from "@/db";
import { products, categories, productImages, filterGroups, filterOptions, productFilters, settings } from "@/db/tenant-schema";
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

  const [product, images, cats, groups, opts, assigned, [s]] = await withTenantDb(schema, async (db) => {
    return Promise.all([
      db.select().from(products).where(eq(products.id, id)).limit(1).then((r) => r[0] ?? null),
      db.select().from(productImages).where(eq(productImages.productId, id)).orderBy(productImages.order),
      db.select({ id: categories.id, name: categories.name }).from(categories).orderBy(categories.name),
      db.select().from(filterGroups).orderBy(filterGroups.order, filterGroups.name),
      db.select().from(filterOptions).orderBy(filterOptions.order, filterOptions.name),
      db.select({ optionId: productFilters.optionId }).from(productFilters).where(eq(productFilters.productId, id)),
      db.select({ inventoryEnabled: settings.inventoryEnabled }).from(settings).limit(1),
    ]);
  });

  if (!product) notFound();

  const filterGroupsWithOptions = groups.map((g) => ({
    ...g,
    options: opts.filter((o) => o.groupId === g.id),
  }));

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Editar producto</h1>
      <ProductForm
        categories={cats}
        filterGroups={filterGroupsWithOptions}
        selectedFilterOptionIds={assigned.map((a) => a.optionId)}
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
          trackStock: product.trackStock,
          stock: product.stock,
          soldOut: product.soldOut,
        }}
        inventoryEnabled={s?.inventoryEnabled ?? false}
      />
    </div>
  );
}
