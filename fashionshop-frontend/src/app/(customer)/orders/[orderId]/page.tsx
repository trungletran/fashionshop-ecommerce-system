'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';
import { EmptyState } from '@/components/common/empty-state';
import { LoadingState } from '@/components/common/loading-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useCancelMyOrderMutation, useMyOrderQuery } from '@/features/orders/hooks';

export default function OrderDetailPage() {
  const params = useParams<{ orderId: string }>();
  const orderQuery = useMyOrderQuery(params.orderId);
  const cancelMutation = useCancelMyOrderMutation(params.orderId);

  if (orderQuery.isLoading) return <LoadingState label="Loading order" />;
  if (!orderQuery.data) {
    return <EmptyState title="Order not found" actionLabel="Back to orders" actionHref="/orders" />;
  }

  const order = orderQuery.data;

  return (
    <main className="container-shell min-h-screen py-10 md:py-14">
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <Link
            href="/orders"
            className="font-label text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant transition-colors hover:text-primary"
          >
            ← Back to orders
          </Link>
          <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-label text-[10px] font-bold uppercase tracking-[0.26em] text-on-surface-variant">
                Order Details
              </p>
              <h1 className="font-headline mt-1 text-3xl font-black uppercase tracking-tight text-primary sm:text-4xl">
                Order {order.orderNumber ?? order.id}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant={order.status === 'CANCELLED' ? 'error' : 'default'}>
                {order.status}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                disabled={cancelMutation.isPending || order.status === 'CANCELLED'}
                onClick={() =>
                  cancelMutation.mutate(undefined, {
                    onSuccess: () => toast.success('Order cancelled successfully.'),
                    onError: (error: { message?: string }) =>
                      toast.error(error?.message || 'Failed to cancel order.'),
                  })
                }
              >
                {cancelMutation.isPending ? 'Cancelling…' : 'Cancel order'}
              </Button>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader className="bg-surface-container-low">
            <h2 className="font-headline text-sm font-bold uppercase tracking-[0.16em] text-primary">
              Items ({order.items.length})
            </h2>
          </CardHeader>
          <CardContent className="space-y-3">
            {order.items.map((item) => (
              <div
                key={item.productId}
                className="flex items-center justify-between rounded-lg border border-outline-variant/50 bg-surface-container-low/60 px-4 py-3.5 text-sm"
              >
                <span className="font-medium text-on-surface">
                  {item.name} <span className="text-on-surface-variant">× {item.quantity}</span>
                </span>
                <strong className="font-headline text-primary">${item.total.toFixed(2)}</strong>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
