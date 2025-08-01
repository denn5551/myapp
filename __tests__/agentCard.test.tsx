/** @jest-environment jsdom */
import React from 'react'
import { render } from '@testing-library/react'
import AgentCard from '../components/AgentCard'

test('link points to slug', () => {
  const { container } = render(
    <AgentCard id="a1" slug="advisor" name="Advisor" short_description="" />
  )
  const a = container.querySelector('a')!
  expect(a.getAttribute('href')).toBe('/agents/advisor')
})
