"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { toggleProductActive } from "@/app/api/admin/actions";

interface Props {
  productId: string;
  active: boolean;
}

export function ToggleActiveButton({ productId, active }: Props) {
  const [isActive, setIsActive] = useState(active);
  const [isPending, startTransition] = useTransition();

  function toggle() {
    const next = !isActive;
    startTransition(async () => {
      const result = await toggleProductActive(productId, next);
      if (result.ok) {
        setIsActive(next);
        toast.success(next ? "Producto activado" : "Producto desactivado");
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <button
      onClick={toggle}
      disabled={isPending}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors disabled:opacity-50 ${
        isActive ? "bg-green-500" : "bg-gray-300"
      }`}
    >
      <span
        className={`inline-block h-3 w-3 rounded-full bg-white shadow transition-transform ${
          isActive ? "translate-x-5" : "translate-x-1"
        }`}
      />
    </button>
  );
}
