# Backend ↔ Frontend Type Mapping Report

**Date**: May 3, 2026  
**Status**: Type Audit & Compatibility Check

---

## Summary

Found **multiple type mismatches** between backend (Java/Spring Boot) and frontend (TypeScript/Next.js). This document lists all mismatches and recommends fixes.

### Critical Issues (🔴)

- ID fields: Backend uses `Integer`, Frontend uses `string`
- Decimal fields: Backend uses `BigDecimal`, Frontend uses `number`
- Field naming inconsistencies across multiple modules
- Missing fields in frontend types

### Type Conversion Rules

| Backend Type    | Frontend Type | Note                               |
| --------------- | ------------- | ---------------------------------- |
| `Integer`       | `number`      | ✅ Direct                          |
| `Integer` (IDs) | `string`      | ⚠️ Mismatch - should be consistent |
| `BigDecimal`    | `number`      | ⚠️ Precision loss                  |
| `LocalDateTime` | `string`      | Format: ISO 8601                   |
| `Boolean`       | `boolean`     | ✅ Direct                          |
| `Enum`          | Union type    | ✅ Direct                          |
| `String`        | `string`      | ✅ Direct                          |

---

## Module-by-Module Analysis

### 1. 🔴 AUTH Module

#### Backend (AuthResponse.java)

```java
@Data
@Builder
public class AuthResponse {
    private String token;           // String
    private Integer userId;         // Integer ⚠️
    private String fullName;        // String
    private String email;           // String
    private Role role;              // Enum
}
```

#### Frontend (auth.ts)

```typescript
export type AuthSession = {
  accessToken: string; // ✓ Matches token
  refreshToken?: string; // ❌ Not in backend
  user: AuthUser; // ✓ Wraps user data
};

// AuthUser comes from common.ts
export type AuthUser = {
  id: string; // ❌ Backend: Integer
  email: string; // ✓
  fullName: string; // ✓
  role: Role; // ✓
  phoneNumber?: string; // ❌ Not in AuthResponse
  avatarUrl?: string; // ❌ Not in AuthResponse
  isActive?: boolean; // ❌ Not in AuthResponse
  accountStatus?: "ACTIVE" | "LOCKED" | "DELETED"; // ❌ Not in AuthResponse
};
```

#### Issues Found

| Field         | Backend Type | Frontend Type        | Status                |
| ------------- | ------------ | -------------------- | --------------------- |
| id/userId     | Integer      | string               | 🔴 Type Mismatch      |
| token         | String       | accessToken (string) | ✓ OK (name diff)      |
| refreshToken  | N/A          | string?              | 🔴 Missing in backend |
| phoneNumber   | N/A          | string?              | 🔴 Missing in backend |
| avatarUrl     | N/A          | string?              | 🔴 Missing in backend |
| accountStatus | N/A          | enum?                | 🔴 Missing in backend |

#### ✅ Recommended Fix

Update frontend `AuthSession` to match backend exactly:

```typescript
export type AuthSession = {
  token: string;
  userId: number;
  fullName: string;
  email: string;
  role: Role;
};

export type AuthUser = {
  id: string; // Convert userId to string for consistency
  email: string;
  fullName: string;
  role: Role;
};
```

---

### 2. 🟡 PRODUCT Module

#### Backend (ProductResponse.java)

```java
@Data
@Builder
public class ProductResponse {
    private Integer id;             // Integer ⚠️
    private Integer categoryId;     // Integer ⚠️
    private String categoryName;    // String
    private String name;            // String
    private String description;     // String
    private BigDecimal price;       // BigDecimal ⚠️
    private String imageUrl;        // String
    private Integer stockQuantity;  // Integer
    private Boolean isActive;       // Boolean
    private String manageDetailUrl; // String
}
```

#### Frontend (product.ts)

```typescript
export type Product = {
  id: string; // ❌ Backend: Integer
  name: string; // ✓
  description?: string; // ✓
  price: number; // ✓ (BigDecimal → number)
  stockQuantity: number; // ✓
  categoryId?: number; // ✓ But backend: Integer (not optional)
  categoryName?: string; // ✓
  imageUrl?: string; // ✓
  images?: ProductImage[]; // ❌ Not in backend
  isActive: boolean; // ✓
  isFeatured: boolean; // ❌ Not in backend
  slug?: string; // ❌ Not in StoreProductDetailResponse
  stock?: number; // ⚠️ Duplicate of stockQuantity
  compareAtPrice?: number; // ❌ Not in ProductResponse
  colors?: string[]; // ❌ Not in ProductResponse
  sizes?: string[]; // ❌ Not in ProductResponse
};
```

