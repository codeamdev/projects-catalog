import Link from "next/link";
import type { Metadata } from "next";
import { getCurrentTenant } from "@/lib/tenant";
import { getProducts, getCategories } from "@/lib/products";
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

function isValidHttpUrl(value: string): boolean {
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

  if (!tenant) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-5xl mb-4">🏪</p>
          <h1 className="text-2xl font-bold text-white mb-2">Sistema de Catálogos</h1>
          <p className="text-gray-400 text-sm">Accedé desde el subdominio de tu catálogo.</p>
        </div>
      </div>
    );
  }

  const { categoria } = await searchParams;

  const [[s], allProducts, categoryList] = await Promise.all([
    withTenantDb(tenant.schemaName, (db) => db.select().from(settings).limit(1)),
    getProducts(tenant.schemaName),
    getCategories(tenant.schemaName),
  ]);

  // ── Hero: video o carrusel de imágenes ──────────────────────
  const heroImageUrl = s?.heroImageUrl ?? null;
  const isVideo = !!heroImageUrl && VIDEO_RE.test(heroImageUrl);

  // Carrusel: heroImage + hasta 5 imágenes de productos destacados
  // isValidHttpUrl filtra textos de atribución u otros valores no-URL que puedan
  // estar guardados accidentalmente en hero_image_url.
  const heroImages: string[] = isVideo
    ? []
    : [
        ...(heroImageUrl && isValidHttpUrl(heroImageUrl) ? [heroImageUrl] : []),
        ...allProducts
          .filter((p) => p.featured && p.active !== false && p.images[0]?.url)
          .slice(0, 5)
          .map((p) => p.images[0].url)
          .filter(isValidHttpUrl),
      ].slice(0, 6);

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
      </header>

      <main>
        <HeroBanner
          title={s?.heroTitle || tenant.name}
          subtitle={s?.heroSubtitle}
          images={heroImages}
          videoUrl={isVideo ? heroImageUrl : null}
          primaryColor={tenant.primaryColor ?? "#111827"}
        />

        <section className="py-6 sm:py-8">
          <ProductGrid
            products={gridProducts}
            categories={categoryList}
            activeCategory={categoria}
            whatsapp={tenant.whatsappNumber}
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
