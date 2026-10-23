import { useMutation } from '@tanstack/react-query';
import { subscribeToNewsletter } from './services';
import type { NewsletterSubscribeRequest, NewsletterSubscription } from '@/types/newsletter';
import type { ParsedApiError } from '@/lib/api/errors';

export function useNewsletterSubscribeMutation() {
  return useMutation<NewsletterSubscription, ParsedApiError, NewsletterSubscribeRequest>({
    mutationFn: subscribeToNewsletter,
  });
}
