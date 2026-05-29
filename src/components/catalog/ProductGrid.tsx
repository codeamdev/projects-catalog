"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";
import { ProductCard } from "./ProductCard";
import type { ProductWithRelations, Category } from "@/lib/products";

export type CatStyle =
  | "stories" | "pills" | "chips" | "tabs"
  | "bubbles" | "minimal" | "bold" | "grid"
  | "outline" | "compact";

interface Props {
  products: ProductWithRelations[];
  categories: Category[];
  activeCategory?: string;
  whatsapp?: string | null;
  categoriesStyle?: CatStyle;
}

interface FilterProps {
  categories: Category[];
  activeCategory?: string;
  filterBy: (slug?: string) => void;
}

// Asigna un color de una paleta dada por posición/hash del nombre
function pick(palette: string[], name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return palette[Math.abs(h) % palette.length];
}

// ── 1. stories — Moderno (arco iris vibrante, círculos) ─────────
const P_MODERN = ["#6366F1","#EC4899","#F59E0B","#10B981","#3B82F6","#EF4444","#8B5CF6","#14B8A6","#F97316","#84CC16"];

function StoriesFilter({ categories, activeCategory, filterBy }: FilterProps) {
  return (
    <div className="relative mb-3">
      <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-white to-transparent z-10" />
      <div className="no-scrollbar flex gap-3 sm:gap-4 overflow-x-auto px-1 py-4">
        <button onClick={() => filterBy()} className="flex flex-col items-center gap-1.5 flex-shrink-0 group">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center text-base font-bold transition-all ${!activeCategory ? "ring-2 ring-offset-2 scale-105" : "bg-gray-100 group-hover:bg-gray-200"}`}
            style={!activeCategory ? { backgroundColor: "var(--primary)" } : undefined}>
            <span className={!activeCategory ? "text-white" : "text-gray-500"}>✦</span>
          </div>
          <span className={`text-[10px] font-medium ${!activeCategory ? "text-gray-900 font-semibold" : "text-gray-400"}`}>Todos</span>
        </button>
        {categories.map((cat) => {
          const isActive = activeCategory === cat.slug;
          const color = pick(P_MODERN, cat.name);
          return (
            <button key={cat.id} onClick={() => filterBy(cat.slug)} className="flex flex-col items-center gap-1.5 flex-shrink-0 group">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center text-sm font-bold text-white transition-all ${isActive ? "ring-2 ring-offset-2 scale-105" : "opacity-60 group-hover:opacity-100 group-hover:scale-105"}`}
                style={{ backgroundColor: color }}>
                {cat.name.slice(0, 2).toUpperCase()}
              </div>
              <span className={`text-[10px] max-w-[56px] text-center truncate ${isActive ? "text-gray-900 font-semibold" : "text-gray-400 font-medium"}`}>{cat.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── 2. pills — Pastel (suave, femenino, lifestyle) ──────────────
const P_PASTEL = ["#FFAFC7","#C7AFEE","#A8DDBA","#FFD1A8","#A8D8F0","#F7BFD8","#C5F0A4","#FDE9A2","#D4C5F9","#B2EBF2"];
const P_PASTEL_DARK = ["#C2547A","#7B5EA7","#2E8B57","#C97B3A","#3A7CA5","#B5526E","#4CAF50","#B8860B","#7B5EA7","#00838F"];

function PillsFilter({ categories, activeCategory, filterBy }: FilterProps) {
  return (
    <div className="no-scrollbar flex gap-2 overflow-x-auto py-3 mb-3">
      <button onClick={() => filterBy()}
        className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${!activeCategory ? "" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
        style={!activeCategory ? { backgroundColor: "var(--primary)", color: "#fff" } : undefined}>
        Todos
      </button>
      {categories.map((cat, i) => {
        const isActive = activeCategory === cat.slug;
        const bg = P_PASTEL[i % P_PASTEL.length];
        const fg = P_PASTEL_DARK[i % P_PASTEL_DARK.length];
        return (
          <button key={cat.id} onClick={() => filterBy(cat.slug)}
            className="flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold transition-all whitespace-nowrap"
            style={isActive
              ? { backgroundColor: bg, color: fg, boxShadow: `0 2px 8px ${bg}99` }
              : { backgroundColor: `${bg}55`, color: fg, opacity: 0.75 }}>
            {cat.name}
          </button>
        );
      })}
    </div>
  );
}

// ── 3. chips — Vintage (tierra, ámbar, sepia cálido) ────────────
const P_VINTAGE = ["#C8956C","#D4A853","#8B6550","#B87333","#9E7458","#C19A6B","#A67B5B","#D2B48C"];

function ChipsFilter({ categories, activeCategory, filterBy }: FilterProps) {
  return (
    <div className="no-scrollbar flex gap-2 overflow-x-auto py-3 mb-3">
      <button onClick={() => filterBy()}
        className={`flex-shrink-0 px-4 py-1.5 rounded-md text-sm font-semibold border transition-all ${!activeCategory ? "text-white border-transparent" : "bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100"}`}
        style={!activeCategory ? { backgroundColor: "#8B6550", borderColor: "#8B6550" } : undefined}>
        ✦ Todos
      </button>
      {categories.map((cat) => {
        const isActive = activeCategory === cat.slug;
        const color = pick(P_VINTAGE, cat.name);
        return (
          <button key={cat.id} onClick={() => filterBy(cat.slug)}
            className="flex-shrink-0 px-4 py-1.5 rounded-md text-sm font-semibold border transition-all whitespace-nowrap"
            style={isActive
              ? { backgroundColor: color, borderColor: color, color: "#fff" }
              : { backgroundColor: "#FDF6EE", borderColor: color, color }}>
            {cat.name}
          </button>
        );
      })}
    </div>
  );
}

// ── 4. tabs — Mínimal (blanco y negro, tipográfico puro) ─────────
function TabsFilter({ categories, activeCategory, filterBy }: FilterProps) {
  return (
    <div className="no-scrollbar flex overflow-x-auto border-b-2 border-gray-100 mb-4">
      <button onClick={() => filterBy()}
        className={`flex-shrink-0 px-4 py-2.5 text-sm border-b-2 -mb-0.5 transition-colors whitespace-nowrap ${!activeCategory ? "border-gray-900 text-gray-900 font-bold" : "border-transparent text-gray-400 hover:text-gray-600 font-medium"}`}>
        Todos
      </button>
      {categories.map((cat) => {
        const isActive = activeCategory === cat.slug;
        return (
          <button key={cat.id} onClick={() => filterBy(cat.slug)}
            className={`flex-shrink-0 px-4 py-2.5 text-sm border-b-2 -mb-0.5 transition-colors whitespace-nowrap ${isActive ? "border-gray-900 text-gray-900 font-bold" : "border-transparent text-gray-400 hover:text-gray-600 font-medium"}`}>
            {cat.name}
          </button>
        );
      })}
    </div>
  );
}

// ── 5. bubbles — Nocturno (fondo oscuro, colores eléctricos) ─────
const P_NIGHT = ["#60A5FA","#34D399","#A78BFA","#FB923C","#F472B6","#2DD4BF","#818CF8","#4ADE80","#FACC15","#F87171"];

function BubblesFilter({ categories, activeCategory, filterBy }: FilterProps) {
  return (
    <div className="mb-4 rounded-2xl bg-gray-950 p-3">
      <div className="no-scrollbar flex gap-2 overflow-x-auto">
        <button onClick={() => filterBy()}
          className="flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-bold transition-all"
          style={!activeCategory
            ? { backgroundColor: "var(--primary)", color: "#fff" }
            : { color: "#6B7280" }}>
          Todos
        </button>
        {categories.map((cat) => {
          const isActive = activeCategory === cat.slug;
          const color = pick(P_NIGHT, cat.name);
          return (
            <button key={cat.id} onClick={() => filterBy(cat.slug)}
              className="flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-bold transition-all whitespace-nowrap"
              style={isActive
                ? { backgroundColor: `${color}22`, color, border: `1.5px solid ${color}` }
                : { color: "#4B5563" }}>
              {cat.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── 6. minimal — Dorado / Elegante (oro, lujo, delicado) ─────────
const P_GOLD = ["#B8962E","#C9A84C","#D4AF37","#E5C460","#CEB050","#B8860B","#DAA520","#C5902A"];

function MinimalFilter({ categories, activeCategory, filterBy }: FilterProps) {
  return (
    <div className="no-scrollbar flex gap-3 overflow-x-auto py-3 mb-4" style={{ borderBottom: "1px solid #E8D89A" }}>
      <button onClick={() => filterBy()}
        className="flex-shrink-0 text-sm pb-2.5 transition-all font-semibold tracking-wide"
        style={!activeCategory
          ? { color: "#B8860B", borderBottom: "2px solid #D4AF37" }
          : { color: "#BBA96B" }}>
        Todos
      </button>
      {categories.map((cat) => {
        const isActive = activeCategory === cat.slug;
        const color = pick(P_GOLD, cat.name);
        return (
          <button key={cat.id} onClick={() => filterBy(cat.slug)}
            className="flex-shrink-0 text-sm pb-2.5 whitespace-nowrap transition-all font-semibold tracking-wide"
            style={isActive
              ? { color, borderBottom: `2px solid ${color}` }
              : { color: "#C9B57A" }}>
            {cat.name}
          </button>
        );
      })}
    </div>
  );
}

// ── 7. bold — Natura (tonos tierra, orgánico, plantas) ──────────
const P_NATURA = ["#5F8C4A","#C17F2E","#7B5E3A","#4A7C59","#8B6914","#6B8E4E","#A0522D","#3D7A6B"];

function BoldFilter({ categories, activeCategory, filterBy }: FilterProps) {
  return (
    <div className="no-scrollbar flex gap-2.5 overflow-x-auto py-3 mb-3">
      <button onClick={() => filterBy()}
        className={`flex-shrink-0 px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${!activeCategory ? "text-white shadow-md" : "text-amber-900 hover:bg-amber-50"}`}
        style={!activeCategory ? { backgroundColor: "#5F8C4A" } : { backgroundColor: "#F5F0E8", border: "1.5px solid #D4B896" }}>
        🌿 Todos
      </button>
      {categories.map((cat) => {
        const isActive = activeCategory === cat.slug;
        const color = pick(P_NATURA, cat.name);
        return (
          <button key={cat.id} onClick={() => filterBy(cat.slug)}
            className="flex-shrink-0 px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap"
            style={isActive
              ? { backgroundColor: color, color: "#fff", boxShadow: `0 4px 12px ${color}55` }
              : { backgroundColor: "#F5F0E8", color, border: `1.5px solid ${color}99` }}>
            {cat.name}
          </button>
        );
      })}
    </div>
  );
}

// ── 8. grid — Neón (fondo oscuro, colores eléctricos, tech) ──────
const P_NEON = ["#39FF14","#00D4FF","#FF6B35","#FF073A","#CC00FF","#FFD700","#00FF9D","#FF1493"];

function GridFilter({ categories, activeCategory, filterBy }: FilterProps) {
  return (
    <div className="flex flex-wrap gap-2 py-3 mb-3">
      <button onClick={() => filterBy()}
        className="px-4 py-1.5 rounded text-xs font-black uppercase tracking-widest transition-all"
        style={!activeCategory
          ? { backgroundColor: "#39FF14", color: "#000", boxShadow: "0 0 10px #39FF14aa" }
          : { backgroundColor: "#111", color: "#39FF14", border: "1px solid #39FF1455" }}>
        TODOS
      </button>
      {categories.map((cat) => {
        const isActive = activeCategory === cat.slug;
        const color = pick(P_NEON, cat.name);
        return (
          <button key={cat.id} onClick={() => filterBy(cat.slug)}
            className="px-4 py-1.5 rounded text-xs font-black uppercase tracking-widest transition-all"
            style={isActive
              ? { backgroundColor: color, color: "#000", boxShadow: `0 0 10px ${color}aa` }
              : { backgroundColor: "#111", color, border: `1px solid ${color}44` }}>
            {cat.name}
          </button>
        );
      })}
    </div>
  );
}

// ── 9. outline — Océano (azules y turquesas, fresco) ─────────────
const P_OCEAN = ["#0077B6","#0096C7","#00B4D8","#48CAE4","#023E8A","#1565C0","#006D77","#0097A7"];

function OutlineFilter({ categories, activeCategory, filterBy }: FilterProps) {
  return (
    <div className="no-scrollbar flex gap-2 overflow-x-auto py-3 mb-3">
      <button onClick={() => filterBy()}
        className="flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold border-2 transition-all"
        style={!activeCategory
          ? { backgroundColor: "#0077B6", borderColor: "#0077B6", color: "#fff", boxShadow: "0 4px 12px #0077B655" }
          : { borderColor: "#90E0EF", color: "#0077B6", backgroundColor: "#E0F7FF" }}>
        🌊 Todos
      </button>
      {categories.map((cat) => {
        const isActive = activeCategory === cat.slug;
        const color = pick(P_OCEAN, cat.name);
        return (
          <button key={cat.id} onClick={() => filterBy(cat.slug)}
            className="flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold border-2 transition-all whitespace-nowrap"
            style={isActive
              ? { backgroundColor: color, borderColor: color, color: "#fff", boxShadow: `0 4px 12px ${color}55` }
              : { borderColor: `${color}66`, color, backgroundColor: `${color}11` }}>
            {cat.name}
          </button>
        );
      })}
    </div>
  );
}

// ── 10. compact — Candy (caramelos brillantes, divertido) ────────
const P_CANDY = ["#FF6B6B","#FFB347","#4FC3F7","#CE93D8","#66BB6A","#FF80AB","#FDD835","#26C6DA"];

function CompactFilter({ categories, activeCategory, filterBy }: FilterProps) {
  return (
    <div className="flex flex-wrap gap-1.5 py-2 mb-3">
      <button onClick={() => filterBy()}
        className="px-3 py-1 rounded-full text-xs font-bold transition-all"
        style={!activeCategory
          ? { backgroundColor: "var(--primary)", color: "#fff" }
          : { backgroundColor: "#F3F4F6", color: "#6B7280" }}>
        ✦ Todos
      </button>
      {categories.map((cat) => {
        const isActive = activeCategory === cat.slug;
        const color = pick(P_CANDY, cat.name);
        return (
          <button key={cat.id} onClick={() => filterBy(cat.slug)}
            className="px-3 py-1 rounded-full text-xs font-bold transition-all"
            style={isActive
              ? { backgroundColor: color, color: "#fff", boxShadow: `0 2px 6px ${color}88` }
              : { backgroundColor: `${color}25`, color }}>
            {cat.name}
          </button>
        );
      })}
    </div>
  );
}

const STYLE_MAP: Record<CatStyle, React.ComponentType<FilterProps>> = {
  stories: StoriesFilter,
  pills:   PillsFilter,
  chips:   ChipsFilter,
  tabs:    TabsFilter,
  bubbles: BubblesFilter,
  minimal: MinimalFilter,
  bold:    BoldFilter,
  grid:    GridFilter,
  outline: OutlineFilter,
  compact: CompactFilter,
};

// ── ProductGrid ────────────────────────────────────────────────

export function ProductGrid({ products, categories, activeCategory, whatsapp, categoriesStyle = "stories" }: Props) {
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
    ? products.filter((p) => p.title.toLowerCase().includes(q) || p.tags.some((t) => t.toLowerCase().includes(q)))
    : products;

  const [heroProduct, ...rest] = filtered;
  const heroIsWide = !!heroProduct?.featured;

  const FilterComponent = STYLE_MAP[categoriesStyle] ?? StoriesFilter;

  return (
    <div id="feed" className="px-2 sm:px-3">
      {categories.length > 0 && (
        <FilterComponent categories={categories} activeCategory={activeCategory} filterBy={filterBy} />
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
            <button onClick={() => filterBy()} className="text-sm text-gray-700 underline underline-offset-4">
              Ver todos
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          {heroProduct && (
            <div className={heroIsWide ? "col-span-2 sm:col-span-4" : ""}>
              <ProductCard product={heroProduct} whatsapp={whatsapp} variant={heroIsWide ? "hero" : "regular"} />
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
