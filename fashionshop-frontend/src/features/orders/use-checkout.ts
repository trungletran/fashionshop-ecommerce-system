'use client';

import { useCallback } from 'react';
import { useCreateOrderMutation, useCheckoutSummaryQuery, useUpdateCheckoutPaymentMethodMutation } from '@/features/orders/hooks';
import { useCart } from '@/features/cart/store';
import type { PlaceOrderRequest } from '@/types/order';
import { toast } from 'sonner';

/**
 * Complete checkout hook that manages the entire order flow
 * Handles: checkout summary, payment method selection, and order placement
 */
export function useCheckout() {
  const { data: checkoutSummary, isLoading: isSummaryLoading } = useCheckoutSummaryQuery();
  const placeOrder = useCreateOrderMutation();
  const updatePaymentMethod = useUpdateCheckoutPaymentMethodMutation();
  const { clearCart } = useCart();

  const handlePlaceOrder = useCallback(
    async (request: PlaceOrderRequest) => {
      try {
        const order = await placeOrder.mutateAsync(request);
        clearCart(); // Clear local cart after successful order
        return order;
      } catch (error: any) {
        toast.error(error.message || 'Failed to place order');
        throw error;
      }
    },
    [placeOrder, clearCart]
  );

  const handleUpdatePaymentMethod = useCallback(
    async (paymentMethod: string) => {
      try {
        await updatePaymentMethod.mutateAsync(paymentMethod);
      } catch (error: any) {
        toast.error(error.message || 'Failed to update payment method');
      }
    },
    [updatePaymentMethod]
  );

  return {
    checkoutSummary,
    isSummaryLoading,
    isPlacingOrder: placeOrder.isPending,
    isUpdatingPayment: updatePaymentMethod.isPending,
    isEmpty: checkoutSummary?.empty || false,
    placeOrder: handlePlaceOrder,
    updatePaymentMethod: handleUpdatePaymentMethod,
  };
}

/**
 * Hook for order tracking
 */
export function useOrderTracking(orderId?: number) {
  const { useTrackOrderQuery } = require('@/features/orders/hooks');
  const tracking = useTrackOrderQuery(orderId);

  return {
    trackingData: tracking.data,
    isLoading: tracking.isLoading,
    error: tracking.error,
  };
}
