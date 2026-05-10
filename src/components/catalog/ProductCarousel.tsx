"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ProductCard } from "./ProductCard";
import type { ProductWithRelations } from "@/lib/products";

interface Props {
  products: ProductWithRelations[];
  title?: string;
  whatsapp?: string | null;
}

export function ProductCarousel({ products, title = "Productos Destacados", whatsapp }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  function scroll(dir: "left" | "right") {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.clientWidth * 0.75;
    scrollRef.current.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  }

  if (products.length === 0) return null;

  return (
    <section id="destacados" className="py-12 bg-gray-50">
      <div className="max-w-screen-xl mx-auto px-4">
        {/* Encabezado */}
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">{title}</h2>
            <div className="mt-1.5 w-10 h-0.5 bg-gray-900 rounded-full" />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => scroll("left")}
              aria-label="Anterior"
              className="w-9 h-9 flex items-center justify-center rounded-full border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 transition-colors shadow-sm"
            >
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>
            <button
              onClick={() => scroll("right")}
              aria-label="Siguiente"
              className="w-9 h-9 flex items-center justify-center rounded-full border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 transition-colors shadow-sm"
            >
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Scroll horizontal */}
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto pb-3"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {products.map((product) => (
            <div key={product.id} className="flex-shrink-0 w-[220px] sm:w-[260px]">
              <ProductCard product={product} whatsapp={whatsapp} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
