import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include'
      });
      console.log('Request headers:', {
        'Content-Type': 'application/json',
        credentials: 'include'
      });
      console.log('Response headers:', Array.from(res.headers.entries()));
      
      const result = await res.json();
      
      if (result.success) {
        if (result.isAdmin) {
          router.push('/admin/agents');
        } else {
          router.push('/dashboard');
        }
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Произошла ошибка при входе');
    }
  }

  return (
    <>
      <Head>
        <title>Вход | ИИ Помощники</title>
      </Head>
      
      <div className="login-container">
        <div className="login-card">
          <h1 className="login-title">Добро пожаловать!</h1>
          <p className="text-center text-gray-600 mb-8">
            Войдите в свой аккаунт для продолжения
          </p>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email
              </label>
              <input
                id="email"
                type="email"
                className="form-control"
                placeholder="Введите ваш email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Пароль
              </label>
              <input
                id="password"
                type="password"
                className="form-control"
                placeholder="Введите ваш пароль"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <div className="text-red-500 text-sm text-center">
                {error}
              </div>
            )}

            <button type="submit" className="btn btn-primary w-full">
              Войти
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-gray-600">
            Нет аккаунта?{' '}
            <a href="/auth/register" className="text-primary-color hover:underline">
              Зарегистрироваться
            </a>
          </p>
        </div>
      </div>
    </>
  );
}
