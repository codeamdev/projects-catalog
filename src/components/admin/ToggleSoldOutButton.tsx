"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { toggleProductSoldOut } from "@/app/api/admin/actions";

interface Props {
  productId: string;
  soldOut: boolean;
}

export function ToggleSoldOutButton({ productId, soldOut }: Props) {
  const [isSoldOut, setIsSoldOut] = useState(soldOut);
  const [isPending, startTransition] = useTransition();

  function toggle() {
    const next = !isSoldOut;
    startTransition(async () => {
      const result = await toggleProductSoldOut(productId, next);
      if (result.ok) {
        setIsSoldOut(next);
        toast.success(next ? "Marcado como agotado" : "Marcado como disponible");
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <button
      onClick={toggle}
      disabled={isPending}
      title={isSoldOut ? "Agotado — clic para marcar disponible" : "Disponible — clic para marcar agotado"}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors disabled:opacity-50 ${
        isSoldOut ? "bg-orange-400" : "bg-gray-300"
      }`}
    >
      <span
        className={`inline-block h-3 w-3 rounded-full bg-white shadow transition-transform ${
          isSoldOut ? "translate-x-5" : "translate-x-1"
        }`}
      />
    </button>
  );
}
