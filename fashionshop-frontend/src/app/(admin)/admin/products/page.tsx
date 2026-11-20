'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  useManageProductsQuery,
  useDeleteManageProductMutation,
} from '@/features/products/hooks';
import { useDebounce } from '@/hooks/use-debounce';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { EmptyState } from '@/components/common/empty-state';
import { PageHeader } from '@/components/common/page-header';
import { Button } from '@/components/ui/button';
import { ProductTable } from '@/features/products/components/admin/product-table';
import { ProductStats } from '@/features/products/components/product-stats';
import { Pagination } from '@/components/common/pagnition';
import { AdminProductsFilters } from '@/features/products/components/admin/admin-products-filters';
import type { Product } from '@/types/product';

export default function AdminProductsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const debouncedSearch = useDebounce(searchTerm, 500);

  const { data: response, isLoading } = useManageProductsQuery({
    keyword: debouncedSearch,
    categoryId: categoryId || undefined,
    page: page - 1,
    size: pageSize,
  });

  const deleteMutation = useDeleteManageProductMutation();

  const products: Product[] = response?.items ?? [];
  const totalItems = response?.totalItems ?? response?.total ?? 0;
  const totalPages = Math.max(1, response?.totalPages ?? Math.ceil(totalItems / pageSize));

  const outOfStockCount = response?.metrics?.outOfStockItems ?? products.filter((p) => p.stockQuantity === 0).length;
  const activeCount = response?.metrics?.activeItems ?? products.filter((p) => p.isActive).length;

  const handleCategoryChange = (id: number | null) => {
    setCategoryId(id);
    setPage(1);
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setPage(1);
  };

  const handleDelete = () => {
    if (!deleteId) return;
    deleteMutation.mutate(deleteId, {
      onSuccess: () => {
        toast.success('Product deleted successfully');
        setDeleteId(null);
      },
      onError: () => {
        toast.error('Failed to delete product');
      },
    });
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <PageHeader
        eyebrow="Catalog Management"
        title="Inventory"
        description="Manage your editorial collection and product stock."
        action={
          <Button asChild>
            <Link href="/admin/products/new">
              <span className="material-symbols-outlined text-base">add</span>
              <span>Add Product</span>
            </Link>
          </Button>
        }
      />

      <ProductStats
        totalItems={totalItems}
        outOfStock={outOfStockCount}
        active={activeCount}
        currentPageItems={response?.metrics?.currentPageItems ?? products.length}
      />

      <AdminProductsFilters
        categoryId={categoryId}
        onCategoryChange={handleCategoryChange}
        searchTerm={searchTerm}
        onSearch={handleSearch}
      />

      <div className="overflow-hidden rounded-xl border border-outline-variant/60 bg-surface-container-lowest shadow-xs">
        <div className="overflow-x-auto">
          {products.length === 0 && !isLoading ? (
            <div className="p-6">
              <EmptyState
                title="No products found"
                description="Try adjusting your search or filters to find what you're looking for."
                actionLabel="Reset Search"
                onAction={() => setSearchTerm('')}
              />
            </div>
          ) : (
            <ProductTable
              products={products}
              isLoading={isLoading}
              onDelete={(id) => setDeleteId(String(id))}
            />
          )}
        </div>

        <Pagination
          page={page}
          totalPages={totalPages}
          pageSize={pageSize}
          totalItems={totalItems}
          onPageChange={setPage}
        />
      </div>

      <ConfirmDialog
        open={Boolean(deleteId)}
        title="Delete Product?"
        description="Are you sure you want to delete this product? This action cannot be undone and will remove the item from all listings."
        confirmLabel="Delete"
        destructive
        onConfirm={handleDelete}
        onOpenChange={(open) => !open && setDeleteId(null)}
      />
    </div>
  );
}
