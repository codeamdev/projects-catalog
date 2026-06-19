"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { sendEmailCampaign } from "@/app/api/admin/actions";

type CampaignType = "general" | "discount" | "new_products" | "price_drop";

const TYPES: { id: CampaignType; label: string; emoji: string; desc: string }[] = [
  { id: "general",      label: "General",         emoji: "📢", desc: "Mensaje libre para todos tus suscriptores" },
  { id: "discount",     label: "Descuento",        emoji: "🏷️", desc: "Anunciá un descuento especial con código" },
  { id: "new_products", label: "Nueva colección",  emoji: "✨", desc: "Mostrá productos nuevos o destacados" },
  { id: "price_drop",   label: "Baja de precios",  emoji: "📉", desc: "Avisá sobre precios reducidos" },
];

interface Product { id: string; title: string; price: string | null; imageUrl: string | null; }

interface Props {
  subscriberCount: number;
  tenantName: string;
  tenantSubdomain: string;
  tenantLogoUrl: string | null;
  tenantPrimaryColor: string;
  welcomeDiscountPercent: number | null;
  products: Product[];
}

export function EmailComposer({
  subscriberCount,
  tenantName,
  tenantSubdomain,
  tenantLogoUrl,
  tenantPrimaryColor,
  welcomeDiscountPercent,
  products,
}: Props) {
  const [type, setType] = useState<CampaignType>("general");
  const [subject, setSubject] = useState("");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [discountCode, setDiscountCode] = useState("");
  const [discountPercent, setDiscountPercent] = useState(welcomeDiscountPercent ?? 10);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [confirmed, setConfirmed] = useState(false);
  const [sending, startSending] = useTransition();

  const selectedProducts = products.filter((p) => selectedProductIds.includes(p.id));
  const showProducts = type === "new_products" || type === "price_drop";
  const showDiscount = type === "discount";

  function toggleProduct(id: string) {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function handleSend() {
    if (!subject.trim() || !title.trim() || !message.trim()) {
      toast.error("Completá el asunto, título y mensaje");
      return;
    }
    if (subscriberCount === 0) {
      toast.error("No hay suscriptores activos");
      return;
    }

    const fd = new FormData();
    fd.set("type", type);
    fd.set("subject", subject.trim());
    fd.set("title", title.trim());
    fd.set("message", message.trim());
    fd.set("tenant_name", tenantName);
    fd.set("tenant_subdomain", tenantSubdomain);
    fd.set("tenant_logo_url", tenantLogoUrl ?? "");
    fd.set("tenant_primary_color", tenantPrimaryColor);
    if (showDiscount && discountCode.trim()) {
      fd.set("discount_code", discountCode.trim().toUpperCase());
      fd.set("discount_percent", String(discountPercent));
    }
    if (showProducts && selectedProductIds.length > 0) {
      fd.set("product_ids", JSON.stringify(selectedProductIds));
    }

    startSending(async () => {
      const result = await sendEmailCampaign(fd);
      if (result.ok) {
        toast.success(`✅ Enviado a ${result.data.sent} suscriptores${result.data.failed > 0 ? ` (${result.data.failed} fallaron)` : ""}`);
        setConfirmed(false);
      } else {
        toast.error(result.error);
      }
    });
  }

  const INPUT = "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300";

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Enviar correos</h1>
        <p className="text-sm text-gray-400 mt-1">
          {subscriberCount > 0
            ? `${subscriberCount} suscriptor${subscriberCount !== 1 ? "es" : ""} activo${subscriberCount !== 1 ? "s" : ""}`
            : "Sin suscriptores activos aún"}
        </p>
      </div>

      {subscriberCount === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-sm text-amber-800">
          <strong>Sin destinatarios.</strong> Activá el popup de bienvenida en Ajustes para empezar a capturar suscriptores.
        </div>
      )}

      {/* Tipo de campaña */}
      <section className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-700">Tipo de campaña</h2>
        <div className="grid grid-cols-2 gap-2">
          {TYPES.map((t) => (
            <button key={t.id} type="button" onClick={() => setType(t.id)}
              className={`text-left p-3.5 rounded-xl border-2 transition-all ${type === t.id ? "border-indigo-500 bg-indigo-50" : "border-gray-100 hover:border-gray-200"}`}>
              <p className="text-xl mb-1">{t.emoji}</p>
              <p className={`text-sm font-semibold ${type === t.id ? "text-indigo-700" : "text-gray-800"}`}>{t.label}</p>
              <p className="text-[11px] text-gray-400 mt-0.5 leading-tight">{t.desc}</p>
            </button>
          ))}
        </div>
      </section>

      {/* Contenido */}
      <section className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
        <h2 className="text-sm font-semibold text-gray-700">Contenido del email</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Asunto del email *</label>
          <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Ej: ¡Nuevos productos disponibles! 🎉" className={INPUT} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Titular interno *</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej: Novedades que no te podés perder" className={INPUT} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Mensaje *</label>
          <textarea value={message} onChange={(e) => setMessage(e.target.value)}
            placeholder="Escribí el cuerpo principal del email..."
            rows={4} className={`${INPUT} resize-none`} />
        </div>

        {showDiscount && (
          <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-4 space-y-3">
            <p className="text-xs font-semibold text-indigo-700">Código de descuento</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Código</label>
                <input value={discountCode} onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                  placeholder="Ej: VERANO25" className={INPUT} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Descuento (%)</label>
                <input type="number" min={1} max={99} value={discountPercent}
                  onChange={(e) => setDiscountPercent(parseInt(e.target.value, 10))} className={INPUT} />
              </div>
            </div>
          </div>
        )}

        {showProducts && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Productos a destacar (máx. 4)</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
              {products.map((p) => (
                <label key={p.id}
                  className={`flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer transition-all ${selectedProductIds.includes(p.id) ? "border-indigo-300 bg-indigo-50" : "border-gray-100 hover:border-gray-200"}`}>
                  <input type="checkbox" checked={selectedProductIds.includes(p.id)}
                    onChange={() => toggleProduct(p.id)}
                    disabled={!selectedProductIds.includes(p.id) && selectedProductIds.length >= 4}
                    className="rounded" />
                  {p.imageUrl && (
                    <img src={p.imageUrl} alt={p.title} className="w-9 h-9 rounded-lg object-cover flex-shrink-0 bg-gray-100" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-gray-800 truncate">{p.title}</p>
                    {p.price && <p className="text-xs text-gray-400">${Number(p.price).toLocaleString("es-CO")}</p>}
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Confirmar y enviar */}
      <section className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
        <div className="flex items-start gap-3">
          <input type="checkbox" id="confirm" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)}
            className="mt-0.5 rounded" />
          <label htmlFor="confirm" className="text-sm text-gray-700 cursor-pointer">
            Confirmo que quiero enviar este email a <strong>{subscriberCount} suscriptor{subscriberCount !== 1 ? "es" : ""}</strong>.
            Esta acción no se puede deshacer.
          </label>
        </div>
        <button
          onClick={handleSend}
          disabled={!confirmed || sending || subscriberCount === 0}
          className="w-full py-3.5 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {sending ? "Enviando…" : `Enviar a ${subscriberCount} suscriptor${subscriberCount !== 1 ? "es" : ""}`}
        </button>
      </section>
    </div>
  );
}
