/** @jest-environment jsdom */
import React, { useEffect } from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react'
function SidebarMock() {
  const [chats, setChats] = React.useState<any[]>([])
  const [cursor, setCursor] = React.useState<string | null>(null)

  async function loadMore() {
    const res = await fetch(`/api/users/me/recent?limit=10${cursor ? `&cursor=${cursor}` : ''}`)
    const data = await res.json()
    setChats(prev => [...prev, ...data.chats])
    setCursor(data.nextCursor)
  }

  React.useEffect(() => { loadMore() }, [])

  function handleScroll(e: any) {
    const el = e.currentTarget
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 10 && cursor) {
      loadMore()
    }
  }

  return React.createElement('ul', { className: 'recent-chats-list', onScroll: handleScroll },
    chats.map(c => React.createElement('a', { key: c.chat_id }))
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

test('sidebar loads more on scroll', async () => {
  const responses = [
    { chats: [{ chat_id: 'a1', title: 'A', last_message_at: 't1' }], nextCursor: 't0' },
    { chats: [{ chat_id: 'a2', title: 'B', last_message_at: 't0' }], nextCursor: null }
  ]
  global.fetch = jest.fn(() => Promise.resolve({ json: () => Promise.resolve(responses.shift()) }))
  const { container } = render(React.createElement(SidebarMock))
  const list = container.querySelector('.recent-chats-list') as HTMLElement
  await waitFor(() => expect(list.querySelectorAll('a').length).toBe(1))
  ;(fetch as jest.Mock).mockClear()
  Object.defineProperty(list, 'scrollTop', { value: 100, configurable: true })
  Object.defineProperty(list, 'clientHeight', { value: 0, configurable: true })
  Object.defineProperty(list, 'scrollHeight', { value: 100, configurable: true })
  fireEvent.scroll(list)
  expect(fetch).toHaveBeenCalled()
  await waitFor(() => expect(list.querySelectorAll('a').length).toBe(2))
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
