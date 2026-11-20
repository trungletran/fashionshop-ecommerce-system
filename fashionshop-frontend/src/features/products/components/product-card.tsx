import Link from 'next/link';
import type { Product } from '@/types/product';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

export function ProductCard({ product }: { product: Product }) {
  return (
    <Card className="group overflow-hidden transition-colors hover:border-primary">
      <div className="aspect-[4/5] overflow-hidden bg-surface-container">
        {product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center font-label text-xs uppercase tracking-[0.2em] text-on-surface-variant">
            No image
          </div>
        )}
      </div>
      <CardContent className="space-y-3 p-5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-headline text-base font-bold tracking-tight text-primary">{product.name}</h3>
            <p className="mt-0.5 font-label text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
              {product.categoryName ?? 'Fashion'}
            </p>
          </div>
          <Badge variant="outline">${product.price.toFixed(2)}</Badge>
        </div>
        <Link
          href={`/products/${product.slug ?? product.id}`}
          className="inline-flex font-label text-[11px] font-bold uppercase tracking-[0.18em] text-primary underline-offset-4 hover:underline"
        >
          View product →
        </Link>
      </CardContent>
    </Card>
  );
}
