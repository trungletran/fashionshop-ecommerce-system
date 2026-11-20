import Link from 'next/link';
import { Button } from '@/components/ui/button';

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  action?: React.ReactNode;
};

export function PageHeader({ eyebrow, title, description, actionLabel, actionHref, action }: PageHeaderProps) {
  return (
    <header className="mb-10 flex flex-col gap-4 border-b border-outline-variant/60 pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-2">
        {eyebrow ? (
          <p className="font-label text-[10px] font-bold uppercase tracking-[0.26em] text-on-surface-variant">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="font-headline text-3xl font-black uppercase tracking-tight text-primary sm:text-4xl">
          {title}
        </h1>
        {description ? <p className="max-w-2xl text-sm text-on-surface-variant">{description}</p> : null}
      </div>
      {action ?? (actionHref && actionLabel ? (
        <Button asChild>
          <Link href={actionHref}>{actionLabel}</Link>
        </Button>
      ) : null)}
    </header>
  );
}
