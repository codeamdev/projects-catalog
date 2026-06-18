"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useState, useMemo } from "react";
import { Search, SlidersHorizontal, X, ChevronDown, ChevronUp, ArrowUpDown } from "lucide-react";
import { ProductCard } from "./ProductCard";
import type { ProductWithRelations, Category, FilterGroupWithOptions } from "@/lib/products";

export type CatStyle =
  | "stories" | "pills" | "chips" | "tabs"
  | "bubbles" | "minimal" | "bold" | "grid"
  | "outline" | "compact";

interface Props {
  products: ProductWithRelations[];
  categories: Category[];
  filterGroups?: FilterGroupWithOptions[];
  productFilterMap?: Record<string, string[]>;
  activeCategory?: string;
  whatsapp?: string | null;
  categoriesStyle?: CatStyle;
}

interface FilterProps {
  categories: Category[];
  activeCategory?: string;
  filterBy: (slug?: string) => void;
}

function pick(palette: string[], name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return palette[Math.abs(h) % palette.length];
}

// ── Category filter styles ─────────────────────────────────────────────────

const P_MODERN = ["#6366F1","#EC4899","#F59E0B","#10B981","#3B82F6","#EF4444","#8B5CF6","#14B8A6","#F97316","#84CC16"];
function StoriesFilter({ categories, activeCategory, filterBy }: FilterProps) {
  return (
    <div className="relative mb-3">
      <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-white to-transparent z-10" />
      <div className="no-scrollbar flex gap-3 sm:gap-4 overflow-x-auto px-1 py-4">
        <button onClick={() => filterBy()} className="flex flex-col items-center gap-1 flex-shrink-0 group">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center text-base font-bold transition-all ${!activeCategory ? "ring-[3px] ring-offset-2 ring-gray-900 scale-110 shadow-md" : "bg-gray-100 group-hover:bg-gray-200"}`}
            style={!activeCategory ? { backgroundColor: "var(--primary)" } : undefined}>
            <span className={!activeCategory ? "text-white" : "text-gray-500"}>✦</span>
          </div>
          <span className={`text-[10px] font-medium ${!activeCategory ? "text-gray-900 font-bold" : "text-gray-400"}`}>Todos</span>
          <div className={`h-1 w-1 rounded-full transition-all ${!activeCategory ? "bg-gray-900" : "bg-transparent"}`} />
        </button>
        {categories.map((cat) => {
          const isActive = activeCategory === cat.slug;
          const color = pick(P_MODERN, cat.name);
          return (
            <button key={cat.id} onClick={() => filterBy(cat.slug)} className="flex flex-col items-center gap-1 flex-shrink-0 group">
              <div
                className={`w-14 h-14 rounded-full overflow-hidden flex items-center justify-center text-sm font-bold text-white transition-all ${isActive ? "ring-[3px] ring-offset-2 ring-gray-900 scale-110 shadow-md" : "group-hover:scale-105"}`}
                style={cat.imageUrl ? undefined : { backgroundColor: color }}
              >
                {cat.imageUrl ? (
                  <img src={cat.imageUrl} alt={cat.name} className="w-full h-full object-cover" />
                ) : (
                  cat.name.slice(0, 2).toUpperCase()
                )}
              </div>
              <span className={`text-[10px] max-w-[56px] text-center truncate ${isActive ? "text-gray-900 font-bold" : "text-gray-400 font-medium"}`}>{cat.name}</span>
              <div className={`h-1 w-1 rounded-full transition-all ${isActive ? "bg-gray-900" : "bg-transparent"}`} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

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
            style={isActive ? { backgroundColor: bg, color: fg, boxShadow: `0 2px 8px ${bg}99` } : { backgroundColor: `${bg}55`, color: fg, opacity: 0.75 }}>
            {cat.name}
          </button>
        );
      })}
    </div>
  );
}

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
            style={isActive ? { backgroundColor: color, borderColor: color, color: "#fff" } : { backgroundColor: "#FDF6EE", borderColor: color, color }}>
            {cat.name}
          </button>
        );
      })}
    </div>
  );
}

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

const P_NIGHT = ["#60A5FA","#34D399","#A78BFA","#FB923C","#F472B6","#2DD4BF","#818CF8","#4ADE80","#FACC15","#F87171"];
function BubblesFilter({ categories, activeCategory, filterBy }: FilterProps) {
  return (
    <div className="mb-4 rounded-2xl bg-gray-950 p-3">
      <div className="no-scrollbar flex gap-2 overflow-x-auto">
        <button onClick={() => filterBy()}
          className="flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-bold transition-all"
          style={!activeCategory ? { backgroundColor: "var(--primary)", color: "#fff" } : { color: "#6B7280" }}>
          Todos
        </button>
        {categories.map((cat) => {
          const isActive = activeCategory === cat.slug;
          const color = pick(P_NIGHT, cat.name);
          return (
            <button key={cat.id} onClick={() => filterBy(cat.slug)}
              className="flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-bold transition-all whitespace-nowrap"
              style={isActive ? { backgroundColor: `${color}22`, color, border: `1.5px solid ${color}` } : { color: "#4B5563" }}>
              {cat.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const P_GOLD = ["#B8962E","#C9A84C","#D4AF37","#E5C460","#CEB050","#B8860B","#DAA520","#C5902A"];
function MinimalFilter({ categories, activeCategory, filterBy }: FilterProps) {
  return (
    <div className="no-scrollbar flex gap-3 overflow-x-auto py-3 mb-4" style={{ borderBottom: "1px solid #E8D89A" }}>
      <button onClick={() => filterBy()}
        className="flex-shrink-0 text-sm pb-2.5 transition-all font-semibold tracking-wide"
        style={!activeCategory ? { color: "#B8860B", borderBottom: "2px solid #D4AF37" } : { color: "#BBA96B" }}>
        Todos
      </button>
      {categories.map((cat) => {
        const isActive = activeCategory === cat.slug;
        const color = pick(P_GOLD, cat.name);
        return (
          <button key={cat.id} onClick={() => filterBy(cat.slug)}
            className="flex-shrink-0 text-sm pb-2.5 whitespace-nowrap transition-all font-semibold tracking-wide"
            style={isActive ? { color, borderBottom: `2px solid ${color}` } : { color: "#C9B57A" }}>
            {cat.name}
          </button>
        );
      })}
    </div>
  );
}

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
            style={isActive ? { backgroundColor: color, color: "#fff", boxShadow: `0 4px 12px ${color}55` } : { backgroundColor: "#F5F0E8", color, border: `1.5px solid ${color}99` }}>
            {cat.name}
          </button>
        );
      })}
    </div>
  );
}

const P_NEON = ["#39FF14","#00D4FF","#FF6B35","#FF073A","#CC00FF","#FFD700","#00FF9D","#FF1493"];
function GridFilter({ categories, activeCategory, filterBy }: FilterProps) {
  return (
    <div className="flex flex-wrap gap-2 py-3 mb-3">
      <button onClick={() => filterBy()}
        className="px-4 py-1.5 rounded text-xs font-black uppercase tracking-widest transition-all"
        style={!activeCategory ? { backgroundColor: "#39FF14", color: "#000", boxShadow: "0 0 10px #39FF14aa" } : { backgroundColor: "#111", color: "#39FF14", border: "1px solid #39FF1455" }}>
        TODOS
      </button>
      {categories.map((cat) => {
        const isActive = activeCategory === cat.slug;
        const color = pick(P_NEON, cat.name);
        return (
          <button key={cat.id} onClick={() => filterBy(cat.slug)}
            className="px-4 py-1.5 rounded text-xs font-black uppercase tracking-widest transition-all"
            style={isActive ? { backgroundColor: color, color: "#000", boxShadow: `0 0 10px ${color}aa` } : { backgroundColor: "#111", color, border: `1px solid ${color}44` }}>
            {cat.name}
          </button>
        );
      })}
    </div>
  );
}

const P_OCEAN = ["#0077B6","#0096C7","#00B4D8","#48CAE4","#023E8A","#1565C0","#006D77","#0097A7"];
function OutlineFilter({ categories, activeCategory, filterBy }: FilterProps) {
  return (
    <div className="no-scrollbar flex gap-2 overflow-x-auto py-3 mb-3">
      <button onClick={() => filterBy()}
        className="flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold border-2 transition-all"
        style={!activeCategory ? { backgroundColor: "#0077B6", borderColor: "#0077B6", color: "#fff", boxShadow: "0 4px 12px #0077B655" } : { borderColor: "#90E0EF", color: "#0077B6", backgroundColor: "#E0F7FF" }}>
        🌊 Todos
      </button>
      {categories.map((cat) => {
        const isActive = activeCategory === cat.slug;
        const color = pick(P_OCEAN, cat.name);
        return (
          <button key={cat.id} onClick={() => filterBy(cat.slug)}
            className="flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold border-2 transition-all whitespace-nowrap"
            style={isActive ? { backgroundColor: color, borderColor: color, color: "#fff", boxShadow: `0 4px 12px ${color}55` } : { borderColor: `${color}66`, color, backgroundColor: `${color}11` }}>
            {cat.name}
          </button>
        );
      })}
    </div>
  );
}

const P_CANDY = ["#FF6B6B","#FFB347","#4FC3F7","#CE93D8","#66BB6A","#FF80AB","#FDD835","#26C6DA"];
function CompactFilter({ categories, activeCategory, filterBy }: FilterProps) {
  return (
    <div className="flex flex-wrap gap-1.5 py-2 mb-3">
      <button onClick={() => filterBy()}
        className="px-3 py-1 rounded-full text-xs font-bold transition-all"
        style={!activeCategory ? { backgroundColor: "var(--primary)", color: "#fff" } : { backgroundColor: "#F3F4F6", color: "#6B7280" }}>
        ✦ Todos
      </button>
      {categories.map((cat) => {
        const isActive = activeCategory === cat.slug;
        const color = pick(P_CANDY, cat.name);
        return (
          <button key={cat.id} onClick={() => filterBy(cat.slug)}
            className="px-3 py-1 rounded-full text-xs font-bold transition-all"
            style={isActive ? { backgroundColor: color, color: "#fff", boxShadow: `0 2px 6px ${color}88` } : { backgroundColor: `${color}25`, color }}>
            {cat.name}
          </button>
        );
      })}
    </div>
  );
}

const STYLE_MAP: Record<CatStyle, React.ComponentType<FilterProps>> = {
  stories: StoriesFilter, pills: PillsFilter, chips: ChipsFilter, tabs: TabsFilter,
  bubbles: BubblesFilter, minimal: MinimalFilter, bold: BoldFilter, grid: GridFilter,
  outline: OutlineFilter, compact: CompactFilter,
};

// ── Accordion para grupos de filtro ───────────────────────────────────────────

function FilterAccordion({ group, activeOptionSlugs, onToggle }: {
  group: FilterGroupWithOptions;
  activeOptionSlugs: Set<string>;
  onToggle: (groupSlug: string, optionSlug: string) => void;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between py-3 text-left"
      >
        <span className="text-xs font-bold uppercase tracking-wider text-gray-600">{group.name}</span>
        {open ? <ChevronUp className="w-3.5 h-3.5 text-gray-400" /> : <ChevronDown className="w-3.5 h-3.5 text-gray-400" />}
      </button>
      {open && (
        <div className="pb-3 space-y-2">
          {group.options.map((opt) => {
            const checked = activeOptionSlugs.has(opt.slug);
            return (
              <label
                key={opt.id}
                onClick={() => onToggle(group.slug, opt.slug)}
                className="flex items-center gap-2.5 cursor-pointer group"
              >
                <span className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${checked ? "bg-indigo-600 border-indigo-600" : "border-gray-300 group-hover:border-indigo-400"}`}>
                  {checked && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                </span>
                <span className={`text-sm transition-colors ${checked ? "text-gray-900 font-medium" : "text-gray-500 group-hover:text-gray-700"}`}>{opt.name}</span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}

const ORDEN_OPTIONS = [
  { value: "destacados", label: "Destacados" },
  { value: "precio-asc", label: "Menor precio" },
  { value: "precio-desc", label: "Mayor precio" },
  { value: "descuento", label: "Mayor descuento" },
  { value: "recientes", label: "Más recientes" },
] as const;

// ── ProductGrid ────────────────────────────────────────────────────────────────

export function ProductGrid({
  products,
  categories,
  filterGroups = [],
  productFilterMap = {},
  activeCategory,
  whatsapp,
  categoriesStyle = "stories",
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);

  // ── URL helpers ──────────────────────────────────────────────────────────
  function filterBy(slug?: string) {
    const p = new URLSearchParams(searchParams.toString());
    if (slug) p.set("categoria", slug);
    else p.delete("categoria");
    router.push(p.toString() ? `${pathname}?${p.toString()}` : pathname, { scroll: false });
  }

  function toggleOption(groupSlug: string, optionSlug: string) {
    const p = new URLSearchParams(searchParams.toString());
    const current = (p.get(groupSlug) ?? "").split(",").filter(Boolean);
    const idx = current.indexOf(optionSlug);
    if (idx >= 0) current.splice(idx, 1); else current.push(optionSlug);
    if (current.length > 0) p.set(groupSlug, current.join(","));
    else p.delete(groupSlug);
    router.push(`${pathname}?${p.toString()}`, { scroll: false });
  }

  function clearFacets() {
    const p = new URLSearchParams(searchParams.toString());
    for (const g of filterGroups) p.delete(g.slug);
    router.push(p.toString() ? `${pathname}?${p.toString()}` : pathname, { scroll: false });
  }

  const orden = (searchParams.get("orden") ?? "destacados") as typeof ORDEN_OPTIONS[number]["value"];

  function setOrden(value: string) {
    const p = new URLSearchParams(searchParams.toString());
    if (value === "destacados") p.delete("orden");
    else p.set("orden", value);
    router.push(p.toString() ? `${pathname}?${p.toString()}` : pathname, { scroll: false });
  }

  // ── Active facet filters from URL ──────────────────────────────────────
  const activeFilters = useMemo(() => {
    const result: Record<string, Set<string>> = {};
    for (const g of filterGroups) {
      const val = searchParams.get(g.slug);
      if (val) result[g.slug] = new Set(val.split(",").filter(Boolean));
    }
    return result;
  }, [searchParams, filterGroups]);

  const totalActive = useMemo(
    () => Object.values(activeFilters).reduce((n, s) => n + s.size, 0),
    [activeFilters]
  );

  // ── Active chips list ──────────────────────────────────────────────────
  const activeChips = useMemo(() =>
    filterGroups.flatMap((g) =>
      Array.from(activeFilters[g.slug] ?? []).map((slug) => {
        const opt = g.options.find((o) => o.slug === slug);
        return opt ? { groupSlug: g.slug, groupName: g.name, optionSlug: slug, optionName: opt.name } : null;
      }).filter(Boolean)
    ) as { groupSlug: string; groupName: string; optionSlug: string; optionName: string }[],
  [activeFilters, filterGroups]);

  // ── Filtered + sorted products ────────────────────────────────────────
  const filtered = useMemo(() => {
    let result = products;

    const q = search.trim().toLowerCase();
    if (q) {
      result = result.filter(
        (p) => p.title.toLowerCase().includes(q) || p.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    for (const [groupSlug, selectedSlugs] of Object.entries(activeFilters)) {
      if (selectedSlugs.size === 0) continue;
      const group = filterGroups.find((g) => g.slug === groupSlug);
      if (!group) continue;
      const selectedIds = new Set(
        group.options.filter((o) => selectedSlugs.has(o.slug)).map((o) => o.id)
      );
      result = result.filter((p) =>
        (productFilterMap[p.id] ?? []).some((id) => selectedIds.has(id))
      );
    }

    // Ordenar
    result = [...result].sort((a, b) => {
      if (orden === "precio-asc") return (Number(a.price) || 0) - (Number(b.price) || 0);
      if (orden === "precio-desc") return (Number(b.price) || 0) - (Number(a.price) || 0);
      if (orden === "descuento") return (b.discountPercent ?? 0) - (a.discountPercent ?? 0);
      if (orden === "recientes") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      // destacados (default): featured primero, luego createdAt desc
      if (a.featured !== b.featured) return a.featured ? -1 : 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return result;
  }, [products, search, activeFilters, filterGroups, productFilterMap, orden]);

  const FilterComponent = STYLE_MAP[categoriesStyle] ?? StoriesFilter;
  const hasFacets = filterGroups.length > 0;

  // ── Sidebar content — función, no componente, para evitar desmontaje en re-renders
  const renderFilters = () => (
    <div className="space-y-1">
      {filterGroups.map((group) => (
        <FilterAccordion
          key={group.id}
          group={group}
          activeOptionSlugs={activeFilters[group.slug] ?? new Set()}
          onToggle={toggleOption}
        />
      ))}
    </div>
  );

  return (
    <div id="feed" className={`${hasFacets ? "lg:flex lg:gap-6" : ""} px-2 sm:px-3`}>

      {/* ── Sidebar desktop ─────────────────────────────────────────── */}
      {hasFacets && (
        <aside className="hidden lg:block w-52 flex-shrink-0">
          <div className="sticky top-20 bg-white rounded-2xl border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                <SlidersHorizontal className="w-4 h-4" /> Filtros
              </span>
              {totalActive > 0 && (
                <button onClick={clearFacets} className="text-xs text-indigo-500 hover:text-indigo-700 font-medium">
                  Limpiar ({totalActive})
                </button>
              )}
            </div>
            {renderFilters()}
          </div>
        </aside>
      )}

      {/* ── Contenido principal ─────────────────────────────────────── */}
      <div className="flex-1 min-w-0">

        {/* Search + filtros + ordenar */}
        <div className="flex gap-2 mb-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar…"
              className="w-full bg-gray-50 border border-gray-200 rounded-2xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 placeholder:text-gray-400"
            />
          </div>

          {/* Filtros (solo mobile) */}
          {hasFacets && (
            <button
              onClick={() => setSheetOpen(true)}
              className={`lg:hidden flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl border text-sm font-medium transition-colors flex-shrink-0 ${
                totalActive > 0
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              {totalActive > 0 && <span>{totalActive}</span>}
            </button>
          )}

          {/* Ordenar por */}
          <div className="relative flex-shrink-0">
            <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
            <select
              value={orden}
              onChange={(e) => setOrden(e.target.value)}
              className="appearance-none bg-white border border-gray-200 rounded-2xl pl-8 pr-6 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300 cursor-pointer"
            >
              {ORDEN_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          </div>
        </div>

        {/* Chips de filtros activos */}
        {activeChips.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {activeChips.map((chip) => (
              <button
                key={`${chip.groupSlug}-${chip.optionSlug}`}
                onClick={() => toggleOption(chip.groupSlug, chip.optionSlug)}
                className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 text-xs px-3 py-1.5 rounded-full font-medium hover:bg-indigo-100 transition-colors"
              >
                {chip.optionName}
                <X className="w-3 h-3" />
              </button>
            ))}
            <button
              onClick={clearFacets}
              className="text-xs text-gray-400 hover:text-gray-600 px-1 py-1.5 transition-colors"
            >
              Limpiar todo
            </button>
          </div>
        )}

        {/* Barra de categorías */}
        {categories.length > 0 && (
          <FilterComponent categories={categories} activeCategory={activeCategory} filterBy={filterBy} />
        )}

        {/* Contador de resultados */}
        {(totalActive > 0 || search) && (
          <p className="text-xs text-gray-400 mb-3">
            {filtered.length === 0
              ? "Sin resultados"
              : `${filtered.length} producto${filtered.length !== 1 ? "s" : ""}`}
          </p>
        )}

        {/* Feed */}
        {filtered.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-5xl mb-4">🔍</p>
            <p className="text-gray-400 font-medium mb-2">
              {search ? `Sin resultados para "${search}"` : "Sin productos con estos filtros"}
            </p>
            <button
              onClick={() => { clearFacets(); setSearch(""); filterBy(); }}
              className="text-sm text-gray-700 underline underline-offset-4"
            >
              Ver todos
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            {filtered.map((product) =>
              product.featured ? (
                <div key={product.id} className="col-span-2">
                  <ProductCard product={product} whatsapp={whatsapp} variant="hero" />
                </div>
              ) : (
                <ProductCard key={product.id} product={product} whatsapp={whatsapp} />
              )
            )}
          </div>
        )}
      </div>

      {/* ── Bottom sheet mobile ─────────────────────────────────────── */}
      {sheetOpen && hasFacets && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setSheetOpen(false)}
          />
          {/* Panel */}
          <div className="relative bg-white rounded-t-3xl max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
              <span className="text-base font-bold text-gray-900">Filtros</span>
              <button onClick={() => setSheetOpen(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            {/* Body */}
            <div className="overflow-y-auto flex-1 px-6 py-4">
              {renderFilters()}
            </div>
            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
              {totalActive > 0 && (
                <button
                  onClick={clearFacets}
                  className="flex-1 border border-gray-200 text-gray-700 py-3 rounded-2xl text-sm font-semibold hover:bg-gray-50 transition-colors"
                >
                  Limpiar ({totalActive})
                </button>
              )}
              <button
                onClick={() => setSheetOpen(false)}
                className="flex-1 bg-indigo-600 text-white py-3 rounded-2xl text-sm font-semibold hover:bg-indigo-700 transition-colors"
              >
                Ver {filtered.length} resultado{filtered.length !== 1 ? "s" : ""}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
