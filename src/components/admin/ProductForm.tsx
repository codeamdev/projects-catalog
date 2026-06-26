"use client";

import { useTransition, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MultiImageUpload } from "./MultiImageUpload";
import type { ActionResult } from "@/app/api/admin/actions";

interface Category { id: string; name: string }
interface FilterOption { id: string; name: string }
interface FilterGroup { id: string; name: string; options: FilterOption[] }

interface DefaultValues {
  title?: string;
  description?: string | null;
  price?: string | null;
  category_id?: string | null;
  active?: boolean;
  featured?: boolean;
  discountPercent?: number | null;
  tags?: string;
  imageUrls?: string;
  trackStock?: boolean;
  stock?: number | null;
}

interface Props {
  categories: Category[];
  filterGroups?: FilterGroup[];
  selectedFilterOptionIds?: string[];
  action: (formData: FormData) => Promise<ActionResult>;
  deleteAction?: () => Promise<ActionResult>;
  defaultValues?: DefaultValues;
  inventoryEnabled?: boolean;
}

const INPUT = "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300";

export function ProductForm({ categories, filterGroups = [], selectedFilterOptionIds = [], action, deleteAction, defaultValues, inventoryEnabled = false }: Props) {
  const [isPending, startTransition] = useTransition();
  const [trackStock, setTrackStock] = useState(defaultValues?.trackStock ?? false);
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await action(formData);
      if (result.ok) {
        toast.success("Producto guardado");
        router.push("/admin/products");
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleDelete() {
    if (!deleteAction) return;
    if (!confirm("¿Eliminar este producto? Esta acción no se puede deshacer.")) return;
    startTransition(async () => {
      const result = await deleteAction();
      if (result.ok) {
        toast.success("Producto eliminado");
        router.push("/admin/products");
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-6 bg-white rounded-2xl border border-gray-100 p-6">
      {/* Título */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
        <input name="title" defaultValue={defaultValues?.title} required className={INPUT} />
      </div>

      {/* Descripción */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
        <textarea
          name="description"
          defaultValue={defaultValues?.description ?? ""}
          rows={4}
          className={`${INPUT} resize-none`}
        />
      </div>

      {/* Precio y descuento */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Precio ($)</label>
          <input
            name="price"
            type="number"
            step="0.01"
            min="0"
            defaultValue={defaultValues?.price ?? ""}
            className={INPUT}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Descuento <span className="text-gray-400 font-normal">(%)</span>
          </label>
          <input
            name="discount_percent"
            type="number"
            min="0"
            max="99"
            step="1"
            defaultValue={defaultValues?.discountPercent ?? ""}
            placeholder="0"
            className={INPUT}
          />
        </div>
      </div>

      {/* Categoría */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
        <select name="category_id" defaultValue={defaultValues?.category_id ?? ""} className={INPUT}>
          <option value="">Sin categoría</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Imágenes — subida directa al servidor */}
      <MultiImageUpload name="imageUrls" defaultValue={defaultValues?.imageUrls} />

      {/* Filtros */}
      {filterGroups.length > 0 && (
        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-700">Filtros</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filterGroups.map((group) => (
              <div key={group.id} className="border border-gray-100 rounded-xl p-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  {group.name}
                </p>
                {group.options.length === 0 ? (
                  <p className="text-xs text-gray-400">Sin opciones configuradas</p>
                ) : (
                  <div className="space-y-2">
                    {group.options.map((opt) => (
                      <label key={opt.id} className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          name="filter_option_ids"
                          value={opt.id}
                          defaultChecked={selectedFilterOptionIds.includes(opt.id)}
                          className="w-4 h-4 rounded accent-indigo-600"
                        />
                        <span className="text-sm text-gray-700">{opt.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Tags <span className="text-gray-400 font-normal">(separados por coma)</span>
        </label>
        <input
          name="tags"
          defaultValue={defaultValues?.tags ?? ""}
          placeholder="nuevo, oferta, temporada"
          className={INPUT}
        />
      </div>

      {/* Flags */}
      <div className="flex gap-6 flex-wrap">
        <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
          <input type="hidden" name="active" value="false" />
          <input
            type="checkbox"
            name="active"
            value="true"
            defaultChecked={defaultValues?.active !== false}
            className="w-4 h-4 rounded accent-gray-900"
          />
          <span>Activo</span>
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
          <input type="hidden" name="featured" value="false" />
          <input
            type="checkbox"
            name="featured"
            value="true"
            defaultChecked={defaultValues?.featured === true}
            className="w-4 h-4 rounded accent-gray-900"
          />
          <span>Destacado</span>
        </label>
        {inventoryEnabled && (
          <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
            <input type="hidden" name="track_stock" value="false" />
            <input
              type="checkbox"
              name="track_stock"
              value="true"
              checked={trackStock}
              onChange={(e) => setTrackStock(e.target.checked)}
              className="w-4 h-4 rounded accent-gray-900"
            />
            <span>Mostrar existencias</span>
          </label>
        )}
      </div>

      {/* Stock — solo si inventoryEnabled y trackStock activo */}
      {inventoryEnabled && trackStock && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Existencias disponibles
          </label>
          <input
            name="stock"
            type="number"
            min={0}
            defaultValue={defaultValues?.stock ?? ""}
            placeholder="Cantidad en stock"
            className={`${INPUT} max-w-[160px]`}
          />
          <p className="text-xs text-gray-400 mt-1">
            ≤ 5 unidades → badge "Últimas X". En 0 → "Sin stock" y botón deshabilitado.
          </p>
        </div>
      )}

      {/* Acciones */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isPending}
            className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {isPending ? "Guardando…" : "Guardar producto"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="border border-gray-200 px-6 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
        </div>
        {deleteAction && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={isPending}
            className="text-red-500 hover:text-red-700 text-sm font-medium disabled:opacity-50 transition-colors"
          >
            Eliminar producto
          </button>
        )}
      </div>
    </form>
  );
}
