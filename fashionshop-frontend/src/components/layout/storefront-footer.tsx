import Image from 'next/image';
import Link from 'next/link';

type FooterGroup = {
  title: string;
  links: Array<{ label: string; href: string }>;
};

const footerGroups: FooterGroup[] = [
  {
    title: 'Services',
    links: [
      { label: 'Sustainability', href: '/policies#sustainability' },
      { label: 'Shipping & Returns', href: '/policies#shipping-returns' },
      { label: 'FAQ', href: '/faq' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy Policy', href: '/policies#privacy-policy' },
      { label: 'Terms of Service', href: '/policies#terms-of-service' },
    ],
  },
  {
    title: 'Connect',
    links: [
      { label: 'Contact', href: '/contact' },
      { label: 'Instagram', href: 'https://instagram.com' },
    ],
  },
];

export function StorefrontFooter() {
  return (
    <footer className="mt-14 bg-surface-container text-on-surface">
      <div className="px-4 py-12 sm:px-6 lg:px-10 xl:px-12">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr] lg:gap-12">
          <section aria-label="Brand" className="max-w-md space-y-4">
            <div className="flex items-center gap-3">
              <Image src="/images/logo.png" alt="18.STUDIO logo" width={50} height={50} className="h-10 w-10 object-contain" />
              <h2 className="text-xl font-semibold tracking-tight text-on-surface">18.STUDIO</h2>
            </div>
            <p className="max-w-xs text-sm font-medium tracking-wide text-on-surface-variant">
              Product from vietnam, more comfortable
            </p>
          </section>

          {footerGroups.map((group) => (
            <nav key={group.title} aria-label={group.title}>
              <h3 className="text-xs font-bold uppercase tracking-[0.16em] text-on-surface">{group.title}</h3>
              <ul className="mt-5 space-y-3">
                {group.links.map((item) => {
                  const isExternal = item.href.startsWith('http');
                  return (
                    <li key={item.label}>
                      <Link
                        href={item.href}
                        target={isExternal ? '_blank' : undefined}
                        rel={isExternal ? 'noreferrer' : undefined}
                        className="text-sm font-medium uppercase tracking-[0.08em] text-on-surface-variant underline decoration-outline-variant underline-offset-4 transition-colors hover:text-on-surface"
                      >
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          ))}
        </div>
      </div>

      <div className="border-t border-outline-variant px-4 py-6 sm:px-6 lg:px-10 xl:px-12">
        <p className="text-xs font-semibold uppercase tracking-[0.1em] text-on-surface-variant">© 2026 18.STUDIO. All rights reserved.</p>
      </div>
    </footer>
  );
}
