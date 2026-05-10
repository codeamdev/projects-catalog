"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import type { ActionResult } from "@/app/api/superadmin/actions";

interface Props {
  id: string;
  active: boolean;
  toggleAction: (id: string) => Promise<ActionResult>;
}

export function ToggleTenantButton({ id, active, toggleAction }: Props) {
  const [isActive, setIsActive] = useState(active);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const result = await toggleAction(id);
      if (result.ok) {
        setIsActive((prev) => !prev);
        toast.success(isActive ? "Tenant desactivado" : "Tenant activado");
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className={`text-xs px-3 py-1 rounded-full font-medium transition-colors disabled:opacity-60 ${
        isActive
          ? "bg-green-100 text-green-700 hover:bg-green-200"
          : "bg-gray-100 text-gray-500 hover:bg-gray-200"
      }`}
    >
      {isPending ? "…" : isActive ? "Activo" : "Inactivo"}
    </button>
  );
}
