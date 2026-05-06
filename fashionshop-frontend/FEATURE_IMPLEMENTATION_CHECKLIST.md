# Frontend Feature Checklist

Use this checklist when implementing a new feature to ensure proper integration and interaction with other parts of the system.

## Feature Setup

- [ ] Create feature folder: `src/features/[feature]/`
- [ ] Create TypeScript types in `src/types/[feature].ts`
- [ ] Create API query keys in `src/lib/api/query-keys.ts`
- [ ] Add to AGENTS.md if it has new conventions

## State Management Setup

### For Local-Only State (Zustand Store)

- [ ] Create `src/features/[feature]/store.ts`
- [ ] Define state interface
- [ ] Create actions (setters, mutations)
- [ ] Export custom hook: `use[Feature]()`
- [ ] Add persist middleware if needed
- [ ] Test with Zustand DevTools

### For Server State (React Query)

- [ ] Create `src/features/[feature]/services.ts` with API functions
- [ ] Create `src/features/[feature]/hooks.ts` with React Query hooks
- [ ] Use `useQuery()` for fetching
- [ ] Use `useMutation()` for mutations
- [ ] Handle loading, error, and success states
- [ ] Invalidate queries on mutations

## API Integration

### Service Functions (API Calls)

- [ ] Use `api` from `@/lib/api/http`
- [ ] Use `apiRequest()` helper to unwrap responses
- [ ] Define request/response types
- [ ] Handle errors in service layer
- [ ] Example:
  ```tsx
  export async function fetchCart() {
    const response = await api.get<ApiResponse<Cart>>("/api/cart");
    return apiRequest(Promise.resolve(response));
  }
  ```

### React Query Hooks

- [ ] Use query key from `queryKeys` constant
- [ ] Set `enabled` condition for conditional queries
- [ ] Use `onSuccess` for optimistic updates
- [ ] Use `onError` for error handling
- [ ] Example:
  ```tsx
  export function useCartQuery() {
    return useQuery({
      queryKey: queryKeys.cart,
      queryFn: fetchCart,
    });
  }
  ```

## Component Integration

### Custom Integration Hooks

- [ ] Create `use-[action].ts` for complex operations
- [ ] Combine multiple mutations/queries
- [ ] Handle cross-cutting concerns (auth check, etc.)
- [ ] Return simplified interface
- [ ] Example: `useCartActions()`, `useToggleWishlist()`

### Example Components

- [ ] Create example component in `src/components/examples/`
- [ ] Show proper hook usage
- [ ] Include loading states
- [ ] Include error handling
- [ ] Include auth checks
- [ ] Add JSDoc comments

## Component Implementation Checklist

When implementing a new component:

- [ ] **Auth Check**: Redirect to login if needed

  ```tsx
  const { user } = useAuthSession();
  if (!user) router.push("/login");
  ```

- [ ] **Loading States**: Show loaders during operations

  ```tsx
  const { isLoading } = useAction();
  <button disabled={isLoading}>{isLoading ? "Loading..." : "Action"}</button>;
  ```

- [ ] **Error Handling**: Show error messages

  ```tsx
  if (error) return <div className="text-red-500">{error.message}</div>;
  ```

- [ ] **Toast Notifications**: Provide user feedback

  ```tsx
  toast.success("Action completed");
  toast.error("Action failed");
  ```

- [ ] **Accessibility**: Proper ARIA labels

  ```tsx
  <button aria-label="Add to cart" disabled={isLoading}>
  ```

- [ ] **Responsive Design**: Mobile-friendly layouts
  ```tsx
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
  ```

## Data Flow Validation

- [ ] Data flows correctly from API → React Query → Components
- [ ] Local Zustand store syncs with React Query cache
- [ ] Mutations update both local and server state
- [ ] Error states are properly handled
- [ ] Loading states are displayed
- [ ] No infinite loops or race conditions

## Testing Checklist

- [ ] Unit tests for custom hooks
- [ ] Integration tests for component + hooks
- [ ] API mock data in development
- [ ] Error cases tested
- [ ] Auth-protected routes tested
- [ ] Loading states tested

```tsx
// Example test structure
describe("useCartActions", () => {
  it("should add item to cart", async () => {
    const { addToCart } = renderHook(() => useCartActions());
    await addToCart({ productId: 1, quantity: 2 });
    // Assert
  });
});
```

## TypeScript & Types

- [ ] Create feature types in `src/types/[feature].ts`
- [ ] Match backend DTOs exactly
- [ ] Export interfaces from types file
- [ ] Use strict type checking
- [ ] No `any` types (unless absolutely necessary)
- [ ] Document complex types with JSDoc

```tsx
// Good type definitions
export interface CartItem {
  id: number;
  productId: number;
  name: string;
  quantity: number;
  price: number;
  imageUrl?: string;
}

export interface AddToCartRequest {
  productId: number;
  quantity: number;
  selectedColor?: string;
  selectedSize?: string;
}
```

## Performance Optimization

- [ ] Use React.memo for expensive components
- [ ] Use useCallback for event handlers
- [ ] Optimize re-renders with proper keys
- [ ] Lazy load images
- [ ] Pagination for large lists
- [ ] Cache API responses with React Query

```tsx
// Memoized component
const ProductCard = React.memo(({ product }: Props) => {
  const handleClick = useCallback(() => {
    // action
  }, []);

  return <div onClick={handleClick}>{product.name}</div>;
});
```

## Documentation

- [ ] Add JSDoc comments to functions
- [ ] Document hook parameters and return values
- [ ] Add comments for complex logic
- [ ] Update FRONTEND_ARCHITECTURE.md if adding new patterns
- [ ] Create README in feature folder if complex

```tsx
/**
 * Hook for adding items to cart
 * @param productId - Product to add
 * @param quantity - Quantity to add
 * @returns Object with addToCart function and loading state
 */
export function useAddToCart(productId: number, quantity: number) {
  // ...
}
```

## Before Committing

- [ ] All TypeScript errors resolved
- [ ] All ESLint warnings fixed
- [ ] No console.log statements left
- [ ] No commented-out code
- [ ] Feature works end-to-end
- [ ] No breaking changes to existing features
- [ ] Git diff is clean and focused

## Browser DevTools

- [ ] React DevTools: Check component tree
- [ ] React Query DevTools: Check cache state
- [ ] Zustand DevTools: Check store state
- [ ] Network tab: Verify API calls
- [ ] Console: No errors or warnings

## Final Review Checklist

- [ ] Feature matches backend API contract
- [ ] All components properly integrated
- [ ] State flows correctly through app
- [ ] Error handling comprehensive
- [ ] Loading states visible to user
- [ ] Mobile responsive
- [ ] Accessibility compliant
- [ ] Performance optimized
- [ ] Documentation complete
- [ ] Code follows AGENTS.md conventions

---

**When stuck**: Refer to example components in `src/components/examples/` for reference implementation.
