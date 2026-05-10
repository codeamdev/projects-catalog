"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";
import { ProductCard } from "./ProductCard";
import type { ProductWithRelations, Category } from "@/lib/products";

interface Props {
  products: ProductWithRelations[];
  categories: Category[];
  activeCategory?: string;
  whatsapp?: string | null;
}

const PALETTE = [
  "#6366F1", "#EC4899", "#F59E0B", "#10B981",
  "#3B82F6", "#EF4444", "#8B5CF6", "#14B8A6",
  "#F97316", "#84CC16",
];

function catColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return PALETTE[Math.abs(h) % PALETTE.length];
}

export function ProductGrid({ products, categories, activeCategory, whatsapp }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");

  function filterBy(slug?: string) {
    const p = new URLSearchParams(searchParams.toString());
    if (slug) p.set("categoria", slug);
    else p.delete("categoria");
    const q = p.toString();
    router.push(q ? `${pathname}?${q}` : pathname, { scroll: false });
  }

  const q = search.trim().toLowerCase();
  const filtered = q
    ? products.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q))
      )
    : products;

  const [heroProduct, ...rest] = filtered;
  const heroIsWide = !!heroProduct?.featured;

  return (
    <div id="feed" className="px-2 sm:px-3">
      {/* ── Stories de categorías ── */}
      {categories.length > 0 && (
        <div className="relative mb-3">
          {/* Gradiente derecho — indica más contenido al deslizar */}
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-white to-transparent z-10" />
        <div className="no-scrollbar flex gap-3 sm:gap-4 overflow-x-auto px-1 py-4">
          {/* Todos */}
          <button
            onClick={() => filterBy()}
            className="flex flex-col items-center gap-1.5 flex-shrink-0 group"
          >
            <div
              className={`w-14 h-14 rounded-full flex items-center justify-center text-base font-bold transition-all ${
                !activeCategory
                  ? "bg-gray-900 ring-2 ring-gray-900 ring-offset-2"
                  : "bg-gray-100 group-hover:bg-gray-200"
              }`}
            >
              <span className={!activeCategory ? "text-white" : "text-gray-500"}>✦</span>
            </div>
            <span
              className={`text-[10px] font-medium ${
                !activeCategory ? "text-gray-900 font-semibold" : "text-gray-400"
              }`}
            >
              Todos
            </span>
          </button>

          {/* Categorías */}
          {categories.map((cat) => {
            const isActive = activeCategory === cat.slug;
            const color = catColor(cat.name);
            return (
              <button
                key={cat.id}
                onClick={() => filterBy(cat.slug)}
                className="flex flex-col items-center gap-1.5 flex-shrink-0 group"
              >
                <div
                  className={`w-14 h-14 rounded-full flex items-center justify-center text-sm font-bold text-white transition-all ${
                    isActive
                      ? "ring-2 ring-offset-2 ring-gray-900 scale-105"
                      : "opacity-70 group-hover:opacity-100 group-hover:scale-105"
                  }`}
                  style={{ backgroundColor: color }}
                >
                  {cat.name.slice(0, 2).toUpperCase()}
                </div>
                <span
                  className={`text-[10px] max-w-[56px] text-center truncate ${
                    isActive ? "text-gray-900 font-semibold" : "text-gray-400 font-medium"
                  }`}
                >
                  {cat.name}
                </span>
              </button>
            );
          })}
        </div>
        </div>
      )}

      {/* ── Buscador ── */}
      <div className="relative mb-4">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre o tag…"
          className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 placeholder:text-gray-400"
        />
      </div>

      {/* ── Feed ── */}
      {filtered.length === 0 ? (
        <div className="text-center py-24">
          <p className="text-5xl mb-4">🔍</p>
          <p className="text-gray-400 font-medium mb-2">
            {q ? `Sin resultados para "${search}"` : "Sin productos en esta categoría"}
          </p>
          {!q && (
            <button
              onClick={() => filterBy()}
              className="text-sm text-gray-700 underline underline-offset-4"
            >
              Ver todos
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          {heroProduct && (
            <div className={heroIsWide ? "col-span-2 sm:col-span-4" : ""}>
              <ProductCard
                product={heroProduct}
                whatsapp={whatsapp}
                variant={heroIsWide ? "hero" : "regular"}
              />
            </div>
          )}
          {rest.map((product) => (
            <ProductCard key={product.id} product={product} whatsapp={whatsapp} />
          ))}
        </div>
      )}
    </div>
  );
}
