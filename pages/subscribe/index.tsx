// pages/subscribe/index.tsx
import Link from 'next/link';

export default function SubscribePage() {
  return (
    <main>
      <h2>Оформление подписки</h2>
      <p>Нажмите кнопку ниже для эмуляции оплаты:</p>
      <Link href="/subscribe/success?plan=monthly">
        <button className="chat-send-button">Оплатить 490 ₽/мес</button>
      </Link>
    </main>
  );
}
