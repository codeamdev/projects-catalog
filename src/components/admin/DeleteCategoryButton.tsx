"use client";

import { useTransition } from "react";

interface Props {
  deleteAction: () => Promise<void>;
}

export function DeleteCategoryButton({ deleteAction }: Props) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (!confirm("¿Eliminar esta categoría? Los productos quedarán sin categoría.")) return;
    startTransition(() => deleteAction());
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
