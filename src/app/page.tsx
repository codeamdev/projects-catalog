import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentTenant } from "@/lib/tenant";
import { getProducts, getCategories, getFilterGroups, getProductFilterMap } from "@/lib/products";
import { withTenantDb } from "@/db";
import { settings } from "@/db/tenant-schema";
import { HeroBanner } from "@/components/catalog/HeroBanner";
import { ProductGrid } from "@/components/catalog/ProductGrid";
import { WhyChooseUs } from "@/components/catalog/WhyChooseUs";
import { FAQ } from "@/components/catalog/FAQ";
import { CartButton } from "@/components/cart/CartButton";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { WhatsAppButton } from "@/components/catalog/WhatsAppButton";

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await getCurrentTenant();
  if (!tenant) return { title: "Catálogo" };

  const [s] = await withTenantDb(tenant.schemaName, (db) =>
    db.select({
      metaTitle: settings.metaTitle,
      metaDescription: settings.metaDescription,
      googleSiteVerification: settings.googleSiteVerification,
    }).from(settings).limit(1)
  );
  return {
    title: s?.metaTitle || tenant.name,
    description: s?.metaDescription || undefined,
    ...(s?.googleSiteVerification && {
      verification: { google: s.googleSiteVerification },
    }),
    ...(tenant.logoUrl && {
      icons: { icon: tenant.logoUrl },
    }),
  };
}

const VIDEO_RE = /\.(mp4|webm|ogg)(\?.*)?$/i;

function footerColors(hex: string) {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const dark = (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.5;
  return {
    title: dark ? "#ffffff" : "#111827",
    body:  dark ? "#a1a1aa" : "#6b7280",
    link:  dark ? "#d4d4d8" : "#374151",
    border: dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
  };
}

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

  // ── ¿Por qué elegirnos? ──────────────────────────────────────
  let whyItems: { icon: string; title: string; description: string }[] = [];
  try { if (s?.whyChooseItems) whyItems = JSON.parse(s.whyChooseItems); } catch { /* */ }

  let faqItems: { question: string; answer: string }[] = [];
  try { if (s?.faqItems) faqItems = JSON.parse(s.faqItems); } catch { /* */ }

  return (
    <div
      className="min-h-screen bg-white"
      style={{ "--primary": tenant.primaryColor } as React.CSSProperties}
    >
      {/* Navbar flotante y transparente sobre el hero */}
      <header className="fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-4 sm:px-6 h-20">
        <Link href="/">
          {tenant.logoUrl ? (
            <img src={tenant.logoUrl} alt={tenant.name} className="h-16 w-auto object-contain drop-shadow-md" />
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

        {s?.whyChooseEnabled && whyItems.length > 0 && (
          <WhyChooseUs
            label={s?.whyChooseTitle || "¿Por qué elegirnos?"}
            headline={s?.whyChooseHeadline || "La mejor experiencia de compra"}
            description={s?.whyChooseDescription || undefined}
            items={whyItems}
            iconStyle={s?.whyChooseIconStyle ?? "color"}
          />
        )}
        {s?.faqEnabled && faqItems.length > 0 && (
          <FAQ title={s?.faqTitle || "Preguntas frecuentes"} items={faqItems} />
        )}
      </main>

      {(() => {
        const fc = footerColors(s?.footerBgColor ?? "#f9fafb");
        return (
      <footer className="mt-10 border-t py-10" style={{ backgroundColor: s?.footerBgColor ?? "#f9fafb", borderColor: fc.border }}>
        <div className="max-w-screen-xl mx-auto px-4 text-center space-y-4">

          {/* Redes sociales — solo si hay al menos una URL */}
          {(s?.instagramUrl || s?.facebookUrl || s?.tiktokUrl || s?.youtubeUrl) && (
            <div>
              <p className="text-sm font-semibold mb-3" style={{ color: fc.title }}>Visitá nuestras redes sociales</p>
              <div className="flex items-center justify-center gap-4">
                {s?.instagramUrl && (
                  <a href={s.instagramUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 transition-colors text-sm font-medium hover:text-pink-500"
                    style={{ color: fc.link }}>
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                    Instagram
                  </a>
                )}
                {s?.facebookUrl && (
                  <a href={s.facebookUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 transition-colors text-sm font-medium hover:text-blue-600"
                    style={{ color: fc.link }}>
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    Facebook
                  </a>
                )}
                {s?.tiktokUrl && (
                  <a href={s.tiktokUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 transition-colors text-sm font-medium hover:opacity-80"
                    style={{ color: fc.link }}>
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.2 8.2 0 004.79 1.53V6.75a4.85 4.85 0 01-1.02-.06z"/>
                    </svg>
                    TikTok
                  </a>
                )}
                {s?.youtubeUrl && (
                  <a href={s.youtubeUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 transition-colors text-sm font-medium hover:text-red-500"
                    style={{ color: fc.link }}>
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                    YouTube
                  </a>
                )}
              </div>
            </div>
          )}

          <div>
            <p className="font-bold mb-1" style={{ color: fc.title }}>{tenant.name}</p>
            <p className="text-sm" style={{ color: fc.body }}>
              © {new Date().getFullYear()} {tenant.name}. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
        );
      })()}

      {tenant.whatsappNumber && <WhatsAppButton whatsappNumber={tenant.whatsappNumber} />}
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
