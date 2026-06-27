'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useHomeQuery } from '@/features/home/hooks';

const ALL_FILTER = 'ALL';
const MAX_NEW_ARRIVALS = 3;

function formatPrice(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value);
}

export function NewArrivalsSection() {
  const { data, isLoading } = useHomeQuery();
  const arrivals = data?.newArrivals ?? [];
  const [activeCategory, setActiveCategory] = useState<string>(ALL_FILTER);

  const categories = useMemo(() => {
    const names = arrivals
      .map((item) => item.categoryName?.trim())
      .filter((value): value is string => Boolean(value));

    return [ALL_FILTER, ...Array.from(new Set(names))];
  }, [arrivals]);

  const visibleArrivals = useMemo(() => {
    if (activeCategory === ALL_FILTER) {
      return arrivals.slice(0, MAX_NEW_ARRIVALS);
    }

    return arrivals
      .filter((item) => item.categoryName === activeCategory)
      .slice(0, MAX_NEW_ARRIVALS);
  }, [activeCategory, arrivals]);

  if (!isLoading && arrivals.length === 0) {
    return null;
  }

  return (
    <section className="bg-surface-container-low py-12 md:py-16">
      <div className="mx-auto w-full max-w-[1440px] px-6 md:px-8 lg:px-12">
        <div className="mb-8 flex flex-col gap-6 md:mb-10">
          <div className="flex items-center gap-4 md:gap-6">
            <span className="h-px w-10 bg-outline" />
            <h2 className="text-3xl font-black uppercase tracking-tight text-on-surface md:text-5xl">NEW ARRIVALS</h2>
            <span className="hidden h-px flex-1 bg-outline-variant md:block" />
          </div>

          <div className="flex flex-wrap gap-3">
            {categories.map((category) => {
              const isActive = category === activeCategory;
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => setActiveCategory(category)}
                  className={[
                    'rounded-full border px-4 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.22em] transition',
                    isActive
                      ? 'border-primary bg-primary text-on-primary'
                      : 'border-outline bg-surface-container-lowest text-on-surface-variant hover:border-outline hover:text-on-surface',
                  ].join(' ')}
                >
                  {category === ALL_FILTER ? 'All' : category}
                </button>
              );
            })}
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="animate-pulse space-y-4">
                <div className="aspect-[4/5] border border-outline-variant bg-surface-container" />
                <div className="h-6 w-2/3 bg-surface-container-high" />
                <div className="h-3 w-1/3 bg-surface-container-high" />
              </div>
            ))}
          </div>
        ) : visibleArrivals.length === 0 ? (
          <div className="border border-dashed border-outline bg-surface-container-low px-6 py-12 text-center">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-on-surface-variant">No arrivals in this filter</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
            {visibleArrivals.map((item) => (
              <Link key={item.id} href={`/products/${item.id}`} className="group block">
                <div className="relative overflow-hidden border border-outline-variant bg-surface-container-lowest">
                  <div className="relative aspect-[4/5]">
                    <Image
                      src={item.imageUrl || '/images/product-blazer.svg'}
                      alt={item.name}
                      fill
                      className="object-cover grayscale transition duration-500 group-hover:scale-[1.03]"
                    />
                  </div>
                </div>
                <div className="mt-4 space-y-1">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-2xl font-semibold tracking-tight text-on-surface">{item.name}</h3>
                    <p className="pt-1 text-base font-semibold text-on-surface">{formatPrice(item.price)}</p>
                  </div>
                  <p className="text-[0.62rem] font-medium uppercase tracking-[0.19em] text-on-surface-variant">
                    {item.categoryName ?? 'Collection'}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
