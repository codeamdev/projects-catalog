"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Check, ShoppingCart } from "lucide-react";
import Image from "next/image";
import { useCart } from "@/store/cart";
import type { ProductWithRelations } from "@/lib/products";

interface Props {
  product: ProductWithRelations;
  whatsapp?: string | null;
  variant?: "hero" | "regular";
}

export function ProductCard({ product, whatsapp, variant = "regular" }: Props) {
  const { addItem, items } = useCart();
  const router = useRouter();
  const [added, setAdded] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const isInCart = items.some((i) => i.id === product.id);

  const mainImage = product.images[0];
  const price = product.price ? Number(product.price) : null;
  const discount = product.discountPercent ?? 0;
  const finalPrice = discount > 0 && price ? price * (1 - discount / 100) : price;

  const fmt = (n: number) =>
    `$${new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 }).format(n)}`;

  const formattedPrice = finalPrice ? fmt(finalPrice) : null;
  const formattedOriginal = discount > 0 && price ? fmt(price) : null;

  const outOfStock = product.trackStock && product.stock !== null && product.stock <= 0;
  const lowStock = product.trackStock && product.stock !== null && product.stock > 0 && product.stock <= 5;

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (outOfStock) return;
    addItem({
      id: product.id,
      title: product.title,
      price: finalPrice,
      originalPrice: discount > 0 ? price : null,
      discountPercent: discount > 0 ? discount : null,
      currency: product.currency,
      image: mainImage?.url ?? null,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  // ── Hero (producto destacado — full width, overlay) ───────────
  if (variant === "hero") {
    return (
      <div
        role="article"
        onClick={() => router.push(`/product/${product.slug}`)}
        className="relative rounded-2xl overflow-hidden bg-gray-900 group cursor-pointer aspect-[4/3]"
      >
        {mainImage && (
          <>
            {!imgLoaded && (
              <div className="absolute inset-0 bg-gray-200 animate-pulse" />
            )}
            <Image
              src={mainImage.url}
              alt={mainImage.alt || product.title}
              fill
              sizes="(max-width: 640px) 100vw, 50vw"
              className={`object-cover transition-all duration-500 group-hover:scale-105 ${imgLoaded ? "opacity-100" : "opacity-0"}`}
              priority
              onLoad={() => setImgLoaded(true)}
            />
          </>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

        {/* Badges */}
        <div className="absolute top-4 left-4 flex flex-col gap-1.5">
          <span className="bg-amber-400/95 text-amber-900 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
            ✦ Destacado
          </span>
          {product.category && (
            <span className="bg-white/15 backdrop-blur-md text-white/90 text-[9px] font-medium px-2 py-0.5 rounded-full">
              {product.category.name}
            </span>
          )}
        </div>

        {discount > 0 && (
          <span className="absolute top-4 right-4 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            -{discount}%
          </span>
        )}

        {/* Contenido inferior */}
        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6">
          <p className="text-white font-bold text-lg sm:text-2xl line-clamp-1 mb-2 drop-shadow">
            {product.title}
          </p>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-baseline gap-2">
              {formattedPrice && (
                <span className="text-white font-bold text-xl sm:text-3xl">{formattedPrice}</span>
              )}
              {formattedOriginal && (
                <span className="text-white/50 text-sm line-through">{formattedOriginal}</span>
              )}
            </div>
            <button
              onClick={handleAddToCart}
              disabled={outOfStock}
              className={`flex items-center gap-2 font-bold rounded-full px-5 py-2.5 text-sm transition-all active:scale-95 disabled:opacity-50 ${
                added ? "bg-green-400 text-white" : "bg-white text-gray-900 hover:bg-gray-100"
              }`}
            >
              {added ? <Check className="w-4 h-4" /> : <ShoppingCart className="w-4 h-4" />}
              {outOfStock ? "Agotado" : added ? "Listo" : "Agregar"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Regular (imagen cuadrada con contain + texto debajo) ──────
  return (
    <div
      role="article"
      onClick={() => router.push(`/product/${product.slug}`)}
      className="rounded-2xl overflow-hidden bg-white border border-gray-100 group cursor-pointer hover:shadow-md transition-shadow duration-300 flex flex-col"
    >
      {/* Imagen */}
      <div className="aspect-square relative overflow-hidden bg-gray-50">
        {mainImage ? (
          <>
            {!imgLoaded && (
              <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse" />
            )}
            <Image
              src={mainImage.url}
              alt={mainImage.alt || product.title}
              fill
              sizes="(max-width: 640px) 50vw, 25vw"
              className={`object-contain p-3 sm:p-4 transition-all duration-500 group-hover:scale-105 ${imgLoaded ? "opacity-100" : "opacity-0"} ${outOfStock ? "grayscale opacity-60" : ""}`}
              loading="lazy"
              onLoad={() => setImgLoaded(true)}
            />
          </>
        ) : (
          <div className={`absolute inset-0 flex items-center justify-center text-5xl text-gray-300 ${outOfStock ? "grayscale opacity-60" : ""}`}>
            📦
          </div>
        )}

        {/* Overlay + badge agotado */}
        {outOfStock && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-white/90 backdrop-blur-[2px] rounded-2xl px-4 py-2 shadow-sm border border-gray-200/80 flex flex-col items-center gap-0.5">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Agotado</span>
            </div>
          </div>
        )}

        {/* Badges superiores */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1">
          {product.featured && !outOfStock && (
            <span className="bg-amber-400 text-amber-900 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
              ✦ Destacado
            </span>
          )}
          {product.category && (
            <span className="bg-gray-900/70 backdrop-blur-sm text-white text-[9px] font-medium px-2 py-0.5 rounded-full">
              {product.category.name}
            </span>
          )}
          {isInCart && !outOfStock && (
            <span className="bg-green-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5">
              <Check className="w-2.5 h-2.5" /> En carrito
            </span>
          )}
          {lowStock && (
            <span className="bg-orange-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
              Últimas {product.stock}
            </span>
          )}
        </div>

        {/* Badge descuento */}
        {discount > 0 && (
          <span className="absolute top-2.5 right-2.5 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            -{discount}%
          </span>
        )}
      </div>

      {/* Texto */}
      <div className="p-3 flex flex-col gap-2 flex-1">
        <p className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug flex-1">
          {product.title}
        </p>
        <div className="flex items-end justify-between gap-1.5 mt-auto">
          <div className="flex flex-col leading-tight min-w-0">
            {formattedPrice ? (
              <span className="text-sm font-bold text-gray-900 truncate">{formattedPrice}</span>
            ) : (
              <span className="text-xs text-gray-400">Consultar</span>
            )}
            {formattedOriginal && (
              <span className="text-xs text-gray-400 line-through truncate">{formattedOriginal}</span>
            )}
          </div>
          <button
            onClick={handleAddToCart}
            disabled={outOfStock}
            className={`flex-shrink-0 flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-full transition-all active:scale-95 ${
              outOfStock
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : added
                ? "bg-green-500 text-white"
                : "bg-[var(--primary)] text-white hover:opacity-90"
            }`}
          >
            {added ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
            {/* Texto solo en tarjetas anchas (sm: 4 columnas) */}
            <span className="hidden sm:inline">
              {outOfStock ? "Agotado" : added ? "Listo" : "Agregar"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
