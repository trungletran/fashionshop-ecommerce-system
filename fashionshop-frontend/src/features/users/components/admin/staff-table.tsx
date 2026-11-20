'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import type { StaffAccount } from '@/types/user';

type Props = {
  staffRows: StaffAccount[];
  onDelete: (id: string) => void;
  onActivate?: (id: string) => void;
  isLoading?: boolean;
};

export function StaffTable({ staffRows, onDelete, onActivate, isLoading }: Props) {
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
              Staff Member
            </th>
            <th className="px-6 py-4 font-label text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
              Contact
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
          {staffRows.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-6 py-16 text-center text-sm text-on-surface-variant">
                No staff accounts found.
              </td>
            </tr>
          ) : (
            staffRows.map((staff) => (
              <tr
                key={staff.id}
                className="transition-colors hover:bg-surface-container-low/60"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3.5">
                    <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-full border border-outline-variant/60 bg-surface-container">
                      {staff.avatarUrl ? (
                        <Image
                          src={staff.avatarUrl}
                          alt={staff.fullName}
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
                      <Link
                        href={`/admin/staff-accounts/${staff.id}`}
                        className="text-sm font-semibold text-primary underline-offset-4 hover:underline"
                      >
                        {staff.fullName}
                      </Link>
                      <span className="font-label text-[10px] uppercase tracking-wider text-outline">
                        ID: #{staff.id} · {staff.role}
                      </span>
                    </div>
                  </div>
                </td>

                <td className="px-6 py-4">
                  <span className="text-sm text-on-surface-variant">{staff.email}</span>
                </td>

                <td className="px-6 py-4">
                  <Badge variant={staff.isActive !== false ? 'success' : 'error'}>
                    {staff.isActive !== false ? 'Active' : 'Inactive'}
                  </Badge>
                </td>

                <td className="space-x-4 px-6 py-4 text-right">
                  <Link
                    href={`/admin/staff-accounts/${staff.id}/edit`}
                    className="font-label text-[10px] font-bold uppercase tracking-[0.16em] text-primary underline-offset-4 hover:underline"
                  >
                    Edit
                  </Link>
                  {staff.isActive === false ? (
                    <button
                      type="button"
                      onClick={() => onActivate?.(staff.id)}
                      className="cursor-pointer font-label text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-700 underline-offset-4 hover:underline"
                    >
                      Activate
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onDelete(staff.id)}
                      className="cursor-pointer font-label text-[10px] font-bold uppercase tracking-[0.16em] text-error underline-offset-4 hover:underline"
                    >
                      Deactivate
                    </button>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
