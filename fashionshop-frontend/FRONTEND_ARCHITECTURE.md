# Frontend Feature Architecture & Integration Guide

## Overview

This document explains how frontend features are organized and how UI components interact with state management (Zustand) and data fetching (React Query).

## Architecture Stack

- **State Management**: Zustand (for persistent client state)
- **Data Fetching**: React Query / TanStack Query (for server state)
- **API Client**: Custom HTTP wrapper with automatic error handling
- **Authentication**: JWT-based with Zustand store

## Feature Structure

Each feature folder has:

```
src/features/[feature]/
├── store.ts          # Zustand store (persistent state)
├── services.ts       # API functions (raw API calls)
├── hooks.ts          # React Query hooks (data fetching + mutations)
├── use-*.ts          # Custom hooks (derived logic + composition)
└── components/       # Feature-specific components
```

### Example: Cart Feature

```
src/features/cart/
├── store.ts               # Zustand cart store (items, total)
├── services.ts            # addCartItem(), updateCartItem(), etc.
├── hooks.ts               # useAddToCartMutation(), useRemoveCartItemMutation()
├── use-cart-actions.ts    # useCartActions() - combined mutation hook
└── components/            # CartCard, CartItem components
```

## Data Flow Patterns

### Pattern 1: Local State Only (Zustand)

For client-side state that doesn't need server sync immediately:

```tsx
import { useCart } from "@/features/cart/store";

export function MyComponent() {
  const { items, addItem, removeItem } = useCart();

  return (
    <div>
      {items.map((item) => (
        <div key={item.id}>{item.name}</div>
      ))}
      <button onClick={() => addItem(item)}>Add</button>
    </div>
  );
}
```

### Pattern 2: Server State + Local Sync (React Query + Zustand)

For data that comes from backend but needs local cache:

```tsx
// services.ts
export async function fetchCart() {
  const response = await api.get<Cart>("/api/cart");
  return apiRequest(Promise.resolve(response));
}

// hooks.ts
export function useCartQuery() {
  return useQuery({
    queryKey: queryKeys.cart,
    queryFn: fetchCart,
  });
}

// Component
import { useSyncCartWithStore } from "@/lib/api/cart-sync";

export function MyComponent() {
  const { cartData } = useSyncCartWithStore(); // Syncs React Query → Zustand
  const cart = useCart(); // Read from Zustand

  return <div>{cart.items.length} items</div>;
}
```

### Pattern 3: Mutations (API + State Update)

For operations that modify backend data:

```tsx
// services.ts
export async function addCartItem(request: AddToCartRequest) {
  const response = await api.post("/api/cart/items", request);
  return apiRequest(Promise.resolve(response));
}

// hooks.ts
export function useAddToCartMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: addCartItem,
    onSuccess: () => {
      // Invalidate cache so React Query refetches
      queryClient.invalidateQueries({ queryKey: queryKeys.cart });
    },
  });
}

// Component
import { useCartActions } from "@/features/cart/use-cart-actions";

export function ProductCard() {
  const { addToCart, isLoading } = useCartActions();

  return (
    <button onClick={() => addToCart(request)} disabled={isLoading}>
      {isLoading ? "Adding..." : "Add to Cart"}
    </button>
  );
}
```

## Integration Hooks (The Connectors)

Custom hooks that connect multiple features:

### `useCartActions()` - Simplified Cart Operations

```tsx
import { useCartActions } from "@/features/cart/use-cart-actions";

const { addToCart, updateQuantity, removeItem, isLoading } = useCartActions();

// Handles: optimistic updates, error messages, cache invalidation
await addToCart({ productId: 1, quantity: 2 });
```

### `useToggleWishlist()` - Wishlist Toggle

```tsx
import { useToggleWishlist } from "@/features/wishlist/use-wishlist";

const { isInWishlist, toggle, isLoading } = useToggleWishlist(productId);

// Handles: checking auth, toggling add/remove, error handling
await toggle();
```

### `useCheckout()` - Complete Checkout Flow

```tsx
import { useCheckout } from "@/features/orders/use-checkout";

const {
  checkoutSummary, // Summary data
  isEmpty, // Cart empty check
  isPlacingOrder, // Loading state
  placeOrder, // Mutation function
  updatePaymentMethod, // Mutation function
} = useCheckout();

await placeOrder(request);
```

## Component Examples

### ProductCard - Full Integration

```tsx
import { ProductCard } from "@/components/examples/ProductCard";

// Uses:
// - useCartActions() for add to cart
// - useToggleWishlist() for wishlist
// - useAuthSession() for auth check
// - Zustand store for cart sync
export function ProductsGrid({ products }: Props) {
  return (
    <div className="grid grid-cols-4 gap-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
```

### CartSummary - Local State

