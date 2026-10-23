export type NewsletterSubscribeRequest = {
  email: string;
};

export type NewsletterSubscription = {
  id: number;
  email: string;
  isActive: boolean;
  createdAt: string;
};
