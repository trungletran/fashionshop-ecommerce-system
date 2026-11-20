import { ChevronDown, Search } from 'lucide-react';
import type { ProductSortOption } from './types';

type ProductToolbarProps = {
  searchTerm: string;
  resultCount: number;
  sortBy: ProductSortOption;
  onSearchChange: (value: string) => void;
  onSortChange: (value: ProductSortOption) => void;
};

const sortOptions: ProductSortOption[] = ['Newest Arrivals', 'Price: Low to High', 'Price: High to Low', 'Category'];

export function ProductToolbar({ searchTerm, resultCount, sortBy, onSearchChange, onSortChange }: ProductToolbarProps) {
  return (
    <div className="space-y-6">
      <label className="relative block">
        <span className="sr-only">Search products</span>
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-outline" />
        <input
          value={searchTerm}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search products..."
          className="h-12 w-full rounded-md border border-outline-variant bg-surface-container-lowest pl-11 pr-4 text-sm text-on-surface outline-none transition-colors placeholder:text-outline/70 hover:border-outline focus:border-primary focus:ring-1 focus:ring-primary"
          aria-label="Search products"
        />
      </label>

      <div className="flex flex-col gap-3 border-b border-outline-variant/60 pb-5 md:flex-row md:items-center md:justify-between">
        <p className="font-label text-[11px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">{resultCount} Results Found</p>

        <div className="flex items-center gap-3 self-start md:self-auto">
          <span className="font-label text-[11px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">Sort By:</span>
          <label className="relative inline-flex items-center">
            <select
              value={sortBy}
              onChange={(event) => onSortChange(event.target.value as ProductSortOption)}
              className="cursor-pointer appearance-none rounded-md border border-outline-variant bg-surface-container-lowest py-2 pl-3 pr-9 font-label text-xs font-bold uppercase tracking-[0.16em] text-primary outline-none transition-colors focus:border-primary"
              aria-label="Sort products"
            >
              {sortOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 h-4 w-4 text-outline" />
          </label>
        </div>
      </div>
    </div>
  );
}