import { auth } from "@/lib/auth";
import { withTenantDb, publicDb } from "@/db";
import { subscribers, settings, products, productImages } from "@/db/tenant-schema";
import { tenants } from "@/db/public-schema";
import { isNull, eq, and } from "drizzle-orm";
import { EmailComposer } from "./EmailComposer";

export default async function EmailsPage() {
  const session = await auth();
  const schema = session!.user.schemaName;

  const [[s], [tenant], activeSubscribers, productList] = await Promise.all([
    withTenantDb(schema, (db) => db.select({
      welcomeDiscountPercent: settings.welcomeDiscountPercent,
    }).from(settings).limit(1)),
    publicDb.select().from(tenants).where(eq(tenants.schemaName, schema)).limit(1),
    withTenantDb(schema, (db) =>
      db.select({ id: subscribers.id, email: subscribers.email, name: subscribers.name })
        .from(subscribers)
        .where(isNull(subscribers.unsubscribedAt))
    ),
    withTenantDb(schema, (db) =>
      db.select({
        id: products.id,
        title: products.title,
        price: products.price,
        imageUrl: productImages.url,
      })
        .from(products)
        .leftJoin(productImages, and(eq(productImages.productId, products.id), eq(productImages.order, 0)))
        .where(eq(products.active, true))
        .orderBy(products.title)
    ),
  ]);

  return (
    <EmailComposer
      subscriberCount={activeSubscribers.length}
      tenantName={tenant?.name ?? ""}
      tenantSubdomain={tenant?.subdomain ?? ""}
      tenantLogoUrl={tenant?.logoUrl ?? null}
      tenantPrimaryColor={tenant?.primaryColor ?? "#111827"}
      welcomeDiscountPercent={s?.welcomeDiscountPercent ?? null}
      products={productList.map((p) => ({
        id: p.id,
        title: p.title,
        price: p.price,
        imageUrl: p.imageUrl ?? null,
      }))}
    />
  );
}
