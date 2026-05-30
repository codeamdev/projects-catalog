import { eq, desc, and } from "drizzle-orm";
import { withTenantDb } from "@/db";
import {
  products,
  categories,
  productImages,
  filterGroups,
  filterOptions,
  productFilters,
  type ProductWithRelations,
  type Category,
} from "@/db/tenant-schema";

export type { ProductWithRelations, Category };

export async function getProducts(
  schemaName: string,
  options: { categorySlug?: string; onlyActive?: boolean } = {}
): Promise<ProductWithRelations[]> {
  return withTenantDb(schemaName, async (db) => {
    const conditions = [];
    if (options.onlyActive !== false) conditions.push(eq(products.active, true));

    if (options.categorySlug) {
      const cat = await db
        .select({ id: categories.id })
        .from(categories)
        .where(eq(categories.slug, options.categorySlug))
        .limit(1);
      if (cat[0]) conditions.push(eq(products.categoryId, cat[0].id));
      else return [];
    }

    const rows = await db.query.products.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      orderBy: [desc(products.featured), desc(products.createdAt)],
      with: {
        category: true,
        images: { orderBy: (img, { asc }) => [asc(img.order)] },
      },
    });

    return rows as ProductWithRelations[];
  });
}

export async function getProductBySlug(
  schemaName: string,
  slug: string
): Promise<ProductWithRelations | null> {
  return withTenantDb(schemaName, async (db) => {
    const row = await db.query.products.findFirst({
      where: and(eq(products.slug, slug), eq(products.active, true)),
      with: {
        category: true,
        images: { orderBy: (img, { asc }) => [asc(img.order)] },
      },
    });
    return (row as ProductWithRelations | undefined) ?? null;
  });
}

export async function getCategories(schemaName: string): Promise<Category[]> {
  return withTenantDb(schemaName, (db) =>
    db.select().from(categories).orderBy(categories.order, categories.name)
  );
}

export type FilterOptionItem = { id: string; name: string; slug: string; order: number };
export type FilterGroupWithOptions = { id: string; name: string; slug: string; order: number; options: FilterOptionItem[] };

export async function getFilterGroups(schemaName: string): Promise<FilterGroupWithOptions[]> {
  return withTenantDb(schemaName, async (db) => {
    const groups = await db.select().from(filterGroups).orderBy(filterGroups.order, filterGroups.name);
    const opts = await db.select().from(filterOptions).orderBy(filterOptions.order, filterOptions.name);
    return groups.map((g) => ({ ...g, options: opts.filter((o) => o.groupId === g.id) }));
  });
}

// productId → array of option IDs assigned to that product
export async function getProductFilterMap(schemaName: string): Promise<Record<string, string[]>> {
  const rows = await withTenantDb(schemaName, (db) => db.select().from(productFilters));
  const map: Record<string, string[]> = {};
  for (const row of rows) {
    if (!map[row.productId]) map[row.productId] = [];
    map[row.productId].push(row.optionId);
  }
  return map;
}
