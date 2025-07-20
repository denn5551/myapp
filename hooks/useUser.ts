import { useEffect, useState } from 'react';

export interface UserData {
  email: string;
  registeredAt: string;
  status: 'trial' | 'active' | 'expired';
  subscriptionEndsAt: string;
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
            status: data.status,
            subscriptionEndsAt: data.subscriptionEndsAt,
          });
          setHasPlus(data.status === 'active');
        }
      })
      .catch(() => {});
  }, []);

  return { user, hasPlus };
}
