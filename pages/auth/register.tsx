import { useState } from 'react';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  async function handleSubmit(e: any) {
    e.preventDefault();
    const res = await fetch('/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const result = await res.json();
    alert(result.message);
  }

  return (
    <form onSubmit={handleSubmit} style={{ padding: 40 }}>
      <h2>Регистрация</h2>
      <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} /><br />
      <input type="password" placeholder="Пароль" value={password} onChange={e => setPassword(e.target.value)} /><br />
      <button type="submit">Зарегистрироваться</button>
    </form>
  );
}
