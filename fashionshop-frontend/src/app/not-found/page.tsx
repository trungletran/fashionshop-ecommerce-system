import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFoundPage() {
  return (
    <div className="container-shell flex min-h-[70vh] flex-col items-center justify-center py-16 text-center">
      <p className="font-label text-[10px] font-bold uppercase tracking-[0.28em] text-on-surface-variant">
        Error 404
      </p>
      <h1 className="font-headline mt-3 text-4xl font-black uppercase tracking-tight text-primary sm:text-5xl">
        Page not found
      </h1>
      <p className="mt-3 max-w-md text-sm text-on-surface-variant">
        The page you requested does not exist.
      </p>
      <div className="mt-8">
        <Button asChild>
          <Link href="/">Return home</Link>
        </Button>
      </div>
    </div>
  );
}
