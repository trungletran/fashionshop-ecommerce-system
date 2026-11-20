import { cn } from '@/lib/utils/cn';

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn(
        'block font-label text-[11px] font-bold uppercase tracking-[0.18em] text-on-surface-variant',
        className,
      )}
      {...props}
    />
  );
}
