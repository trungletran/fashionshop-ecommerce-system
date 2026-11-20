'use client';

import { cn } from '@/lib/utils/cn';

type Props = {
  page: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
};

export function Pagination({
  page,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
}: Props) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-t border-outline-variant/60 px-6 py-5">
      <p className="font-body text-xs text-on-surface-variant">
        Showing{' '}
        <span className="font-bold text-primary">
          {Math.min((page - 1) * pageSize + 1, totalItems)} – {Math.min(page * pageSize, totalItems)}
        </span>{' '}
        of <span className="font-bold text-primary">{totalItems}</span> items
      </p>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
          aria-label="Previous page"
          className="flex h-9 w-9 items-center justify-center rounded-md border border-outline-variant bg-surface-container-lowest text-on-surface-variant transition-colors hover:border-primary hover:text-primary disabled:pointer-events-none disabled:opacity-35"
        >
          <span className="material-symbols-outlined text-lg">chevron_left</span>
        </button>

        {Array.from({ length: totalPages }).map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => onPageChange(i + 1)}
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-md font-label text-xs font-bold transition-colors',
              page === i + 1
                ? 'bg-primary text-on-primary'
                : 'border border-outline-variant bg-surface-container-lowest text-on-surface hover:border-primary',
            )}
          >
            {i + 1}
          </button>
        ))}

        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          aria-label="Next page"
          className="flex h-9 w-9 items-center justify-center rounded-md border border-outline-variant bg-surface-container-lowest text-on-surface-variant transition-colors hover:border-primary hover:text-primary disabled:pointer-events-none disabled:opacity-35"
        >
          <span className="material-symbols-outlined text-lg">chevron_right</span>
        </button>
      </div>
    </div>
  );
}
