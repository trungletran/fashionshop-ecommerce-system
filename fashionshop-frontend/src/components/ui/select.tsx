import { cn } from '@/lib/utils/cn';

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

export function Select({ className, children, ...props }: SelectProps) {
  return (
    <div className="relative">
      <select
        className={cn(
          'flex h-11 w-full appearance-none rounded-md border border-outline-variant bg-surface-container-lowest px-3.5 pr-10 text-sm text-on-surface outline-none transition-colors hover:border-outline focus:border-primary focus:ring-1 focus:ring-primary aria-[invalid=true]:border-error aria-[invalid=true]:focus:ring-error disabled:cursor-not-allowed disabled:bg-surface-container-low disabled:opacity-60 cursor-pointer',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <span
        aria-hidden="true"
        className="material-symbols-outlined pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-lg text-outline"
      >
        expand_more
      </span>
    </div>
  );
}
