/** @jest-environment jsdom */
import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react'
import { useSidebarState } from '../hooks/useSidebarState'

function TestComp() {
  const { sidebarOpen, toggleSidebar } = useSidebarState()
  return React.createElement('button', { onClick: toggleSidebar, 'data-testid': 'btn' }, sidebarOpen ? 'open' : 'closed')
}

test('reads initial state from localStorage', () => {
  localStorage.setItem('sidebarOpen', 'false')
  const { getByTestId } = render(React.createElement(TestComp))
  expect(getByTestId('btn').textContent).toBe('closed')
})

test('toggle updates storage', () => {
  localStorage.setItem('sidebarOpen', 'true')
  const { getByTestId } = render(React.createElement(TestComp))
  fireEvent.click(getByTestId('btn'))
  expect(localStorage.getItem('sidebarOpen')).toBe('false')
})
