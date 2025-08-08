import handler from '../pages/api/chat/upload'
import httpMocks from 'node-mocks-http'

describe('chat upload api', () => {
  it('rejects non-post methods', async () => {
    const req = httpMocks.createRequest({ method: 'GET' })
    const res = httpMocks.createResponse()
    await handler(req as any, res as any)
    expect(res._getStatusCode()).toBe(405)
  })
})
