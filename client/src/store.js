import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

// ── AUTH STORE ──
export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: (user, token) => set({ user, token, isAuthenticated: true }),
      logout: () => set({ user: null, token: null, isAuthenticated: false }),
      updateUser: (user) => set({ user }),
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// ── CART STORE ──
export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (product, quantity = 1, variant = null) => {
        const { items } = get();
        const key = variant ? `${product._id}-${variant.value}` : product._id;
        const existing = items.find((i) => i.key === key);

        if (existing) {
          set({
            items: items.map((i) =>
              i.key === key
                ? { ...i, quantity: Math.min(i.quantity + quantity, i.maxStock || 99) }
                : i
            ),
          });
        } else {
          set({
            items: [
              ...items,
              {
                key,
                product: product._id,
                name: product.name,
                price: product.price + (variant?.priceModifier || 0),
                image: product.images?.[0]?.url || "",
                variant,
                quantity,
                maxStock: product.stock,
              },
            ],
          });
        }
      },

      removeItem: (key) =>
        set((state) => ({ items: state.items.filter((i) => i.key !== key) })),

      updateQuantity: (key, quantity) => {
        if (quantity < 1) return get().removeItem(key);
        set((state) => ({
          items: state.items.map((i) =>
            i.key === key ? { ...i, quantity: Math.min(quantity, i.maxStock || 99) } : i
          ),
        }));
      },

      clearCart: () => set({ items: [] }),

      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),

      get itemCount() {
        return get().items.reduce((acc, i) => acc + i.quantity, 0);
      },

      get subtotal() {
        return get().items.reduce((acc, i) => acc + i.price * i.quantity, 0);
      },
    }),
    {
      name: "cart-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// ── UI STORE ──
export const useUIStore = create((set) => ({
  searchOpen: false,
  mobileMenuOpen: false,
  toggleSearch: () => set((s) => ({ searchOpen: !s.searchOpen })),
  toggleMobileMenu: () => set((s) => ({ mobileMenuOpen: !s.mobileMenuOpen })),
  closeAll: () => set({ searchOpen: false, mobileMenuOpen: false }),
}));
