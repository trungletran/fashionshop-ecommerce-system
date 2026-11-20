'use client';

import Link from 'next/link';
import { StaffForm } from '@/features/users/components/admin/staff-form';

export default function AddStaffPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header className="border-b border-outline-variant/60 pb-6">
        <nav className="mb-3 flex items-center gap-2 font-label text-[10px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">
          <Link href="/admin/staff-accounts" className="transition-colors hover:text-primary">
            Staff Accounts
          </Link>
          <span className="material-symbols-outlined text-xs">chevron_right</span>
          <span className="text-primary">New Staff</span>
        </nav>
        <h1 className="font-headline text-3xl font-black uppercase tracking-tight text-primary sm:text-4xl">
          Add Staff Member
        </h1>
        <p className="mt-2 text-sm text-on-surface-variant">
          Register a new member to the 18 Studio internal portal.
        </p>
      </header>
      <StaffForm />
    </div>
  );
}
