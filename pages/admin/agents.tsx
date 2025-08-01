// pages/admin/agents.tsx
import { useState } from "react";
import Head from "next/head";
import AdminLayout from "@/components/AdminLayout";
import { useEffect } from "react";
import { slugify } from "@/lib/slugify";

export default function AdminAgentsPage() {
  const [agents, setAgents] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [pageCount, setPageCount] = useState(1);

  const loadCategories = async () => {
    const data = await fetch("/api/categories").then((r) => r.json());
    const list = Array.isArray(data)
      ? data
      : Array.isArray(data.categories)
        ? data.categories
        : [];
    setCategories(list);
  };

  const loadAgents = async (p = page, pp = perPage) => {
    const res = await fetch(`/api/admin/agents?page=${p}&perPage=${pp}`);
    const data = await res.json();
    const list = Array.isArray(data.agents) ? data.agents : [];
    setAgents(list);
    setPageCount(data.pageCount);
  };

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadAgents();
  }, [page, perPage]);

  useEffect(() => {
    if (categories.length > 0) {
      setNewAgent((na) => ({ ...na, categoryId: categories[0].id }));
    }
  }, [categories]);

  const [newAgent, setNewAgent] = useState({
    openaiId: "",
    name: "",
    slug: "",
    short: "",
    full: "",
    categoryId: 1,
  });

  const handleAdd = async () => {
    if (!newAgent.openaiId || !newAgent.name) return;
    const payload = {
      id: newAgent.openaiId,
      name: newAgent.name,
      slug: newAgent.slug || slugify(newAgent.name),
      short: newAgent.short,
      full: newAgent.full,
      categoryId: newAgent.categoryId,
    };
    console.log("add agent", payload);
    const res = await fetch("/api/agents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      const agent = await res.json();
      console.log("Saved agent:", agent);
      await loadAgents(1, perPage);
      setPage(1);
      setNewAgent({
        openaiId: "",
        name: "",
        slug: "",
        short: "",
        full: "",
        categoryId: 1,
      });
    }
  };

  const updateAgent = async (id: string, updates: any) => {
    const res = await fetch(`/api/admin/agents?id=${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...updates }),
    });
    if (res.ok) {
      await loadAgents();
    }
  };

  const deleteAgent = async (id: string) => {
    await fetch(`/api/agents?id=${id}`, { method: "DELETE" });
    await loadAgents();
  };

  return (
    <>
      <Head>
        <title>Админка — Агенты</title>
      </Head>

      <h1 className="text-2xl font-bold mb-4">ИИ-Агенты</h1>

      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <input
          className="border p-2 rounded"
          placeholder="OpenAI ID"
          value={newAgent.openaiId}
          onChange={(e) =>
            setNewAgent({ ...newAgent, openaiId: e.target.value })
          }
        />
        <input
          className="border p-2 rounded"
          placeholder="Название"
          value={newAgent.name}
          onChange={(e) =>
            setNewAgent({
              ...newAgent,
              name: e.target.value,
              slug: slugify(e.target.value),
            })
          }
        />
        <select
          className="border p-2 rounded"
          value={newAgent.categoryId}
          onChange={(e) =>
            setNewAgent({ ...newAgent, categoryId: +e.target.value })
          }
        >
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
        <input
          className="border p-2 rounded"
          placeholder="Краткое описание"
          value={newAgent.short}
          onChange={(e) => setNewAgent({ ...newAgent, short: e.target.value })}
        />
        <textarea
          className="border p-2 rounded col-span-full"
          placeholder="Полное описание"
          rows={3}
          value={newAgent.full}
          onChange={(e) => setNewAgent({ ...newAgent, full: e.target.value })}
        />
        <button
          onClick={handleAdd}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          Добавить агента
        </button>
      </div>

      <div className="flex items-center gap-3 mb-2">
        <label>
          Показывать по:{" "}
          <select
            className="border px-2 py-1 rounded"
            value={perPage}
            onChange={(e) => {
              setPage(1);
              setPerPage(+e.target.value);
            }}
          >
            {[25, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <button
          className="px-2 py-1 border rounded"
          disabled={page <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
        >
          ‹
        </button>
        <span>
          Страница {page} из {pageCount}
        </span>
        <button
          className="px-2 py-1 border rounded"
          disabled={page >= pageCount}
          onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
        >
          ›
        </button>
      </div>

      <div style={{ maxHeight: "60vh", overflowY: "auto" }}>
        <table className="w-full table-auto border-collapse text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2 text-left">Название</th>
              <th className="border p-2">Категория</th>
              <th className="border p-2">OpenAI ID</th>
              <th className="border p-2">Кратко</th>
              <th className="border p-2">Полное описание</th>
              <th className="border p-2">Действия</th>
            </tr>
          </thead>
          <tbody>
            {agents.map((agent) => (
              <tr key={agent.id}>
                <td className="border p-2">
                  <input
                    className="w-full border px-2 py-1 rounded"
                    value={agent.name}
                    onChange={(e) =>
                      updateAgent(agent.id, { name: e.target.value })
                    }
                  />
                </td>
                <td className="border p-2">
                  <select
                    className="w-full border px-2 py-1 rounded"
                    value={agent.category_id}
                    onChange={(e) =>
                      updateAgent(agent.id, { categoryId: +e.target.value })
                    }
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="border p-2">
                  <input
                    className="w-full border px-2 py-1 rounded"
                    value={agent.id}
                    onChange={(e) =>
                      updateAgent(agent.id, { id: e.target.value })
                    }
                  />
                </td>
                <td className="border p-2">
                  <input
                    className="w-full border px-2 py-1 rounded"
                    value={agent.short_description}
                    onChange={(e) =>
                      updateAgent(agent.id, { short: e.target.value })
                    }
                  />
                </td>
                <td className="border p-2">
                  <textarea
                    className="w-full border px-2 py-1 rounded"
                    rows={2}
                    value={agent.full_description}
                    onChange={(e) =>
                      updateAgent(agent.id, { full: e.target.value })
                    }
                  />
                </td>
                <td className="border p-2 text-center flex items-center justify-center gap-2">
                  <input
                    type="checkbox"
                    checked={agent.display_on_main}
                    onChange={(e) =>
                      updateAgent(agent.id, { displayOnMain: e.target.checked })
                    }
                  />
                  <button
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                    onClick={() => deleteAgent(agent.id)}
                  >
                    Удалить
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
