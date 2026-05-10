import { auth } from "@/lib/auth";
import { withTenantDb } from "@/db";
import { categories } from "@/db/tenant-schema";
import { ProductForm } from "@/components/admin/ProductForm";
import { createProduct } from "@/app/api/admin/actions";

export default async function NewProductPage() {
  const session = await auth();
  const cats = await withTenantDb(session!.user.schemaName, (db) =>
    db.select({ id: categories.id, name: categories.name }).from(categories).orderBy(categories.name)
  );

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Nuevo producto</h1>
      <ProductForm categories={cats} action={createProduct} />
    </div>
  );
}
