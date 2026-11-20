'use client';

import { use } from 'react';
import { ProductForm } from '@/features/products/components/product-form';
import { useManageProductQuery } from '@/features/products/hooks';
import { LoadingState } from '@/components/common/loading-state';
import { EmptyState } from '@/components/common/empty-state';

type Props = {
  params: Promise<{ id: string }>;
};

export default function EditProductPage({ params }: Props) {
  const { id } = use(params);
  const { data: product, isLoading, error } = useManageProductQuery(id);

  if (isLoading) return <LoadingState label="Loading product data" />;

  if (error || !product) {
    return (
      <div className="mx-auto max-w-7xl">
        <EmptyState
          title="Product Not Found"
          description="The product you are trying to edit does not exist or has been removed."
          actionLabel="Back to Catalog"
          actionHref="/admin/products"
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl">
      <ProductForm initialData={product} />
    </div>
  );
}
