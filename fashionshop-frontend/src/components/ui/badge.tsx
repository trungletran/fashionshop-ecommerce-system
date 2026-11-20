import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-label text-[10px] font-bold uppercase tracking-[0.14em]',
  {
    variants: {
      variant: {
        default: 'bg-primary text-on-primary',
        secondary: 'bg-surface-container text-on-surface-variant',
        outline: 'border border-outline-variant bg-surface-container-lowest text-on-surface',
        success: 'bg-emerald-50 text-emerald-700',
        warning: 'bg-amber-50 text-amber-700',
        error: 'bg-error-container/60 text-error',
      },
    },
    defaultVariants: {
      variant: 'secondary',
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
