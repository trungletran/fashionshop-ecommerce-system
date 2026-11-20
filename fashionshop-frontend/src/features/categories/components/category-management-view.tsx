'use client';

import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { LoadingState } from '@/components/common/loading-state';
import { EmptyState } from '@/components/common/empty-state';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { PageHeader } from '@/components/common/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  useManageCategoriesQuery,
  useCreateCategoryMutation,
  useDeleteCategoryMutation,
  useActivateCategoryMutation,
} from '@/features/categories/hooks';
import { toast } from 'sonner';

const categorySchema = z.object({
  name: z.string().min(2, 'Category name must be at least 2 characters'),
  description: z.string().optional(),
});

type CategoryFormValues = z.infer<typeof categorySchema>;

type CategoryManagementViewProps = {
  emptyActionHref: string;
};

export function CategoryManagementView({ emptyActionHref }: CategoryManagementViewProps) {
  const categoriesQuery = useManageCategoriesQuery();
  const createMutation = useCreateCategoryMutation();
  const deleteMutation = useDeleteCategoryMutation();
  const activateMutation = useActivateCategoryMutation();
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: '', description: '' },
  });

  const categories = categoriesQuery.data ?? [];
  const filteredCategories = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();
    if (!keyword) return categories;

    return categories.filter((category) =>
      [category.name, category.description ?? ''].some((value) =>
        value.toLowerCase().includes(keyword),
      ),
    );
  }, [categories, searchTerm]);

  if (categoriesQuery.isLoading) return <LoadingState label="Loading categories" />;

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <PageHeader
        eyebrow="Catalog Structure"
        title="Categories"
        description="Create and manage product categories used across the storefront and console."
        action={
          <Button type="button" onClick={() => setIsCreateOpen((value) => !value)}>
            <span className="material-symbols-outlined text-base">
              {isCreateOpen ? 'close' : 'add'}
            </span>
            <span>{isCreateOpen ? 'Close Form' : 'Add Category'}</span>
          </Button>
        }
      />

      {/* KPI + Search */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-6 shadow-xs md:col-span-4">
          <p className="font-label text-[10px] font-bold uppercase tracking-[0.22em] text-on-surface-variant">
            Total Categories
          </p>
          <p className="font-headline mt-2 text-3xl font-black tracking-tight text-primary">
            {categories.length.toLocaleString()}
          </p>
          <div className="mt-3 flex items-center gap-2 text-xs text-emerald-700">
            <span className="material-symbols-outlined text-sm">inventory_2</span>
            <span>Available for product assignment</span>
          </div>
        </div>

        <div className="col-span-12 flex items-center rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-6 shadow-xs md:col-span-8">
          <div className="relative w-full">
            <span className="material-symbols-outlined pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-lg text-outline">
              search
            </span>
            <Input
              className="pl-10"
              placeholder="Search by category name or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Inline Create Form */}
      {isCreateOpen ? (
        <section className="rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-6 shadow-xs sm:p-8">
          <div className="mb-6 border-b border-outline-variant/50 pb-4">
            <span className="font-label text-[10px] font-bold uppercase tracking-[0.24em] text-on-surface-variant">
              New Category
            </span>
            <h2 className="font-headline mt-1 text-xl font-black uppercase tracking-tight text-primary">
              Add to Catalog
            </h2>
            <p className="mt-1 text-xs text-on-surface-variant">
              Keep naming concise and describe which products belong in this group.
            </p>
          </div>

          <form
            className="grid grid-cols-12 gap-6"
            onSubmit={form.handleSubmit((values) =>
              createMutation.mutate(values, {
                onSuccess: () => {
                  toast.success('Category created');
                  form.reset();
                  setIsCreateOpen(false);
                },
              }),
            )}
          >
            <div className="col-span-12 space-y-2 lg:col-span-4">
              <Label htmlFor="category-name">Category Name</Label>
              <Input
                id="category-name"
                {...form.register('name')}
                type="text"
                placeholder="e.g. Outerwear"
                aria-invalid={Boolean(form.formState.errors.name)}
              />
              {form.formState.errors.name ? (
                <p className="text-xs font-medium text-error">{form.formState.errors.name.message}</p>
              ) : null}
            </div>

            <div className="col-span-12 space-y-2 lg:col-span-8">
              <Label htmlFor="category-description">Description</Label>
              <Textarea
                id="category-description"
                {...form.register('description')}
                rows={3}
                className="min-h-24"
                placeholder="Describe the products that belong in this category."
                aria-invalid={Boolean(form.formState.errors.description)}
              />
              {form.formState.errors.description ? (
                <p className="text-xs font-medium text-error">{form.formState.errors.description.message}</p>
              ) : null}
            </div>

            <div className="col-span-12 flex items-center gap-3 border-t border-outline-variant/50 pt-5">
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating…' : 'Create Category'}
              </Button>
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </section>
      ) : null}

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-outline-variant/60 bg-surface-container-lowest shadow-xs">
        {categories.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title="No categories"
              description="Create the first category to organize products in the console and storefront."
              actionLabel="Create category"
              actionHref={emptyActionHref}
            />
          </div>
        ) : (
          <table className="w-full border-collapse text-left">
            <thead className="border-b border-outline-variant/60 bg-surface-container-low">
              <tr>
                <th className="px-6 py-4 font-label text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                  Category Name
                </th>
                <th className="px-6 py-4 font-label text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                  Description
                </th>
                <th className="px-6 py-4 text-center font-label text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                  Status
                </th>
                <th className="px-6 py-4 text-right font-label text-[10px] font-bold uppercase tracking-[0.18em] text-on-surface-variant">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/40 font-body">
              {filteredCategories.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-16 text-center text-sm text-on-surface-variant">
                    No matching categories found.
                  </td>
                </tr>
              ) : (
                filteredCategories.map((category) => (
                  <tr key={category.id} className="transition-colors hover:bg-surface-container-low/60">
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-primary">{category.name}</p>
                      <p className="font-label text-[10px] uppercase tracking-wider text-outline">
                        ID: {String(category.id).toUpperCase()}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm leading-relaxed text-on-surface-variant">
                        {category.description?.trim() || 'No description provided yet.'}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {category.isActive ? (
                        <Badge variant="success">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-600" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <span className="h-1.5 w-1.5 rounded-full bg-outline" />
                          Inactive
                        </Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {category.isActive ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-error/30 text-error hover:border-error hover:bg-error-container/30"
                          onClick={() => setDeleteId(String(category.id))}
                          disabled={deleteMutation.isPending}
                        >
                          Deactivate
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-emerald-300 text-emerald-700 hover:border-emerald-600 hover:bg-emerald-50"
                          onClick={() =>
                            activateMutation.mutate(category.id, {
                              onSuccess: () => toast.success('Category activated'),
                            })
                          }
                          disabled={activateMutation.isPending}
                        >
                          Activate
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      <ConfirmDialog
        open={Boolean(deleteId)}
        title="Deactivate category?"
        description="Deactivating this category will hide products assigned to it from storefront listings."
        confirmLabel="Deactivate"
        destructive
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={() => {
          if (!deleteId) return;
          deleteMutation.mutate(deleteId, {
            onSuccess: () => {
              toast.success('Category deactivated');
              setDeleteId(null);
            },
          });
        }}
      />
    </div>
  );
}
