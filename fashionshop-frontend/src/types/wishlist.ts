/**
 * Wishlist item type
 * Matches backend WishlistItemResponse.java
 */
export type WishlistItem = {
  wishlistId: number;            // Maps to backend: Integer wishlistId
  productId: number;             // Maps to backend: Integer productId
  productName: string;           // Maps to backend: String productName
  price: number;                 // Maps to backend: BigDecimal price
  imageUrl?: string;             // Maps to backend: String imageUrl
  createdAt?: string;            // Maps to backend: LocalDateTime createdAt → ISO 8601 string
};
