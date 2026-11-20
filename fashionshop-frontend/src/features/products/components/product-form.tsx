'use client';

import { useForm, useWatch, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ImageUploader } from '@/components/ui/image-uploader';
import { useCreateProductMutation, useUpdateManageProductMutation } from '@/features/products/hooks';
import { useCategoriesQuery } from '@/features/categories/hooks';
import { cn } from '@/lib/utils/cn';
import type { Product } from '@/types/product';

const productSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
  price: z.coerce.number().min(0, 'Price must be positive'),
  stockQuantity: z.coerce.number().min(0, 'Stock must be at least 0'),
  categoryId: z.coerce.number().optional(),
  imageUrls: z.array(z.string().url()).default([]),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  slug: z.string().optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

type Props = {
  initialData?: Product;
  redirectPath?: string;
};

export function ProductForm({ initialData, redirectPath = '/admin/products' }: Props) {
  const router = useRouter();
  const createMutation = useCreateProductMutation();
  const updateMutation = useUpdateManageProductMutation(initialData?.id ? String(initialData.id) : '');
  const { data: categories = [] } = useCategoriesQuery();

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProductFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(productSchema) as any,
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      price: initialData?.price || 0,
      stockQuantity: initialData?.stockQuantity || 0,
      categoryId: initialData?.categoryId || undefined,
      isActive: initialData?.isActive ?? true,
      isFeatured: initialData?.isFeatured ?? false,
      imageUrls: initialData?.imageUrl ? [initialData.imageUrl] : [],
      slug: initialData?.slug || '',
    },
  });

  const watchedImageUrls = watch('imageUrls') ?? [];
  const watchedValues = useWatch({ control }) as Partial<ProductFormValues>;
  const watchedCategoryId =
    watchedValues.categoryId === undefined ? undefined : String(watchedValues.categoryId);
  const previewCategorySelected = categories.find((c) => c.id === watchedCategoryId);
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const onSubmit: SubmitHandler<ProductFormValues> = (data) => {
    const primaryImageUrl = data.imageUrls?.[0] ?? '';
    const payload = {
      ...data,
      categoryId: data.categoryId || (categories.length > 0 ? categories[0].id : 1),
      imageUrl: primaryImageUrl,
      imageUrls: data.imageUrls ?? [],
    };

    if (initialData) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      updateMutation.mutate(payload as any, {
        onSuccess: () => {
          toast.success('Product updated successfully');
          router.push(redirectPath);
        },
        onError: (error: { message?: string }) => {
          toast.error(error?.message || 'Failed to update product');
        },
      });
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      createMutation.mutate(payload as any, {
        onSuccess: () => {
          toast.success('Product created successfully');
          router.push(redirectPath);
        },
        onError: (error: { message?: string }) => {
          toast.error(error?.message || 'Failed to create product');
        },
      });
    }
  };

  return (
    <form id="product-form" onSubmit={handleSubmit(onSubmit)} className="space-y-8 pb-20">
      {/* Sticky Header Bar */}
      <div className="sticky top-0 z-30 -mx-2 flex flex-wrap items-center justify-between gap-4 border-b border-outline-variant/60 bg-surface/95 px-2 py-4 backdrop-blur-md">
        <div>
          <p className="font-label text-[10px] font-bold uppercase tracking-[0.26em] text-on-surface-variant">
            Catalog Management
          </p>
          <h1 className="font-headline mt-1 text-2xl font-black uppercase tracking-tight text-primary sm:text-3xl">
            {initialData ? 'Edit Product' : 'Create New Product'}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <Button type="button" variant="outline" size="sm" onClick={() => router.back()}>
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : initialData ? 'Save Changes' : 'Create Product'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Left Column: Core Info & Media (8 cols) */}
        <div className="col-span-12 space-y-8 lg:col-span-8">
          {/* Step 01: Core Details */}
          <section className="space-y-6 rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-6 shadow-xs sm:p-8">
            <div className="border-b border-outline-variant/50 pb-4">
              <p className="font-label text-[10px] font-bold uppercase tracking-[0.24em] text-on-surface-variant">
                Step 01
              </p>
              <h2 className="font-headline mt-1 text-lg font-black uppercase tracking-tight text-primary">
                {initialData ? 'Product Identity' : 'Core Details'}
              </h2>
              <p className="mt-1 text-xs text-on-surface-variant">
                Provide the title and editorial description shown on the storefront.
              </p>
            </div>

            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="product-name">Product Name</Label>
                <Input
                  id="product-name"
                  {...register('name')}
                  aria-invalid={Boolean(errors.name)}
                  placeholder="e.g. Minimalist Linen Overshirt"
                />
                {errors.name ? <p className="text-xs font-medium text-error">{errors.name.message}</p> : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="product-description">Description</Label>
                <Textarea
                  id="product-description"
                  {...register('description')}
                  placeholder="Describe the material, silhouette, fit, and care details..."
                  rows={6}
                />
                {errors.description ? <p className="text-xs font-medium text-error">{errors.description.message}</p> : null}
              </div>
            </div>
          </section>

          {/* Step 02: Media */}
          <section className="space-y-6 rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-6 shadow-xs sm:p-8">
            <div className="border-b border-outline-variant/50 pb-4">
              <p className="font-label text-[10px] font-bold uppercase tracking-[0.24em] text-on-surface-variant">
                Step 02
              </p>
              <h2 className="font-headline mt-1 text-lg font-black uppercase tracking-tight text-primary">
                Product Imagery
              </h2>
              <p className="mt-1 text-xs text-on-surface-variant">
                Upload product photos to Cloudinary. The first image is used as the primary catalog cover.
              </p>
            </div>

            <ImageUploader
              value={watchedImageUrls}
              onChange={(urls) => setValue('imageUrls', urls, { shouldValidate: true })}
              maxImages={10}
              folder="fashionshop/products"
              disabled={isSubmitting}
            />

            {errors.imageUrls ? (
              <p className="flex items-center gap-1.5 text-xs font-medium text-error">
                <span className="material-symbols-outlined text-sm">error</span>
                {errors.imageUrls.message as string}
              </p>
            ) : null}
          </section>
        </div>

        {/* Right Column: Pricing, Inventory & Preview (4 cols) */}
        <div className="col-span-12 space-y-8 lg:col-span-4">
          {/* Step 03: Pricing & Availability */}
          <section className="space-y-6 rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-6 shadow-xs sm:p-8">
            <div className="border-b border-outline-variant/50 pb-4">
              <p className="font-label text-[10px] font-bold uppercase tracking-[0.24em] text-on-surface-variant">
                Step 03
              </p>
              <h2 className="font-headline mt-1 text-lg font-black uppercase tracking-tight text-primary">
                Inventory & Pricing
              </h2>
            </div>

            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="product-category">Category</Label>
                <Select id="product-category" {...register('categoryId')}>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="product-price">Price (USD)</Label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-outline">
                      $
                    </span>
                    <Input
                      id="product-price"
                      {...register('price')}
                      aria-invalid={Boolean(errors.price)}
                      className="pl-7"
                      placeholder="0.00"
                      type="number"
                      step="0.01"
                    />
                  </div>
                  {errors.price ? <p className="text-xs font-medium text-error">{errors.price.message}</p> : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="product-stock">Stock</Label>
                  <Input
                    id="product-stock"
                    {...register('stockQuantity')}
                    aria-invalid={Boolean(errors.stockQuantity)}
                    placeholder="0"
                    type="number"
                  />
                  {errors.stockQuantity ? (
                    <p className="text-xs font-medium text-error">{errors.stockQuantity.message}</p>
                  ) : null}
                </div>
              </div>

              <div className="space-y-3 border-t border-outline-variant/50 pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-label text-[11px] font-bold uppercase tracking-[0.16em] text-on-surface">
                      Active
                    </p>
                    <p className="text-xs text-on-surface-variant">Visible in storefront catalog</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={Boolean(watchedValues.isActive)}
                    onClick={() => setValue('isActive', !watchedValues.isActive)}
                    className={cn(
                      'relative h-6 w-11 cursor-pointer rounded-full transition-colors duration-200',
                      watchedValues.isActive ? 'bg-primary' : 'bg-outline-variant',
                    )}
                  >
                    <span
                      className={cn(
                        'absolute top-0.5 h-5 w-5 rounded-full bg-surface-container-lowest shadow-xs transition-all duration-200',
                        watchedValues.isActive ? 'left-[22px]' : 'left-0.5',
                      )}
                    />
                  </button>
                  <input type="hidden" {...register('isActive')} />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-label text-[11px] font-bold uppercase tracking-[0.16em] text-on-surface">
                      Featured
                    </p>
                    <p className="text-xs text-on-surface-variant">Highlight in curated sections</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={Boolean(watchedValues.isFeatured)}
                    onClick={() => setValue('isFeatured', !watchedValues.isFeatured)}
                    className={cn(
                      'relative h-6 w-11 cursor-pointer rounded-full transition-colors duration-200',
                      watchedValues.isFeatured ? 'bg-primary' : 'bg-outline-variant',
                    )}
                  >
                    <span
                      className={cn(
                        'absolute top-0.5 h-5 w-5 rounded-full bg-surface-container-lowest shadow-xs transition-all duration-200',
                        watchedValues.isFeatured ? 'left-[22px]' : 'left-0.5',
                      )}
                    />
                  </button>
                  <input type="hidden" {...register('isFeatured')} />
                </div>
              </div>
            </div>
          </section>

          {/* Store Preview Card */}
          <div className="relative overflow-hidden rounded-xl bg-primary p-7 text-on-primary shadow-xl">
            <p className="font-label text-[10px] font-bold uppercase tracking-[0.26em] text-on-primary/60">
              Storefront Preview
            </p>
            <div className="relative z-10 mt-5 space-y-4">
              <div className="relative aspect-[4/5] overflow-hidden rounded-lg bg-white/10">
                {watchedImageUrls[0] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={watchedImageUrls[0]}
                    alt="Preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-on-primary/40">
                    <span className="material-symbols-outlined text-4xl">image</span>
                    <span className="font-label text-[10px] font-bold uppercase tracking-[0.2em]">
                      No image yet
                    </span>
                  </div>
                )}
              </div>
              <h3 className="font-headline text-xl font-bold tracking-tight">
                {watchedValues.name || 'Product Title'}
              </h3>
              <div className="flex items-baseline justify-between border-t border-white/15 pt-3">
                <span className="font-label text-xs uppercase tracking-[0.16em] text-on-primary/70">
                  {previewCategorySelected ? previewCategorySelected.name : 'Uncategorized'}
                </span>
                <span className="font-headline text-lg font-bold">
                  ${Number(watchedValues.price || 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
