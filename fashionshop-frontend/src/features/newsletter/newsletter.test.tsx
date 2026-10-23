import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NewsletterSection } from '@/components/home/newsletter-section';

const mockMutateAsync = vi.fn();
let mockIsPending = false;

vi.mock('@/features/newsletter/hooks', () => ({
  useNewsletterSubscribeMutation: () => ({
    mutateAsync: mockMutateAsync,
    isPending: mockIsPending,
  }),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

describe('NewsletterSection Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsPending = false;
  });

  it('renders heading and form controls initially', () => {
    render(<NewsletterSection />);

    expect(screen.getByRole('heading', { level: 2, name: /join fashionshop/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/enter your email/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /subscribe/i })).toBeInTheDocument();
  });

  it('shows error message if submitted with empty email', async () => {
    render(<NewsletterSection />);

    const submitBtn = screen.getByRole('button', { name: /subscribe/i });
    fireEvent.click(submitBtn);

    expect(await screen.findByTestId('newsletter-error')).toHaveTextContent(/please enter your email address/i);
    expect(mockMutateAsync).not.toHaveBeenCalled();
  });

  it('handles successful subscription and allows reset', async () => {
    mockMutateAsync.mockResolvedValueOnce({
      id: 1,
      email: 'test@example.com',
      isActive: true,
      createdAt: '2026-10-23T10:00:00Z',
    });

    render(<NewsletterSection />);

    const input = screen.getByPlaceholderText(/enter your email/i);
    fireEvent.change(input, { target: { value: 'guest@example.com' } });

    const submitBtn = screen.getByRole('button', { name: /subscribe/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({ email: 'guest@example.com' });
    });

    expect(await screen.findByTestId('newsletter-success')).toBeInTheDocument();
    expect(screen.getByText(/welcome to the circle/i)).toBeInTheDocument();

    const resetBtn = screen.getByRole('button', { name: /subscribe another email/i });
    fireEvent.click(resetBtn);

    expect(screen.getByPlaceholderText(/enter your email/i)).toBeInTheDocument();
  });

  it('handles duplicate email subscription error gracefully', async () => {
    mockMutateAsync.mockRejectedValueOnce({
      code: 'DUPLICATE_EMAIL',
      status: 409,
      message: 'This email is already subscribed to our newsletter',
    });

    render(<NewsletterSection />);

    const input = screen.getByPlaceholderText(/enter your email/i);
    fireEvent.change(input, { target: { value: 'existing@example.com' } });

    const submitBtn = screen.getByRole('button', { name: /subscribe/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({ email: 'existing@example.com' });
    });

    expect(await screen.findByTestId('newsletter-duplicate')).toHaveTextContent(
      /this email address is already subscribed to our newsletter/i,
    );
  });

  it('handles server errors gracefully', async () => {
    mockMutateAsync.mockRejectedValueOnce({
      status: 500,
      message: 'Service unavailable. Please try again.',
    });

    render(<NewsletterSection />);

    const input = screen.getByPlaceholderText(/enter your email/i);
    fireEvent.change(input, { target: { value: 'error@example.com' } });

    const submitBtn = screen.getByRole('button', { name: /subscribe/i });
    fireEvent.click(submitBtn);

    expect(await screen.findByTestId('newsletter-error')).toHaveTextContent(
      /service unavailable. please try again./i,
    );
  });
});
