import { useEffect, useState } from 'react';

export interface UserData {
  email: string;
  registeredAt: string;
  subscriptionStatus: 'trial' | 'active' | 'expired';
}

export function useUser() {
  const [user, setUser] = useState<UserData | null>(null);
  const [hasPlus, setHasPlus] = useState(false);

  useEffect(() => {
    fetch('/api/me', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data?.email) {
          setUser({
            email: data.email,
            registeredAt: data.registeredAt,
            subscriptionStatus: data.subscriptionStatus,
          });
          setHasPlus(data.subscriptionStatus === 'active');
        }
      })
      .catch(() => {});
  }, []);

  return { user, hasPlus };
}
