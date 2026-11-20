import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-md font-label text-xs font-bold uppercase tracking-[0.18em] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer',
  {
    variants: {
      variant: {
        default: 'bg-primary text-on-primary shadow-sm hover:bg-primary-container active:scale-[0.99]',
        secondary: 'bg-surface-container text-on-surface hover:bg-surface-container-high active:scale-[0.99]',
        outline: 'border border-outline-variant bg-surface-container-lowest text-on-surface hover:border-primary hover:bg-surface-container-low',
        ghost: 'text-on-surface-variant hover:bg-surface-container hover:text-primary',
        destructive: 'bg-error text-on-error shadow-sm hover:opacity-90 active:scale-[0.99]',
      },
      size: {
        default: 'h-11 px-6 py-2.5',
        sm: 'h-9 px-4 text-[11px]',
        lg: 'h-12 px-8',
        icon: 'h-10 w-10 px-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : 'button';
  return <Comp className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}
