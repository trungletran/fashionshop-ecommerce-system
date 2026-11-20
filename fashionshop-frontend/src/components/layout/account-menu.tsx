'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { UserRound } from 'lucide-react';

type AccountMenuProps = {
  isLoggedIn: boolean;
  avatarUrl?: string;
  fullName?: string;
  onLogout: () => void;
};

const menuItems = [
  { label: 'Profile', href: '/account', testId: 'customer-menu-profile' },
  { label: 'Cart', href: '/cart', testId: 'customer-menu-cart' },
  { label: 'Wishlist', href: '/wishlist', testId: 'customer-menu-wishlist' },
  { label: 'Order', href: '/orders', testId: 'customer-menu-order' },
] as const;

export function AccountMenu({ isLoggedIn, avatarUrl, fullName, onLogout }: AccountMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [failedAvatarUrl, setFailedAvatarUrl] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const showAvatar = Boolean(avatarUrl && avatarUrl !== failedAvatarUrl);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  if (!isLoggedIn) {
    return (
      <Link
        href="/auth"
        aria-label="Open account"
        className="inline-flex h-9 w-9 items-center justify-center rounded-full text-on-surface/80 transition-colors hover:bg-surface-container hover:text-primary"
      >
        <UserRound className="h-4 w-4" />
      </Link>
    );
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-label="Open account menu"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        onClick={() => setIsOpen((current) => !current)}
        className="relative inline-flex h-9 w-9 cursor-pointer items-center justify-center overflow-hidden rounded-full text-on-surface/80 transition-colors hover:bg-surface-container hover:text-primary"
      >
        {showAvatar && avatarUrl ? (
          <Image
            src={avatarUrl}
            alt={fullName ? `${fullName} avatar` : 'User avatar'}
            fill
            sizes="36px"
            className="object-cover"
            onError={() => setFailedAvatarUrl(avatarUrl)}
          />
        ) : (
          <UserRound className="h-4 w-4" />
        )}
      </button>

      {isOpen ? (
        <div
          className="absolute right-0 top-[calc(100%+0.5rem)] z-50 min-w-[180px] rounded-lg border border-outline-variant/70 bg-surface-container-lowest p-1.5 shadow-xl"
          role="menu"
          data-testid="customer-menu"
        >
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              role="menuitem"
              data-testid={item.testId}
              onClick={() => setIsOpen(false)}
              className="block rounded-md px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-on-surface-variant transition-colors hover:bg-surface-container hover:text-primary"
            >
              {item.label}
            </Link>
          ))}

          <div className="my-1 border-t border-outline-variant/50" />

          <button
            type="button"
            role="menuitem"
            data-testid="customer-menu-logout"
            onClick={() => {
              setIsOpen(false);
              onLogout();
            }}
            className="block w-full cursor-pointer rounded-md px-3 py-2 text-left text-xs font-semibold uppercase tracking-[0.14em] text-error transition-colors hover:bg-error-container/40"
          >
            Logout
          </button>
        </div>
      ) : null}
    </div>
  );
}
