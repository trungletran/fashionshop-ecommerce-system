import { cn } from '@/lib/utils/cn';

type Column<T> = {
  header: string;
  cell: (row: T) => React.ReactNode;
  className?: string;
};

type DataTableProps<T> = {
  columns: Column<T>[];
  data: T[];
  emptyLabel?: string;
  isLoading?: boolean;
};

export function DataTable<T>({ columns, data, emptyLabel = 'No records found', isLoading }: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div className="animate-pulse rounded-xl border border-outline-variant/60 bg-surface-container-lowest px-6 py-10 text-sm text-on-surface-variant">
        <div className="space-y-4">
          <div className="h-4 w-full rounded-md bg-surface-container" />
          <div className="h-4 w-full rounded-md bg-surface-container" />
          <div className="h-4 w-4/5 rounded-md bg-surface-container" />
        </div>
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="rounded-xl border border-dashed border-outline-variant bg-surface-container-lowest px-6 py-12 text-center text-sm text-on-surface-variant">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-outline-variant/60 bg-surface-container-lowest shadow-xs">
      <table className="w-full border-collapse text-left text-sm">
        <thead className="border-b border-outline-variant/60 bg-surface-container-low">
          <tr>
            {columns.map((column) => (
              <th
                key={column.header}
                className={cn(
                  'px-6 py-4 font-label text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant',
                  column.className,
                )}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-outline-variant/40">
          {data.map((row, index) => (
            <tr key={index} className="transition-colors hover:bg-surface-container-low/60">
              {columns.map((column) => (
                <td key={column.header} className={cn('px-6 py-4 align-middle', column.className)}>
                  {column.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