#### StoreProductDetailResponse (More detailed)

```java
private Integer id;
private String slug;
private String name;
private BigDecimal price;
private BigDecimal originalPrice;    // Should map to compareAtPrice
private BigDecimal salePrice;        // ❌ Not in frontend
private List<String> sizeOptions;    // Maps to sizes
private List<String> colorOptions;   // Maps to colors
private List<String> galleryImages;  // Maps to images
```

#### Issues Found

| Field        | Backend Type                | Frontend Type  | Status                       |
| ------------ | --------------------------- | -------------- | ---------------------------- |
| id           | Integer                     | string         | 🔴 Type Mismatch             |
| price        | BigDecimal                  | number         | ⚠️ Precision loss            |
| categoryId   | Integer                     | number?        | ✓ OK (optional in frontend)  |
| images       | N/A                         | ProductImage[] | 🔴 Missing                   |
| isFeatured   | N/A                         | boolean        | 🔴 Missing                   |
| slug         | String (StoreProductDetail) | string?        | ⚠️ Only in detailed response |
| colors/sizes | Enums/Lists                 | string[]       | ✓ OK                         |
| salePrice    | BigDecimal                  | N/A            | 🔴 Not used in frontend      |

#### ✅ Recommended Fix

```typescript
export type Product = {
  id: number; // Change to number (or string if needed for API compatibility)
  name: string;
  description?: string;
  price: number;
  originalPrice?: number; // From compareAtPrice
  salePrice?: number;
  stockQuantity: number;
  categoryId?: number;
  categoryName?: string;
  imageUrl?: string;
  galleryImages?: string[]; // From galleryImages in detail response
  isActive: boolean;
  slug?: string; // From detail response
  sizeOptions?: string[]; // From backend
  colorOptions?: string[]; // From backend
};
```

---

### 3. 🟡 CART Module

#### Backend (CartResponse.java & CartItemResponse.java)

```java
// CartResponse
private Integer cartId;
private List<CartItemResponse> items;
private Integer totalItems;
private Integer distinctItemCount;
private BigDecimal subtotal;
private BigDecimal totalPrice;
private Boolean empty;

// CartItemResponse
private Integer itemId;
private Integer productId;
private String productName;
private String productImage;
private BigDecimal price;
private Integer quantity;
private BigDecimal lineTotal;
```

#### Frontend (cart.ts)

```typescript
export type CartItem = {
  itemId: number; // ✓ (Integer → number)
  productId: number; // ✓
  productName: string; // ✓
  productImage?: string; // ✓ (productImage in backend)
  price: number; // ✓ (BigDecimal → number)
  quantity: number; // ✓
  lineTotal: number; // ✓ (BigDecimal → number)
  product?: Product; // ❌ Not in backend
};

export type Cart = {
  cartId: number; // ✓
  items: CartItem[]; // ✓
  totalItems: number; // ✓
  distinctItemCount: number; // ✓
  subtotal: number; // ✓ (BigDecimal → number)
  totalPrice: number; // ✓
  empty: boolean; // ✓
};
```

#### AddToCartRequest

```typescript
// Backend
@Data
public class AddToCartRequest {
    private Integer productId;
    @Min(value = 1)
    private Integer quantity;
}

// Frontend
export type AddCartItemRequest = {
    productId: number;              // ✓
    quantity: number;               // ✓
};
```

#### Issues Found

| Field       | Backend Type       | Frontend Type | Status                   |
| ----------- | ------------------ | ------------- | ------------------------ |
| All numeric | Integer/BigDecimal | number        | ⚠️ Precision OK for cart |
| All strings | String             | string        | ✓ OK                     |
| empty       | Boolean            | boolean       | ✓ OK                     |
| product     | N/A                | Product?      | ⚠️ Local cache only      |

#### ✅ Status: ✓ TYPES MATCH (BigDecimal → number is acceptable for cart values)

---

### 4. 🔴 ORDER Module

#### Backend (OrderResponse.java)

```java
@Data
@Builder
public class OrderResponse {
    private Integer id;                         // Integer ⚠️
    private OrderStatus status;                 // Enum
    private BigDecimal totalPrice;              // BigDecimal
    private String receiverName;                // String
    private String phone;                       // String
    private String shippingAddress;             // String
    private String customerNote;                // String
    private PaymentMethod paymentMethod;        // Enum
    private String cancellationReason;          // String
    private LocalDateTime createdAt;            // LocalDateTime
    private String detailPath;                  // String
    private List<OrderItemResponse> items;      // List
}

// OrderItemResponse
private Integer productId;
private String name;
private Integer quantity;
private BigDecimal price;
private BigDecimal total;
private String imageUrl;
```

