import Link from 'next/link';
import { Button } from '@/components/ui/button';

type EmptyStateProps = {
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
};

export function EmptyState({ title, description, actionLabel, actionHref, onAction, icon }: EmptyStateProps) {
  return (
    <div className="mx-auto my-8 max-w-2xl rounded-xl border border-dashed border-outline-variant bg-surface-container-lowest px-6 py-14 text-center">
      {icon ? (
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-surface-container text-primary">
          {icon}
        </div>
      ) : null}
      <h3 className="font-headline text-lg font-extrabold uppercase tracking-tight text-primary">{title}</h3>
      {description ? <p className="mx-auto mt-2 max-w-md text-sm text-on-surface-variant">{description}</p> : null}

      {actionLabel && (
        <div className="mt-6">
          {actionHref ? (
            <Button asChild>
              <Link href={actionHref}>{actionLabel}</Link>
            </Button>
          ) : onAction ? (
            <Button type="button" onClick={onAction}>
              {actionLabel}
            </Button>
          ) : null}
        </div>
      )}
    </div>
  );
}
