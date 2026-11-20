'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { StaffTable } from '@/features/users/components/admin/staff-table';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { PageHeader } from '@/components/common/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  useAdminStaffAccountsQuery,
  useDeleteAdminUserMutation,
  useActivateAdminUserMutation,
} from '@/features/users/hooks';
import { toast } from 'sonner';
import { useDebounce } from '@/hooks/use-debounce';
import { cn } from '@/lib/utils/cn';

export default function AdminStaffAccountsPage() {
  const { data: staff = [], isLoading } = useAdminStaffAccountsQuery();
  const deleteMutation = useDeleteAdminUserMutation();
  const activateMutation = useActivateAdminUserMutation();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const debouncedSearch = useDebounce(searchTerm, 300);

  const handleActivate = (id: string) => {
    activateMutation.mutate(id, {
      onSuccess: () => {
        toast.success('Staff account restored successfully');
      },
      onError: () => {
        toast.error('Failed to restore staff account');
      },
    });
  };

  const filteredStaff = useMemo(() => {
    return staff.filter((s) => {
      const matchSearch =
        s.fullName.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        s.email.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        String(s.id).toLowerCase().includes(debouncedSearch.toLowerCase());
      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && s.isActive !== false) ||
        (statusFilter === 'inactive' && s.isActive === false);

      return matchSearch && matchStatus;
    });
  }, [staff, debouncedSearch, statusFilter]);

  const handleDelete = () => {
    if (!deleteId) return;
    deleteMutation.mutate(deleteId, {
      onSuccess: () => {
        toast.success('Account deactivated');
        setDeleteId(null);
      },
      onError: () => {
        toast.error('Failed to deactivate account');
      },
    });
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <PageHeader
        eyebrow="Access Control"
        title="Staff Accounts"
        description="Manage administrative and staff access across the studio console."
        action={
          <Button asChild>
            <Link href="/admin/staff-accounts/new">
              <span className="material-symbols-outlined text-base">add</span>
              <span>Add Staff Member</span>
            </Link>
          </Button>
        }
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
              onClick={() => setStatusFilter(status)}
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
              placeholder="Search staff by name, email or ID..."
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <StaffTable
        isLoading={isLoading}
        staffRows={filteredStaff}
        onDelete={setDeleteId}
        onActivate={handleActivate}
      />

      <ConfirmDialog
        open={Boolean(deleteId)}
        title="Deactivate staff account?"
        description="Are you sure you want to deactivate this account? Access will be revoked immediately while account history is preserved."
        destructive
        confirmLabel="Deactivate"
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
