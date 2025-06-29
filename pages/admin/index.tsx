import Head from 'next/head';
import AdminLayout from '@/components/AdminLayout';
import { withAdminAccess } from '@/lib/withAdminAccess';
import Link from 'next/link';

export default function AdminHome() {
  return (
    <AdminLayout>
      <Head>
        <title>Админка</title>
      </Head>
      <h1 className="text-2xl font-bold mb-4">Админка</h1>
      <ul className="list-disc pl-5 space-y-2">
        <li>
          <Link href="/admin/users">Пользователи</Link>
        </li>
        <li>
          <Link href="/admin/categories">Категории</Link>
        </li>
        <li>
          <Link href="/admin/agents">Агенты</Link>
        </li>
      </ul>
    </AdminLayout>
  );
}

export const getServerSideProps = withAdminAccess();
