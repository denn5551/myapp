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
  const slug = params.name;
  const base = process.env.API_URL || '';
  const res = await fetch(`${base}/api/categories/${slug}`);
  if (!res.ok) {
    return { notFound: true };
  }
  const { category, agents } = await res.json();
  return { props: { category, agents } };
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
