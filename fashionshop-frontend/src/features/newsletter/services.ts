import { api, apiRequest } from '@/lib/api/http';
import type { ApiResponse } from '@/lib/api/types';
import type { NewsletterSubscribeRequest, NewsletterSubscription } from '@/types/newsletter';

export async function subscribeToNewsletter(request: NewsletterSubscribeRequest): Promise<NewsletterSubscription> {
  const response = await api.post<ApiResponse<NewsletterSubscription>>('/api/newsletter/subscribe', request);
  return apiRequest(Promise.resolve(response));
}
