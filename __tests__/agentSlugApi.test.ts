import handler from '../pages/api/agents/[slug]'
import httpMocks from 'node-mocks-http'
import { getAgentBySlug } from '../lib/getAgentBySlug'

jest.mock('../lib/getAgentBySlug')

beforeEach(() => {
  ;(getAgentBySlug as jest.Mock).mockReset()
})

test('returns agent data', async () => {
  ;(getAgentBySlug as jest.Mock).mockResolvedValue({
    assistantId: 'a1',
    name: 'A',
    category: 'Cat',
    description: 'Desc',
  })
  const req = httpMocks.createRequest({ method: 'GET', query: { slug: 'agent' } })
  const res = httpMocks.createResponse()
  await handler(req, res)
  expect(res._getStatusCode()).toBe(200)
  expect(res._getJSONData()).toEqual({
    name: 'A',
    slug: 'agent',
    assistant_id: 'a1',
    category: 'Cat',
    description: 'Desc',
    isFavorite: false,
  })
})

test('404 when missing', async () => {
  (getAgentBySlug as jest.Mock).mockResolvedValue(null)
  const req = httpMocks.createRequest({ method: 'GET', query: { slug: 'none' } })
  const res = httpMocks.createResponse()
  await handler(req, res)
  expect(res._getStatusCode()).toBe(404)
})

