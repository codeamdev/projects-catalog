import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  id: string;
  title: string;
  price: number | null;
  originalPrice: number | null;
  discountPercent: number | null;
  currency: string;
  image: string | null;
  quantity: number;
}

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  totalItems: () => number;
  totalPrice: () => number;
  buildWhatsAppUrl: (phone: string, tenantName: string) => string;
}

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem(item) {
        set((state) => {
          const existing = state.items.find((i) => i.id === item.id);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
              ),
              isOpen: true,
            };
          }
          return { items: [...state.items, { ...item, quantity: 1 }], isOpen: true };
        });
      },

      removeItem(id) {
        set((state) => ({ items: state.items.filter((i) => i.id !== id) }));
      },

      updateQuantity(id, quantity) {
        if (quantity < 1) {
          get().removeItem(id);
          return;
        }
        set((state) => ({
          items: state.items.map((i) => (i.id === id ? { ...i, quantity } : i)),
        }));
      },

      clearCart() {
        set({ items: [] });
      },

      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),

      totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

      totalPrice: () =>
        get().items.reduce((sum, i) => sum + (i.price ?? 0) * i.quantity, 0),

      buildWhatsAppUrl(phone, tenantName) {
        const { items, totalPrice } = get();
        if (items.length === 0) return "";

        const currency = items[0].currency;
        const lines = items
          .map((i) => `• ${i.title} x${i.quantity}`)
          .join("\n");
        const total = totalPrice();

        const message = [
          `Hola ${tenantName}! Quiero hacer el siguiente pedido:`,
          "",
          lines,
          "",
          `Total: ${currency} ${total.toLocaleString("es-AR")}`,
        ].join("\n");

        return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
      },
    }),
    {
      name: "cart-storage",
      partialize: (state) => ({ items: state.items }),
    }
  )
);
