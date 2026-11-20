'use client';

import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import type { CustomerAccount } from '@/types/user';

type Props = {
  customers: CustomerAccount[];
  onDelete: (id: string) => void;
  onActivate?: (id: string) => void;
  isLoading?: boolean;
};

export function CustomerTable({ customers, onDelete, onActivate, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4 rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-8">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-14 rounded-md bg-surface-container" />
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-outline-variant/60 bg-surface-container-lowest shadow-xs">
      <table className="w-full border-collapse text-left">
        <thead className="border-b border-outline-variant/60 bg-surface-container-low">
          <tr>
            <th className="px-6 py-4 font-label text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
              Customer
            </th>
            <th className="px-6 py-4 font-label text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
              Contact
            </th>
            <th className="px-6 py-4 font-label text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
              Total Orders
            </th>
            <th className="px-6 py-4 font-label text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
              Total Spend
            </th>
            <th className="px-6 py-4 font-label text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
              Status
            </th>
            <th className="px-6 py-4 text-right font-label text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-outline-variant/40 font-body">
          {customers.map((customer) => (
            <tr
              key={customer.id}
              className="transition-colors hover:bg-surface-container-low/60"
            >
              <td className="px-6 py-4">
                <div className="flex items-center gap-3.5">
                  <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-full border border-outline-variant/60 bg-surface-container">
                    {customer.avatarUrl ? (
                      <Image
                        src={customer.avatarUrl}
                        alt={customer.fullName}
                        fill
                        sizes="40px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-on-surface-variant">
                        <span className="material-symbols-outlined text-lg">person</span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold text-primary">
                      {customer.fullName}
                    </span>
                    <span className="font-label text-[10px] uppercase tracking-wider text-outline">
                      ID: #{customer.id}
                    </span>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <span className="text-sm text-on-surface-variant">{customer.email}</span>
              </td>
              <td className="px-6 py-4">
                <span className="text-sm font-medium text-on-surface">{customer.totalOrders || 0}</span>
              </td>
              <td className="px-6 py-4 font-headline text-sm font-bold text-primary">
                ${Number(customer.totalSpend || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
              <td className="px-6 py-4">
                <Badge variant={customer.isActive !== false ? 'success' : 'error'}>
                  {customer.isActive !== false ? 'Active' : 'Inactive'}
                </Badge>
              </td>
              <td className="space-x-4 px-6 py-4 text-right">
                {customer.isActive === false ? (
                  <button
                    type="button"
                    onClick={() => onActivate?.(customer.id)}
                    className="cursor-pointer font-label text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-700 underline-offset-4 hover:underline"
                  >
                    Activate
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => onDelete(customer.id)}
                  className="cursor-pointer font-label text-[10px] font-bold uppercase tracking-[0.16em] text-error underline-offset-4 hover:underline"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
