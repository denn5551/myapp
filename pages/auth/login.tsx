import { useState } from 'react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  async function handleSubmit(e: any) {
    e.preventDefault();
    const res = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const result = await res.json();
    if (result.success) {
      window.location.href = '/dashboard';
    } else {
      alert(result.message);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ padding: 40 }}>
      <h2>Вход</h2>
      <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} /><br />
      <input type="password" placeholder="Пароль" value={password} onChange={e => setPassword(e.target.value)} /><br />
      <button type="submit">Войти</button>
    </form>
  );
}
