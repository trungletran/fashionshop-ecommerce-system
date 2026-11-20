'use client';

import { useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { EmptyState } from '@/components/common/empty-state';
import { PageHeader } from '@/components/common/page-header';
import { Pagination } from '@/components/common/pagnition';
import { Button } from '@/components/ui/button';
import { ProductTable } from '@/features/products/components/admin/product-table';
import { ProductStats } from '@/features/products/components/product-stats';
import { AdminProductsFilters } from '@/features/products/components/admin/admin-products-filters';
import { useDeleteManageProductMutation, useManageProductsQuery } from '@/features/products/hooks';
import type { Product } from '@/types/product';

export default function StaffProductsPage() {
  const [page, setPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const pageSize = 8;

  const { data, isLoading } = useManageProductsQuery({
    page,
    size: pageSize,
    keyword: searchTerm,
    categoryId: categoryId ?? undefined,
  });

  const deleteMutation = useDeleteManageProductMutation();
  const products: Product[] = data?.items ?? [];
  const metrics = data?.metrics;

  const handleDelete = () => {
    if (!deleteId) return;

    deleteMutation.mutate(deleteId, {
      onSuccess: () => {
        toast.success('Product deleted successfully');
        setDeleteId(null);
      },
      onError: () => toast.error('Failed to delete product'),
    });
  };

  const totalItems = data?.totalItems ?? data?.total ?? 0;
  const totalPages = data?.totalPages ?? (totalItems > 0 ? Math.ceil(totalItems / pageSize) : 0);

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <PageHeader
        eyebrow="Staff Console · Inventory"
        title="Products"
        description="Manage catalog listings, pricing, and inventory levels."
        action={
          <Button asChild>
            <Link href="/staff/products/new">
              <span className="material-symbols-outlined text-base">add</span>
              <span>Add Product</span>
            </Link>
          </Button>
        }
      />

      <ProductStats
        totalItems={totalItems}
        outOfStock={metrics?.outOfStockItems ?? products.filter((p) => p.stockQuantity === 0).length}
        active={metrics?.activeItems ?? products.filter((p) => p.isActive).length}
        currentPageItems={metrics?.currentPageItems ?? products.length}
      />

      <AdminProductsFilters
        categoryId={categoryId}
        onCategoryChange={(id) => {
          setCategoryId(id);
          setPage(0);
        }}
        searchTerm={searchTerm}
        onSearch={(val) => {
          setSearchTerm(val);
          setPage(0);
        }}
      />

      <div className="overflow-hidden rounded-xl border border-outline-variant/60 bg-surface-container-lowest shadow-xs">
        <div className="overflow-x-auto">
          {products.length === 0 && !isLoading ? (
            <div className="p-6">
              <EmptyState
                title="No products found"
                description="Try adjusting your search or category filter."
                actionLabel="Reset Search"
                onAction={() => {
                  setSearchTerm('');
                  setCategoryId(null);
                }}
              />
            </div>
          ) : (
            <ProductTable
              products={products}
              isLoading={isLoading}
              onDelete={(id) => setDeleteId(String(id))}
              editBasePath="/staff/products"
            />
          )}
        </div>

        <Pagination
          page={page + 1}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={totalItems}
          onPageChange={(p) => setPage(p - 1)}
        />
      </div>

      <ConfirmDialog
        open={Boolean(deleteId)}
        title="Delete product?"
        description="Are you sure you want to delete this product? This action cannot be undone and will remove the item from all listings."
        destructive
        confirmLabel="Delete"
        onOpenChange={(open) => {
          if (!open) setDeleteId(null);
        }}
        onConfirm={handleDelete}
      />
    </div>
  );
}
