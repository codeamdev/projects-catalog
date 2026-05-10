"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Check } from "lucide-react";
import Image from "next/image";
import { useCart } from "@/store/cart";
import type { ProductWithRelations } from "@/lib/products";

interface Props {
  product: ProductWithRelations;
  whatsapp?: string | null;
  /** "hero" = primera card destacada, span 2 columnas */
  variant?: "hero" | "regular";
}

export function ProductCard({ product, whatsapp, variant = "regular" }: Props) {
  const { addItem, items } = useCart();
  const router = useRouter();
  const [added, setAdded] = useState(false);
  const isInCart = items.some((i) => i.id === product.id);

  const mainImage = product.images[0];
  const price = product.price ? Number(product.price) : null;
  const discount = product.discountPercent ?? 0;
  const finalPrice = discount > 0 && price ? price * (1 - discount / 100) : price;

  const $ = (n: number) =>
    `$${new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 }).format(n)}`;

  const formattedPrice = finalPrice ? $(finalPrice) : null;
  const formattedOriginal = discount > 0 && price ? $(price) : null;

  function handleAddToCart(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
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

  const aspectClass = variant === "hero" ? "aspect-[4/3] sm:aspect-[16/9]" : "aspect-[3/4]";

  return (
    <div
      role="article"
      onClick={() => router.push(`/product/${product.slug}`)}
      className="relative rounded-2xl sm:rounded-3xl overflow-hidden bg-gray-100 group cursor-pointer"
    >
        <div className={`${aspectClass} relative overflow-hidden`}>
          {/* Imagen */}
          {mainImage ? (
            <Image
              src={mainImage.url}
              alt={mainImage.alt || product.title}
              fill
              sizes="(max-width: 640px) 50vw, 25vw"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              priority={variant === "hero"}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-200 text-6xl">
              📦
            </div>
          )}

          {/* Overlay degradé desde abajo */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
          {/* Sutil viñeta en esquinas */}
          <div className="absolute inset-0 bg-gradient-to-br from-black/15 via-transparent to-transparent" />

          {/* Badge superior izquierdo */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5">
            {product.featured && variant !== "hero" && (
              <span className="bg-amber-400/95 text-amber-900 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                ✦ Destacado
              </span>
            )}
            {product.category && (
              <span className="bg-white/15 backdrop-blur-md text-white/90 text-[9px] font-medium px-2 py-0.5 rounded-full">
                {product.category.name}
              </span>
            )}
            {isInCart && (
              <span className="bg-green-500/90 backdrop-blur-md text-white text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                <Check className="w-2.5 h-2.5" /> En carrito
              </span>
            )}
          </div>

          {/* Badge de descuento */}
          {discount > 0 && (
            <span className="absolute top-3 right-3 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full leading-tight">
              -{discount}%
            </span>
          )}

          {/* Contenido inferior */}
          <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
            <p
              className={`text-white font-semibold line-clamp-2 leading-snug mb-2 ${
                variant === "hero" ? "text-base sm:text-xl" : "text-sm sm:text-base"
              }`}
            >
              {product.title}
            </p>
            <div className="flex items-center justify-between gap-2">
              <div className="flex flex-col">
                {formattedPrice && (
                  <span
                    className={`text-white font-bold ${
                      variant === "hero" ? "text-lg sm:text-2xl" : "text-sm sm:text-lg"
                    }`}
                  >
                    {formattedPrice}
                  </span>
                )}
                {formattedOriginal && (
                  <span className="text-white/60 text-xs line-through leading-none">
                    {formattedOriginal}
                  </span>
                )}
              </div>
              <button
                onClick={handleAddToCart}
                className={`ml-auto flex items-center gap-1.5 font-bold rounded-full transition-all active:scale-95 ${
                  added
                    ? "bg-green-400 text-white"
                    : "bg-white text-gray-900 hover:bg-gray-100"
                } ${variant === "hero" ? "text-xs px-4 py-2" : "text-xs px-3.5 py-2"}`}
              >
                {added ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                {added ? "Listo" : "Agregar"}
              </button>
            </div>
          </div>
        </div>
    </div>
  );
}
