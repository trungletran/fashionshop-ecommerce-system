import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { HeroSection } from '@/components/home/hero-section';
import { ArchiveBannerSection } from '@/components/home/archive-banner-section';
import { NewsletterSection } from '@/components/home/newsletter-section';
import { StorefrontFooter } from '@/components/layout/storefront-footer';
import LookbookPage from '@/app/(public)/lookbook/page';

describe('Homepage Navigation and Branding', () => {
  it('renders HeroSection with correct links and FashionShop branding', () => {
    render(<HeroSection />);

    const shopLink = screen.getByRole('link', { name: /shop the collection/i });
    expect(shopLink).toHaveAttribute('href', '/products');

    const lookbookLink = screen.getByRole('link', { name: /view lookbook/i });
    expect(lookbookLink).toHaveAttribute('href', '/lookbook');

    const heroImage = screen.getByAltText(/fashionshop campaign look/i);
    expect(heroImage).toBeInTheDocument();
  });

  it('renders ArchiveBannerSection with EXPLORE THE VAULT pointing to /products', () => {
    render(<ArchiveBannerSection />);

    const vaultLink = screen.getByRole('link', { name: /explore the vault/i });
    expect(vaultLink).toHaveAttribute('href', '/products');
  });

  it('renders NewsletterSection with FashionShop branding', () => {
    render(<NewsletterSection />);

    expect(screen.getByRole('heading', { level: 2, name: /join fashionshop/i })).toBeInTheDocument();
  });

  it('renders StorefrontFooter with FashionShop branding', () => {
    render(<StorefrontFooter />);

    expect(screen.getByRole('heading', { level: 2, name: /fashionshop/i })).toBeInTheDocument();
    expect(screen.getByText(/© 2026 FashionShop. All rights reserved./i)).toBeInTheDocument();
  });

  it('renders LookbookPage correctly', () => {
    render(<LookbookPage />);

    expect(screen.getByRole('heading', { level: 1, name: /lookbook/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /shop all products/i })).toHaveAttribute('href', '/products');
  });
});
