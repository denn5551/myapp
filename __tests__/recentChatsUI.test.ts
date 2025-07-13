/** @jest-environment jsdom */
import React, { useEffect } from 'react'
import { render, fireEvent, waitFor, act } from '@testing-library/react'
let obsCallback: any
(global as any).IntersectionObserver = class {
  constructor(cb: any) { obsCallback = cb }
  observe() { setTimeout(() => obsCallback([{ isIntersecting: true }]), 0) }
  disconnect() {}
}
function SidebarMock() {
  const [chats, setChats] = React.useState<any[]>([])
  const [page, setPage] = React.useState(1)
  const [hasMore, setHasMore] = React.useState(true)
  const [loading, setLoading] = React.useState(false)
  const listRef = React.useRef<HTMLUListElement>(null)
  const sentinelRef = React.useRef<HTMLDivElement>(null)
  const perPage = 10

  async function loadPage(p: number) {
    if (loading || !hasMore) return
    setLoading(true)
    const res = await fetch(`/api/users/me/recent-chats?page=${p}&perPage=${perPage}`)
    const data = await res.json()
    setChats(prev => [...prev, ...data.chats])
    setHasMore(data.chats.length === perPage)
    setPage(p)
    setLoading(false)
  }

  React.useEffect(() => { loadPage(1) }, [])

  React.useEffect(() => {
    const root = listRef.current
    const sent = sentinelRef.current
    if (!root || !sent) return
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loading) {
        loadPage(page + 1)
      }
    }, { root, threshold: 1 })
    obs.observe(sent)
    return () => obs.disconnect()
  }, [page, hasMore, loading])

  return React.createElement('ul', { className: 'recent-chats-list', ref: listRef },
    chats.map(c => React.createElement('a', { key: c.id })),
    React.createElement('div', { ref: sentinelRef })
  )
}

function TouchComp({ id }: { id: string }) {
  useEffect(() => {
    fetch(`/api/chats/${id}/touch`, { method: 'POST', credentials: 'include' })
  }, [id])
  return React.createElement('div')
}

test('touch endpoint called on chat open', async () => {
  global.fetch = jest.fn(() => Promise.resolve({ json: () => Promise.resolve({}) }))
  render(React.createElement(TouchComp, { id: 'a1' }))
  await waitFor(() => expect(fetch).toHaveBeenCalled())
  expect((fetch as jest.Mock).mock.calls[0][0]).toContain('/api/chats/a1/touch')
})

test('sidebar sets up intersection observer', () => {
  global.fetch = jest.fn(() => Promise.resolve({ json: () => Promise.resolve({ chats: [] }) }))
  render(React.createElement(SidebarMock))
  expect(fetch).toHaveBeenCalledTimes(1)
  expect(typeof obsCallback).toBe('function')
})

function CollapseMock() {
  const [open, setOpen] = React.useState<boolean>(true)
  const toggle = () => {
    setOpen(prev => {
      const next = !prev
      localStorage.setItem('sidebarCategoriesOpen', JSON.stringify(next))
      return next
    })
  }
  React.useEffect(() => {
    const saved = localStorage.getItem('sidebarCategoriesOpen')
    if (saved !== null) setOpen(JSON.parse(saved))
  }, [])
  return React.createElement('button', { onClick: toggle, 'data-testid': 'toggle' }, open ? 'open' : 'closed')
}

test('sidebar collapse state persists', () => {
  localStorage.setItem('sidebarCategoriesOpen', 'false')
  const { getByTestId } = render(React.createElement(CollapseMock))
  expect(getByTestId('toggle').textContent).toBe('closed')
  fireEvent.click(getByTestId('toggle'))
  expect(localStorage.getItem('sidebarCategoriesOpen')).toBe('true')
})
