'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import { clearSessionAndRedirect, useAuthSession } from '@/features/auth/store';

const navigationByRole = {
  STAFF: [
    { href: '/staff/products', label: 'Products', icon: 'inventory_2' },
    { href: '/staff/categories', label: 'Categories', icon: 'warehouse' },
    { href: '/staff/orders', label: 'Orders', icon: 'shopping_bag' },
  ],
  ADMIN: [
    { href: '/admin/products', label: 'Products', icon: 'inventory_2' },
    { href: '/admin/categories', label: 'Categories', icon: 'warehouse' },
    { href: '/admin/orders', label: 'Orders', icon: 'shopping_bag' },
    { href: '/admin/customers', label: 'Customers', icon: 'group' },
    { href: '/admin/staff-accounts', label: 'Staff', icon: 'badge' },
  ],
} as const;

export function RoleShell({ role, children }: { role: 'STAFF' | 'ADMIN'; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const session = useAuthSession();
  const [failedAvatarUrl, setFailedAvatarUrl] = useState<string | null>(null);
  const avatarUrl = session.user?.avatarUrl && session.user.avatarUrl !== failedAvatarUrl ? session.user.avatarUrl : null;
  const initials =
    session.user?.fullName
      ?.split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || (role === 'ADMIN' ? 'AD' : 'ST');

  return (
    <div className="min-h-screen bg-surface font-body text-on-surface">
      <div className="flex min-h-screen">
        {/* SIDE NAV BAR */}
        <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-outline-variant/60 bg-surface-container-lowest py-8">
          <div className="mb-10 px-6">
            <Link href="/" className="block">
              <h1 className="font-headline text-xl font-black uppercase tracking-[0.22em] text-primary">
                18 Studio
              </h1>
              <p className="mt-1 font-label text-[10px] font-bold uppercase tracking-[0.24em] text-on-surface-variant">
                {role === 'ADMIN' ? 'Admin Console' : 'Staff Console'}
              </p>
            </Link>
          </div>

          <nav className="flex-1 space-y-1 px-3" aria-label={`${role} navigation`}>
            {navigationByRole[role].map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3.5 py-2.5 font-label text-xs font-bold uppercase tracking-[0.16em] transition-colors',
                    active
                      ? 'bg-primary text-on-primary'
                      : 'text-on-surface-variant hover:bg-surface-container hover:text-primary',
                  )}
                >
                  <span
                    className="material-symbols-outlined text-[20px]"
                    style={{ fontVariationSettings: active ? "'FILL' 1" : undefined }}
                  >
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-auto border-t border-outline-variant/60 px-4 pt-5">
            <div className="mb-3 flex items-center gap-3 rounded-lg border border-outline-variant/50 bg-surface-container-low p-3">
              <div className="relative flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary text-[11px] font-bold text-on-primary">
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt={session.user?.fullName ?? 'User avatar'}
                    fill
                    sizes="36px"
                    className="object-cover"
                    onError={() => setFailedAvatarUrl(session.user?.avatarUrl ?? null)}
                  />
                ) : (
                  initials
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs font-bold text-primary">
                  {session.user?.fullName ?? (role === 'ADMIN' ? 'Admin User' : 'Staff Member')}
                </p>
                <p className="font-label text-[10px] font-bold uppercase tracking-[0.16em] text-on-surface-variant">
                  {role}
                </p>
              </div>
            </div>

            <button
              type="button"
              className="flex w-full cursor-pointer items-center gap-2.5 rounded-md px-3 py-2 font-label text-[11px] font-bold uppercase tracking-[0.16em] text-error transition-colors hover:bg-error-container/40"
              onClick={() => clearSessionAndRedirect(router)}
            >
              <span className="material-symbols-outlined text-base">logout</span>
              <span>Log out</span>
            </button>
          </div>
        </aside>

        <div className="ml-64 flex min-h-screen flex-1 flex-col">
          <main className="min-h-screen flex-1 bg-surface px-6 py-8 lg:px-10 lg:py-10">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
