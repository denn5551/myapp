// pages/_app.tsx

import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import AdminLayout from '@/components/AdminLayout';
import { TrialBanner } from '@/components/TrialBanner';
import '@/styles/global.css';
import '@/styles/sidebar.css';

export default function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  
  // Проверяем, находимся ли мы ТОЛЬКО на админских страницах (исключаем dashboard)
  const isAdminPage = router.pathname.startsWith('/admin');
  
  if (isAdminPage) {
    return (
      <AdminLayout>
        <TrialBanner />
        <Component {...pageProps} />
      </AdminLayout>
    );
  }
  
  return (
    <Layout>
      <TrialBanner />
      <Component {...pageProps} />
    </Layout>
  );
}