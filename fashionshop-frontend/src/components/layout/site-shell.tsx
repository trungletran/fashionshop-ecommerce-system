import { StorefrontHeader } from '@/components/layout/storefront-header';
import { StorefrontFooter } from '@/components/layout/storefront-footer';

export function SiteShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-surface font-body text-on-surface">
      <StorefrontHeader />
      <main className="flex-1">{children}</main>
      <StorefrontFooter />
    </div>
  );
}
