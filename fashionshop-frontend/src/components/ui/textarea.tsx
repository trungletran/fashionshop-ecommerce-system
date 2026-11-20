import { cn } from '@/lib/utils/cn';

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Textarea({ className, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(
        'flex min-h-28 w-full resize-y rounded-md border border-outline-variant bg-surface-container-lowest px-3.5 py-3 text-sm text-on-surface placeholder:text-outline/70 outline-none transition-colors hover:border-outline focus:border-primary focus:ring-1 focus:ring-primary aria-[invalid=true]:border-error aria-[invalid=true]:focus:ring-error disabled:cursor-not-allowed disabled:bg-surface-container-low disabled:opacity-60',
        className,
      )}
      {...props}
    />
  );
}
