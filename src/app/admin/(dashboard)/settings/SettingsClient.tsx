"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { MultiImageUpload } from "@/components/admin/MultiImageUpload";
import { VideoUpload } from "@/components/admin/VideoUpload";
import { updateSettings, updateTenantConfig, updateDiscountCode, updateWhyChooseUs } from "@/app/api/admin/actions";

const INPUT = "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300";
const LABEL = "block text-sm font-medium text-gray-700 mb-1";
const VIDEO_RE = /\.(mp4|webm|ogg)(\?.*)?$/i;

const CAT_STYLES = [
  { id: "stories", name: "Moderno",   desc: "Círculos coloridos tipo stories" },
  { id: "pills",   name: "Pastel",    desc: "Tones suaves, femenino y lifestyle" },
  { id: "chips",   name: "Vintage",   desc: "Ámbar y tierra, look artesanal" },
  { id: "tabs",    name: "Minimal",   desc: "Solo texto negro, ultra limpio" },
  { id: "bubbles", name: "Nocturno",  desc: "Fondo oscuro, colores eléctricos" },
  { id: "minimal", name: "Dorado",    desc: "Acentos dorados, look de lujo" },
  { id: "bold",    name: "Natura",    desc: "Tonos tierra y verde, orgánico" },
  { id: "grid",    name: "Neón",      desc: "Colores eléctricos sobre negro" },
  { id: "outline", name: "Océano",    desc: "Paleta de azules y turquesas" },
  { id: "compact", name: "Candy",     desc: "Caramelos brillantes y divertidos" },
] as const;

interface WhyItem {
  icon: string;
  title: string;
  description: string;
}

interface Props {
  defaults: {
    heroTitle: string;
    heroSubtitle: string;
    heroImageUrl: string | null;
    heroImageUrlMobile: string | null;
    heroVideoUrlMobile: string | null;
    heroImagePosition: "top" | "center" | "bottom";
    categoriesStyle: string;
    metaTitle: string;
    metaDescription: string;
    googleSiteVerification: string;
    instagramUrl: string;
    facebookUrl: string;
    tiktokUrl: string;
    youtubeUrl: string;
    footerText: string;
    discountCode: string;
    discountCodePercent: number | null;
    logoUrl: string | null;
    whatsappNumber: string;
    primaryColor: string;
    whyChooseTitle: string;
    whyChooseItems: WhyItem[];
  };
}

