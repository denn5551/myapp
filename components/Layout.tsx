// components/Layout.tsx
import Link from 'next/link';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* lk-header will be rendered on account pages */}

      <main>{children}</main>

      <footer className="site-footer">
        © 2025 AI Tools. <Link href="/about">О проекте</Link> • <Link href="/support">Поддержка</Link> • <Link href="/privacy">Политика</Link> • <Link href="/contacts">Контакты</Link>
      </footer>
    </>
  );
}
