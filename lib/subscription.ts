export type SubscriptionStatus = 'trial' | 'active' | 'expired';

export function isSubscriptionInvalid(
  status: SubscriptionStatus,
  subscriptionEnd?: string
): boolean {
  const isExpired = subscriptionEnd ? new Date(subscriptionEnd) < new Date() : false;
  return status === 'expired' || status === 'trial' || (status === 'active' && isExpired);
}
