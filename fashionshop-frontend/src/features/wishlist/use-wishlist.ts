'use client';

import { useCallback } from 'react';
import { useAddWishlistItemMutation, useDeleteWishlistItemMutation, useWishlistContainsQuery, useWishlistQuery } from '@/features/wishlist/hooks';
import { toast } from 'sonner';

/**
 * Hook for wishlist toggle action
 * Handles add/remove in a single function
 */
export function useToggleWishlist(productId: number) {
  const { data: isInWishlist } = useWishlistContainsQuery(productId);
  const addToWishlist = useAddWishlistItemMutation();
  const removeFromWishlist = useDeleteWishlistItemMutation();

  const toggle = useCallback(async () => {
    try {
      if (isInWishlist) {
        await removeFromWishlist.mutateAsync(productId);
        toast.success('Removed from wishlist');
      } else {
        await addToWishlist.mutateAsync(productId);
        toast.success('Added to wishlist');
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to update wishlist';
      toast.error(message);
    }
  }, [isInWishlist, productId, addToWishlist, removeFromWishlist]);

  return {
    isInWishlist: isInWishlist || false,
    toggle,
    isLoading: addToWishlist.isPending || removeFromWishlist.isPending,
  };
}

/**
 * Hook to get wishlist state for multiple products
 */
export function useWishlistState() {
  const { data: wishlist } = useWishlistQuery();
  const idSet = new Set((wishlist ?? []).map((item) => item.productId));

  return {
    isInWishlist: (productId: number) => {
      return idSet.has(productId);
    },
  };
}
