import type { Product } from './product';

/**
 * Item in shopping cart
 * Matches backend CartItemResponse.java
 */
export type CartItem = {
  itemId: number;                // Maps to backend: Integer itemId
  productId: number;             // Maps to backend: Integer productId
  productName: string;           // Maps to backend: String productName
  productImage?: string;         // Maps to backend: String productImage
  price: number;                 // Maps to backend: BigDecimal price
  quantity: number;              // Maps to backend: Integer quantity
  lineTotal: number;             // Maps to backend: BigDecimal lineTotal (price * quantity)
  /** Kept for components that embed a full product object from local state */
  product?: Product;
};

/**
 * Shopping cart
 * Matches backend CartResponse.java
 */
export type Cart = {
  cartId: number;                // Maps to backend: Integer cartId
  items: CartItem[];             // Maps to backend: List<CartItemResponse>
  totalItems: number;            // Maps to backend: Integer totalItems (sum of quantities)
  distinctItemCount: number;     // Maps to backend: Integer distinctItemCount (count of unique products)
  subtotal: number;              // Maps to backend: BigDecimal subtotal
  totalPrice: number;            // Maps to backend: BigDecimal totalPrice
  empty: boolean;                // Maps to backend: Boolean empty
};

/**
 * Request to add item to cart
 * Matches backend AddToCartRequest.java
 */
export type AddCartItemRequest = {
  productId: number;             // Maps to backend: Integer productId (required, not null)
  quantity: number;              // Maps to backend: Integer quantity (required, >= 1)
};

/**
 * Request to update cart item quantity
 * Matches backend UpdateCartItemRequest.java
 */
export type UpdateCartItemRequest = {
  quantity: number;              // Maps to backend: Integer quantity
};
