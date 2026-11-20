import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils/cn';
import { useCategoriesQuery } from '@/features/categories/hooks';

type Props = {
  categoryId: number | null;
  onCategoryChange: (id: number | null) => void;
  searchTerm: string;
  onSearch: (value: string) => void;
};

export function AdminProductsFilters({
  categoryId,
  onCategoryChange,
  searchTerm,
  onSearch,
}: Props) {
  const { data: categories = [] } = useCategoriesQuery();

  const categoryTabs: Array<{ label: string; value: number | null }> = [
    { label: 'All', value: null },
    ...categories.map((c) => ({
      label: c.name,
      value: Number(c.id),
    })),
  ];

  return (
    <div className="mb-8 grid grid-cols-12 items-center gap-4">
      <div className="scrollbar-hide col-span-12 flex gap-2 overflow-x-auto pb-1 lg:col-span-8">
        {categoryTabs.map((tab) => (
          <button
            key={tab.label}
            type="button"
            onClick={() => onCategoryChange(tab.value)}
            className={cn(
              'cursor-pointer whitespace-nowrap rounded-full px-4 py-2 font-label text-[11px] font-bold uppercase tracking-[0.16em] transition-colors',
              categoryId === tab.value
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
            placeholder="Search by name, SKU or category..."
            value={searchTerm}
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
