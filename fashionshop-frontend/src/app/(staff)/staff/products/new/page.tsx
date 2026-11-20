'use client';

import { ProductForm } from '@/features/products/components/product-form';

export default function CreateProductPage() {
  return (
    <div className="mx-auto max-w-7xl">
      <ProductForm redirectPath="/staff/products" />
    </div>
  );
}
