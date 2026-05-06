export const queryKeys = {
  auth: ['auth'] as const,
  me: ['me'] as const,
  home: ['home'] as const,
  dashboard: (from?: string, to?: string) => ['dashboard', from ?? '', to ?? ''] as const,
  categories: ['categories'] as const,
  products: ['products'] as const,
  product: (idOrSlug: string) => ['products', idOrSlug] as const,
  storeProducts: (filter?: unknown) => ['store', 'products', filter ?? {}] as const,
  
  // Cart endpoints
  cart: ['cart'] as const,
  cartSummary: ['cart', 'summary'] as const,
  
  // Wishlist endpoints
  wishlist: ['wishlist'] as const,
  wishlistContains: (productId: number) => ['wishlist', 'contains', productId] as const,
  
  // Orders endpoints
  orders: ['orders'] as const,
  myOrders: ['orders', 'my'] as const,
  orderDetail: ['orders', 'detail'] as const,
  checkoutSummary: ['orders', 'checkout-summary'] as const,
  tracking: ['orders', 'tracking'] as const,
  order: (orderId: string) => ['orders', orderId] as const,
  
  // Payments
  payments: (orderId: string) => ['payments', orderId] as const,
  
  // Invoices
  invoices: (invoiceId: string) => ['invoices', invoiceId] as const,
  
  // Admin
  staffAccounts: ['admin', 'staff-accounts'] as const,
  customerAccounts: ['admin', 'customer-accounts'] as const,
};
