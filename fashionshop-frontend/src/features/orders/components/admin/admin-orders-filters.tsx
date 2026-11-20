import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils/cn';
import type { OrderStatus } from '@/types/order';

type Props = {
  statusFilter: OrderStatus | '';
  onStatusChange: (status: OrderStatus | '') => void;
  searchTerm: string;
  onSearch: (value: string) => void;
};

const STATUS_TABS: { label: string; value: OrderStatus | '' }[] = [
  { label: 'All Orders', value: '' },
  { label: 'Pending', value: 'PENDING' },
  { label: 'Confirmed', value: 'CONFIRMED' },
  { label: 'Processing', value: 'PROCESSING' },
  { label: 'Shipped', value: 'SHIPPED' },
  { label: 'Delivered', value: 'DELIVERED' },
  { label: 'Cancelled', value: 'CANCELLED' },
];

export function AdminOrdersFilters({
  statusFilter,
  onStatusChange,
  searchTerm,
  onSearch,
}: Props) {
  return (
    <div className="mb-8 grid grid-cols-12 items-center gap-4">
      <div className="scrollbar-hide col-span-12 flex gap-2 overflow-x-auto pb-1 lg:col-span-8">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => onStatusChange(tab.value)}
            className={cn(
              'cursor-pointer whitespace-nowrap rounded-full px-4 py-2 font-label text-[11px] font-bold uppercase tracking-[0.16em] transition-colors',
              statusFilter === tab.value
                ? 'bg-primary text-on-primary'
                : 'border border-outline-variant/60 bg-surface-container-lowest text-on-surface-variant hover:border-primary hover:text-primary',
            )}
          >
            {tab.label}
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
            placeholder="Search order ID or customer..."
            value={searchTerm}
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
