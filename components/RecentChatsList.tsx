import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

interface Chat {
  id: string
  slug: string
  name: string
  lastMessageAt: string
}

export default function RecentChatsList() {
  const [chats, setChats] = useState<Chat[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const perPage = 10
  const listRef = useRef<HTMLUListElement>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)

  async function loadPage(pageToLoad: number) {
    if (loading || !hasMore) return
    setLoading(true)
    const res = await fetch(
      `/api/users/me/recent-chats?page=${pageToLoad}&perPage=${perPage}`,
      { credentials: 'include' }
    )
    const data = await res.json()
    setChats(prev => [...prev, ...data.chats])
    setHasMore(data.chats.length === perPage)
    setPage(pageToLoad)
    setLoading(false)
  }

  useEffect(() => {
    loadPage(1)
  }, [])

  useEffect(() => {
    const sentinel = sentinelRef.current
    const root = listRef.current
    if (!sentinel || !root) return
    const obs = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadPage(page + 1)
        }
      },
      { root, threshold: 1 }
    )
    obs.observe(sentinel)
    return () => obs.disconnect()
  }, [page, hasMore, loading])

  return (
    <>
      <ul className="recent-chats-list" ref={listRef} style={{ overflowY: 'auto' }}>
        {chats.map(chat => (
          <li key={chat.id} className="recent-chat-item">
            <Link href={`/agents/${chat.slug}`}>
              <div className="chat-title">{chat.name}</div>
              <div className="chat-date">{chat.lastMessageAt}</div>
            </Link>
          </li>
        ))}
        <div ref={sentinelRef} style={{ height: 1 }} />
      </ul>
      {loading && <div className="loading">Загружаем…</div>}
    </>
  )
}
