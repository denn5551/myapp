import handler from '../pages/api/chat/index'
import httpMocks from 'node-mocks-http'

describe('chat api attachments', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('sends attachments as image_url parts', async () => {
    const fetchMock = jest
      .fn()
      // create thread
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'thread_1' }) })
      // post message
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) })
      // create run
      .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 'run_1', status: 'completed' }) })
      // list messages
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [{ role: 'assistant', content: [{ text: { value: 'ok' } }] }] }),
      })

    ;(global as any).fetch = fetchMock

    const req = httpMocks.createRequest({
      method: 'POST',
      body: {
        message: 'hi',
        assistant_id: 'asst_1',
        attachments: ['https://example.com/a.png'],
      },
    })
    const res = httpMocks.createResponse()

    await handler(req as any, res as any)

    expect(res._getStatusCode()).toBe(200)
    const postBody = JSON.parse(fetchMock.mock.calls[1][1].body)
    expect(postBody.content).toEqual([
      { type: 'text', text: 'hi' },
      { type: 'image_url', image_url: { url: 'https://example.com/a.png' } },
    ])
    const data = JSON.parse(res._getData())
    expect(data.attachments).toEqual(['https://example.com/a.png'])
  })
})
