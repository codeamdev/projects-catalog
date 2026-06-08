"use client";

import { useRef, useTransition } from "react";
import { toast } from "sonner";

interface Props {
  imageUrl: string | null;
  updateAction: (imageUrl: string | null) => Promise<{ ok: boolean; error?: string }>;
}

export function CategoryImageButton({ imageUrl, updateAction }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const fd = new FormData();
    fd.append("file", file);

    const res = await fetch("/api/upload", { method: "POST", body: fd });
    if (!res.ok) {
      toast.error("Error al subir imagen");
      return;
    }
    const { url } = await res.json();

    startTransition(async () => {
      const result = await updateAction(url);
      if (result.ok) toast.success("Imagen actualizada");
      else toast.error(result.error ?? "Error");
    });

    // Reset input so same file can be re-selected
    e.target.value = "";
  }

  function handleRemove() {
    startTransition(async () => {
      const result = await updateAction(null);
      if (result.ok) toast.success("Imagen eliminada");
      else toast.error(result.error ?? "Error");
    });
  }

  return (
    <div className="flex items-center gap-2">
      <div className="w-9 h-9 rounded-full overflow-hidden border border-gray-200 flex-shrink-0 bg-gray-50 flex items-center justify-center">
        {imageUrl ? (
          <img src={imageUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-gray-300 text-xs">—</span>
        )}
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />

      <button
        onClick={() => fileRef.current?.click()}
        disabled={isPending}
        className="text-xs text-indigo-500 hover:text-indigo-700 disabled:opacity-50 transition-colors font-medium"
      >
        {isPending ? "Subiendo…" : imageUrl ? "Cambiar" : "Subir imagen"}
      </button>

      {imageUrl && !isPending && (
        <button
          onClick={handleRemove}
          className="text-xs text-gray-300 hover:text-red-400 transition-colors"
        >
          Quitar
        </button>
      )}
    </div>
  );
}
