import touchHandler from '../pages/api/chats/[id]/touch'
import recentHandler from '../pages/api/users/me/recent'
import httpMocks from 'node-mocks-http'
import { openDb } from '../lib/db'
import { getSession } from '../lib/auth'

jest.mock('../lib/db')
jest.mock('../lib/auth')

const mockDb = {
  run: jest.fn(),
  all: jest.fn(),
  close: jest.fn()
}

beforeEach(() => {
  ;(openDb as jest.Mock).mockResolvedValue(mockDb)
  ;(getSession as jest.Mock).mockResolvedValue({ userId: 1 })
  mockDb.run.mockReset()
  mockDb.all.mockReset()
  mockDb.close.mockReset()
})

test('touch inserts or updates', async () => {
  const req = httpMocks.createRequest({ method: 'POST', query: { id: 'c1' } })
  const res = httpMocks.createResponse()
  await touchHandler(req, res)
  expect(mockDb.run).toHaveBeenCalled()
  expect(res._getStatusCode()).toBe(204)
})

test('recent list returns nextCursor', async () => {
  mockDb.all.mockResolvedValueOnce([
    { chat_id: 'c1', last_message_at: '2025-07-15', title: 'A' },
    { chat_id: 'c2', last_message_at: '2025-07-14', title: 'B' }
  ])
  const req = httpMocks.createRequest({ method: 'GET', query: { limit: '2' } })
  const res = httpMocks.createResponse()
  await recentHandler(req, res)
  expect(mockDb.all).toHaveBeenCalled()
  const data = res._getJSONData()
  expect(data.chats.length).toBe(2)
  expect(data.chats[0].title).toBe('A')
  expect(data.nextCursor).toBe('2025-07-14')
})
