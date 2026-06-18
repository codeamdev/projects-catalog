"use client";

import { useEffect, useState } from "react";
import { X, Tag, Gift } from "lucide-react";

interface Props {
  tenantSubdomain: string;
  tenantName: string;
  primaryColor: string;
  title: string;
  subtitle: string;
  message: string;
  discountPercent: number | null;
  delaySeconds: number;
}

export function WelcomeModal({
  tenantSubdomain,
  tenantName,
  primaryColor,
  title,
  subtitle,
  message,
  discountPercent,
  delaySeconds,
}: Props) {
  const [show, setShow] = useState(false);
  const [step, setStep] = useState<"form" | "success">("form");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [code, setCode] = useState("");
  const [percent, setPercent] = useState(discountPercent);

  useEffect(() => {
    const key = `welcome_seen_${tenantSubdomain}`;
    if (localStorage.getItem(key)) return;
    const t = setTimeout(() => setShow(true), (delaySeconds || 3) * 1000);
    return () => clearTimeout(t);
  }, [tenantSubdomain, delaySeconds]);

  function dismiss() {
    localStorage.setItem(`welcome_seen_${tenantSubdomain}`, "1");
    setShow(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-subdomain": tenantSubdomain,
        },
        body: JSON.stringify({ email: email.trim(), name: name.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error || "Error al suscribirte. Intentá de nuevo.");
        return;
      }
      setCode(data.discountCode ?? "");
      setPercent(data.percent);
      setStep("success");
      localStorage.setItem(`welcome_seen_${tenantSubdomain}`, "1");
    } catch {
      setError("Error de conexión. Intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={dismiss}
      />

      {/* Card */}
      <div className="relative w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">

        {/* Top accent bar */}
        <div className="h-1.5" style={{ background: primaryColor }} />

        {/* Close button */}
        <button
          onClick={dismiss}
          className="absolute top-4 right-4 p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors z-10"
        >
          <X className="w-4 h-4 text-gray-500" />
        </button>

        {step === "form" ? (
          <div className="px-7 py-8">
            {/* Icon + headline */}
            <div className="flex flex-col items-center text-center mb-6">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-sm"
                style={{ backgroundColor: `${primaryColor}18` }}
              >
                <Gift className="w-8 h-8" style={{ color: primaryColor }} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 leading-tight">{title}</h2>
              {subtitle && <p className="text-gray-500 text-sm mt-1.5 leading-relaxed">{subtitle}</p>}
            </div>

            {/* Discount badge */}
            {discountPercent && (
              <div
                className="flex items-center justify-center gap-2 rounded-2xl py-3 px-4 mb-5 text-white font-bold text-sm"
                style={{ background: primaryColor }}
              >
                <Tag className="w-4 h-4 flex-shrink-0" />
                {discountPercent}% de descuento en tu primera compra
              </div>
            )}

            {message && (
              <p className="text-gray-500 text-sm text-center mb-5 leading-relaxed">{message}</p>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tu nombre (opcional)"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 bg-gray-50"
              />
              <input
                required
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                placeholder="Tu correo electrónico *"
                className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 bg-gray-50 ${error ? "border-red-300" : "border-gray-200"}`}
              />
              {error && <p className="text-red-500 text-xs px-1">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl font-bold text-white text-sm disabled:opacity-60 transition-opacity shadow-sm"
                style={{ background: primaryColor }}
              >
                {loading ? "Suscribiéndote…" : discountPercent ? `¡Quiero mi ${discountPercent}% de descuento!` : "Suscribirme"}
              </button>
            </form>

            <button
              onClick={dismiss}
              className="w-full text-center text-xs text-gray-400 hover:text-gray-600 mt-3 transition-colors"
            >
              No gracias, continuar sin descuento
            </button>

            <p className="text-center text-[10px] text-gray-300 mt-3 leading-relaxed">
              Al suscribirte aceptás recibir emails de {tenantName}. Podés darte de baja cuando quieras.
            </p>
          </div>
        ) : (
          <div className="px-7 py-10 text-center">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Ya estás adentro!</h2>
            <p className="text-gray-500 text-sm mb-6">
              Te enviamos un email de confirmación. Tu código de descuento es:
            </p>
            {code && (
              <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl py-5 px-6 mb-6">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Tu código</p>
                <p className="text-3xl font-black text-gray-900 tracking-widest font-mono">{code}</p>
                {percent && <p className="text-sm text-gray-500 mt-1">{percent}% de descuento</p>}
              </div>
            )}
            <p className="text-xs text-gray-400 mb-6">Usalo en el carrito antes de hacer tu pedido por WhatsApp</p>
            <button
              onClick={dismiss}
              className="w-full py-3.5 rounded-xl font-bold text-white text-sm shadow-sm"
              style={{ background: primaryColor }}
            >
              ¡Ver el catálogo!
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
