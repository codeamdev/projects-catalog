"use client";

import { useTransition } from "react";
import { toast } from "sonner";

interface Props {
  deleteAction: () => Promise<{ ok: boolean; error?: string }>;
}

export function DeleteCategoryButton({ deleteAction }: Props) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (!confirm("¿Eliminar esta categoría? Los productos quedarán sin categoría.")) return;
    startTransition(async () => {
      const result = await deleteAction();
      if (result.ok) {
        toast.success("Categoría eliminada");
      } else {
        toast.error(result.error ?? "Error al eliminar");
      }
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="text-xs text-red-400 hover:text-red-600 disabled:opacity-50 transition-colors font-medium"
    >
      {isPending ? "Eliminando…" : "Eliminar"}
    </button>
  );
}
