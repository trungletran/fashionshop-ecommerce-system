'use client';

import { use } from 'react';
import Link from 'next/link';
import { useAdminStaffAccountsQuery } from '@/features/users/hooks';
import { StaffForm } from '@/features/users/components/admin/staff-form';
import { LoadingState } from '@/components/common/loading-state';
import { EmptyState } from '@/components/common/empty-state';

export default function EditStaffPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: staffList, isLoading } = useAdminStaffAccountsQuery();

  if (isLoading) {
    return <LoadingState label="Loading account details" />;
  }

  const staff = staffList?.find((s) => s.id === id);

  if (!staff) {
    return (
      <EmptyState
        title="Staff Account Not Found"
        description="The account you are trying to edit does not exist."
        actionLabel="Back to Staff"
        actionHref="/admin/staff-accounts"
      />
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header className="border-b border-outline-variant/60 pb-6">
        <nav className="mb-3 flex items-center gap-2 font-label text-[10px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">
          <Link href="/admin/staff-accounts" className="transition-colors hover:text-primary">
            Staff Accounts
          </Link>
          <span className="material-symbols-outlined text-xs">chevron_right</span>
          <Link href={`/admin/staff-accounts/${id}`} className="transition-colors hover:text-primary">
            {staff.fullName}
          </Link>
          <span className="material-symbols-outlined text-xs">chevron_right</span>
          <span className="text-primary">Edit Profile</span>
        </nav>
        <h1 className="font-headline text-3xl font-black uppercase tracking-tight text-primary sm:text-4xl">
          Edit Staff Profile
        </h1>
        <p className="mt-2 text-sm text-on-surface-variant">
          Modify administrative access and personal information for this account.
        </p>
      </header>

      <StaffForm initialData={staff} />
    </div>
  );
}
