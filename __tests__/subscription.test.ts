import { isSubscriptionValid } from '../lib/subscription';

describe('isSubscriptionValid', () => {
  beforeAll(() => {
    jest.useFakeTimers().setSystemTime(new Date('2025-08-10T12:00:00Z'));
  });
  afterAll(() => {
    jest.useRealTimers();
  });

  it('returns false for expired regardless of date', () => {
    expect(isSubscriptionValid('expired', '2025-08-15T00:00:00Z')).toBe(false);
  });

  it('returns false for trial with past end date', () => {
    expect(isSubscriptionValid('trial', '2025-08-09T00:00:00Z')).toBe(false);
  });

  it('returns false for active with past end date', () => {
    expect(isSubscriptionValid('active', '2025-08-09T00:00:00Z')).toBe(false);
  });

  it('returns true for trial with future end date', () => {
    expect(isSubscriptionValid('trial', '2025-08-11T00:00:00Z')).toBe(true);
  });

  it('returns true for active with future end date', () => {
    expect(isSubscriptionValid('active', '2025-08-11T00:00:00Z')).toBe(true);
  });
});
