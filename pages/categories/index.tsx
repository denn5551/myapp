import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import CategoryCard from '@/components/CategoryCard';
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

  const slugify = (name: string) => encodeURIComponent(name.toLowerCase().replace(/\s+/g, '-'));

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Категории</h1>
      <div className="categories-grid">
        {categories.map(cat => (
          <CategoryCard key={cat.id} href={`/categories/${slugify(cat.name)}`} {...cat}>
            {Array.isArray(cat.agents) && cat.agents.slice(0, 4).map(agent => (
              <AgentCard key={agent.id} {...agent} />
            ))}
          </CategoryCard>
        ))}
      </div>
      <Pagination
        page={page}
        pageCount={pageCount}
        perPage={perPage}
        onPageChange={goToPage}
        onPerPageChange={changePerPage}
      />
    </div>
  );
}
