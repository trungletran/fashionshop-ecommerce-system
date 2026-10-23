'use client';

import Link from 'next/link';
import Image from 'next/image';
import { EmptyState } from '@/components/common/empty-state';
import { LoadingState } from '@/components/common/loading-state';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useMeQuery } from '@/features/users/hooks';
import { useMyOrdersQuery as useOrdersQueryFromOrders } from '@/features/orders/hooks';

export default function AccountPage() {
  const meQuery = useMeQuery();
  const ordersQuery = useOrdersQueryFromOrders();
  const hasBackendError = meQuery.isError || ordersQuery.isError;

  if (meQuery.isPending || ordersQuery.isPending) return <LoadingState />;
  if (!meQuery.data && !hasBackendError) {
    return <EmptyState title="Account not found" description="Please log in again." actionLabel="Log in" actionHref="/auth" />;
  }

  const user = meQuery.data;
  const accountOrders = ordersQuery.data ?? [];

  return (
    <main className="container-shell min-h-screen py-10 font-body text-on-surface md:py-14">
      {hasBackendError && <div className="mb-8 rounded-xl border border-outline-variant bg-surface-container-low p-4 text-center">
        <p className="text-sm text-on-surface-variant">Unable to load all account data.</p>
        <Link href="/auth" className="mt-3 inline-block rounded-lg bg-primary px-6 py-3 text-xs font-bold uppercase tracking-[0.18em] text-on-primary">Log in</Link>
      </div>}

      <section className="mb-8 overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest p-6 shadow-sm md:p-10">
        <div className="flex flex-col items-center gap-7 sm:flex-row sm:items-start md:gap-10">
          <div className="relative h-32 w-32 flex-shrink-0 overflow-hidden rounded-full border-4 border-surface-container bg-surface-container sm:h-40 sm:w-40">
            {user?.avatarUrl ? <Image alt={user.fullName} src={user.avatarUrl} fill sizes="(max-width: 640px) 128px, 160px" className="object-cover" /> :
              <div className="flex h-full w-full items-center justify-center text-5xl font-black uppercase text-on-surface-variant">{user?.fullName?.charAt(0).toUpperCase() ?? 'U'}</div>}
          </div>
          <div className="min-w-0 flex-1 text-center sm:text-left">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.28em] text-on-surface-variant">Your account</p>
            <h1 className="font-headline break-words text-4xl font-black uppercase tracking-[-0.06em] sm:text-5xl md:text-6xl">{user?.fullName ?? 'Your Account'}</h1>
            <p className="mt-2 text-sm text-on-surface-variant">{user?.email}</p>
            <div className="mt-6 flex flex-wrap justify-center gap-x-10 gap-y-4 sm:justify-start">
              <div><p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">Orders</p><p className="text-xl font-bold">{accountOrders.length}</p></div>
              <div><p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">Member since</p><p className="text-xl font-bold">{user?.createdAt ? new Date(user.createdAt).getFullYear() : '—'}</p></div>
              <div><p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">Phone</p><p className="text-xl font-bold">{user?.phoneNumber || '—'}</p></div>
            </div>
            <Link href="/account/edit" className="mt-7 inline-flex rounded-lg bg-primary px-6 py-3 text-xs font-bold uppercase tracking-[0.18em] text-on-primary transition hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">Edit profile</Link>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-12">
        <Card className="overflow-hidden rounded-xl border-outline-variant bg-surface-container-lowest shadow-sm md:col-span-8">
          <CardHeader className="flex items-center justify-between bg-surface-container-low">
            <h2 className="font-headline text-lg font-bold uppercase tracking-tight">Account details</h2>
            <span className="material-symbols-outlined text-on-surface-variant" aria-hidden="true">verified_user</span>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-x-8 gap-y-7 px-6 py-7 sm:grid-cols-2 md:px-8">
            <div><p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">Full name</p><p className="text-sm font-medium">{user?.fullName ?? 'Unavailable'}</p></div>
            <div><p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">Email address</p><p className="break-all text-sm font-medium">{user?.email ?? 'Unavailable'}</p></div>
            <div><p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">Phone</p><p className="text-sm font-medium">{user?.phoneNumber || 'Not provided'}</p></div>
            <div><p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">Address</p><p className="text-sm font-medium">{user?.address || 'Not provided'}</p></div>
          </CardContent>
        </Card>
        <section className="rounded-xl bg-primary p-7 text-on-primary md:col-span-4 md:p-8">
          <h2 className="font-headline text-lg font-bold uppercase tracking-tight">Membership</h2>
          <p className="mt-1 text-xs uppercase tracking-[0.2em] text-on-primary/60">{user?.accountStatus ?? 'Active'}</p>
          <div className="mt-10 border-t border-on-primary/15 pt-6">
            <p className="font-headline text-4xl font-black">{accountOrders.length}</p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-on-primary/60">Orders placed</p>
            <Link href="/orders" className="mt-6 inline-block text-[10px] font-bold uppercase tracking-[0.2em] hover:underline">View orders →</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
