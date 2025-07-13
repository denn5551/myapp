import touchHandler from '../pages/api/chats/[id]/touch'
import recentHandler from '../pages/api/users/me/recent-chats'
import httpMocks from 'node-mocks-http'
import { openDb } from '../lib/db'
import { getSession } from '../lib/auth'

jest.mock('../lib/db')
jest.mock('../lib/auth')

const mockDb = {
  run: jest.fn(),
  all: jest.fn(),
  get: jest.fn(),
  close: jest.fn()
}

beforeEach(() => {
  ;(openDb as jest.Mock).mockResolvedValue(mockDb)
  ;(getSession as jest.Mock).mockResolvedValue({ userId: 1 })
  mockDb.run.mockReset()
  mockDb.all.mockReset()
  mockDb.get.mockReset()
  mockDb.close.mockReset()
})

test('touch inserts or updates', async () => {
  const req = httpMocks.createRequest({ method: 'POST', query: { id: 'c1' } })
  const res = httpMocks.createResponse()
  await touchHandler(req, res)
  expect(mockDb.run).toHaveBeenCalled()
  expect(res._getStatusCode()).toBe(204)
})

test('recent list returns paginated result', async () => {
  mockDb.get.mockResolvedValueOnce({ count: 2 })
  mockDb.all.mockResolvedValueOnce([
    { id: 'c1', name: 'A', lastMessageAt: '2025-07-15' },
    { id: 'c2', name: 'B', lastMessageAt: '2025-07-14' }
  ])
  const req = httpMocks.createRequest({ method: 'GET', query: { page: '1', perPage: '2' } })
  const res = httpMocks.createResponse()
  await recentHandler(req, res)
  expect(mockDb.get).toHaveBeenCalled()
  expect(mockDb.all).toHaveBeenCalled()
  const data = res._getJSONData()
  expect(data.chats.length).toBe(2)
  expect(data.chats[0].name).toBe('A')
  expect(data.total).toBe(2)
  expect(data.page).toBe(1)
  expect(data.perPage).toBe(2)
})