#### Frontend (order.ts)

```typescript
export type Order = {
    id: string;                     // ❌ Backend: Integer
    orderNumber?: string;           // ❌ Not in backend
    status: OrderStatus;            // ✓
    paymentStatus?: PaymentStatus;  // ❌ Not in backend
    paymentMethod?: PaymentMethod;  // ✓ (but required in backend)
    customerName?: string;          // ❌ Backend: receiverName
    customerEmail?: string;         // ❌ Not in backend
    customerPhone?: string;         // ❌ Backend: phone
    customerAvatar?: string;        // ❌ Not in backend
    customerTotalOrders?: number;   // ❌ Not in backend
    items: OrderSummaryItem[];      // ✓ (structure differs)
    subtotal: number;               // ❌ Not in backend directly
    shippingFee: number;            // ❌ Not in backend
    discount: number;               // ❌ Not in backend
    total: number;                  // ❌ Backend: totalPrice
    createdAt?: string;             // ✓ (LocalDateTime)
    shippingAddress?: string;       // ✓
    note?: string;                  // ✓ (Backend: customerNote)
    activityLog?: Array<{...}>;     // ❌ Not in backend
};

export type OrderSummaryItem = {
    productId: string;              // ❌ Backend: Integer
    name: string;                   // ✓
    quantity: number;               // ✓
    price: number;                  // ✓
    total: number;                  // ✓
    imageUrl?: string;              // ✓
};

export type CheckoutSummary = {
    cartId: number;                 // ✓
    empty: boolean;                 // ✓
    message?: string;               // ✓
    customerName?: string;          // ✓
    customerPhone?: string;         // ✓
    suggestedShippingAddress?: string; // ✓
    availablePaymentMethods: PaymentMethod[]; // ✓
    selectedPaymentMethod: PaymentMethod; // ✓
    items: OrderSummaryItem[];      // ✓
    totalItems: number;             // ✓
    distinctItemCount: number;      // ✓
    subtotal: number;               // ✓
    shippingFee: number;            // ✓
    discountAmount: number;         // ✓
    finalTotal: number;             // ✓
};
```

#### Issues Found

| Field            | Backend Type | Frontend Type | Status                |
| ---------------- | ------------ | ------------- | --------------------- |
| id               | Integer      | string        | 🔴 Type Mismatch      |
| orderNumber      | N/A          | string?       | 🔴 Missing in backend |
| total/totalPrice | BigDecimal   | number        | ✓ OK                  |
| status           | Enum         | Enum          | ✓ OK                  |
| paymentStatus    | N/A          | Enum?         | 🔴 Missing in backend |
| receiverName     | String       | customerName  | ⚠️ Name differs       |
| phone            | String       | customerPhone | ⚠️ Name differs       |
| customerNote     | String       | note          | ⚠️ Name differs       |
| activityLog      | N/A          | Array         | 🔴 Missing in backend |

#### ✅ Recommended Fix

```typescript
export type Order = {
  id: number; // Change to number
  status: OrderStatus; // ✓
  totalPrice: number; // Rename from 'total'
  receiverName: string; // Use backend name
  phone: string; // Use backend name
  shippingAddress: string; // ✓
  customerNote?: string; // Use backend name
  paymentMethod: PaymentMethod; // ✓
  cancellationReason?: string; // From backend
  createdAt: string; // From backend (LocalDateTime → ISO 8601)
  items: OrderItemResponse[]; // Match backend structure
};

export type OrderItemResponse = {
  productId: number; // Change from string
  name: string;
  quantity: number;
  price: number;
  total: number;
  imageUrl?: string;
};
```

---

### 5. 🟡 WISHLIST Module

#### Backend (WishlistItemResponse.java)

```java
@Data
@Builder
public class WishlistItemResponse {
    private Integer wishlistId;     // Integer
    private Integer productId;      // Integer ⚠️
    private String productName;     // String
    private BigDecimal price;       // BigDecimal
    private String imageUrl;        // String
    private LocalDateTime createdAt; // LocalDateTime ⚠️
}
```

#### Frontend (wishlist.ts)

```typescript
export type WishlistItem = {
  wishlistId: number; // ✓
  productId: number; // ✓
  productName: string; // ✓
  price: number; // ✓
  imageUrl?: string; // ✓
};
```

#### Issues Found

| Field     | Backend Type  | Frontend Type | Status                 |
| --------- | ------------- | ------------- | ---------------------- |
| createdAt | LocalDateTime | N/A           | 🔴 Missing in frontend |

