"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { MultiImageUpload } from "@/components/admin/MultiImageUpload";
import { VideoUpload } from "@/components/admin/VideoUpload";
import { updateAllSettings } from "@/app/api/admin/actions";
import { WHY_EMOJIS, WHY_ICONS, resolveIcon } from "@/components/catalog/WhyChooseUs";

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

interface WhyItem { icon: string; title: string; description: string; }
interface FaqItem { question: string; answer: string; }

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
    whyChooseEnabled: boolean;
    whyChooseTitle: string;
    whyChooseHeadline: string;
    whyChooseDescription: string;
    whyChooseItems: WhyItem[];
    whyChooseIconStyle: string;
    faqEnabled: boolean;
    faqTitle: string;
    faqItems: FaqItem[];
    footerBgColor: string;
    welcomeEnabled: boolean;
    welcomeTitle: string;
    welcomeSubtitle: string;
    welcomeDiscountPercent: number | null;
    welcomeMessage: string;
    welcomeDelaySeconds: number;
    welcomeCodePrefix: string;
  };
}

export function SettingsClient({ defaults }: Props) {
  const router = useRouter();
  const [saving, startSaving] = useTransition();

  const rawHero = defaults.heroImageUrl ?? "";
  const defaultVideoUrl = VIDEO_RE.test(rawHero.split("\n")[0] ?? "") ? rawHero.split("\n")[0].trim() : "";
  const defaultHeroImages = rawHero.split("\n").map(u => u.trim()).filter(u => u && !VIDEO_RE.test(u)).join("\n");
  const rawHeroMobile = defaults.heroImageUrlMobile ?? "";
  const defaultHeroImagesMobile = rawHeroMobile.split("\n").map(u => u.trim()).filter(u => u && !VIDEO_RE.test(u)).join("\n");

  const [catStyle, setCatStyle] = useState(defaults.categoriesStyle ?? "stories");

  // Why Choose Us
  const [whyEnabled, setWhyEnabled] = useState(defaults.whyChooseEnabled);
  const whyIconStyle = "plain";
  const [whyItems, setWhyItems] = useState<WhyItem[]>(defaults.whyChooseItems);
  const [newWhy, setNewWhy] = useState<WhyItem | null>(null);
  const DEFAULT_EMOJI = WHY_EMOJIS[0].emoji;

  // Welcome popup
  const [welcomeEnabled, setWelcomeEnabled] = useState(defaults.welcomeEnabled);

  // FAQ
  const [faqEnabled, setFaqEnabled] = useState(defaults.faqEnabled);
  const [faqItems, setFaqItems] = useState<FaqItem[]>(defaults.faqItems);
  const [newFaq, setNewFaq] = useState<FaqItem | null>(null);

  function handleSaveAll(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    // Hero video/images precedence
    const videoUrl = ((fd.get("hero_video_url") as string) ?? "").trim();
    const imageUrls = ((fd.get("hero_images") as string) ?? "").trim();
    fd.set("hero_image_url", videoUrl || imageUrls);
    fd.set("hero_video_url_mobile", ((fd.get("hero_video_url_mobile") as string) ?? "").trim());
    fd.set("hero_image_url_mobile", ((fd.get("hero_images_mobile") as string) ?? "").trim());

    // State-managed fields
    fd.set("categories_style", catStyle);
    fd.set("welcome_enabled", welcomeEnabled ? "1" : "0");
    fd.set("why_choose_enabled", whyEnabled ? "1" : "0");
    fd.set("why_choose_icon_style", whyIconStyle);
    fd.set("why_choose_items", JSON.stringify(whyItems.filter(it => it.title.trim())));
    fd.set("faq_enabled", faqEnabled ? "1" : "0");
    fd.set("faq_items", JSON.stringify(faqItems.filter(it => it.question.trim())));

    startSaving(async () => {
      const result = await updateAllSettings(fd);
      if (result.ok) { toast.success("Cambios guardados"); router.refresh(); }
      else toast.error(result.error);
    });
  }

  return (
    <form onSubmit={handleSaveAll}>
      <div className="max-w-2xl space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Ajustes del catálogo</h1>
          <button
            type="submit"
            disabled={saving}
            className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60 transition-colors shadow-sm"
          >
            {saving ? "Guardando…" : "Guardar cambios"}
          </button>
        </div>

        {/* ── General ── */}
        <section className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
          <div>
            <h2 className="text-base font-semibold text-gray-900">General</h2>
            <p className="text-xs text-gray-400 mt-0.5">WhatsApp, color de marca y logo</p>
          </div>
          <ImageUpload name="logo_url" defaultValue={defaults.logoUrl} label="Logo" />
          <div>
            <label className={LABEL}>Número de WhatsApp</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm select-none">+</span>
              <input name="whatsapp_number" defaultValue={defaults.whatsappNumber} placeholder="5491112345678" className={`${INPUT} pl-7`} />
            </div>
            <p className="text-xs text-gray-400 mt-1">Código de país + número sin espacios ni guiones</p>
          </div>
          <div>
            <label className={LABEL}>Color principal</label>
            <div className="flex items-center gap-3">
              <input type="color" name="primary_color" defaultValue={defaults.primaryColor} className="h-10 w-16 rounded-xl border border-gray-200 cursor-pointer p-1" />
              <span className="text-xs text-gray-400">Se usa en el hero y en la identidad visual del catálogo</span>
            </div>
          </div>
        </section>

        {/* ── Hero + SEO ── */}
        <section className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Hero y SEO</h2>
            <p className="text-xs text-gray-400 mt-0.5">Pantalla de bienvenida y metadatos para buscadores</p>
          </div>
          <div>
            <label className={LABEL}>Título del hero *</label>
            <input name="hero_title" defaultValue={defaults.heroTitle} required className={INPUT} />
          </div>
          <div>
            <label className={LABEL}>Subtítulo del hero</label>
            <input name="hero_subtitle" defaultValue={defaults.heroSubtitle} className={INPUT} />
          </div>
          <div>
            <VideoUpload name="hero_video_url" defaultValue={defaultVideoUrl} label="Video de fondo (desktop / tablet)" />
            <p className="text-xs text-gray-400 mt-1">MP4 o WebM horizontal (16:9). Si se configura, tiene prioridad sobre las imágenes.</p>
          </div>
          <div>
            <MultiImageUpload name="hero_images" defaultValue={defaultHeroImages} label="Imágenes del carrusel (desktop / tablet)" />
            <p className="text-xs text-gray-400 mt-1">Horizontales (16:9). Si no hay imágenes se usan las de productos destacados.</p>
          </div>
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-4">
            <div>
              <p className="text-sm font-semibold text-gray-700">📱 Versión móvil</p>
              <p className="text-xs text-gray-400 mt-0.5">Contenido vertical (9:16) para teléfonos. Si se deja vacío, se usa el de desktop.</p>
            </div>
            <div>
              <VideoUpload name="hero_video_url_mobile" defaultValue={defaults.heroVideoUrlMobile ?? ""} label="Video móvil" />
              <p className="text-xs text-gray-400 mt-1">MP4 o WebM vertical (9:16). Se muestra solo en teléfonos.</p>
            </div>
            <div>
              <MultiImageUpload name="hero_images_mobile" defaultValue={defaultHeroImagesMobile} label="Imágenes móvil (carrusel vertical)" />
              <p className="text-xs text-gray-400 mt-1">Verticales (9:16 o cuadradas). Se muestran solo en pantallas pequeñas.</p>
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
            <textarea name="meta_description" defaultValue={defaults.metaDescription} rows={2} className={`${INPUT} resize-none`} />
          </div>
          <div>
            <label className={LABEL}>Google Site Verification</label>
            <input name="google_site_verification" defaultValue={defaults.googleSiteVerification} placeholder="Código de verificación de Google Search Console" className={INPUT} />
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
        </section>

        {/* ── Código de descuento ── */}
        <section className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Código de descuento</h2>
            <p className="text-xs text-gray-400 mt-0.5">Déjalo vacío para desactivar.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={LABEL}>Código</label>
              <input name="discount_code" defaultValue={defaults.discountCode} placeholder="Ej: VERANO25" className={INPUT} />
            </div>
            <div>
              <label className={LABEL}>Descuento (%)</label>
              <input name="discount_code_percent" type="number" min={1} max={99} defaultValue={defaults.discountCodePercent ?? ""} placeholder="Ej: 15" className={INPUT} />
            </div>
          </div>
        </section>

        {/* ── Estilo de categorías ── */}
        <section className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Estilo del filtro de categorías</h2>
            <p className="text-xs text-gray-400 mt-0.5">Elegí cómo se ven los botones de categoría en tu catálogo.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {CAT_STYLES.map((s) => (
              <button key={s.id} type="button" onClick={() => setCatStyle(s.id)}
                className={`text-left p-3 rounded-xl border-2 transition-all ${catStyle === s.id ? "border-indigo-600 bg-indigo-50" : "border-gray-100 hover:border-gray-300 bg-gray-50"}`}>
                <StylePreview id={s.id} />
                <p className={`text-xs font-semibold mt-2 ${catStyle === s.id ? "text-indigo-700" : "text-gray-700"}`}>{s.name}</p>
                <p className="text-[10px] text-gray-400 leading-tight mt-0.5">{s.desc}</p>
              </button>
            ))}
          </div>
        </section>

        {/* ── Color del footer ── */}
        <section className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Color del footer</h2>
            <p className="text-xs text-gray-400 mt-0.5">El texto se adapta automáticamente al fondo.</p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Blanco", color: "#ffffff" },
              { label: "Gris claro", color: "#f9fafb" },
              { label: "Gris medio", color: "#e5e7eb" },
              { label: "Gris oscuro", color: "#374151" },
              { label: "Negro suave", color: "#0f0f0f" },
              { label: "Negro puro", color: "#000000" },
            ].map(({ label, color }) => (
              <button key={color} type="button"
                onClick={(e) => {
                  const form = (e.target as HTMLElement).closest("form")!;
                  (form.querySelector("input[name=footer_bg_color]") as HTMLInputElement).value = color;
                }}
                className="flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 hover:border-gray-400 text-xs font-medium text-gray-700 transition-all">
                <span className="w-5 h-5 rounded-md border border-gray-200 flex-shrink-0" style={{ backgroundColor: color }} />
                {label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <input type="color" name="footer_bg_color" defaultValue={defaults.footerBgColor} className="h-10 w-14 rounded-xl border border-gray-200 cursor-pointer p-1" />
            <p className="text-xs text-gray-400">O elegí un color personalizado.</p>
          </div>
        </section>

        {/* ── ¿Por qué elegirnos? ── */}
        <section className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
          <div>
            <h2 className="text-base font-semibold text-gray-900">¿Por qué elegirnos?</h2>
            <p className="text-xs text-gray-400 mt-0.5">Sección opcional entre el catálogo y el footer.</p>
          </div>

          {/* Toggle */}
          <label className="flex items-center justify-between gap-3 p-4 rounded-xl border border-gray-100 bg-gray-50 cursor-pointer">
            <div>
              <p className="text-sm font-medium text-gray-800">Mostrar sección en el catálogo</p>
              <p className="text-xs text-gray-400 mt-0.5">Si está desactivada no se muestra, pero los datos se conservan</p>
            </div>
            <button type="button" role="switch" aria-checked={whyEnabled} onClick={() => setWhyEnabled(!whyEnabled)}
              className={`relative flex-shrink-0 w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none ${whyEnabled ? "bg-indigo-600" : "bg-gray-300"}`}>
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${whyEnabled ? "translate-x-5" : "translate-x-0"}`} />
            </button>
          </label>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>Etiqueta pequeña (arriba)</label>
              <input name="why_choose_title" defaultValue={defaults.whyChooseTitle} placeholder="¿Por qué elegirnos?" className={INPUT} />
              <p className="text-[11px] text-gray-400 mt-1">Texto pequeño en mayúsculas sobre el titular</p>
            </div>
            <div>
              <label className={LABEL}>Titular principal</label>
              <input name="why_choose_headline" defaultValue={defaults.whyChooseHeadline} placeholder="La mejor experiencia de compra" className={INPUT} />
            </div>
          </div>
          <div>
            <label className={LABEL}>Descripción (opcional)</label>
            <textarea name="why_choose_description" defaultValue={defaults.whyChooseDescription} placeholder="En pocas palabras, por qué confiar en nosotros..." rows={2} className={`${INPUT} resize-none`} />
          </div>

          {/* Razones — read-only list */}
          <div className="space-y-2">
            <label className={`${LABEL} mb-0`}>Razones (hasta 4)</label>
            {whyItems.map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50">
                <span className="text-2xl leading-none w-9 text-center flex-shrink-0 flex items-center justify-center">
                  {(() => { const r = resolveIcon(item.icon); if (r in WHY_ICONS) { const { Icon } = WHY_ICONS[r]; return <Icon size={22} strokeWidth={1.8} className="text-gray-600" />; } return item.icon; })()}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{item.title}</p>
                  {item.description && <p className="text-xs text-gray-400 truncate">{item.description}</p>}
                </div>
                <button type="button" onClick={() => setWhyItems(whyItems.filter((_, j) => j !== i))}
                  className="text-xs text-red-400 hover:text-red-600 flex-shrink-0 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors">
                  Quitar
                </button>
              </div>
            ))}

            {/* Formulario para añadir nueva razón */}
            {whyItems.length < 4 && (
              newWhy === null ? (
                <button type="button" onClick={() => setNewWhy({ icon: DEFAULT_EMOJI, title: "", description: "" })}
                  className="w-full py-2.5 rounded-xl border-2 border-dashed border-gray-200 text-sm text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 font-medium transition-all">
                  + Agregar razón
                </button>
              ) : (
                <div className="rounded-xl border-2 border-indigo-200 bg-indigo-50/30 p-4 space-y-3">
                  <p className="text-xs font-semibold text-indigo-700">Nueva razón</p>

                  {/* Picker: Emoji + Íconos SVG con tabs */}
                  <IconPicker
                    value={newWhy.icon}
                    onChange={(v) => setNewWhy({ ...newWhy, icon: v })}
                    INPUT={INPUT}
                    LABEL={LABEL}
                  />

                  <div>
                    <label className={LABEL}>Título *</label>
                    <input value={newWhy.title} onChange={e => setNewWhy({ ...newWhy, title: e.target.value })} placeholder="Envío rápido" className={INPUT} />
                  </div>
                  <div>
                    <label className={LABEL}>Descripción</label>
                    <input value={newWhy.description} onChange={e => setNewWhy({ ...newWhy, description: e.target.value })} placeholder="Recibís tu pedido en 24-48 hs" className={INPUT} />
                  </div>
                  <div className="flex gap-2">
                    <button type="button"
                      onClick={() => {
                        if (!newWhy.title.trim()) return;
                        setWhyItems([...whyItems, newWhy]);
                        setNewWhy(null);
                      }}
                      className="flex-1 bg-indigo-600 text-white py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors">
                      Añadir
                    </button>
                    <button type="button" onClick={() => setNewWhy(null)}
                      className="px-4 py-2 rounded-xl text-sm text-gray-500 hover:bg-gray-100 transition-colors">
                      Cancelar
                    </button>
                  </div>
                </div>
              )
            )}
          </div>

        </section>

        {/* ── Preguntas frecuentes ── */}
        <section className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Preguntas frecuentes</h2>
            <p className="text-xs text-gray-400 mt-0.5">Acordeón con respuestas a las preguntas más comunes.</p>
          </div>

          {/* Toggle */}
          <label className="flex items-center justify-between gap-3 p-4 rounded-xl border border-gray-100 bg-gray-50 cursor-pointer">
            <div>
              <p className="text-sm font-medium text-gray-800">Mostrar sección en el catálogo</p>
              <p className="text-xs text-gray-400 mt-0.5">Si está desactivada no se muestra, pero los datos se conservan</p>
            </div>
            <button type="button" role="switch" aria-checked={faqEnabled} onClick={() => setFaqEnabled(!faqEnabled)}
              className={`relative flex-shrink-0 w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none ${faqEnabled ? "bg-indigo-600" : "bg-gray-300"}`}>
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${faqEnabled ? "translate-x-5" : "translate-x-0"}`} />
            </button>
          </label>

          <div>
            <label className={LABEL}>Título de la sección</label>
            <input name="faq_title" defaultValue={defaults.faqTitle} placeholder="Preguntas frecuentes" className={INPUT} />
          </div>

          {/* Preguntas — read-only list */}
          <div className="space-y-2">
            <label className={`${LABEL} mb-0`}>Preguntas</label>
            {faqItems.map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 leading-snug">{item.question}</p>
                  <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{item.answer}</p>
                </div>
                <button type="button" onClick={() => setFaqItems(faqItems.filter((_, j) => j !== i))}
                  className="text-xs text-red-400 hover:text-red-600 flex-shrink-0 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors mt-0.5">
                  Quitar
                </button>
              </div>
            ))}

            {newFaq === null ? (
              <button type="button" onClick={() => setNewFaq({ question: "", answer: "" })}
                className="w-full py-2.5 rounded-xl border-2 border-dashed border-gray-200 text-sm text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50 font-medium transition-all">
                + Agregar pregunta
              </button>
            ) : (
              <div className="rounded-xl border-2 border-indigo-200 bg-indigo-50/30 p-4 space-y-3">
                <p className="text-xs font-semibold text-indigo-700">Nueva pregunta</p>
                <div>
                  <label className={LABEL}>Pregunta *</label>
                  <input value={newFaq.question} onChange={e => setNewFaq({ ...newFaq, question: e.target.value })} placeholder="¿Hacen envíos a todo el país?" className={INPUT} />
                </div>
                <div>
                  <label className={LABEL}>Respuesta *</label>
                  <textarea value={newFaq.answer} onChange={e => setNewFaq({ ...newFaq, answer: e.target.value })} placeholder="Sí, hacemos envíos a todo el país..." rows={3} className={`${INPUT} resize-none`} />
                </div>
                <div className="flex gap-2">
                  <button type="button"
                    onClick={() => {
                      if (!newFaq.question.trim() || !newFaq.answer.trim()) return;
                      setFaqItems([...faqItems, newFaq]);
                      setNewFaq(null);
                    }}
                    className="flex-1 bg-indigo-600 text-white py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors">
                    Añadir
                  </button>
                  <button type="button" onClick={() => setNewFaq(null)}
                    className="px-4 py-2 rounded-xl text-sm text-gray-500 hover:bg-gray-100 transition-colors">
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ── Popup de bienvenida + suscripción ── */}
        <section className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Popup de bienvenida</h2>
            <p className="text-xs text-gray-400 mt-0.5">Modal que aparece al ingresar al catálogo por primera vez. Captura el email y ofrece un descuento.</p>
          </div>

          {/* Toggle */}
          <label className="flex items-center justify-between gap-3 p-4 rounded-xl border border-gray-100 bg-gray-50 cursor-pointer">
            <div>
              <p className="text-sm font-medium text-gray-800">Mostrar popup en el catálogo</p>
              <p className="text-xs text-gray-400 mt-0.5">Se muestra una vez por visitante (cookie de sesión)</p>
            </div>
            <button type="button" role="switch" aria-checked={welcomeEnabled} onClick={() => setWelcomeEnabled(!welcomeEnabled)}
              className={`relative flex-shrink-0 w-11 h-6 rounded-full transition-colors duration-200 ${welcomeEnabled ? "bg-indigo-600" : "bg-gray-300"}`}>
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${welcomeEnabled ? "translate-x-5" : "translate-x-0"}`} />
            </button>
          </label>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>Título del popup</label>
              <input name="welcome_title" defaultValue={defaults.welcomeTitle} placeholder="¡Bienvenida/o! 🎉" className={INPUT} />
            </div>
            <div>
              <label className={LABEL}>Subtítulo</label>
              <input name="welcome_subtitle" defaultValue={defaults.welcomeSubtitle} placeholder="Suscribite y obtené tu descuento" className={INPUT} />
            </div>
          </div>
          <div>
            <label className={LABEL}>Mensaje</label>
            <textarea name="welcome_message" defaultValue={defaults.welcomeMessage} placeholder="Ingresá tu correo para recibir novedades y descuentos exclusivos." rows={2} className={`${INPUT} resize-none`} />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>% de descuento (opcional)</label>
              <input type="number" name="welcome_discount_percent" min={1} max={99} defaultValue={defaults.welcomeDiscountPercent ?? ""} placeholder="Ej: 15" className={INPUT} />
              <p className="text-[11px] text-gray-400 mt-1">Deja vacío para no mostrar descuento</p>
            </div>
            <div>
              <label className={LABEL}>Prefijo del código</label>
              <input name="welcome_code_prefix" maxLength={10} defaultValue={defaults.welcomeCodePrefix ?? "DESC"} placeholder="Ej: DESC" className={INPUT} />
              <p className="text-[11px] text-gray-400 mt-1">Cada suscriptor recibe un código único: DESC-A1B2C3</p>
            </div>
            <div>
              <label className={LABEL}>Demora antes de mostrar (seg)</label>
              <input type="number" name="welcome_delay_seconds" min={0} max={30} defaultValue={defaults.welcomeDelaySeconds} className={INPUT} />
            </div>
          </div>
          <div className="rounded-xl bg-blue-50 border border-blue-100 p-3.5 text-xs text-blue-700 space-y-1">
            <p><strong>¿Cómo funciona?</strong></p>
            <p>• Al suscribirse, el visitante recibe un código único de descuento por email.</p>
            <p>• El código puede usarse en el carrito para obtener el % configurado.</p>
            <p>• Podés ver todos los suscriptores en <strong>Suscriptores</strong> del menú.</p>
            <p>• Para enviar emails a los suscriptores, usá la sección <strong>Correos</strong>.</p>
          </div>
        </section>

        {/* ── Botón guardar al final ── */}
        <div className="flex justify-end pb-8">
          <button type="submit" disabled={saving}
            className="bg-indigo-600 text-white px-8 py-3 rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60 transition-colors shadow-sm">
            {saving ? "Guardando…" : "Guardar cambios"}
          </button>
        </div>
      </div>
    </form>
  );
}

// ── Icon Picker (emoji + Lucide) ─────────────────────────────────

function IconPicker({
  value,
  onChange,
  INPUT,
  LABEL,
}: {
  value: string;
  onChange: (v: string) => void;
  INPUT: string;
  LABEL: string;
}) {
  const [tab, setTab] = useState<"emoji" | "icons">("emoji");

  return (
    <div>
      <label className={LABEL}>Ícono</label>
      <div className="flex gap-1 mb-2">
        <button type="button" onClick={() => setTab("emoji")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${tab === "emoji" ? "bg-indigo-100 text-indigo-700" : "text-gray-500 hover:bg-gray-100"}`}>
          😀 Emoji coloridos
        </button>
        <button type="button" onClick={() => setTab("icons")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${tab === "icons" ? "bg-indigo-100 text-indigo-700" : "text-gray-500 hover:bg-gray-100"}`}>
          ✏️ Íconos SVG
        </button>
      </div>
      {tab === "emoji" ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(52px,1fr))] gap-1 p-2 bg-white rounded-xl border border-gray-200 max-h-52 overflow-y-auto">
          {WHY_EMOJIS.map(({ emoji, label }) => (
            <button key={emoji} type="button" title={label} onClick={() => onChange(emoji)}
              className={`flex flex-col items-center gap-0.5 py-2 px-1 rounded-lg transition-all ${value === emoji ? "bg-indigo-100 ring-2 ring-indigo-400" : "hover:bg-gray-100"}`}>
              <span className="text-2xl leading-none">{emoji}</span>
              <span className="text-[8px] leading-tight text-center text-gray-500 truncate w-full">{label}</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(56px,1fr))] gap-1 p-2 bg-white rounded-xl border border-gray-200 max-h-52 overflow-y-auto">
          {Object.entries(WHY_ICONS).map(([name, { label, Icon }]) => (
            <button key={name} type="button" title={label} onClick={() => onChange(name)}
              className={`flex flex-col items-center gap-0.5 py-2 px-1 rounded-lg transition-all ${value === name ? "bg-indigo-100 ring-2 ring-indigo-400" : "hover:bg-gray-100"}`}>
              <Icon size={18} strokeWidth={1.5} className={value === name ? "text-indigo-600" : "text-gray-500"} />
              <span className="text-[8px] leading-tight text-center text-gray-500 truncate w-full">{label}</span>
            </button>
          ))}
        </div>
      )}
      <p className="text-[11px] text-gray-400 mt-1.5">O pegá cualquier emoji personalizado:</p>
      <input
        value={WHY_ICONS[value] || WHY_EMOJIS.find(e => e.emoji === value) ? "" : value}
        onChange={e => onChange(e.target.value)}
        placeholder="🦋"
        className={`${INPUT} mt-1 text-lg`}
        maxLength={8}
      />
    </div>
  );
}

// ── Mini preview por estilo ─────────────────────────────────────

function StylePreview({ id }: { id: string }) {
  const labels = ["Todos", "Ropa", "Acces."];
  if (id === "stories") {
    const colors = ["#6366F1", "#EC4899", "#10B981"];
    return (<div className="flex gap-2 py-1">{labels.map((label, i) => (<div key={label} className="flex flex-col items-center gap-0.5"><div className="w-8 h-8 rounded-full flex items-center justify-center text-[7px] font-bold text-white" style={{ backgroundColor: colors[i] }}>{i === 0 ? "✦" : label.slice(0, 2)}</div><span className="text-[6px] text-gray-400">{label}</span></div>))}</div>);
  }
  if (id === "pills") {
    const bgs = ["#FFAFC7","#C7AFEE","#A8DDBA"]; const fgs = ["#C2547A","#7B5EA7","#2E8B57"];
    return (<div className="flex gap-1 py-1.5 flex-wrap">{labels.map((label, i) => (<span key={label} className="px-2 py-0.5 rounded-full text-[7px] font-semibold" style={{ backgroundColor: bgs[i], color: fgs[i] }}>{label}</span>))}</div>);
  }
  if (id === "chips") {
    const colors = ["#8B6550","#D4A853","#9E7458"];
    return (<div className="flex gap-1 py-1.5 flex-wrap" style={{ background: "#FDF6EE", borderRadius: 6, padding: "4px 4px" }}>{labels.map((label, i) => (<span key={label} className="px-2 py-0.5 rounded text-[7px] font-semibold border" style={i === 0 ? { backgroundColor: colors[0], borderColor: colors[0], color: "#fff" } : { backgroundColor: "#FDF6EE", borderColor: colors[i], color: colors[i] }}>{label}</span>))}</div>);
  }
  if (id === "tabs") {
    return (<div className="flex gap-2 py-1 border-b-2 border-gray-200">{labels.map((label, i) => (<span key={label} className="text-[7px] pb-1" style={i === 0 ? { fontWeight: 800, color: "#111", borderBottom: "2px solid #111" } : { color: "#9ca3af", fontWeight: 500 }}>{label}</span>))}</div>);
  }
  if (id === "bubbles") {
    const colors = ["#60A5FA","#34D399","#A78BFA"];
    return (<div className="flex gap-1 py-1.5 px-2 rounded-xl" style={{ backgroundColor: "#0d0d0d" }}>{labels.map((label, i) => (<span key={label} className="px-2 py-0.5 rounded-full text-[7px] font-bold" style={i === 0 ? { backgroundColor: `${colors[0]}22`, color: colors[0], border: `1px solid ${colors[0]}` } : { color: "#374151" }}>{label}</span>))}</div>);
  }
  if (id === "minimal") {
    const colors = ["#D4AF37","#C9A84C","#B8922D"];
    return (<div className="flex gap-2 py-1" style={{ borderBottom: "1px solid #E8D89A" }}>{labels.map((label, i) => (<span key={label} className="text-[7px] pb-1 font-semibold tracking-wide" style={i === 0 ? { color: colors[0], borderBottom: `2px solid ${colors[0]}` } : { color: "#C9B57A" }}>{label}</span>))}</div>);
  }
  if (id === "bold") {
    const colors = ["#5F8C4A","#C17F2E","#7B5E3A"];
    return (<div className="flex gap-1 py-1 flex-wrap">{labels.map((label, i) => (<span key={label} className="px-2 py-0.5 rounded-lg text-[6px] font-black uppercase" style={i === 0 ? { backgroundColor: colors[0], color: "#fff" } : { backgroundColor: "#F5F0E8", color: colors[i], border: `1px solid ${colors[i]}99` }}>{label}</span>))}</div>);
  }
  if (id === "grid") {
    const colors = ["#39FF14","#00D4FF","#FF6B35"];
    return (<div className="flex flex-wrap gap-1 py-1.5 px-1 rounded" style={{ background: "#0a0a0a" }}>{labels.map((label, i) => (<span key={label} className="px-2 py-0.5 rounded text-[7px] font-black uppercase" style={i === 0 ? { backgroundColor: colors[0], color: "#000" } : { backgroundColor: "#111", color: colors[i], border: `1px solid ${colors[i]}44` }}>{label}</span>))}</div>);
  }
  if (id === "outline") {
    const colors = ["#0077B6","#0096C7","#00B4D8"];
    return (<div className="flex gap-1 py-1.5 flex-wrap">{labels.map((label, i) => (<span key={label} className="px-2 py-0.5 rounded-full text-[7px] font-semibold border-2" style={i === 0 ? { backgroundColor: colors[0], borderColor: colors[0], color: "#fff" } : { borderColor: `${colors[i]}66`, color: colors[i], backgroundColor: `${colors[i]}11` }}>{label}</span>))}</div>);
  }
  const colors = ["#FF6B6B","#FFB347","#4FC3F7"];
  return (<div className="flex flex-wrap gap-1 py-1.5">{labels.map((label, i) => (<span key={label} className="px-2 py-0.5 rounded-full text-[7px] font-bold" style={i === 0 ? { backgroundColor: colors[0], color: "#fff" } : { backgroundColor: `${colors[i]}33`, color: colors[i] }}>{label}</span>))}</div>);
}
