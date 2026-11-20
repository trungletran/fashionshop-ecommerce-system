import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const routerPushMock = vi.fn();
const addCartMutateMock = vi.fn();
const authState = vi.hoisted(() => ({ token: 'jwt-token' as string | null }));

vi.mock('next/navigation', () => ({
  usePathname: () => '/products/1',
  useRouter: () => ({ push: routerPushMock }),
}));

vi.mock('@/features/cart/hooks', () => ({
  useAddCartItemMutation: () => ({ mutate: addCartMutateMock, isPending: false }),
}));

vi.mock('@/features/auth/store', () => ({
  useAuthSession: () => ({ token: authState.token, user: null }),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

import { AiChatbox } from './AiChatbox';

describe('AiChatbox', () => {
  beforeEach(() => {
    sessionStorage.clear();
    routerPushMock.mockReset();
    addCartMutateMock.mockReset();
    authState.token = 'jwt-token';
    Element.prototype.scrollIntoView = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('opens drawer, renders contextual product chip, escapes HTML safely (no XSS), and allows Add to Bag', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: true,
          data: {
            stylistComment: 'Try **Classic Denim** <img src=x onerror=alert(1)> for contrast.',
            recommendedProducts: [
              {
                id: 3,
                name: 'Classic Blue Denim Jeans',
                categoryName: 'Pants',
                price: 59.99,
              },
            ],
            suggestedPrompts: ['Show shoes under $80'],
          },
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );

    render(<AiChatbox />);

    fireEvent.click(screen.getByRole('button', { name: 'Toggle AI Stylist' }));

    const contextChip = screen.getByRole('button', { name: 'Phối sản phẩm đang xem với gì đẹp?' });
    expect(contextChip).toBeInTheDocument();

    fireEvent.click(contextChip);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    // Safe markdown rendered, raw HTML escaped as text (no injected <img> element)
    expect(await screen.findByText('Classic Denim')).toBeInTheDocument();
    expect(screen.getByText(/<img src=x onerror=alert\(1\)>/)).toBeInTheDocument();
    expect(document.querySelector('img[src="x"]')).toBeNull();

    // Recommended product card + Add to bag action
    expect(screen.getByText('Classic Blue Denim Jeans')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Add Classic Blue Denim Jeans to bag' }));
    expect(addCartMutateMock).toHaveBeenCalledWith({ productId: 3, quantity: 1 }, expect.any(Object));
  });

  it('rejects unsupported file formats with an accessible error alert', () => {
    render(<AiChatbox />);
    fireEvent.click(screen.getByRole('button', { name: 'Toggle AI Stylist' }));

    const fileInput = screen.getByLabelText('Upload outfit photo');
    const badFile = new File(['<svg/>'], 'bad.svg', { type: 'image/svg+xml' });
    fireEvent.change(fileInput, { target: { files: [badFile] } });

    expect(screen.getByRole('alert')).toHaveTextContent('Please attach a JPEG, PNG, or WEBP image.');
  });
});
