'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import type { Product } from '@/types/product';

type Props = {
  products: Product[];
  onDelete: (id: number) => void;
  isLoading?: boolean;
  editBasePath?: string;
};

export function ProductTable({ products, onDelete, isLoading, editBasePath = '/admin/products' }: Props) {
  return (
    <table className="w-full border-collapse text-left">
      <thead className="border-b border-outline-variant/60 bg-surface-container-low">
        <tr>
          <th className="w-24 px-6 py-4 text-center font-label text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
            Image
          </th>
          <th className="px-6 py-4 font-label text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
            Product Name
          </th>
          <th className="px-6 py-4 font-label text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
            Category
          </th>
          <th className="px-6 py-4 font-label text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
            Stock
          </th>
          <th className="px-6 py-4 font-label text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
            Price
          </th>
          <th className="px-6 py-4 font-label text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
            Status
          </th>
          <th className="px-6 py-4 text-right font-label text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
            Actions
          </th>
        </tr>
      </thead>

      <tbody className="divide-y divide-outline-variant/40 font-body">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <tr key={i} className="animate-pulse">
              <td className="px-6 py-4">
                <div className="mx-auto h-16 w-12 rounded-md bg-surface-container" />
              </td>
              <td className="px-6 py-4">
                <div className="space-y-2">
                  <div className="h-4 w-32 rounded-md bg-surface-container" />
                  <div className="h-3 w-20 rounded-md bg-surface-container" />
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="h-5 w-16 rounded-md bg-surface-container" />
              </td>
              <td className="px-6 py-4">
                <div className="h-4 w-10 rounded-md bg-surface-container" />
              </td>
              <td className="px-6 py-4">
                <div className="h-4 w-12 rounded-md bg-surface-container" />
              </td>
              <td className="px-6 py-4">
                <div className="h-5 w-16 rounded-full bg-surface-container" />
              </td>
              <td className="px-6 py-4 text-right">
                <div className="ml-auto h-4 w-16 rounded-md bg-surface-container" />
              </td>
            </tr>
          ))
        ) : products.length === 0 ? (
          <tr>
            <td colSpan={7} className="px-6 py-16 text-center text-sm text-on-surface-variant">
              No products found
            </td>
          </tr>
        ) : (
          products.map((product) => (
            <tr key={product.id} className="transition-colors hover:bg-surface-container-low/60">
              <td className="px-6 py-4">
                <div className="relative mx-auto h-16 w-12 overflow-hidden rounded-md border border-outline-variant/50 bg-surface-container">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={product.imageUrl || '/images/product-blazer.svg'}
                    alt={product.name}
                    className="h-full w-full object-cover"
                  />
                </div>
              </td>

              <td className="px-6 py-4">
                <p className="text-sm font-bold text-primary">{product.name}</p>
                <p className="font-label text-[10px] uppercase tracking-wider text-outline">
                  SKU: {product.slug?.toUpperCase() || product.id.toString().slice(-8).toUpperCase()}
                </p>
              </td>

              <td className="px-6 py-4">
                <Badge variant="secondary">
                  {product.categoryName || 'Uncategorized'}
                </Badge>
              </td>

              <td className="px-6 py-4 text-sm font-medium text-on-surface">{product.stockQuantity}</td>

              <td className="px-6 py-4 font-headline text-sm font-bold text-primary">
                ${product.price.toLocaleString()}
              </td>

              <td className="px-6 py-4">
                <Badge variant={product.isActive ? 'success' : 'secondary'}>
                  <span className={`h-1.5 w-1.5 rounded-full ${product.isActive ? 'bg-emerald-600' : 'bg-outline'}`} />
                  {product.isActive ? 'Active' : 'Draft'}
                </Badge>
              </td>

              <td className="px-6 py-4 text-right">
                <div className="flex justify-end gap-4">
                  <Link
                    href={`${editBasePath}/${product.id}/edit`}
                    className="font-label text-[10px] font-bold uppercase tracking-[0.16em] text-primary underline-offset-4 hover:underline"
                  >
                    Edit
                  </Link>
                  <button
                    type="button"
                    onClick={() => onDelete(product.id)}
                    className="cursor-pointer font-label text-[10px] font-bold uppercase tracking-[0.16em] text-error underline-offset-4 hover:underline"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}
