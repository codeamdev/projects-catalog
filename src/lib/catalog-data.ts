import { unstable_cache } from "next/cache";
import { withTenantDb } from "@/db";
import { settings } from "@/db/tenant-schema";
import { getProducts, getCategories, getFilterGroups, getProductFilterMap } from "./products";

export const CATALOG_TAG = "catalog-data";

export const getCatalogData = unstable_cache(
  async (schemaName: string) => {
    const [settingsRows, allProducts, categoryList, filterGroupList, productFilterMap] =
      await Promise.all([
        withTenantDb(schemaName, (db) => db.select().from(settings).limit(1)),
        getProducts(schemaName),
        getCategories(schemaName),
        getFilterGroups(schemaName),
        getProductFilterMap(schemaName),
      ]);
    return {
      s: settingsRows[0] ?? null,
      allProducts,
      categoryList,
      filterGroupList,
      productFilterMap,
    };
  },
  ["catalog-data"],
  { revalidate: 3600, tags: [CATALOG_TAG] }
);
