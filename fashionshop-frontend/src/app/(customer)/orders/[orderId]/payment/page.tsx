'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { EmptyState } from '@/components/common/empty-state';
import { LoadingState } from '@/components/common/loading-state';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useMyOrderPaymentQuery } from '@/features/orders/hooks';

export default function OrderPaymentPage() {
  const params = useParams<{ orderId: string }>();
  const paymentQuery = useMyOrderPaymentQuery(params.orderId);

  if (paymentQuery.isLoading) return <LoadingState label="Loading payment" />;
  if (!paymentQuery.data) {
    return <EmptyState title="Payment not found" actionLabel="Back to orders" actionHref="/orders" />;
  }

  return (
    <main className="container-shell min-h-screen py-10 md:py-14">
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <Link
            href="/orders"
            className="font-label text-xs font-bold uppercase tracking-[0.18em] text-on-surface-variant transition-colors hover:text-primary"
          >
            ← Back to orders
          </Link>
          <p className="mt-4 font-label text-[10px] font-bold uppercase tracking-[0.26em] text-on-surface-variant">
            Payment Receipt
          </p>
          <h1 className="font-headline mt-1 text-3xl font-black uppercase tracking-tight text-primary sm:text-4xl">
            Payment detail
          </h1>
        </div>

        <Card>
          <CardHeader className="bg-surface-container-low">
            <h2 className="font-headline text-sm font-bold uppercase tracking-[0.16em] text-primary">
              Transaction Summary
            </h2>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <p className="font-label text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                Method
              </p>
              <p className="mt-1.5 text-sm font-bold uppercase text-primary">
                {paymentQuery.data.paymentMethod}
              </p>
            </div>
            <div>
              <p className="font-label text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                Status
              </p>
              <div className="mt-1.5">
                <Badge variant={paymentQuery.data.paymentStatus === 'PAID' ? 'success' : 'secondary'}>
                  {paymentQuery.data.paymentStatus}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
