import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Lookbook | FashionShop',
  description: 'Explore the FashionShop editorial lookbook featuring contemporary silhouettes and curated styling.',
};

type LookbookEntry = {
  id: string;
  number: string;
  title: string;
  description: string;
  image: string;
  categoryHref: string;
};

const looks: LookbookEntry[] = [
  {
    id: 'look-01',
    number: '01',
    title: 'Monochrome Study',
    description: 'High-contrast wool tailoring paired with relaxed draping for modern elegance.',
    image: '/images/hero-fashion.jpg',
    categoryHref: '/products?category=outerwear',
  },
  {
    id: 'look-02',
    number: '02',
    title: 'Architectural Form',
    description: 'Sharp lines and intentional structure designed to move effortlessly.',
    image: '/images/about-manifesto.jpg',
    categoryHref: '/products?category=tops',
  },
  {
    id: 'look-03',
    number: '03',
    title: 'Layered Utility',
    description: 'Balanced silhouettes crafted with premium natural fibers and durable finishes.',
    image: '/images/category-outerwear.jpg',
    categoryHref: '/products?category=outerwear',
  },
  {
    id: 'look-04',
    number: '04',
    title: 'Essential Proportion',
    description: 'Subtle textures meeting relaxed contours for everyday understated luxury.',
    image: '/images/about-story.jpg',
    categoryHref: '/products?category=bottoms',
  },
  {
    id: 'look-05',
    number: '05',
    title: 'Fluid Geometry',
    description: 'Soft structural pieces engineered for versatile layering across climates.',
    image: '/images/category-tops.jpg',
    categoryHref: '/products?category=tops',
  },
  {
    id: 'look-06',
    number: '06',
    title: 'Curated Accent',
    description: 'Refined leather and metal accessories completing the complete modern silhouette.',
    image: '/images/category-accessories.jpg',
    categoryHref: '/products?category=accessories',
  },
];

export default function LookbookPage() {
  return (
    <section className="bg-surface-container-low py-12 md:py-16 lg:py-20">
      <div className="mx-auto w-full max-w-[1440px] px-6 md:px-8 lg:px-12">
        <header className="mb-12 border-b border-outline-variant pb-10 text-center md:mb-16 md:pb-14">
          <p className="text-[0.65rem] font-bold uppercase tracking-[0.3em] text-on-surface-variant">
            FashionShop Editorial / 2026 Collection
          </p>
          <h1 className="mt-4 text-5xl font-black uppercase tracking-tight text-on-surface sm:text-6xl md:text-8xl">
            LOOKBOOK
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-xs uppercase leading-relaxed tracking-[0.18em] text-on-surface-variant md:text-sm">
            A visual documentation of form, materiality, and contemporary style. Designed to celebrate timeless design.
          </p>
        </header>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 md:gap-10 lg:grid-cols-3 lg:gap-12">
          {looks.map((look) => (
            <article key={look.id} className="group flex flex-col">
              <div className="relative aspect-[4/5] overflow-hidden border border-outline-variant bg-surface-container">
                <Image
                  src={look.image}
                  alt={look.title}
                  fill
                  className="object-cover grayscale transition duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
                <span className="absolute left-4 top-4 border border-white/20 bg-black/40 px-3 py-1 text-[0.62rem] font-bold tracking-[0.2em] text-white backdrop-blur-sm">
                  LOOK {look.number}
                </span>
              </div>

              <div className="mt-5 flex flex-1 flex-col justify-between space-y-4">
                <div>
                  <h2 className="text-2xl font-bold uppercase tracking-tight text-on-surface">
                    {look.title}
                  </h2>
                  <p className="mt-2 text-sm text-on-surface-variant">
                    {look.description}
                  </p>
                </div>

                <Link
                  href={look.categoryHref}
                  className="inline-flex items-center text-[0.68rem] font-bold uppercase tracking-[0.2em] text-on-surface underline underline-offset-4 transition hover:text-on-surface-variant"
                >
                  Shop This Look &rarr;
                </Link>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-16 border-t border-outline-variant pt-12 text-center md:mt-24 md:pt-16">
          <h3 className="text-2xl font-black uppercase tracking-tight text-on-surface md:text-4xl">
            Explore The Full Wardrobe
          </h3>
          <p className="mx-auto mt-3 max-w-xl text-xs uppercase tracking-[0.16em] text-on-surface-variant">
            Discover all ready-to-wear silhouettes and curated accessories in our online catalog.
          </p>
          <div className="mt-8">
            <Link
              href="/products"
              className="inline-flex min-h-12 items-center justify-center border border-primary bg-primary px-8 text-[0.68rem] font-semibold tracking-[0.2em] text-on-primary transition hover:opacity-90"
            >
              SHOP ALL PRODUCTS
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