export function SettingsClient({ defaults }: Props) {
  const router = useRouter();
  const [tenantPending, startTenant] = useTransition();
  const [heroPending, startHero] = useTransition();
  const [discountPending, startDiscount] = useTransition();

  const rawHero = defaults.heroImageUrl ?? "";
  const defaultVideoUrl = VIDEO_RE.test(rawHero.split("\n")[0] ?? "") ? rawHero.split("\n")[0].trim() : "";
  const defaultHeroImages = rawHero
    .split("\n")
    .map((u) => u.trim())
    .filter((u) => u && !VIDEO_RE.test(u))
    .join("\n");

  const rawHeroMobile = defaults.heroImageUrlMobile ?? "";
  const defaultVideoUrlMobile = defaults.heroVideoUrlMobile ?? "";
  const defaultHeroImagesMobile = rawHeroMobile
    .split("\n")
    .map((u) => u.trim())
    .filter((u) => u && !VIDEO_RE.test(u))
    .join("\n");

  const [catStyle, setCatStyle] = useState(defaults.categoriesStyle ?? "stories");
  const [catStylePending, startCatStyle] = useTransition();

  const EMPTY_ITEM: WhyItem = { icon: "", title: "", description: "" };
  const [whyItems, setWhyItems] = useState<WhyItem[]>(
    defaults.whyChooseItems.length > 0 ? defaults.whyChooseItems : [EMPTY_ITEM]
  );
  const [whyPending, startWhy] = useTransition();

  function handleWhy(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const validItems = whyItems.filter((it) => it.title.trim());
    fd.set("why_choose_items", JSON.stringify(validItems));
    startWhy(async () => {
      const result = await updateWhyChooseUs(fd);
      if (result.ok) toast.success("Sección guardada");
      else toast.error(result.error);
    });
  }

  function handleTenant(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTenant(async () => {
      const result = await updateTenantConfig(fd);
      if (result.ok) { toast.success("Configuración general guardada"); router.refresh(); }
      else toast.error(result.error);
    });
  }

  function handleHero(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    // Desktop: video tiene prioridad sobre imágenes
    const videoUrl = ((fd.get("hero_video_url") as string) ?? "").trim();
    const imageUrls = ((fd.get("hero_images") as string) ?? "").trim();
    fd.set("hero_image_url", videoUrl || imageUrls);

    // Móvil: video y imágenes en campos separados
    fd.set("hero_video_url_mobile", ((fd.get("hero_video_url_mobile") as string) ?? "").trim());
    fd.set("hero_image_url_mobile", ((fd.get("hero_images_mobile") as string) ?? "").trim());

    startHero(async () => {
      const result = await updateSettings(fd);
      if (result.ok) { toast.success("Hero y SEO guardados"); router.refresh(); }
      else toast.error(result.error);
    });
  }

  function handleDiscount(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startDiscount(async () => {
      const result = await updateDiscountCode(fd);
      if (result.ok) { toast.success("Código de descuento guardado"); router.refresh(); }
      else toast.error(result.error);
    });
  }

  return (
    <div className="max-w-2xl space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Ajustes del catálogo</h1>

      {/* ── General ── */}
      <section className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
        <div>
          <h2 className="text-base font-semibold text-gray-900">General</h2>
          <p className="text-xs text-gray-400 mt-0.5">WhatsApp, color de marca y logo</p>
        </div>
        <form onSubmit={handleTenant} className="space-y-5">
          <ImageUpload name="logo_url" defaultValue={defaults.logoUrl} label="Logo" />

          <div>
            <label className={LABEL}>Número de WhatsApp</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm select-none">+</span>
              <input
                name="whatsapp_number"
                defaultValue={defaults.whatsappNumber}
                placeholder="5491112345678"
                className={`${INPUT} pl-7`}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Código de país + número sin espacios ni guiones (ej: 5491112345678)
            </p>
          </div>

          <div>
            <label className={LABEL}>Color principal</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                name="primary_color"
                defaultValue={defaults.primaryColor}
                className="h-10 w-16 rounded-xl border border-gray-200 cursor-pointer p-1"
              />
              <span className="text-xs text-gray-400">
                Se usa en el hero y en la identidad visual del catálogo
              </span>
            </div>
          </div>

          <button
            type="submit"
            disabled={tenantPending}
            className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-60 transition-colors"
          >
            {tenantPending ? "Guardando…" : "Guardar configuración general"}
          </button>
        </form>
      </section>

      {/* ── Hero + SEO ── */}
      <section className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Hero y SEO</h2>
          <p className="text-xs text-gray-400 mt-0.5">Pantalla de bienvenida y metadatos para buscadores</p>
        </div>
        <form onSubmit={handleHero} className="space-y-5">
          <div>
            <label className={LABEL}>Título del hero *</label>
            <input name="hero_title" defaultValue={defaults.heroTitle} required className={INPUT} />
          </div>
          <div>
            <label className={LABEL}>Subtítulo del hero</label>
            <input name="hero_subtitle" defaultValue={defaults.heroSubtitle} className={INPUT} />
          </div>

          <div>
            <VideoUpload
              name="hero_video_url"
              defaultValue={defaultVideoUrl}
              label="Video de fondo (desktop / tablet)"
            />
            <p className="text-xs text-gray-400 mt-1">
              MP4 o WebM horizontal (16:9). Si se configura, tiene prioridad sobre las imágenes.
            </p>
          </div>

          <div>
            <MultiImageUpload
              name="hero_images"
              defaultValue={defaultHeroImages}
              label="Imágenes del carrusel (desktop / tablet)"
            />
            <p className="text-xs text-gray-400 mt-1">
              Horizontales (16:9). Si no hay imágenes se usan las de productos destacados.
            </p>
          </div>

          {/* ── Móvil ── */}
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-4">
            <div>
              <p className="text-sm font-semibold text-gray-700">📱 Versión móvil</p>
              <p className="text-xs text-gray-400 mt-0.5">
                Contenido vertical (9:16) para teléfonos. Si se deja vacío, se usa el de desktop.
              </p>
            </div>

            <div>
              <VideoUpload
                name="hero_video_url_mobile"
                defaultValue={defaultVideoUrlMobile}
                label="Video móvil"
              />
              <p className="text-xs text-gray-400 mt-1">
                MP4 o WebM vertical (9:16). Se muestra solo en teléfonos.
              </p>
            </div>

            <div>
              <MultiImageUpload
                name="hero_images_mobile"
                defaultValue={defaultHeroImagesMobile}
                label="Imágenes móvil (carrusel vertical)"
              />
              <p className="text-xs text-gray-400 mt-1">
                Verticales (9:16 o cuadradas). Se muestran solo en pantallas pequeñas.
              </p>
            </div>
          </div>

          <hr className="border-gray-100" />
          <h3 className="text-sm font-semibold text-gray-700">SEO</h3>

          <div>
            <label className={LABEL}>Meta título</label>
            <input name="meta_title" defaultValue={defaults.metaTitle} className={INPUT} />
          </div>
          <div>
            <label className={LABEL}>Meta descripción</label>
            <textarea
              name="meta_description"
              defaultValue={defaults.metaDescription}
              rows={2}
              className={`${INPUT} resize-none`}
            />
          </div>
          <div>
            <label className={LABEL}>Google Site Verification</label>
            <input
              name="google_site_verification"
              defaultValue={defaults.googleSiteVerification}
              placeholder="Código de verificación de Google Search Console"
              className={INPUT}
            />
          </div>

          <h3 className="text-sm font-semibold text-gray-700 pt-2">Redes sociales</h3>
          <p className="text-xs text-gray-400 -mt-2">Solo se muestran en el catálogo las redes que tengan URL configurada.</p>

          <div>
            <label className={LABEL}>Instagram</label>
            <input name="instagram_url" defaultValue={defaults.instagramUrl} placeholder="https://instagram.com/tu_usuario" className={INPUT} />
          </div>
          <div>
            <label className={LABEL}>Facebook</label>
            <input name="facebook_url" defaultValue={defaults.facebookUrl} placeholder="https://facebook.com/tu_pagina" className={INPUT} />
          </div>
          <div>
            <label className={LABEL}>TikTok</label>
            <input name="tiktok_url" defaultValue={defaults.tiktokUrl} placeholder="https://tiktok.com/@tu_usuario" className={INPUT} />
          </div>
          <div>
            <label className={LABEL}>YouTube</label>
            <input name="youtube_url" defaultValue={defaults.youtubeUrl} placeholder="https://youtube.com/@tu_canal" className={INPUT} />
          </div>

          <div>
            <label className={LABEL}>Texto del footer</label>
            <input name="footer_text" defaultValue={defaults.footerText} className={INPUT} />
          </div>

          <button
            type="submit"
            disabled={heroPending}
            className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-60 transition-colors"
          >
            {heroPending ? "Guardando…" : "Guardar hero y SEO"}
          </button>
        </form>
      </section>

      {/* ── Código de descuento ── */}
      <section className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Código de descuento</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Si configuras un código, el cliente podrá ingresarlo en el carrito antes de pedir.
            Déjalo vacío para desactivar.
          </p>
        </div>
        <form onSubmit={handleDiscount} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={LABEL}>Código</label>
              <input
                name="discount_code"
                defaultValue={defaults.discountCode}
                placeholder="Ej: VERANO25"
                className={INPUT}
              />
            </div>
            <div>
              <label className={LABEL}>Descuento (%)</label>
              <input
                name="discount_code_percent"
                type="number"
                min={1}
                max={99}
                defaultValue={defaults.discountCodePercent ?? ""}
                placeholder="Ej: 15"
                className={INPUT}
              />
            </div>
          </div>
          <p className="text-xs text-gray-400">
            El código no es sensible a mayúsculas. El porcentaje se aplica al total del carrito.
          </p>
          <button
            type="submit"
            disabled={discountPending}
            className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-60 transition-colors"
          >
            {discountPending ? "Guardando…" : "Guardar código de descuento"}
          </button>
        </form>
      </section>

      {/* ── ¿Por qué elegirnos? ── */}
      <section className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
        <div>
          <h2 className="text-base font-semibold text-gray-900">¿Por qué elegirnos?</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Sección opcional que aparece entre el catálogo y el footer. Dejá vacío para ocultarla.
          </p>
        </div>
        <form onSubmit={handleWhy} className="space-y-5">
          <div>
            <label className={LABEL}>Título de la sección</label>
            <input
              name="why_choose_title"
              defaultValue={defaults.whyChooseTitle}
              placeholder="¿Por qué elegirnos?"
              className={INPUT}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className={`${LABEL} mb-0`}>Razones (hasta 4)</label>
              {whyItems.length < 4 && (
                <button
                  type="button"
                  onClick={() => setWhyItems([...whyItems, EMPTY_ITEM])}
                  className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  + Agregar razón
                </button>
              )}
            </div>

            {whyItems.map((item, i) => (
              <div key={i} className="rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-500">Razón {i + 1}</span>
                  {whyItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setWhyItems(whyItems.filter((_, j) => j !== i))}
                      className="text-xs text-red-400 hover:text-red-600"
                    >
                      Quitar
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-[80px_1fr] gap-3">
                  <div>
                    <label className={LABEL}>Ícono</label>
                    <input
                      value={item.icon}
                      onChange={(e) => setWhyItems(whyItems.map((it, j) => j === i ? { ...it, icon: e.target.value } : it))}
                      placeholder="🚀"
                      className={`${INPUT} text-2xl text-center`}
                      maxLength={4}
                    />
                  </div>
                  <div>
                    <label className={LABEL}>Título *</label>
                    <input
                      value={item.title}
                      onChange={(e) => setWhyItems(whyItems.map((it, j) => j === i ? { ...it, title: e.target.value } : it))}
                      placeholder="Envío rápido"
                      className={INPUT}
                    />
                  </div>
                </div>
                <div>
                  <label className={LABEL}>Descripción</label>
                  <input
                    value={item.description}
                    onChange={(e) => setWhyItems(whyItems.map((it, j) => j === i ? { ...it, description: e.target.value } : it))}
                    placeholder="Recibís tu pedido en 24-48 horas hábiles"
                    className={INPUT}
                  />
                </div>
              </div>
            ))}
          </div>

          <button
            type="submit"
            disabled={whyPending}
            className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-60 transition-colors"
          >
            {whyPending ? "Guardando…" : "Guardar sección"}
          </button>
        </form>
      </section>

      {/* ── Estilo de categorías ── */}
      <section className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Estilo del filtro de categorías</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Elegí cómo se ven los botones de categoría en tu catálogo.
          </p>
        </div>

        {/* Hidden input que se envía al guardar */}
        <input type="hidden" name="categories_style" value={catStyle} />

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {CAT_STYLES.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setCatStyle(s.id)}
              className={`text-left p-3 rounded-xl border-2 transition-all ${
                catStyle === s.id
                  ? "border-indigo-600 bg-indigo-50"
                  : "border-gray-100 hover:border-gray-300 bg-gray-50"
              }`}
            >
              {/* Mini preview del estilo */}
              <StylePreview id={s.id} />
              <p className={`text-xs font-semibold mt-2 ${catStyle === s.id ? "text-indigo-700" : "text-gray-700"}`}>
                {s.name}
              </p>
              <p className="text-[10px] text-gray-400 leading-tight mt-0.5">{s.desc}</p>
            </button>
          ))}
        </div>

        <button
          type="button"
          disabled={catStylePending}
          onClick={() => {
            const fd = new FormData();
            fd.set("categories_style", catStyle);
            // reutilizamos hero_title y hero_subtitle vacíos para no sobreescribir
            fd.set("hero_title", ""); // updateSettings requerirá estos campos — usamos acción separada
            startCatStyle(async () => {
              const { updateCategoriesStyle } = await import("@/app/api/admin/actions");
              const result = await updateCategoriesStyle(fd);
              if (result.ok) {
                const { toast } = await import("sonner");
                toast.success("Estilo de categorías guardado");
              }
            });
          }}
          className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-60 transition-colors"
        >
          {catStylePending ? "Guardando…" : "Guardar estilo"}
        </button>
      </section>
    </div>
  );
}

