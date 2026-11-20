import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams('method=MOMO'),
}));

import CheckoutSuccessPage from './page';

describe('CheckoutSuccessPage', () => {
  afterEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it('renders stored order from sessionStorage without getSnapshot loop warnings', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    sessionStorage.setItem(
      'lastOrder',
      JSON.stringify({
        orderNumber: 'FS-20260001',
        method: 'MOMO',
        shippingAddress: '123 Le Loi, District 1, HCMC',
        items: [
          {
            productId: 1,
            name: 'Structured Wool Blazer',
            quantity: 2,
            price: 120,
            total: 240,
          },
        ],
        subtotal: 240,
        shippingFee: 0,
        discount: 0,
        total: 240,
      }),
    );

    render(<CheckoutSuccessPage />);

    expect(screen.getByText('#FS-20260001')).toBeInTheDocument();
    expect(screen.getByText('123 Le Loi, District 1, HCMC')).toBeInTheDocument();
    expect(screen.getByText('Structured Wool Blazer')).toBeInTheDocument();
    expect(screen.getByText('Momo E-Wallet')).toBeInTheDocument();
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });
});
