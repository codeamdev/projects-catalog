import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentTenant } from "@/lib/tenant";
import { getProducts, getCategories, getFilterGroups, getProductFilterMap } from "@/lib/products";
import { withTenantDb } from "@/db";
import { settings } from "@/db/tenant-schema";
import { HeroBanner } from "@/components/catalog/HeroBanner";
import { ProductGrid } from "@/components/catalog/ProductGrid";
import { CartButton } from "@/components/cart/CartButton";
import { CartDrawer } from "@/components/cart/CartDrawer";

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await getCurrentTenant();
  if (!tenant) return { title: "Catálogo" };

  const [s] = await withTenantDb(tenant.schemaName, (db) =>
    db.select({ metaTitle: settings.metaTitle, metaDescription: settings.metaDescription })
      .from(settings).limit(1)
  );
  return {
    title: s?.metaTitle || tenant.name,
    description: s?.metaDescription || undefined,
  };
}

const VIDEO_RE = /\.(mp4|webm|ogg)(\?.*)?$/i;

function isValidUrl(value: string): boolean {
  if (value.startsWith("/")) return true; // ruta relativa — servida por este servidor
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string }>;
}) {
  const tenant = await getCurrentTenant();

  if (!tenant) redirect("/superadmin/login");

  // ── Verificar que el tenant esté activo y dentro del período de publicación ──
  const now = new Date();
  const suspended =
    !tenant.active ||
    (tenant.publishedFrom  != null && now < new Date(tenant.publishedFrom)) ||
    (tenant.publishedUntil != null && now > new Date(tenant.publishedUntil));

  if (suspended) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 text-center">
        <div className="max-w-sm">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 119 0v3.75M3.75 21.75h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H3.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-800 mb-2">Catálogo no disponible</h1>
          <p className="text-gray-500 text-sm leading-relaxed">
            Este catálogo no está disponible en este momento. Por favor volvé más tarde.
          </p>
        </div>
      </div>
    );
  }

  const { categoria } = await searchParams;

  const [[s], allProducts, categoryList, filterGroupList, productFilterMap] = await Promise.all([
    withTenantDb(tenant.schemaName, (db) => db.select().from(settings).limit(1)),
    getProducts(tenant.schemaName),
    getCategories(tenant.schemaName),
    getFilterGroups(tenant.schemaName),
    getProductFilterMap(tenant.schemaName),
  ]);

  // ── Hero desktop: video o carrusel de imágenes ──────────────
  const heroImageUrl = s?.heroImageUrl ?? null;
  const firstHeroUrl = heroImageUrl?.split("\n")[0]?.trim() ?? null;
  const isVideo = !!firstHeroUrl && VIDEO_RE.test(firstHeroUrl);

  const explicitUrls = isVideo
    ? []
    : (heroImageUrl ?? "")
        .split("\n")
        .map((u) => u.trim())
        .filter((u) => u && isValidUrl(u) && !VIDEO_RE.test(u));

  const featuredFallback = allProducts
    .filter((p) => p.featured && p.active !== false && p.images[0]?.url)
    .slice(0, 6)
    .map((p) => p.images[0].url)
    .filter((u) => isValidUrl(u) && !VIDEO_RE.test(u));

  const heroImages: string[] = isVideo
    ? []
    : explicitUrls.length > 0
    ? explicitUrls.slice(0, 6)
    : featuredFallback;

  // ── Hero móvil: video o imágenes verticales ──────────────────
  const mobileVideoUrl = s?.heroVideoUrlMobile?.trim() || null;
  const mobileImageRaw = s?.heroImageUrlMobile ?? "";
  const mobileImages: string[] = mobileImageRaw
    .split("\n")
    .map((u) => u.trim())
    .filter((u) => u && isValidUrl(u) && !VIDEO_RE.test(u))
    .slice(0, 6);

  // ── Productos del grid (filtrados por categoría) ─────────────
  const gridProducts = categoria
    ? allProducts.filter((p) => p.category?.slug === categoria && p.active !== false)
    : allProducts.filter((p) => p.active !== false);

  return (
    <div
      className="min-h-screen bg-white"
      style={{ "--primary": tenant.primaryColor } as React.CSSProperties}
    >
      {/* Navbar flotante y transparente sobre el hero */}
      <header className="fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-4 sm:px-6 h-14">
        <Link href="/">
          {tenant.logoUrl ? (
            <img src={tenant.logoUrl} alt={tenant.name} className="h-8 w-auto object-contain drop-shadow-md" />
          ) : (
            <span className="text-base font-bold text-white drop-shadow-md tracking-tight">
              {tenant.name}
            </span>
          )}
        </Link>
        <Link
          href="/admin/login"
          className="text-xs text-white/70 hover:text-white transition-colors drop-shadow"
        >
          Ingresar
        </Link>
      </header>

      <main>
        <HeroBanner
          title={s?.heroTitle || tenant.name}
          subtitle={s?.heroSubtitle}
          images={heroImages}
          imagesMobile={mobileImages}
          videoUrl={isVideo ? firstHeroUrl : null}
          videoUrlMobile={mobileVideoUrl}
          primaryColor={tenant.primaryColor ?? "#111827"}
          imagePosition={(s?.heroImagePosition as "top" | "center" | "bottom") ?? "center"}
        />

        <section className="py-6 sm:py-8">
          <ProductGrid
            products={gridProducts}
            categories={categoryList}
            filterGroups={filterGroupList}
            productFilterMap={productFilterMap}
            activeCategory={categoria}
            whatsapp={tenant.whatsappNumber}
            categoriesStyle={(s?.categoriesStyle as import("@/components/catalog/ProductGrid").CatStyle) ?? "stories"}
          />
        </section>
      </main>

      <footer className="mt-10 border-t border-gray-100 bg-gray-50 py-10">
        <div className="max-w-screen-xl mx-auto px-4 text-center">
          <p className="font-bold text-gray-900 mb-1">{tenant.name}</p>
          <p className="text-gray-400 text-sm">
            © {new Date().getFullYear()} {tenant.name}. Todos los derechos reservados.
          </p>
        </div>
      </footer>

      <CartButton />
      <CartDrawer
        tenantName={tenant.name}
        tenantSubdomain={tenant.subdomain}
        whatsappNumber={tenant.whatsappNumber}
        discountCode={s?.discountCode ?? null}
        discountCodePercent={s?.discountCodePercent ?? null}
      />
    </div>
  );
}