```tsx
import { CartSummary } from "@/components/examples/CartSummary";

// Uses:
// - useCart() from Zustand store
// - useCartActions() for mutations
// - Real-time quantity updates
export function CartPage() {
  return <CartSummary />;
}
```

### CheckoutFlow - Complex Integration

```tsx
import { CheckoutFlow } from "@/components/examples/CheckoutFlow";

// Uses:
// - useCheckout() hook
// - useAuthSession() for auth
// - useRouter() for navigation
// - Multiple form states
export function CheckoutPage() {
  return <CheckoutFlow />;
}
```

## API Query Keys

Centralized query keys for React Query:

```tsx
// src/lib/api/query-keys.ts
export const queryKeys = {
  // Cart
  cart: ["cart"],
  cartSummary: ["cart", "summary"],

  // Wishlist
  wishlist: ["wishlist"],

  // Orders
  orders: ["orders"],
  myOrders: ["orders", "my"],
  checkoutSummary: ["orders", "checkout-summary"],

  // Products
  products: ["products"],
  product: (id) => ["products", id],
};

// Usage in components
queryClient.invalidateQueries({ queryKey: queryKeys.cart });
```

## Authentication Flow

Auth state is managed in:

- **Store**: `src/features/auth/store.ts` (Zustand)
- **Services**: `src/features/auth/services.ts` (API calls)
- **Hooks**: `src/features/auth/hooks.ts` (React Query)

```tsx
import { useLoginMutation } from "@/features/auth/hooks";
import { useAuthSession } from "@/features/auth/store";

export function LoginPage() {
  const { user } = useAuthSession(); // Get auth state
  const loginMutation = useLoginMutation(); // Login mutation

  const handleLogin = async (email: string, password: string) => {
    await loginMutation.mutateAsync({ email, password });
    // Automatically redirects after success
  };
}
```

## Error Handling & Notifications

All mutations and queries include error handling:

```tsx
// Automatic toast notifications
toast.success("Item added to cart");
toast.error("Failed to add to cart");

// Manual error handling
const { addToCart, error } = useCartActions();
if (error) {
  // Handle error
}
```

## Best Practices

### 1. Always Use Integration Hooks

❌ **Bad**: Directly calling mutations in components

```tsx
const addToCart = useAddToCartMutation();
await addToCart.mutateAsync(...);
```

✅ **Good**: Use integration hooks

```tsx
const { addToCart } = useCartActions();
await addToCart(...);
```

### 2. Check Authentication Before Protected Actions

```tsx
const { user } = useAuthSession();

const handleAction = async () => {
  if (!user) {
    window.location.href = "/login";
    return;
  }
  // Continue with action
};
```

### 3. Use React Query for Server State

```tsx
// ❌ Bad: Manually managing fetch state
const [loading, setLoading] = useState(false);
const [data, setData] = useState(null);

// ✅ Good: React Query handles all state
const { data, isLoading, error } = useProductsQuery();
```

### 4. Sync Server State with Local Store

```tsx
// Use useEffect to sync
useEffect(() => {
  if (cartData) {
    setCart(cartData); // Sync to Zustand
  }
}, [cartData, setCart]);
```

### 5. Compose Hooks for Complex Logic

```tsx
// Instead of large components, create composition hooks
export function useCartCheckout() {
  const cart = useCart();
  const { placeOrder } = useCheckout();
  const { clearCart } = useCart();

  return {
    cart,
    placeOrder,
    clearCart,
  };
}

// Use in component
const { cart, placeOrder } = useCartCheckout();
```

## File Organization Summary

```
src/
├── features/
│   ├── auth/           # Authentication
│   ├── cart/           # Shopping cart
│   ├── orders/         # Orders & checkout
│   ├── products/       # Products listing
│   ├── wishlist/       # Wishlist
│   └── users/          # User profile
│
├── components/
│   ├── examples/       # Example implementations
│   │   ├── ProductCard.tsx
│   │   ├── CartSummary.tsx
│   │   └── CheckoutFlow.tsx
│   └── [feature]/      # Feature-specific components
│
├── lib/
│   ├── api/
│   │   ├── http.ts             # HTTP client
│   │   ├── query-keys.ts       # React Query keys
│   │   ├── cart-sync.ts        # Cart sync hooks
│   │   └── types.ts            # API types
│   └── store.ts                # Global store setup
│
└── types/              # TypeScript types
    ├── cart.ts
    ├── order.ts
    ├── product.ts
    └── ...
```

## Next Steps

1. **Review Examples**: Look at `ProductCard.tsx`, `CartSummary.tsx`, `CheckoutFlow.tsx`
2. **Implement Features**: Use the patterns above for new features
3. **Test Integration**: Verify component interactions with React DevTools
4. **Monitor State**: Use Redux/Zustand DevTools to debug state flow

---

For questions or improvements, refer to AGENTS.md conventions.
