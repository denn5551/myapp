// pages/index.tsx
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function Home() {
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    fetch('/api/me')
      .then(res => res.json())
      .then(data => {
        if (data?.email) {
          window.location.href = '/dashboard';
        } else {
          setChecking(false);
        }
      });
  }, []);

  if (checking) return null;

  return (
    <main style={{ padding: '30px' }}>
      <h1>Добро пожаловать в <br /> <b>100 ИИ-помощников</b></h1>
      <p><Link href="/auth/register">Регистрация</Link> | <Link href="/auth/login">Вход</Link></p>
    </main>
  );
}
