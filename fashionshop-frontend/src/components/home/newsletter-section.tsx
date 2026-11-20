'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useNewsletterSubscribeMutation } from '@/features/newsletter/hooks';
import type { ParsedApiError } from '@/lib/api/errors';

export function NewsletterSection() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'duplicate' | 'error'>('idle');
  const [feedbackMessage, setFeedbackMessage] = useState('');

  const mutation = useNewsletterSubscribeMutation();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const cleanEmail = email.trim();

    if (!cleanEmail) {
      setStatus('error');
      setFeedbackMessage('Please enter your email address.');
      return;
    }

    try {
      await mutation.mutateAsync({ email: cleanEmail });
      setStatus('success');
      setFeedbackMessage('Thank you for subscribing! You will receive our latest launches and editorial insights.');
      setEmail('');
      toast.success('Successfully subscribed to FashionShop newsletter!');
    } catch (err: unknown) {
      const error = err as ParsedApiError;
      const isDuplicate =
        error.code === 'DUPLICATE_EMAIL' ||
        error.status === 409 ||
        error.message?.toLowerCase().includes('already');

      if (isDuplicate) {
        setStatus('duplicate');
        setFeedbackMessage('This email address is already subscribed to our newsletter.');
        toast.info('You are already subscribed to our newsletter.');
      } else {
        setStatus('error');
        setFeedbackMessage(error.message || 'Failed to subscribe. Please try again later.');
        toast.error(error.message || 'Subscription failed');
      }
    }
  };

  const handleReset = () => {
    setStatus('idle');
    setFeedbackMessage('');
    setEmail('');
  };

  return (
    <section className="border-t border-outline-variant/60 bg-surface-container-low py-20 md:py-28">
      <div className="mx-auto w-full max-w-3xl px-6 text-center md:px-8">
        <h2 className="font-headline text-4xl font-black uppercase tracking-tight text-primary md:text-6xl">
          JOIN FASHIONSHOP
        </h2>
        <p className="mx-auto mt-4 max-w-2xl font-label text-xs font-medium uppercase tracking-[0.18em] text-on-surface-variant md:text-sm">
          Receive exclusive access to private launches and editorial insights.
        </p>

        {status === 'success' ? (
          <div
            data-testid="newsletter-success"
            className="mx-auto mt-9 max-w-2xl rounded-xl border border-primary bg-surface-container-lowest p-6 text-center text-on-surface md:p-8"
          >
            <p className="font-headline text-sm font-bold uppercase tracking-[0.18em] text-primary">
              WELCOME TO THE CIRCLE
            </p>
            <p className="mt-2 text-xs uppercase tracking-[0.14em] text-on-surface-variant">
              {feedbackMessage}
            </p>
            <button
              type="button"
              onClick={handleReset}
              className="mt-6 inline-flex h-10 cursor-pointer items-center justify-center rounded-md bg-primary px-6 font-label text-[11px] font-bold uppercase tracking-[0.18em] text-on-primary transition hover:bg-primary-container"
            >
              SUBSCRIBE ANOTHER EMAIL
            </button>
          </div>
        ) : (
          <form
            className="mx-auto mt-9 flex max-w-2xl flex-col gap-3 sm:flex-row"
            onSubmit={handleSubmit}
            noValidate
          >
            <label htmlFor="newsletter-email" className="sr-only">
              Email
            </label>
            <input
              id="newsletter-email"
              name="email"
              type="email"
              required
              disabled={mutation.isPending}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (status !== 'idle') setStatus('idle');
              }}
              placeholder="ENTER YOUR EMAIL"
              className="h-12 flex-1 rounded-md border border-outline-variant bg-surface-container-lowest px-4 text-xs tracking-[0.14em] text-on-surface placeholder:text-outline/70 outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={mutation.isPending}
              className="inline-flex h-12 cursor-pointer items-center justify-center rounded-md bg-primary px-8 font-label text-xs font-bold uppercase tracking-[0.2em] text-on-primary transition hover:bg-primary-container disabled:opacity-50"
            >
              {mutation.isPending ? 'SUBSCRIBING...' : 'SUBSCRIBE'}
            </button>
          </form>
        )}

        {status === 'duplicate' && (
          <p
            data-testid="newsletter-duplicate"
            className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-amber-700"
          >
            {feedbackMessage}
          </p>
        )}

        {status === 'error' && (
          <p
            data-testid="newsletter-error"
            className="mt-4 text-xs font-semibold uppercase tracking-[0.14em] text-error"
          >
            {feedbackMessage}
          </p>
        )}
      </div>
    </section>
  );
}
