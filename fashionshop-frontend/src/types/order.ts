export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'CANCELLED';

export type PaymentStatus = 'PENDING' | 'PROCESSING' | 'UNPAID' | 'PAID' | 'FAILED' | 'CANCELLED' | 'REFUNDED';

/**
 * Matches backend PaymentMethod enum
 * COD = Cash on Delivery, BANKING = Bank Transfer
 */
export type PaymentMethod = 'COD' | 'BANKING' | 'MOMO' | 'VNPAY';

export type OrderFilter = {
  keyword?: string;
  status?: OrderStatus | '';
  page?: number;
  size?: number;
};

/**
 * Item in order summary
 * Matches backend OrderItemResponse.java
 */
export type OrderSummaryItem = {
  productId: number;             // Changed from string to number (matches backend: Integer)
  name: string;
  quantity: number;
  price: number;                 // Maps to backend: BigDecimal price
  total: number;                 // Maps to backend: BigDecimal total (sum of price * quantity)
  imageUrl?: string;
};

/**
 * Main Order type
 * Matches backend OrderResponse.java
 */
export type Order = {
  id: number;                    // Changed from string to number (matches backend: Integer id)
  status: OrderStatus;           // Maps to backend: OrderStatus
  totalPrice: number;            // Maps to backend: BigDecimal totalPrice
  receiverName: string;          // Maps to backend: String receiverName
  phone: string;                 // Maps to backend: String phone
  shippingAddress: string;       // Maps to backend: String shippingAddress
  customerNote?: string;         // Maps to backend: String customerNote
  paymentMethod: PaymentMethod;  // Maps to backend: PaymentMethod
  cancellationReason?: string;   // Maps to backend: String cancellationReason
  createdAt?: string;            // Maps to backend: LocalDateTime createdAt → ISO 8601
  detailPath?: string;           // Maps to backend: String detailPath
  items: OrderSummaryItem[];     // Maps to backend: List<OrderItemResponse>

  // Legacy fields (for backward compatibility)
  orderNumber?: string;
  paymentStatus?: PaymentStatus;
  customerName?: string;         // Alias for receiverName
  customerEmail?: string;
  customerPhone?: string;        // Alias for phone
  customerAvatar?: string;
  customerTotalOrders?: number;
  subtotal?: number;
  shippingFee?: number;
  discount?: number;
  total?: number;                // Alias for totalPrice
  note?: string;                 // Alias for customerNote
  activityLog?: Array<{
    status: string;
    timestamp: string;
    isPrimary?: boolean;
  }>;
};

/**
 * Checkout summary before placing order
 * Matches backend CheckoutSummaryResponse.java
 */
export type CheckoutSummary = {
  cartId: number;
  empty: boolean;
  message?: string;
  customerName?: string;
  customerPhone?: string;
  suggestedShippingAddress?: string;
  availablePaymentMethods: PaymentMethod[];
  selectedPaymentMethod: PaymentMethod;
  items: OrderSummaryItem[];
  totalItems: number;
  distinctItemCount: number;
  subtotal: number;              // Maps to backend: BigDecimal subtotal
  shippingFee: number;           // Maps to backend: BigDecimal shippingFee
  discountAmount: number;        // Maps to backend: BigDecimal discountAmount
  finalTotal: number;            // Maps to backend: BigDecimal finalTotal
};

/**
 * Request to place an order
 * Matches backend PlaceOrderRequest.java
 */
export type PlaceOrderRequest = {
  receiverName: string;          // Maps to backend: String receiverName
  phone: string;                 // Maps to backend: String phone (regex: ^(\+?[0-9]{9,15})$)
  shippingAddress: string;       // Maps to backend: String shippingAddress
  city?: string;
  district?: string;
  province?: string;
  postalCode?: string;
  note?: string;                 // Maps to backend: String note (max 500 chars)
  paymentMethod: PaymentMethod;  // Maps to backend: PaymentMethod
};

/**
 * Legacy type - use PlaceOrderRequest instead
 * Kept for backward compatibility
 */
export type CreateOrderRequest = {
  receiverName: string;
  phone: string;
  shippingAddress: string;
  city?: string;
  district?: string;
  province?: string;
  postalCode?: string;
  note?: string;
  paymentMethod: PaymentMethod;
};
