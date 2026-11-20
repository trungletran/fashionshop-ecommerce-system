'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useMemo, useSyncExternalStore } from 'react';
import type { OrderSummaryItem } from '@/types/order';

type StoredOrder = {
    orderNumber: string;
    method: string;
    shippingAddress: string;
    items: OrderSummaryItem[];
    subtotal: number;
    shippingFee: number;
    discount: number;
    total: number;
};

const STEPS = ['Placed', 'Processing', 'Shipped', 'Delivered'];

function subscribe(callback: () => void) {
    window.addEventListener('storage', callback);
    return () => window.removeEventListener('storage', callback);
}

function getRawOrderSnapshot(): string | null {
    if (typeof window === 'undefined') return null;
    try {
        return sessionStorage.getItem('lastOrder');
    } catch {
        return null;
    }
}

function getServerSnapshot(): null {
    return null;
}

export default function CheckoutSuccessPage() {
    const searchParams = useSearchParams();
    const method = searchParams.get('method');
    const rawOrder = useSyncExternalStore(subscribe, getRawOrderSnapshot, getServerSnapshot);
    const order = useMemo<StoredOrder | null>(() => {
        if (!rawOrder) return null;
        try {
            return JSON.parse(rawOrder) as StoredOrder;
        } catch {
            return null;
        }
    }, [rawOrder]);

    const isMomo = method === 'MOMO';
    const paymentLabel = isMomo ? 'Momo E-Wallet' : 'Cash on Delivery';
    const orderNumber = order?.orderNumber ?? 'FS-18042026';

    return (
        <main className="min-h-screen bg-surface font-body text-on-surface">
            {/* ── Hero Banner ── */}
            <header className="border-b border-outline-variant/60 bg-surface-container-lowest px-6 py-16 text-center md:py-24">
                <p className="font-label mb-2 text-[11px] font-bold uppercase tracking-[0.26em] text-on-surface-variant">
                    Order Confirmation
                </p>
                <h1 className="font-headline text-5xl font-black uppercase tracking-[-0.03em] text-primary md:text-8xl">
                    Successful.
                </h1>
                <p className="mt-4 text-sm tracking-wide text-on-surface-variant">
                    Your order has been placed at 18 Studio.&nbsp;&nbsp;
                    <span className="font-bold text-primary">#{orderNumber}</span>
                </p>
            </header>

            <div className="mx-auto max-w-6xl px-6 py-12 md:px-12 lg:px-0">
                <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_380px] lg:gap-14">
                    {/* ── Left Column ── */}
                    <div className="space-y-6">
                        {/* Estimated Arrival */}
                        <div className="rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-7 shadow-xs">
                            <div className="mb-6 flex items-start justify-between">
                                <div>
                                    <h2 className="font-headline text-sm font-bold uppercase tracking-wider text-primary">
                                        Estimated Arrival
                                    </h2>
                                    <p className="mt-1 text-xs text-on-surface-variant">
                                        Expected in 7 – 14 business days
                                    </p>
                                </div>
                                <span className="rounded-full bg-primary px-4 py-1.5 font-label text-[10px] font-bold uppercase tracking-[0.14em] text-on-primary">
                                    Processing
                                </span>
                            </div>

                            {/* Dot progress */}
                            <div className="flex items-center gap-0">
                                {STEPS.map((step, i) => (
                                    <div key={step} className="flex flex-1 items-center">
                                        <div
                                            className={`h-3 w-3 rounded-full ${i === 0 ? 'bg-primary' : 'bg-outline-variant'}`}
                                        />
                                        {i < STEPS.length - 1 && (
                                            <div className="h-[2px] flex-1 bg-outline-variant/60" />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Shipping & Payment */}
                        <div className="grid grid-cols-1 divide-y divide-outline-variant/60 rounded-xl border border-outline-variant/60 bg-surface-container-lowest shadow-xs sm:grid-cols-2 sm:divide-x sm:divide-y-0">
                            <div className="p-7">
                                <p className="mb-2 font-label text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">
                                    Shipping Address
                                </p>
                                <p className="whitespace-pre-line text-sm font-medium leading-relaxed text-on-surface">
                                    {order?.shippingAddress ?? 'Address provided at checkout'}
                                </p>
                            </div>
                            <div className="p-7">
                                <p className="mb-2 font-label text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">
                                    Payment Method
                                </p>
                                <p className="text-sm font-bold text-primary">{paymentLabel}</p>
                                <p className="mt-0.5 text-xs text-on-surface-variant">
                                    {isMomo ? 'Paid via Momo' : 'Billing address same as shipping'}
                                </p>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-3 sm:flex-row">
                            <Link
                                href="/orders"
                                className="flex h-12 flex-1 items-center justify-center gap-2 rounded-md bg-primary font-label text-xs font-bold uppercase tracking-[0.2em] text-on-primary transition-colors hover:bg-primary-container"
                            >
                                Track Order
                                <span className="material-symbols-outlined text-base">arrow_forward</span>
                            </Link>
                            <Link
                                href="/products"
                                className="flex h-12 flex-1 items-center justify-center rounded-md border border-outline-variant bg-surface-container-lowest font-label text-xs font-bold uppercase tracking-[0.2em] text-on-surface transition-colors hover:border-primary"
                            >
                                Continue Shopping
                            </Link>
                        </div>
                    </div>

                    {/* ── Right Column — Summary ── */}
                    <div className="h-fit lg:sticky lg:top-24">
                        <div className="rounded-xl border border-outline-variant/60 bg-surface-container-lowest p-7 shadow-xs">
                            <h2 className="font-headline mb-6 text-lg font-black uppercase tracking-tight text-primary">
                                Summary
                            </h2>

                            {order?.items && order.items.length > 0 ? (
                                <div className="space-y-5 border-b border-outline-variant/60 pb-6">
                                    {order.items.map((item) => (
                                        <div key={item.productId} className="flex items-center gap-4">
                                            <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-surface-container">
                                                {item.imageUrl ? (
                                                    <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
                                                ) : (
                                                    <div className="flex h-full w-full items-center justify-center">
                                                        <span className="material-symbols-outlined text-xl text-on-surface-variant">checkroom</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-bold text-primary">{item.name}</p>
                                                <p className="mt-0.5 text-xs text-on-surface-variant">Qty: {item.quantity}</p>
                                            </div>
                                            <p className="flex-shrink-0 text-sm font-bold text-primary">${item.total.toFixed(2)}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="border-b border-outline-variant/60 pb-6">
                                    <p className="text-sm text-on-surface-variant">Order items confirmed</p>
                                </div>
                            )}

                            <div className="mt-6 space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-on-surface-variant">Subtotal</span>
                                    <span className="font-medium">${(order?.subtotal ?? 0).toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-on-surface-variant">Shipping</span>
                                    <span className="font-medium">{!order?.shippingFee ? 'Complimentary' : `$${order.shippingFee.toFixed(2)}`}</span>
                                </div>
                                {order && order.discount > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-on-surface-variant">Discount</span>
                                        <span className="font-medium text-emerald-700">-${order.discount.toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="mt-4 flex justify-between border-t border-outline-variant/60 pt-4">
                                    <span className="font-headline text-base font-black uppercase">Total</span>
                                    <span className="font-headline text-base font-black">${(order?.total ?? 0).toFixed(2)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 rounded-xl border border-outline-variant/60 bg-surface-container-low px-6 py-4">
                            <p className="text-xs leading-relaxed text-on-surface-variant">
                                A confirmation email has been sent to your inbox. Please keep it for your records.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
