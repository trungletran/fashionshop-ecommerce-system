'use client';

import { useCallback } from 'react';
import { useAddWishlistItemMutation, useDeleteWishlistItemMutation, useWishlistContainsQuery } from '@/features/wishlist/hooks';
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
    } catch (error: any) {
      toast.error(error.message || 'Failed to update wishlist');
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
export function useWishlistState(productIds: number[]) {
  const wishlists = productIds.map(id => useWishlistContainsQuery(id));
  
  return {
    isInWishlist: (productId: number) => {
      const index = productIds.indexOf(productId);
      return wishlists[index]?.data || false;
    },
  };
}
