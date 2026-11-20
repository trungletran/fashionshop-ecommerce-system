'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/common/page-header';
import { Button } from '@/components/ui/button';
import { useDashboardQuery } from '@/features/dashboard/hooks';
import { DashboardView } from '@/features/dashboard/components/dashboard-view';

function currentDate(offsetDays = 0) {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().slice(0, 10);
}

export default function AdminDashboardPage() {
  const [from, setFrom] = useState(currentDate(-30));
  const [to, setTo] = useState(currentDate());
  const query = useDashboardQuery(from, to);

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <PageHeader
        eyebrow="Overview & Core Metrics"
        title="Dashboard"
        action={
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex h-11 items-center gap-2 rounded-md border border-outline-variant bg-surface-container-lowest px-3.5 text-xs font-medium text-on-surface">
              <span className="material-symbols-outlined text-base text-outline">calendar_today</span>
              <input
                type="date"
                aria-label="Start date"
                value={from}
                onChange={(event) => setFrom(event.target.value)}
                className="cursor-pointer border-none bg-transparent p-0 text-xs text-on-surface outline-none"
              />
              <span className="text-outline">→</span>
              <input
                type="date"
                aria-label="End date"
                value={to}
                onChange={(event) => setTo(event.target.value)}
                className="cursor-pointer border-none bg-transparent p-0 text-xs text-on-surface outline-none"
              />
            </div>
            <Button type="button">
              <span className="material-symbols-outlined text-base">download</span>
              <span>Export Report</span>
            </Button>
          </div>
        }
      />

      <DashboardView data={query.data} isLoading={query.isLoading} />
    </div>
  );
}
