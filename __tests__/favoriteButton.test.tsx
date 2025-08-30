/** @jest-environment jsdom */
import { render } from '@testing-library/react'
import FavoriteButton from '@/components/FavoriteButton'

jest.mock('@/hooks/useFavorites', () => ({
  useFavorites: () => ({
    favorites: [{ id: '1', name: 'Agent' }],
    toggleFavorite: jest.fn(),
  }),
}))

test('renders active heart when agent already in favorites', () => {
  const { container } = render(<FavoriteButton agentId="1" />)
  const btn = container.querySelector('button.btn-heart')
  expect(btn).not.toBeNull()
  expect(btn!.classList.contains('active')).toBe(true)
})

