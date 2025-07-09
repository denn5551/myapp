import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import CategoryCard from '@/components/CategoryCard';
import AgentCard from '@/components/AgentCard';
import Pagination from '@/components/Pagination';

interface Agent {
  id: string;
  name: string;
  short_description: string;
  category_id: number;
  display_on_main: boolean;
}

interface Category {
  id: number;
  name: string;
  description: string;
  agents: Agent[];
  slug: string;
}

export default function CategoriesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(5);
  const [pageCount, setPageCount] = useState(1);

  const loadCategories = async (p = page, pp = perPage) => {
    const res = await fetch(`/api/categories?page=${p}&perPage=${pp}`);
    const data = await res.json();
    const list = Array.isArray(data.categories) ? data.categories : [];
    setCategories(list);
    setPageCount(data.pageCount);
  };

  useEffect(() => {
    loadCategories();
  }, [page, perPage]);

  useEffect(() => {
    if (!router.isReady) return;
    const qp = Array.isArray(router.query.page) ? router.query.page[0] : router.query.page;
    const qpp = Array.isArray(router.query.perPage) ? router.query.perPage[0] : router.query.perPage;
    setPage(qp ? parseInt(qp as string) : 1);
    setPerPage(qpp ? parseInt(qpp as string) : 5);
  }, [router.isReady, router.query.page, router.query.perPage]);

  useEffect(() => {
    if (router.isReady) {
      loadCategories();
    }
  }, [router.isReady, page, perPage]);

  return (
    <Layout>
      <h1 className="text-2xl mb-4">Все категории</h1>
      <div className="categories-grid">
        {categories.map(cat => (
          <CategoryCard key={cat.id} {...cat}>
            {cat.agents.slice(0,4).map(a => (
              <AgentCard key={a.id} {...a} />
            ))}
          </CategoryCard>
        ))}
      </div>
      <Pagination
        page={page}
        pageCount={pageCount}
        perPage={perPage}
        onPageChange={p => router.push(`/categories?page=${p}&perPage=${perPage}`)}
        onPerPageChange={n => router.push(`/categories?page=1&perPage=${n}`)}
      />
    </Layout>
  );
}
