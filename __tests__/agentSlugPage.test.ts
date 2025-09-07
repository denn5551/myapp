import { getAgentBySlug } from '../lib/getAgentBySlug'
import openDb from '../lib/db'

jest.mock('../lib/db')

const mockDb = { get: jest.fn(), close: jest.fn() }

beforeEach(() => {
  (openDb as jest.Mock).mockResolvedValue(mockDb)
  mockDb.get.mockReset()
  mockDb.close.mockReset()
})

test('fetches agent by slug', async () => {
  mockDb.get.mockResolvedValue({
    id: 'a1',
    name: 'A',
    description: 'd',
    short_description: 's',
    category_name: 'Cat',
  })
  const agent = await getAgentBySlug('agent')
  expect(agent).toEqual({
    assistantId: 'a1',
    name: 'A',
    description: 'd',
    short: 's',
    category: 'Cat',
  })
})

test('returns notFound for missing', async () => {
  mockDb.get.mockResolvedValue(undefined)
  const agent = await getAgentBySlug('none')
  expect(agent).toBeNull()
})
