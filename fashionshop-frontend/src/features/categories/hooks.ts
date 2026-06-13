'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createCategory, fetchCategories, fetchManageCategories, deleteCategory, activateCategory } from './services';
import { queryKeys } from '@/lib/api/query-keys';

export function useCategoriesQuery() {
  return useQuery({ queryKey: queryKeys.categories, queryFn: fetchCategories });
}

export function useManageCategoriesQuery() {
  return useQuery({ queryKey: [...queryKeys.categories, 'manage'], queryFn: fetchManageCategories });
}

export function useCreateCategoryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createCategory,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.categories });
    },
  });
}

export function useDeleteCategoryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteCategory,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.categories });
    },
  });
}

export function useActivateCategoryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: activateCategory,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.categories });
    },
  });
}
