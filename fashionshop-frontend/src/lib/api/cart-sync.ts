'use client';

import { useEffect } from 'react';
import { useCart } from '@/features/cart/store';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api, apiRequest } from '@/lib/api/http';
import type { ApiResponse } from '@/lib/api/types';
import type { Cart } from '@/types/cart';
import { queryKeys } from './query-keys';

/**
 * Hook to sync React Query cart data with Zustand store
 * Keeps local cart state in sync with backend whenever cart changes
 */
export function useSyncCartWithStore() {
  const { setCart } = useCart();
  const queryClient = useQueryClient();

  // Fetch cart from API
  const { data: cartData } = useQuery({
    queryKey: queryKeys.cart,
    queryFn: async () => {
      const response = await api.get<ApiResponse<Cart>>('/api/cart');
      return apiRequest(Promise.resolve(response));
    },
  });

  // Sync with Zustand store
  useEffect(() => {
    if (cartData) {
      setCart(cartData);
    }
  }, [cartData, setCart]);

  return { cartData };
}

/**
 * Hook to invalidate and refetch cart data
 */
export function useInvalidateCart() {
  const queryClient = useQueryClient();
  const { setCart } = useCart();

  return async () => {
    await queryClient.invalidateQueries({ queryKey: queryKeys.cart });
    // Optionally clear local store immediately for optimistic updates
    setCart({ items: [], totalItems: 0, totalPrice: 0, cartId: 0, distinctItemCount: 0, subtotal: 0, empty: true });
  };
}

/**
 * Hook to get formatted cart data for display
 */
export function useFormattedCart() {
  const cart = useCart();
  return {
    items: cart.items,
    itemCount: cart.totalItems,
    totalPrice: cart.totalPrice,
    isEmpty: cart.items.length === 0,
  };
}
