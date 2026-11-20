'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { EmptyState } from '@/components/common/empty-state';
import { LoadingState } from '@/components/common/loading-state';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useMyInvoiceQuery } from '@/features/invoices/hooks';

export default function InvoiceDetailPage() {
  const params = useParams<{ invoiceId: string }>();
  const invoiceQuery = useMyInvoiceQuery(params.invoiceId);

  if (invoiceQuery.isLoading) return <LoadingState label="Loading invoice" />;
  if (!invoiceQuery.data) {
    return <EmptyState title="Invoice not found" actionLabel="Back to orders" actionHref="/orders" />;
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
            Billing Statement
          </p>
          <h1 className="font-headline mt-1 text-3xl font-black uppercase tracking-tight text-primary sm:text-4xl">
            Invoice detail
          </h1>
        </div>

        <Card>
          <CardHeader className="bg-surface-container-low">
            <h2 className="font-headline text-sm font-bold uppercase tracking-[0.16em] text-primary">
              Invoice #{invoiceQuery.data.invoiceNumber ?? invoiceQuery.data.id}
            </h2>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div>
              <p className="font-label text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                Invoice Number
              </p>
              <p className="mt-1.5 font-mono text-sm font-bold text-primary">
                {invoiceQuery.data.invoiceNumber ?? invoiceQuery.data.id}
              </p>
            </div>
            <div>
              <p className="font-label text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                Total Amount
              </p>
              <p className="font-headline mt-1.5 text-lg font-black text-primary">
                ${invoiceQuery.data.totalAmount.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="font-label text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                Payment Status
              </p>
              <div className="mt-1.5">
                <Badge variant={invoiceQuery.data.paymentStatus === 'PAID' ? 'success' : 'secondary'}>
                  {invoiceQuery.data.paymentStatus}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
