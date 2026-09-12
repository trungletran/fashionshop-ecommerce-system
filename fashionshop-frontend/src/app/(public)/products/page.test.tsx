import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/features/categories/hooks', () => ({
  useCategoriesQuery: () => ({
    data: [
      { id: 1, name: 'Outerwear' },
      { id: 2, name: 'Tops' },
    ],
    isLoading: false,
  }),
}));

vi.mock('@/features/products/hooks', () => ({
  useStoreProductsQuery: () => ({
    data: {
      pages: [
        {
          items: [
            {
              id: 1,
              name: 'Modular Tech Parka',
              categoryName: 'Outerwear',
              price: 180,
              imageUrl: '/images/product-parka.svg',
            },
          ],
          totalItems: 1,
          totalPages: 2,
          page: 0,
        },
      ],
    },
    isPending: false,
    hasNextPage: true,
    fetchNextPage: vi.fn(),
    isFetchingNextPage: false,
  }),
}));

vi.mock('@/features/wishlist/use-wishlist', () => ({
  useWishlistState: () => ({
    isInWishlist: () => false,
  }),
  useToggleWishlist: () => ({
    isInWishlist: false,
    toggle: vi.fn(),
    isLoading: false,
  }),
}));

import ProductsPage from './page';

describe('ProductsPage', () => {
  it('renders the product listing page', () => {
    render(<ProductsPage />);

    expect(screen.getByPlaceholderText('Search products...')).toBeInTheDocument();
    expect(screen.getByText(/1 Results Found/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Load More Products' })).toBeInTheDocument();
    expect(screen.getByText('Modular Tech Parka')).toBeInTheDocument();
  });
});
