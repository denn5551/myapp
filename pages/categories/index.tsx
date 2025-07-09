import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import AgentCard from '@/components/AgentCard';
import Pagination from '@/components/Pagination';

interface Category {
  id: number;
  name: string;
  description?: string;
  agents?: any[];
}

export default function AllCategories() {
  const router = useRouter();
  const page = parseInt((router.query.page as string) || '1');
  const perPage = parseInt((router.query.perPage as string) || '5');

  const [categories, setCategories] = useState<Category[]>([]);
  const [pageCount, setPageCount] = useState(1);

  useEffect(() => {
    fetch(`/api/categories?page=${page}&perPage=${perPage}`)
      .then(res => res.json())
      .then(data => {
        const list = Array.isArray(data.categories) ? data.categories : [];
        setCategories(list);
        setPageCount(data.pageCount || 1);
      })
      .catch(() => {});
  }, [page, perPage]);

  const goToPage = (p: number) => {
    router.push(`/categories?page=${p}&perPage=${perPage}`);
  };
  const changePerPage = (n: number) => {
    router.push(`/categories?page=1&perPage=${n}`);
  };

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-4">Категории</h1>
      <div className="categories-list">
        {categories.map(cat => (
          <section key={cat.id} className="category-block">
            <h2 className="category-title">{cat.name}</h2>
            <div className="agents-row">
              {Array.isArray(cat.agents) &&
                cat.agents.map(agent => (
                  <AgentCard key={agent.id} {...agent} />
                ))}
            </div>
          </section>
        ))}
      </div>
      <Pagination
        page={page}
        pageCount={pageCount}
        perPage={perPage}
        onPageChange={goToPage}
        onPerPageChange={changePerPage}
      />
    </Layout>
  );
}
