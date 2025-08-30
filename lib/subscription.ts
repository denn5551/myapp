export type SubscriptionStatus = 'trial' | 'active' | 'expired';

export function isSubscriptionValid(
  status: SubscriptionStatus,
  subscriptionEnd?: string | null
): boolean {
  if (!subscriptionEnd) return false;
  const end = new Date(subscriptionEnd);
  end.setHours(23, 59, 59, 999);
  const now = new Date();
  if (status === 'active' && end > now) return true;
  if (status === 'trial' && end > now) return true;
  return false;
}

export function isSubscriptionInvalid(
  status: SubscriptionStatus,
  subscriptionEnd?: string | null
): boolean {
  return !isSubscriptionValid(status, subscriptionEnd);
}
