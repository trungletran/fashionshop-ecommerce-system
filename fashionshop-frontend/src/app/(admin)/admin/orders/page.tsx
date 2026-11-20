'use client';

import { useState } from 'react';
import { useManageOrdersQuery } from '@/features/orders/hooks';
import { useDebounce } from '@/hooks/use-debounce';
import type { Order, OrderStatus } from '@/types/order';
import { PageHeader } from '@/components/common/page-header';
import { Pagination } from '@/components/common/pagnition';
import { AdminOrdersTable } from '@/features/orders/components/admin/admin-orders-table';
import { AdminOrdersFilters } from '@/features/orders/components/admin/admin-orders-filters';
import { AdminOrdersInsights } from '@/features/orders/components/admin/admin-orders-insights';

export default function AdminOrdersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  const debouncedSearch = useDebounce(searchTerm, 500);

  const handleStatusChange = (status: OrderStatus | '') => {
    setStatusFilter(status);
    setPage(1);
  };
  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setPage(1);
  };

  const { data: response, isLoading } = useManageOrdersQuery({
    keyword: debouncedSearch || undefined,
    status: statusFilter || undefined,
    page: page - 1,
    size: pageSize,
  });

  const orders: Order[] = response?.items ?? [];
  const totalItems = response?.totalItems ?? response?.total ?? 0;
  const totalPages = Math.max(1, response?.totalPages ?? Math.ceil(totalItems / pageSize));

  const pendingCount = orders.filter((o) => o.status === 'PENDING').length;

  const completed = orders.filter(
    (o) => o.status === 'DELIVERED' || o.status === 'SHIPPED' || o.status === 'COMPLETED',
  ).length;

  const completionRate =
    orders.length > 0 ? Math.round((completed / orders.length) * 100) : 0;

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <PageHeader
        eyebrow="Operations"
        title="Order Management"
        description="Track, confirm, and fulfill customer orders across the storefront."
      />

      <AdminOrdersFilters
        statusFilter={statusFilter}
        onStatusChange={handleStatusChange}
        searchTerm={searchTerm}
        onSearch={handleSearch}
      />

      <div className="overflow-hidden rounded-xl border border-outline-variant/60 bg-surface-container-lowest shadow-xs">
        <AdminOrdersTable orders={orders} isLoading={isLoading} />

        <Pagination
          page={page}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={totalItems}
          onPageChange={setPage}
        />
      </div>

      <AdminOrdersInsights
        pendingCount={pendingCount}
        completionRate={completionRate}
        onGoToPending={() => handleStatusChange('PENDING')}
      />
    </div>
  );
}