// ── Mini preview por estilo — muestra la paleta y forma real ─────

function StylePreview({ id }: { id: string }) {
  const labels = ["Todos", "Ropa", "Acces."];

  if (id === "stories") {
    const colors = ["#6366F1", "#EC4899", "#10B981"];
    return (
      <div className="flex gap-2 py-1">
        {labels.map((label, i) => (
          <div key={label} className="flex flex-col items-center gap-0.5">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-[7px] font-bold text-white"
              style={{ backgroundColor: colors[i] }}>
              {i === 0 ? "✦" : label.slice(0, 2)}
            </div>
            <span className="text-[6px] text-gray-400">{label}</span>
          </div>
        ))}
      </div>
    );
  }

  if (id === "pills") {
    const bgs  = ["#FFAFC7","#C7AFEE","#A8DDBA"];
    const fgs  = ["#C2547A","#7B5EA7","#2E8B57"];
    return (
      <div className="flex gap-1 py-1.5 flex-wrap">
        {labels.map((label, i) => (
          <span key={label} className="px-2 py-0.5 rounded-full text-[7px] font-semibold"
            style={{ backgroundColor: bgs[i], color: fgs[i] }}>{label}</span>
        ))}
      </div>
    );
  }

  if (id === "chips") {
    const colors = ["#8B6550","#D4A853","#9E7458"];
    return (
      <div className="flex gap-1 py-1.5 flex-wrap" style={{ background: "#FDF6EE", borderRadius: 6, padding: "4px 4px" }}>
        {labels.map((label, i) => (
          <span key={label} className="px-2 py-0.5 rounded text-[7px] font-semibold border"
            style={i === 0
              ? { backgroundColor: colors[0], borderColor: colors[0], color: "#fff" }
              : { backgroundColor: "#FDF6EE", borderColor: colors[i], color: colors[i] }}>
            {label}
          </span>
        ))}
      </div>
    );
  }

  if (id === "tabs") {
    return (
      <div className="flex gap-2 py-1 border-b-2 border-gray-200">
        {labels.map((label, i) => (
          <span key={label} className="text-[7px] pb-1"
            style={i === 0
              ? { fontWeight: 800, color: "#111", borderBottom: "2px solid #111" }
              : { color: "#9ca3af", fontWeight: 500 }}>
            {label}
          </span>
        ))}
      </div>
    );
  }

  if (id === "bubbles") {
    const colors = ["#60A5FA","#34D399","#A78BFA"];
    return (
      <div className="flex gap-1 py-1.5 px-2 rounded-xl" style={{ backgroundColor: "#0d0d0d" }}>
        {labels.map((label, i) => (
          <span key={label} className="px-2 py-0.5 rounded-full text-[7px] font-bold"
            style={i === 0
              ? { backgroundColor: `${colors[0]}22`, color: colors[0], border: `1px solid ${colors[0]}` }
              : { color: "#374151" }}>
            {label}
          </span>
        ))}
      </div>
    );
  }

  if (id === "minimal") {
    const colors = ["#D4AF37","#C9A84C","#B8922D"];
    return (
      <div className="flex gap-2 py-1" style={{ borderBottom: "1px solid #E8D89A" }}>
        {labels.map((label, i) => (
          <span key={label} className="text-[7px] pb-1 font-semibold tracking-wide"
            style={i === 0
              ? { color: colors[0], borderBottom: `2px solid ${colors[0]}` }
              : { color: "#C9B57A" }}>
            {label}
          </span>
        ))}
      </div>
    );
  }

  if (id === "bold") {
    const colors = ["#5F8C4A","#C17F2E","#7B5E3A"];
    return (
      <div className="flex gap-1 py-1 flex-wrap">
        {labels.map((label, i) => (
          <span key={label} className="px-2 py-0.5 rounded-lg text-[6px] font-black uppercase"
            style={i === 0
              ? { backgroundColor: colors[0], color: "#fff" }
              : { backgroundColor: "#F5F0E8", color: colors[i], border: `1px solid ${colors[i]}99` }}>
            {label}
          </span>
        ))}
      </div>
    );
  }

  if (id === "grid") {
    const colors = ["#39FF14","#00D4FF","#FF6B35"];
    return (
      <div className="flex flex-wrap gap-1 py-1.5 px-1 rounded" style={{ background: "#0a0a0a" }}>
        {labels.map((label, i) => (
          <span key={label} className="px-2 py-0.5 rounded text-[7px] font-black uppercase"
            style={i === 0
              ? { backgroundColor: colors[0], color: "#000" }
              : { backgroundColor: "#111", color: colors[i], border: `1px solid ${colors[i]}44` }}>
            {label}
          </span>
        ))}
      </div>
    );
  }

  if (id === "outline") {
    const colors = ["#0077B6","#0096C7","#00B4D8"];
    return (
      <div className="flex gap-1 py-1.5 flex-wrap">
        {labels.map((label, i) => (
          <span key={label} className="px-2 py-0.5 rounded-full text-[7px] font-semibold border-2"
            style={i === 0
              ? { backgroundColor: colors[0], borderColor: colors[0], color: "#fff" }
              : { borderColor: `${colors[i]}66`, color: colors[i], backgroundColor: `${colors[i]}11` }}>
            {label}
          </span>
        ))}
      </div>
    );
  }

  // compact — candy
  const colors = ["#FF6B6B","#FFB347","#4FC3F7"];
  return (
    <div className="flex flex-wrap gap-1 py-1.5">
      {labels.map((label, i) => (
        <span key={label} className="px-2 py-0.5 rounded-full text-[7px] font-bold"
          style={i === 0
            ? { backgroundColor: colors[0], color: "#fff" }
            : { backgroundColor: `${colors[i]}33`, color: colors[i] }}>
          {label}
        </span>
      ))}
    </div>
  );
}
