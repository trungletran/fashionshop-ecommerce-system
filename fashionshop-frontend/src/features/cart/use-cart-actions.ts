'use client';

import { useCallback } from 'react';
import { useAddCartItemMutation, useUpdateCartItemQuantityMutation, useDeleteCartItemMutation } from '@/features/cart/hooks';
import type { AddCartItemRequest } from '@/types/cart';
import { toast } from 'sonner';

/**
 * Hook that combines cart mutations into a single, easy-to-use interface
 * Handles optimistic updates and error messages
 */
export function useCartActions() {
  const addToCart = useAddCartItemMutation();
  const updateCartItem = useUpdateCartItemQuantityMutation();
  const removeCartItem = useDeleteCartItemMutation();

  const handleAddToCart = useCallback(
    async (request: AddCartItemRequest) => {
      try {
        await addToCart.mutateAsync(request);
      } catch (error: any) {
        toast.error(error.message || 'Failed to add to cart');
      }
    },
    [addToCart]
  );

  const handleUpdateQuantity = useCallback(
    async (itemId: number, quantity: number) => {
      try {
        if (quantity <= 0) {
          await removeCartItem.mutateAsync(itemId);
          toast.success('Item removed from cart');
        } else {
          await updateCartItem.mutateAsync({ itemId, quantity });
        }
      } catch (error: any) {
        toast.error(error.message || 'Failed to update cart');
      }
    },
    [updateCartItem, removeCartItem]
  );

  const handleRemoveItem = useCallback(
    async (itemId: number) => {
      try {
        await removeCartItem.mutateAsync(itemId);
        toast.success('Item removed from cart');
      } catch (error: any) {
        toast.error(error.message || 'Failed to remove item');
      }
    },
    [removeCartItem]
  );

  return {
    addToCart: handleAddToCart,
    updateQuantity: handleUpdateQuantity,
    removeItem: handleRemoveItem,
    isLoading: addToCart.isPending || updateCartItem.isPending || removeCartItem.isPending,
  };
}
