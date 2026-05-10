import { eq, desc, and } from "drizzle-orm";
import { withTenantDb } from "@/db";
import {
  products,
  categories,
  productImages,
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
