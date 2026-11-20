'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="container-shell flex min-h-[70vh] flex-col items-center justify-center py-16 text-center">
      <p className="font-label text-[10px] font-bold uppercase tracking-[0.28em] text-on-surface-variant">
        System Error
      </p>
      <h1 className="font-headline mt-3 text-4xl font-black uppercase tracking-tight text-primary sm:text-5xl">
        Something went wrong
      </h1>
      <p className="mt-3 max-w-md text-sm text-on-surface-variant">
        Please retry the action or return to the storefront.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button type="button" onClick={reset}>
          Try again
        </Button>
        <Button asChild variant="outline">
          <Link href="/">Home</Link>
        </Button>
      </div>
    </div>
  );
}
