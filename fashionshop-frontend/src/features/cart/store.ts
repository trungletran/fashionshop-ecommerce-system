'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';
import type { Cart, CartItem } from '@/types/cart';

type CartState = {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  addItem: (item: CartItem) => void;
  removeItem: (itemId: number) => void;
  updateItem: (itemId: number, quantity: number) => void;
  clearCart: () => void;
  setCart: (cart: Cart) => void;
};

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      totalItems: 0,
      totalPrice: 0,
      
      addItem: (item) =>
        set((state) => {
          const existingItem = state.items.find((i) => i.itemId === item.itemId);
          let newItems;
          if (existingItem) {
            newItems = state.items.map((i) =>
              i.itemId === item.itemId ? { ...i, quantity: i.quantity + item.quantity } : i
            );
          } else {
            newItems = [...state.items, item];
          }
          return {
            items: newItems,
            totalItems: newItems.reduce((sum, i) => sum + i.quantity, 0),
            totalPrice: newItems.reduce((sum, i) => sum + i.price * i.quantity, 0),
          };
        }),

      removeItem: (itemId) =>
        set((state) => {
          const newItems = state.items.filter((i) => i.itemId !== itemId);
          return {
            items: newItems,
            totalItems: newItems.reduce((sum, i) => sum + i.quantity, 0),
            totalPrice: newItems.reduce((sum, i) => sum + i.price * i.quantity, 0),
          };
        }),

      updateItem: (itemId, quantity) =>
        set((state) => {
          const newItems = state.items.map((i) =>
            i.itemId === itemId ? { ...i, quantity } : i
          );
          return {
            items: newItems,
            totalItems: newItems.reduce((sum, i) => sum + i.quantity, 0),
            totalPrice: newItems.reduce((sum, i) => sum + i.price * i.quantity, 0),
          };
        }),

      clearCart: () => set({ items: [], totalItems: 0, totalPrice: 0 }),

      setCart: (cart) =>
        set({
          items: cart.items || [],
          totalItems: cart.totalItems || 0,
          totalPrice: cart.totalPrice || 0,
        }),
    }),
    {
      name: 'fashionshop.cart',
    }
  )
);

export function useCart() {
  return useCartStore(
    useShallow((state) => ({
      items: state.items,
      totalItems: state.totalItems,
      totalPrice: state.totalPrice,
      addItem: state.addItem,
      removeItem: state.removeItem,
      updateItem: state.updateItem,
      clearCart: state.clearCart,
      setCart: state.setCart,
    }))
  );
}
