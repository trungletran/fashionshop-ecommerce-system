'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/common/empty-state';
import { LoadingState } from '@/components/common/loading-state';
import { useManageOrderQuery, useUpdateManageOrderStatusMutation } from '@/features/orders/hooks';

const ORDER_STATUSES = ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'] as const;

export default function StaffOrderDetailPage() {
  const params = useParams<{ orderId: string }>();
  const orderQuery = useManageOrderQuery(params.orderId);
  const mutation = useUpdateManageOrderStatusMutation(params.orderId);

  if (orderQuery.isLoading) return <LoadingState label="Loading order" />;
  if (!orderQuery.data) {
    return (
      <EmptyState
        title="Order not found"
        description={`We could not locate order #${params.orderId}.`}
        actionLabel="Back to Orders"
        actionHref="/staff/orders"
      />
    );
  }

  const order = orderQuery.data;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header className="border-b border-outline-variant/60 pb-6">
        <nav className="mb-3 flex items-center gap-2 font-label text-[10px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">
          <Link href="/staff/orders" className="transition-colors hover:text-primary">
            Orders
          </Link>
          <span className="material-symbols-outlined text-xs">chevron_right</span>
          <span className="text-primary">#{order.orderNumber ?? order.id}</span>
        </nav>

        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-headline text-3xl font-black uppercase tracking-tight text-primary sm:text-4xl">
              Order #{order.orderNumber ?? order.id}
            </h1>
            <p className="mt-2 text-sm text-on-surface-variant">
              Placed on{' '}
              {order.createdAt ? new Date(order.createdAt).toLocaleString() : 'Unknown date'}
            </p>
          </div>
          <Badge variant={order.status === 'CANCELLED' ? 'error' : order.status === 'DELIVERED' || order.status === 'COMPLETED' ? 'success' : 'default'}>
            {order.status}
          </Badge>
        </div>
      </header>

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 space-y-6 lg:col-span-8">
          <Card>
            <CardHeader className="bg-surface-container-low">
              <h2 className="font-headline text-sm font-bold uppercase tracking-[0.16em] text-primary">
                Order Items ({order.items.length})
              </h2>
            </CardHeader>
            <CardContent className="divide-y divide-outline-variant/40 p-0">
              {order.items.map((item, idx) => (
                <div key={`${item.productId}-${idx}`} className="flex items-center justify-between gap-4 px-6 py-4">
                  <div>
                    <p className="text-sm font-bold text-primary">{item.name}</p>
                    <p className="mt-0.5 text-xs text-on-surface-variant">Quantity: {item.quantity}</p>
                  </div>
                  <p className="font-headline text-sm font-bold text-primary">
                    ${item.total.toFixed(2)}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="bg-surface-container-low">
              <h2 className="font-headline text-sm font-bold uppercase tracking-[0.16em] text-primary">
                Update Fulfillment Status
              </h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-on-surface-variant">
                Select the next valid status for this order. Status updates are persisted immediately.
              </p>
              <div className="flex flex-wrap gap-2.5">
                {ORDER_STATUSES.map((status) => (
                  <Button
                    key={status}
                    type="button"
                    size="sm"
                    variant={order.status === status ? 'default' : status === 'CANCELLED' ? 'destructive' : 'outline'}
                    disabled={mutation.isPending || order.status === status}
                    onClick={() =>
                      mutation.mutate(status, {
                        onSuccess: () => toast.success(`Order updated to ${status}`),
                        onError: (err: { message?: string }) =>
                          toast.error(err?.message || 'Failed to update status'),
                      })
                    }
                  >
                    {status}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="col-span-12 space-y-6 lg:col-span-4">
          <Card>
            <CardHeader className="bg-surface-container-low">
              <h2 className="font-headline text-sm font-bold uppercase tracking-[0.16em] text-primary">
                Delivery & Payment
              </h2>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <p className="font-label text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                  Shipping Address
                </p>
                <p className="mt-1 whitespace-pre-line text-on-surface">
                  {order.shippingAddress || 'No shipping address provided.'}
                </p>
              </div>
              <div className="border-t border-outline-variant/50 pt-4">
                <p className="font-label text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                  Payment Method
                </p>
                <p className="mt-1 font-semibold uppercase text-primary">{order.paymentMethod || '—'}</p>
              </div>
              <div className="border-t border-outline-variant/50 pt-4">
                <p className="font-label text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                  Total Amount
                </p>
                <p className="font-headline mt-1 text-2xl font-black text-primary">
                  ${(order.totalPrice ?? 0).toFixed(2)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
