'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useManageOrdersQuery } from '@/features/orders/hooks';
import { AdminOrdersFilters } from '@/features/orders/components/admin/admin-orders-filters';
import { PageHeader } from '@/components/common/page-header';
import { Pagination } from '@/components/common/pagnition';
import { Badge } from '@/components/ui/badge';
import type { Order, OrderStatus } from '@/types/order';

function getOrderBadgeVariant(status: string): 'success' | 'warning' | 'error' | 'secondary' {
  if (status === 'DELIVERED' || status === 'COMPLETED') return 'success';
  if (status === 'CANCELLED') return 'error';
  if (status === 'PROCESSING' || status === 'PENDING') return 'warning';
  return 'secondary';
}

export default function StaffOrdersPage() {
  const [page, setPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [status, setStatus] = useState<OrderStatus | ''>('');
  const pageSize = 10;

  const { data, isLoading } = useManageOrdersQuery({
    page,
    size: pageSize,
    keyword: searchTerm,
    status: status || undefined,
  });

  const orders: Order[] = data?.items ?? [];
  const totalItems = data?.totalItems ?? data?.total ?? 0;
  const totalPages = data?.totalPages ?? (totalItems > 0 ? Math.ceil(totalItems / pageSize) : 0);

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <PageHeader
        eyebrow="Staff Console · Operations"
        title="Orders"
        description="Review incoming orders and update fulfillment status."
      />

      <AdminOrdersFilters
        statusFilter={status}
        onStatusChange={(val) => {
          setStatus(val);
          setPage(0);
        }}
        searchTerm={searchTerm}
        onSearch={(val) => {
          setSearchTerm(val);
          setPage(0);
        }}
      />

      <div className="overflow-hidden rounded-xl border border-outline-variant/60 bg-surface-container-lowest shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead className="border-b border-outline-variant/60 bg-surface-container-low">
              <tr>
                <th className="px-6 py-4 font-label text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                  Order Info
                </th>
                <th className="px-6 py-4 font-label text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                  Customer
                </th>
                <th className="px-6 py-4 font-label text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                  Status
                </th>
                <th className="px-6 py-4 font-label text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                  Total
                </th>
                <th className="px-6 py-4 text-right font-label text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/40 font-body">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={5} className="px-6 py-7">
                      <div className="h-4 w-full rounded-md bg-surface-container" />
                    </td>
                  </tr>
                ))
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-sm text-on-surface-variant">
                    No matching orders found.
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="transition-colors hover:bg-surface-container-low/60">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-mono text-sm font-bold text-primary">
                          #{order.orderNumber || String(order.id).substring(0, 8)}
                        </span>
                        <span className="font-label text-[10px] uppercase tracking-wider text-outline">
                          {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-primary">
                          {order.customerName || order.receiverName || 'Customer'}
                        </span>
                        <span className="text-xs text-on-surface-variant">
                          {order.customerEmail || order.phone || '—'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={getOrderBadgeVariant(order.status)}>
                        {order.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 font-headline text-sm font-bold text-primary">
                      ${(order.totalPrice ?? 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/staff/orders/${order.id}`}
                        className="font-label text-[11px] font-bold uppercase tracking-[0.16em] text-primary underline-offset-4 hover:underline"
                      >
                        Manage
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          page={page + 1}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={totalItems}
          onPageChange={(p) => setPage(p - 1)}
        />
      </div>
    </div>
  );
}
