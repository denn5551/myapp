/** @jest-environment jsdom */
import { render } from '@testing-library/react'
import FavoriteButton from '@/components/FavoriteButton'

test('renders filled heart when agent is favorite', () => {
  const { container } = render(<FavoriteButton agentId="1" initialIsFavorite={true} />)
  const btn = container.querySelector('button.btn-heart')
  expect(btn).not.toBeNull()
  expect(btn!.classList.contains('active')).toBe(true)
})
