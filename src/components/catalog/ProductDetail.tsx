"use client";

import { useState } from "react";
import Link from "next/link";
import { ShoppingCart, ArrowLeft, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { useCart } from "@/store/cart";
import type { ProductWithRelations } from "@/lib/products";

interface Props {
  product: ProductWithRelations;
}

export function ProductDetail({ product }: Props) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const { addItem, openCart } = useCart();

  const images = product.images ?? [];
  const price = product.price ? Number(product.price) : null;
  const discount = product.discountPercent ?? 0;
  const finalPrice = discount > 0 && price ? price * (1 - discount / 100) : price;

  const $ = (n: number) =>
    `$${new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 }).format(n)}`;

  const formattedPrice = finalPrice ? $(finalPrice) : null;
  const formattedOriginal = discount > 0 && price ? $(price) : null;
  const savings = discount > 0 && price && finalPrice ? $(price - finalPrice) : null;

  function handleAddToCart() {
    for (let i = 0; i < quantity; i++) {
      addItem({
        id: product.id,
        title: product.title,
        price: finalPrice,
        originalPrice: discount > 0 ? price : null,
        discountPercent: discount > 0 ? discount : null,
        currency: product.currency,
        image: images[0]?.url ?? null,
      });
    }
    openCart();
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  function prevImage() {
    setSelectedImage((i) => (i === 0 ? images.length - 1 : i - 1));
  }
  function nextImage() {
    setSelectedImage((i) => (i === images.length - 1 ? 0 : i + 1));
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-screen-xl mx-auto px-4 py-8">
        {/* Volver */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-gray-400 hover:text-gray-700 text-sm mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al catálogo
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
          {/* ── Galería ── */}
          <div className="space-y-3">
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-50">
              {images[selectedImage] ? (
                <img
                  src={images[selectedImage].url}
                  alt={images[selectedImage].alt || product.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-8xl text-gray-200">
                  📦
                </div>
              )}

              {/* Flechas si hay más de una imagen */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center bg-white/90 rounded-full shadow-md hover:bg-white transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4 text-gray-700" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center bg-white/90 rounded-full shadow-md hover:bg-white transition-colors"
                  >
                    <ChevronRight className="w-4 h-4 text-gray-700" />
                  </button>
                  {/* Dots */}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {images.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedImage(i)}
                        className={`w-1.5 h-1.5 rounded-full transition-all ${
                          i === selectedImage ? "bg-white w-4" : "bg-white/50"
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Miniaturas */}
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
                {images.map((img, i) => (
                  <button
                    key={img.id}
                    onClick={() => setSelectedImage(i)}
                    className={`flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${
                      i === selectedImage
                        ? "border-gray-900"
                        : "border-transparent opacity-50 hover:opacity-80"
                    }`}
                  >
                    <img src={img.url} alt={img.alt || ""} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Info del producto ── */}
          <div className="flex flex-col">
            {product.category && (
              <span className="text-xs uppercase tracking-[0.2em] text-gray-400 font-semibold mb-2">
                {product.category.name}
              </span>
            )}

            <h1 className="text-3xl sm:text-5xl font-bold text-gray-900 leading-tight mb-5">
              {product.title}
            </h1>

            {/* Precio con descuento */}
            {formattedPrice && (
              <div className="mb-6">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-4xl sm:text-5xl font-bold text-gray-900">{formattedPrice}</span>
                  {discount > 0 && (
                    <span className="bg-red-500 text-white text-sm font-bold px-3 py-1 rounded-full">
                      -{discount}% OFF
                    </span>
                  )}
                </div>
                {formattedOriginal && (
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-gray-400 text-xl line-through">{formattedOriginal}</span>
                    {savings && (
                      <span className="text-green-600 text-sm font-semibold">Ahorras {savings}</span>
                    )}
                  </div>
                )}
              </div>
            )}

            {product.description && (
              <p className="text-gray-600 leading-relaxed whitespace-pre-line mb-7 text-base sm:text-lg">
                {product.description}
              </p>
            )}

            {product.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {product.tags.map((tag) => (
                  <span key={tag} className="bg-gray-100 text-gray-500 text-xs px-3 py-1 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Selector de cantidad */}
            <div className="flex items-center gap-4 mb-7">
              <span className="text-base font-medium text-gray-700">Cantidad</span>
              <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-12 h-12 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors text-2xl leading-none"
                >
                  −
                </button>
                <span className="w-12 text-center text-base font-bold">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => q + 1)}
                  className="w-12 h-12 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors text-2xl leading-none"
                >
                  +
                </button>
              </div>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 mt-auto">
              <button
                onClick={handleAddToCart}
                className={`flex-1 flex items-center justify-center gap-2.5 py-5 px-8 rounded-2xl font-bold text-base transition-all duration-200 ${
                  added
                    ? "bg-green-500 text-white"
                    : "bg-gray-900 hover:bg-gray-700 text-white"
                }`}
              >
                {added ? (
                  <><Check className="w-5 h-5" /> Agregado al carrito</>
                ) : (
                  <><ShoppingCart className="w-5 h-5" /> Agregar al carrito</>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
