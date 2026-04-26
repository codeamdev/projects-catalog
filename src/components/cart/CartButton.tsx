"use client";

import { useEffect, useState } from "react";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/store/cart";

export function CartButton() {
  const { totalItems, openCart } = useCart();
  // Evita hydration mismatch: el servidor no tiene acceso a localStorage,
  // así que siempre renderiza count=0. El badge solo aparece tras el mount.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const count = mounted ? totalItems() : 0;

  return (
    <button
      onClick={openCart}
      aria-label="Abrir carrito"
      className="fixed bottom-6 right-4 sm:right-6 z-40 flex items-center gap-2 bg-gray-900 text-white rounded-full shadow-2xl px-4 py-3 hover:bg-gray-700 active:scale-95 transition-all"
    >
      <ShoppingBag className="w-5 h-5 flex-shrink-0" />
      <span className="text-sm font-semibold hidden sm:block">Carrito</span>
      {count > 0 && (
        <span className="min-w-[22px] h-[22px] flex items-center justify-center bg-white text-gray-900 text-[10px] font-bold rounded-full px-1">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </button>
  );
}
