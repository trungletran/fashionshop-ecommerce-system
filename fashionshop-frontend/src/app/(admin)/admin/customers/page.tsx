'use client';

import { useState, useMemo } from 'react';
import {
  useAdminCustomerAccountsQuery,
  useDeleteAdminUserMutation,
  useActivateAdminUserMutation,
} from '@/features/users/hooks';
import { EmptyState } from '@/components/common/empty-state';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { PageHeader } from '@/components/common/page-header';
import { Pagination } from '@/components/common/pagnition';
import { Input } from '@/components/ui/input';
import { CustomerStats } from '@/features/users/components/admin/customer-stats';
import { CustomerTable } from '@/features/users/components/admin/customer-table';
import { toast } from 'sonner';
import { useDebounce } from '@/hooks/use-debounce';
import { cn } from '@/lib/utils/cn';

export default function AdminCustomersPage() {
  const { data: customers = [], isLoading } = useAdminCustomerAccountsQuery();
  const deleteMutation = useDeleteAdminUserMutation();
  const activateMutation = useActivateAdminUserMutation();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const debouncedSearch = useDebounce(searchTerm, 300);

  const handleStatusFilterChange = (nextStatus: 'all' | 'active' | 'inactive') => {
    setStatusFilter(nextStatus);
    setPage(1);
  };

  const toSearchable = (value: unknown) => String(value ?? '').toLowerCase();

  const handleActivate = (id: string) => {
    activateMutation.mutate(id, {
      onSuccess: () => {
        toast.success('Customer account restored successfully');
      },
      onError: () => {
        toast.error('Failed to restore customer account');
      },
    });
  };

  const filteredCustomers = useMemo(() => {
    const keyword = debouncedSearch.trim().toLowerCase();

    return customers.filter((customer) => {
      const matchSearch =
        keyword.length === 0 ||
        toSearchable(customer.fullName).includes(keyword) ||
        toSearchable(customer.email).includes(keyword) ||
        toSearchable(customer.id).includes(keyword);
      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && customer.isActive !== false) ||
        (statusFilter === 'inactive' && customer.isActive === false);

      return matchSearch && matchStatus;
    });
  }, [customers, debouncedSearch, statusFilter]);

  const totalItems = filteredCustomers.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  const paginatedCustomers = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredCustomers.slice(start, start + pageSize);
  }, [filteredCustomers, page, pageSize]);

  const stats = useMemo(() => {
    const totalSpend = customers.reduce((acc, c) => acc + (c.totalSpend || 0), 0);
    const avgSpend = customers.length > 0 ? totalSpend / customers.length : 0;

    return {
      totalActive: customers.filter((c) => c.isActive !== false).length,
      avgSpend,
      newRegistrations: customers.length,
    };
  }, [customers]);

  const handleDelete = () => {
    if (!deleteId) return;
    deleteMutation.mutate(deleteId, {
      onSuccess: () => {
        toast.success('Customer account deleted successfully');
        setDeleteId(null);
      },
      onError: () => {
        toast.error('Failed to delete customer account');
      },
    });
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <PageHeader
        eyebrow="Directory"
        title="Customers"
        description="Manage your studio's client base and account status."
      />

      <CustomerStats
        totalActive={stats.totalActive}
        avgSpend={stats.avgSpend}
        newRegistrations={stats.newRegistrations}
      />

      <div className="grid grid-cols-12 items-center gap-4">
        <div className="col-span-12 flex flex-wrap items-center gap-2 lg:col-span-8">
          <span className="mr-1 font-label text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">
            Filter:
          </span>
          {(['all', 'active', 'inactive'] as const).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => handleStatusFilterChange(status)}
              className={cn(
                'cursor-pointer rounded-full px-4 py-2 font-label text-[11px] font-bold uppercase tracking-[0.16em] transition-colors',
                statusFilter === status
                  ? 'bg-primary text-on-primary'
                  : 'border border-outline-variant/60 bg-surface-container-lowest text-on-surface-variant hover:border-primary hover:text-primary',
              )}
            >
              {status}
            </button>
          ))}
        </div>

        <div className="col-span-12 lg:col-span-4">
          <div className="relative w-full">
            <span className="material-symbols-outlined pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-lg text-outline">
              search
            </span>
            <Input
              className="pl-10"
              placeholder="Search customers by name or email..."
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {totalItems === 0 && !isLoading ? (
          <EmptyState
            title="No customers found"
            description="Try adjusting your search or filters to find what you're looking for."
            actionLabel="Reset filters"
            onAction={() => {
              setSearchTerm('');
              handleStatusFilterChange('all');
            }}
          />
        ) : (
          <div className="overflow-hidden rounded-xl border border-outline-variant/60 bg-surface-container-lowest shadow-xs">
            <CustomerTable
              customers={paginatedCustomers}
              onDelete={setDeleteId}
              onActivate={handleActivate}
              isLoading={isLoading}
            />
            <Pagination
              page={page}
              totalPages={totalPages}
              pageSize={pageSize}
              totalItems={totalItems}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(deleteId)}
        title="Delete customer account?"
        description="Are you sure you want to delete this customer account? This action cannot be undone and will remove all associated data."
        destructive
        confirmLabel="Delete"
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