#### ✅ Recommended Fix

```typescript
export type WishlistItem = {
  wishlistId: number;
  productId: number;
  productName: string;
  price: number;
  imageUrl?: string;
  createdAt?: string; // Add LocalDateTime conversion
};
```

---

### 6. 🟡 USER Module

#### Backend (UserResponse.java)

```java
@Data
@Builder
public class UserResponse {
    private Integer id;             // Integer ⚠️
    private String fullName;        // String
    private String email;           // String
    private String phoneNumber;     // String
    private String address;         // String
    private String avatarUrl;       // String
    private String bio;             // String
    private Role role;              // Enum
    private Boolean isActive;       // Boolean
    private AccountStatus accountStatus; // Enum
    private LocalDateTime createdAt; // LocalDateTime
}
```

#### Frontend (common.ts & user.ts)

```typescript
export type AuthUser = {
  id: string; // ❌ Backend: Integer
  email: string; // ✓
  fullName: string; // ✓
  role: Role; // ✓
  phoneNumber?: string; // ✓ (not optional in backend)
  avatarUrl?: string; // ✓ (not in AuthResponse)
  isActive?: boolean; // ✓ (in UserResponse)
  accountStatus?: "ACTIVE" | "LOCKED" | "DELETED"; // ✓ (in UserResponse)
};

export type UpdateProfileRequest = {
  fullName: string; // ✓
  email: string; // ✓
  phoneNumber?: string; // ✓
  address?: string; // ✓
  avatarUrl?: string; // ✓
  bio?: string; // ✓
};
```

#### Issues Found

| Field         | Backend Type  | Frontend Type       | Status                   |
| ------------- | ------------- | ------------------- | ------------------------ |
| id            | Integer       | string              | 🔴 Type Mismatch         |
| address       | String        | N/A (UpdateProfile) | ⚠️ Missing from AuthUser |
| bio           | String        | N/A (UpdateProfile) | ⚠️ Missing from AuthUser |
| isActive      | Boolean       | boolean?            | ✓ OK                     |
| accountStatus | Enum          | enum?               | ✓ OK                     |
| createdAt     | LocalDateTime | N/A                 | ⚠️ Missing               |

#### ✅ Recommended Fix

```typescript
export type AuthUser = {
  id: number; // Change from string
  email: string;
  fullName: string;
  role: Role;
  phoneNumber?: string;
  address?: string; // Add from UserResponse
  avatarUrl?: string;
  bio?: string; // Add from UserResponse
  isActive?: boolean;
  accountStatus?: "ACTIVE" | "LOCKED" | "DELETED";
  createdAt?: string; // Add LocalDateTime conversion
};
```

---

## Action Items

### 🔴 Critical (Must Fix)

- [ ] **Update `src/types/auth.ts`**
  - Change `userId` from `Integer` to `number` in AuthSession mapping
  - Align field naming with backend

- [ ] **Update `src/types/product.ts`**
  - Change `id` from `string` to `number`
  - Add missing fields from StoreProductDetailResponse

- [ ] **Update `src/types/order.ts`**
  - Change all ID fields from `string` to `number`
  - Rename fields to match backend (receiverName, phone, customerNote)

- [ ] **Update `src/types/user.ts`**
  - Change `id` from `string` to `number`
  - Add missing fields (address, bio, createdAt)

- [ ] **Update `src/types/common.ts` (AuthUser)**
  - Align with backend UserResponse structure

### 🟡 Important (Should Fix)

- [ ] Review all `number` ← `BigDecimal` conversions for precision
- [ ] Add missing fields: `createdAt` in WishlistItem
- [ ] Standardize DateTime handling (LocalDateTime → ISO 8601 string)
- [ ] Update all services.ts to use correct field names

### 🟢 Nice to Have

- [ ] Update documentation with type mappings
- [ ] Add type conversion helpers for BigDecimal
- [ ] Add validation for numeric ranges

---

## Testing Recommendations

1. **Type Checking**: Run `tsc --noEmit` to verify no type errors
2. **API Response Validation**: Log actual API responses in console and compare with types
3. **Unit Tests**: Create type guards for critical types
4. **Integration Tests**: Test API requests/responses with real backend

```typescript
// Example type guard
function isValidProduct(data: unknown): data is Product {
  return (
    typeof data === "object" &&
    data !== null &&
    "id" in data &&
    typeof (data as any).id === "number"
  );
}
```

---

**Document Status**: Complete audit  
**Last Updated**: May 3, 2026  
**Next Review**: After implementing fixes
