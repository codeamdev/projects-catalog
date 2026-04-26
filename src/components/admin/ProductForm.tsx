"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { MultiImageUpload } from "./MultiImageUpload";

interface Category { id: string; name: string }

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
}

interface Props {
  categories: Category[];
  action: (formData: FormData) => Promise<void>;
  deleteAction?: () => Promise<void>;
  defaultValues?: DefaultValues;
}

const INPUT = "w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300";

export function ProductForm({ categories, action, deleteAction, defaultValues }: Props) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleDelete() {
    if (!deleteAction) return;
    if (!confirm("¿Eliminar este producto? Esta acción no se puede deshacer.")) return;
    startTransition(async () => {
      await deleteAction();
      router.push("/admin/products");
    });
  }

  return (
    <form action={action} className="space-y-6 bg-white rounded-2xl border border-gray-100 p-6">
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
      <div className="flex gap-6">
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
      </div>

      {/* Acciones */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isPending}
            className="bg-gray-900 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors"
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
