import favToggle from '../pages/api/agents/[id]/favorite'
import listFavs from '../pages/api/users/me/favorites'
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
  (openDb as jest.Mock).mockResolvedValue(mockDb)
  ;(getSession as jest.Mock).mockResolvedValue({ userId: 1 })
  mockDb.run.mockReset()
  mockDb.all.mockReset()
  mockDb.close.mockReset()
})

test('POST adds favorite', async () => {
  const req = httpMocks.createRequest({ method: 'POST', query: { id: 'a1' } })
  const res = httpMocks.createResponse()

  await favToggle(req, res)

  expect(mockDb.run).toHaveBeenCalledWith(
    `INSERT OR IGNORE INTO user_favorite_agents(user_id, agent_id) VALUES(?, ?);`,
    [1, 'a1']
  )
  expect(res._getStatusCode()).toBe(200)
})

test('DELETE removes favorite', async () => {
  const req = httpMocks.createRequest({ method: 'DELETE', query: { id: 'a1' } })
  const res = httpMocks.createResponse()

  await favToggle(req, res)

  expect(mockDb.run).toHaveBeenCalledWith(
    `DELETE FROM user_favorite_agents WHERE user_id = ? AND agent_id = ?;`,
    [1, 'a1']
  )
  expect(res._getStatusCode()).toBe(200)
})

test('GET returns favorites list', async () => {
  mockDb.all.mockResolvedValueOnce([{ id: 'a1', name: 'Agent', short_description: '' }])
  const req = httpMocks.createRequest({ method: 'GET' })
  const res = httpMocks.createResponse()

  await listFavs(req, res)

  expect(mockDb.all).toHaveBeenCalled()
  const data = res._getJSONData()
  expect(Array.isArray(data.agents)).toBe(true)
})

