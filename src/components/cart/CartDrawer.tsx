"use client";

import { useEffect, useState } from "react";
import { X, Trash2, MessageCircle, Tag, ShoppingBag } from "lucide-react";
import { useCart } from "@/store/cart";

interface Props {
  tenantName: string;
  tenantSubdomain: string;
  whatsappNumber: string | null;
  discountCode: string | null;
  discountCodePercent: number | null;
}

const fmtCOP = (n: number) =>
  `$${new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 }).format(n)}`;

export function CartDrawer({ tenantName, tenantSubdomain, whatsappNumber, discountCode, discountCodePercent }: Props) {
  const {
    items: storeItems,
    isOpen,
    closeCart,
    removeItem,
    updateQuantity,
    totalItems,
    totalPrice,
    clearCart,
  } = useCart();

  const [mounted, setMounted] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [couponInput, setCouponInput] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponError, setCouponError] = useState(false);

  useEffect(() => setMounted(true), []);
  useEffect(() => { if (!isOpen) setShowModal(false); }, [isOpen]);

  const items = mounted ? storeItems : [];
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + (i.price ?? 0) * i.quantity, 0);
  const couponDiscount = couponApplied && discountCodePercent
    ? Math.round(subtotal * discountCodePercent / 100)
    : 0;
  const finalTotal = subtotal - couponDiscount;

  function applyCoupon() {
    if (!discountCode) return;
    if (couponInput.trim().toLowerCase() === discountCode.toLowerCase()) {
      setCouponApplied(true);
      setCouponError(false);
    } else {
      setCouponError(true);
    }
  }

  function removeCoupon() {
    setCouponApplied(false);
    setCouponInput("");
    setCouponError(false);
  }

  async function handleSendOrder(e: React.FormEvent) {
    e.preventDefault();
    if (!whatsappNumber || submitting) return;

    const waWindow = window.open("about:blank", "_blank");

    setSubmitting(true);
    let orderNumber = "";
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-tenant-subdomain": tenantSubdomain,
        },
        body: JSON.stringify({
          customerName: name,
          customerPhone: phone,
          customerEmail: email || undefined,
          notes: notes || undefined,
          items: items.map((i) => ({
            title: i.title,
            quantity: i.quantity,
            price: i.price,
            originalPrice: i.originalPrice,
            discountPercent: i.discountPercent,
          })),
          total: finalTotal,
          couponCode: couponApplied ? couponInput.toUpperCase() : null,
          couponDiscount: couponApplied ? couponDiscount : null,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        orderNumber = data.orderNumber ?? "";
      } else {
        console.error("Error al registrar pedido:", await res.text());
      }
    } catch (err) {
      console.error("Error al registrar pedido:", err);
    } finally {
      setSubmitting(false);
    }

    function fmtItem(i: (typeof items)[0]): string {
      const u = i.quantity === 1 ? "1 unid." : `${i.quantity} unid.`;
      if (!i.price) {
        return `🔹 *${i.title}*\n     ${u}`;
      }
      if (i.discountPercent && i.originalPrice) {
        return (
          `🔹 *${i.title}*\n` +
          `     🏷️ -${i.discountPercent}% | ${u} x ~${fmtCOP(i.originalPrice)}~ ${fmtCOP(i.price)}\n` +
          `     💵 *${fmtCOP(i.price * i.quantity)}*`
        );
      }
      return (
        `🔹 *${i.title}*\n` +
        `     ${u} x ${fmtCOP(i.price)}\n` +
        `     💵 *${fmtCOP(i.price * i.quantity)}*`
      );
    }

    // Limpiar el número: solo dígitos y + inicial para evitar URL rota
    const waNumber = whatsappNumber!.replace(/[^+\d]/g, "");

    const msg: string[] = [];
    msg.push(`👋 *Hola ${tenantName}!*`);
    msg.push(`Quiero hacer el siguiente pedido 👇`);
    msg.push("");
    if (orderNumber) msg.push(`🧾 _Pedido #${orderNumber}_`);
    msg.push("");
    msg.push(`📦 *PRODUCTOS*`);
    items.forEach((item) => {
      msg.push("");
      msg.push(fmtItem(item));
    });
    msg.push("");
    msg.push(`💰 *RESUMEN*`);
    if (couponApplied && discountCodePercent) {
      msg.push(`Subtotal: ${fmtCOP(subtotal)}`);
      msg.push(`🏷️ Cupon _${couponInput.toUpperCase()}_ -${discountCodePercent}%: -${fmtCOP(couponDiscount)}`);
    }
    msg.push(`✅ *TOTAL: ${fmtCOP(finalTotal)}*`);
    msg.push("");
    msg.push(`📋 *MIS DATOS*`);
    msg.push(`👤 ${name}`);
    if (phone) msg.push(`📲 ${phone}`);
    if (email) msg.push(`📧 ${email}`);
    if (notes) msg.push(`\n📝 _${notes}_`);

    const parts = msg.join("\n");

    const url = `https://wa.me/${waNumber}?text=${encodeURIComponent(parts)}`;
    if (waWindow) {
      waWindow.location.href = url;
    } else {
      window.open(url, "_blank");
    }

    clearCart();
    removeCoupon();
    setShowModal(false);
    setName(""); setPhone(""); setEmail(""); setNotes("");
    closeCart();
  }

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/40 z-40 transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={closeCart}
      />

      {/* Panel */}
      <aside
        className={`fixed right-0 top-0 h-full w-full max-w-sm bg-white z-50 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Encabezado */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-900">Tu carrito</h2>
            {itemCount > 0 && (
              <p className="text-xs text-gray-400 mt-0.5">
                {itemCount} {itemCount === 1 ? "producto" : "productos"}
              </p>
            )}
          </div>
          <button
            onClick={closeCart}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Lista de items */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center gap-4 py-8">
              <ShoppingBag className="w-16 h-16 text-gray-200" />
              <div>
                <p className="text-gray-600 font-semibold text-base">Tu carrito está vacío</p>
                <p className="text-gray-400 text-sm mt-1">Explorá el catálogo y agregá lo que te guste</p>
              </div>
              <button
                onClick={closeCart}
                className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-full hover:bg-gray-700 transition-colors"
              >
                Ver catálogo
              </button>
            </div>
          ) : (
            <ul className="space-y-4">
              {items.map((item) => (
                <li key={item.id} className="flex gap-3 items-start py-1">
                  <div className="w-16 h-16 flex-shrink-0 rounded-xl overflow-hidden bg-gray-100">
                    {item.image ? (
                      <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1">
                      <p className="text-sm font-medium text-gray-900 line-clamp-2 leading-snug">
                        {item.title}
                      </p>
                      {item.discountPercent && (
                        <span className="flex-shrink-0 text-[10px] font-bold bg-red-500 text-white px-1.5 py-0.5 rounded-full">
                          -{item.discountPercent}%
                        </span>
                      )}
                    </div>
                    {item.price && (
                      <div className="mt-0.5">
                        {item.originalPrice && (
                          <span className="text-xs text-gray-400 line-through mr-1.5">
                            {fmtCOP(item.originalPrice * item.quantity)}
                          </span>
                        )}
                        <span className="text-sm text-gray-700 font-medium">{fmtCOP(item.price * item.quantity)}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-7 h-7 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors text-base leading-none"
                        >
                          −
                        </button>
                        <span className="w-7 text-center text-xs font-semibold">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-7 h-7 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors text-base leading-none"
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="ml-auto p-1.5 text-gray-300 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-gray-100 px-5 py-5 bg-gray-50 space-y-3">
            {/* Código de descuento */}
            {discountCode && (
              <div className="space-y-1.5">
                {couponApplied ? (
                  <div className="flex items-center justify-between bg-green-50 rounded-xl px-3 py-2">
                    <span className="text-xs text-green-700 font-semibold flex items-center gap-1.5">
                      <Tag className="w-3 h-3" />
                      {couponInput.toUpperCase()} — {discountCodePercent}% de descuento
                    </span>
                    <button
                      onClick={removeCoupon}
                      className="text-green-400 hover:text-green-700 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      value={couponInput}
                      onChange={(e) => { setCouponInput(e.target.value); setCouponError(false); }}
                      onKeyDown={(e) => e.key === "Enter" && applyCoupon()}
                      placeholder="Código de descuento"
                      className={`flex-1 border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-gray-300 bg-white ${
                        couponError ? "border-red-300" : "border-gray-200"
                      }`}
                    />
                    <button
                      onClick={applyCoupon}
                      className="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded-xl text-xs font-medium transition-colors whitespace-nowrap"
                    >
                      Aplicar
                    </button>
                  </div>
                )}
                {couponError && (
                  <p className="text-xs text-red-400 px-1">Código inválido</p>
                )}
              </div>
            )}

            {/* Totales */}
            <div className="space-y-1">
              {couponApplied && discountCodePercent && (
                <>
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>Subtotal</span>
                    <span>{fmtCOP(subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-green-600 font-semibold">
                    <span>Descuento -{discountCodePercent}%</span>
                    <span>-{fmtCOP(couponDiscount)}</span>
                  </div>
                </>
              )}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  {couponApplied ? "Total final" : "Total estimado"}
                </span>
                <span className="text-xl font-bold text-gray-900">{fmtCOP(finalTotal)}</span>
              </div>
            </div>

            {whatsappNumber ? (
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center justify-center gap-2 w-full py-3.5 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-2xl transition-colors text-sm"
              >
                <MessageCircle className="w-4 h-4" />
                Pedir por WhatsApp
              </button>
            ) : (
              <p className="text-xs text-center text-gray-400 py-1">
                Sin número de WhatsApp configurado
              </p>
            )}
            <button
              onClick={clearCart}
              className="w-full text-xs text-gray-400 hover:text-gray-600 transition-colors py-1"
            >
              Vaciar carrito
            </button>
          </div>
        )}
      </aside>

      {/* ── Modal de pedido ── */}
      {showModal && (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-6">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />

          <div className="relative bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[92vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 flex-shrink-0">
              <h3 className="text-lg font-bold text-gray-900">Confirmar pedido</h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Cuerpo scrollable */}
            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
              {/* Resumen del pedido */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Resumen del pedido
                </p>
                <ul className="space-y-2">
                  {items.map((item) => (
                    <li key={item.id} className="flex items-center justify-between gap-3 text-sm">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {item.image && (
                          <img
                            src={item.image}
                            alt={item.title}
                            className="w-9 h-9 rounded-lg object-cover flex-shrink-0 bg-gray-100"
                          />
                        )}
                        <span className="text-gray-700 truncate">
                          {item.title}{" "}
                          <span className="text-gray-400">×{item.quantity}</span>
                        </span>
                      </div>
                      <span className="font-semibold text-gray-900 flex-shrink-0">
                        {item.price ? fmtCOP(item.price * item.quantity) : "—"}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* Descuento aplicado */}
                {couponApplied && discountCodePercent && (
                  <div className="mt-3 space-y-1.5">
                    <div className="flex justify-between items-center text-sm text-gray-400">
                      <span>Subtotal</span>
                      <span>{fmtCOP(subtotal)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-green-600 font-semibold flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5" />
                        {couponInput.toUpperCase()} -{discountCodePercent}%
                      </span>
                      <span className="text-green-600 font-semibold">-{fmtCOP(couponDiscount)}</span>
                    </div>
                  </div>
                )}

                <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-baseline">
                  <span className="text-sm font-semibold text-gray-700">Total</span>
                  <span className="text-2xl font-bold text-gray-900">{fmtCOP(finalTotal)}</span>
                </div>
              </div>

              {/* Formulario de contacto */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Tus datos de contacto
                </p>
                <form id="order-form" onSubmit={handleSendOrder} className="space-y-3">
                  <input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nombre *"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
                  />
                  <input
                    required
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Celular *"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Correo (opcional)"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
                  />
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Notas adicionales: dirección, horario de entrega… (opcional)"
                    rows={2}
                    maxLength={300}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 resize-none"
                  />
                </form>
              </div>
            </div>

            {/* Botones fijos al fondo */}
            <div className="flex gap-3 px-6 py-5 border-t border-gray-100 flex-shrink-0">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex-1 py-3.5 border border-gray-200 rounded-2xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                form="order-form"
                disabled={submitting}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 bg-green-500 hover:bg-green-600 disabled:opacity-60 text-white font-semibold rounded-2xl transition-colors text-sm"
              >
                <MessageCircle className="w-4 h-4" />
                {submitting ? "Registrando…" : "Enviar por WhatsApp"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
