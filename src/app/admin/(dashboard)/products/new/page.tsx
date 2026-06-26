import { auth } from "@/lib/auth";
import { withTenantDb } from "@/db";
import { categories, filterGroups, filterOptions, settings } from "@/db/tenant-schema";
import { ProductForm } from "@/components/admin/ProductForm";
import { createProduct } from "@/app/api/admin/actions";

export default async function NewProductPage() {
  const session = await auth();
  const schema = session!.user.schemaName;

  const [cats, groups, opts, [s]] = await withTenantDb(schema, async (db) =>
    Promise.all([
      db.select({ id: categories.id, name: categories.name }).from(categories).orderBy(categories.name),
      db.select().from(filterGroups).orderBy(filterGroups.order, filterGroups.name),
      db.select().from(filterOptions).orderBy(filterOptions.order, filterOptions.name),
      db.select({ inventoryEnabled: settings.inventoryEnabled }).from(settings).limit(1),
    ])
  );

  const filterGroupsWithOptions = groups.map((g) => ({
    ...g,
    options: opts.filter((o) => o.groupId === g.id),
  }));

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Nuevo producto</h1>
      <ProductForm
        categories={cats}
        filterGroups={filterGroupsWithOptions}
        selectedFilterOptionIds={[]}
        action={createProduct}
        inventoryEnabled={s?.inventoryEnabled ?? false}
      />
    </div>
  );
}
