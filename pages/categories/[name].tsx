import Layout from '@/components/Layout';
import AgentCard from '@/components/AgentCard';

interface Agent {
  id: string;
  name: string;
  short_description: string;
}

interface Category {
  id: number;
  name: string;
  slug: string;
}

export async function getServerSideProps({ params }: { params: { name: string } }) {
  try {
    const slug = params.name;
    const base = process.env.NEXT_PUBLIC_API_URL || '';
    const res = await fetch(`${base}/api/categories/${encodeURIComponent(slug)}`);
    if (!res.ok) {
      if (res.status === 404) {
        return { notFound: true };
      }
      throw new Error(`API error ${res.status}`);
    }
    const { category, agents } = await res.json();
    return { props: { category, agents } };
  } catch (error) {
    console.error('getServerSideProps error:', error);
    return { notFound: true };
  }
}

export default function CategoryPage({ category, agents }: { category: Category; agents: Agent[] }) {
  console.log('Loaded agents for category:', agents);
  return (
    <Layout>
      <h1 className="section-title">{category.name}</h1>
      <div className="agents-grid">
        {agents.length > 0 ? (
          agents.map(agent => <AgentCard key={agent.id} {...agent} />)
        ) : (
          <p>Нет агентов в этой категории.</p>
        )}
      </div>
    </Layout>
  );
}
