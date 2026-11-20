import { cn } from '@/lib/utils/cn';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, type = 'text', ...props }: InputProps) {
  return (
    <input
      type={type}
      className={cn(
        'flex h-11 w-full rounded-md border border-outline-variant bg-surface-container-lowest px-3.5 py-2 text-sm text-on-surface placeholder:text-outline/70 outline-none transition-colors hover:border-outline focus:border-primary focus:ring-1 focus:ring-primary aria-[invalid=true]:border-error aria-[invalid=true]:focus:ring-error disabled:cursor-not-allowed disabled:bg-surface-container-low disabled:opacity-60',
        className,
      )}
      {...props}
    />
  );
}
