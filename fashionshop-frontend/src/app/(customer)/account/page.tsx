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

  // Show loading state
  if (meQuery.isPending || ordersQuery.isPending) {
    return <LoadingState />;
  }

  if (!meQuery.data && !hasBackendError) {
    return (
      <EmptyState
        title="Account not found"
        description="Please log in again."
        actionLabel="Log in"
        actionHref="/auth"
      />
    );
  }

  const user = meQuery.data;
  const accountOrders = ordersQuery.data ?? [];

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-6 py-10 font-body text-on-surface md:px-12 lg:px-0 lg:py-14">
      {hasBackendError && (
        <div className="mb-8 rounded-lg bg-surface-container p-4 text-center">
          <p className="text-sm text-on-surface-variant">Unable to load account data. Showing layout while content is unavailable.</p>
          <Link
            href="/auth"
            className="mt-3 inline-block rounded-md bg-primary px-6 py-3 text-center text-sm font-bold uppercase tracking-[0.24em] text-on-primary no-underline transition-all hover:opacity-90"
          >
            Log In
          </Link>
        </div>
      )}
      <section className="mb-20">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-8 md:gap-12">
          <div className="h-48 w-48 flex-shrink-0 overflow-hidden rounded-lg bg-surface-container">
            {user?.avatarUrl ? (
              <Image alt={user.fullName} src={user.avatarUrl} width={192} height={192} className="h-full w-full object-cover grayscale" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-surface-container text-5xl font-black uppercase">
                {user?.fullName?.charAt(0).toUpperCase() ?? 'U'}
              </div>
            )}
          </div>

          <div className="flex-1">
            <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">Member</span>
            <h1 className="font-headline mb-6 text-5xl font-black uppercase tracking-[-0.06em] md:text-7xl">{user?.fullName ?? 'Your Account'}</h1>
            <div className="flex flex-wrap gap-x-12 gap-y-4">
              <div>
                <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">Orders</p>
                <p className="text-xl font-bold">{accountOrders.length}</p>
              </div>
              <div>
                <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">Since</p>
                <p className="text-xl font-bold">{new Date().getFullYear().toString()}</p>
              </div>
              <div>
                <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">Location</p>
                <p className="text-xl font-bold">Not Set</p>
              </div>
            </div>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/account/edit" className="rounded-md bg-primary px-8 py-3 text-sm font-bold uppercase tracking-[0.24em] text-on-primary transition-all duration-200 hover:scale-105 hover:opacity-90">
                Edit Profile
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
        <Card className="editorial-shadow overflow-hidden rounded-xl border-0 bg-surface-container-lowest md:col-span-8">
          <CardHeader className="mb-0 flex items-center justify-between border-b border-outline-variant px-8 py-6">
            <h2 className="font-headline text-2xl font-bold uppercase tracking-tight">Account Details</h2>
            <span className="material-symbols-outlined text-on-surface-variant">verified_user</span>
          </CardHeader>
          <CardContent className="space-y-8 px-8 py-8">
            <div className="grid grid-cols-1 gap-y-8 gap-x-12 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">Full Name</label>
                <p className="text-base font-medium">{user?.fullName ?? 'Unavailable'}</p>
              </div>
              <div>
                <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">Email Address</label>
                <p className="text-base font-medium">{user?.email ?? 'Unavailable'}</p>
              </div>
              <div>
                <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">Phone</label>
                <p className="text-base font-medium">{user?.phoneNumber ?? '+44 7700 900077'}</p>
              </div>
              <div>
                <label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.3em] text-on-surface-variant">Language Preference</label>
                <p className="text-base font-medium">English</p>
              </div>
            </div>

          </CardContent>
        </Card>

        <section className="rounded-xl bg-primary p-8 text-on-primary md:col-span-4">
          <div>
            <h2 className="font-headline mb-2 text-2xl font-bold uppercase tracking-tight">Status</h2>
            <p className="text-xs uppercase tracking-[0.3em] text-on-primary/60">Active Customer</p>
          </div>
          <div className="mt-20">
            <p className="font-headline mb-2 text-4xl font-black">{accountOrders.length}</p>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-60">Total Orders</p>
          </div>
          <div className="mt-6 border-t border-on-primary/10 pt-6">
            <Link href="/orders" className="text-[10px] font-bold uppercase tracking-[0.3em] hover:underline">
              View Benefits →
            </Link>
          </div>
        </section>


      </div>


    </main>
  );
}
