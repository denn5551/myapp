export type SubscriptionStatus = 'trial' | 'active' | 'expired';

export function isSubscriptionInvalid(
  status: SubscriptionStatus,
  subscriptionEnd?: string | null
): boolean {
  if (status === 'expired') return true;
  if (!subscriptionEnd) return true;
  const normalizedEnd = new Date(subscriptionEnd);
  normalizedEnd.setHours(23, 59, 59, 999);
  return normalizedEnd.getTime() < Date.now();
}
