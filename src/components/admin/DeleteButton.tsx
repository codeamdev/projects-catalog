"use client";

import { useTransition } from "react";
import { toast } from "sonner";

interface Props {
  deleteAction: () => Promise<{ ok: boolean; error?: string }>;
  confirm?: string;
  label?: string;
  small?: boolean;
}

export function DeleteButton({
  deleteAction,
  confirm: confirmMsg = "¿Eliminar este elemento?",
  label = "Eliminar",
  small = false,
}: Props) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (!confirm(confirmMsg)) return;
    startTransition(async () => {
      const result = await deleteAction();
      if (!result.ok) toast.error(result.error ?? "Error al eliminar");
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className={
        small
          ? "text-xs text-gray-300 hover:text-red-500 disabled:opacity-50 transition-colors font-medium px-1"
          : "text-xs text-red-400 hover:text-red-600 disabled:opacity-50 transition-colors font-medium"
      }
    >
      {isPending ? "…" : label}
    </button>
  );
}
