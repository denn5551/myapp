import handler from '../pages/api/agents';
import httpMocks from 'node-mocks-http';
import openDb from '../lib/db';

jest.mock('../lib/db');

const mockDb = {
  run: jest.fn(),
  get: jest.fn(),
  close: jest.fn(),
  all: jest.fn()
};

beforeEach(() => {
  (openDb as jest.Mock).mockResolvedValue(mockDb);
  mockDb.run.mockReset();
  mockDb.get.mockReset();
  mockDb.all.mockReset();
  mockDb.all.mockResolvedValue([]);
  mockDb.close.mockReset();
});

describe('agents api update', () => {
  it('updates existing agent', async () => {
    mockDb.run.mockResolvedValue({ changes: 1 });
    const updated = { id: '1', name: 'Agent', display_on_main: false };
    mockDb.get.mockResolvedValue(updated);

    const req = httpMocks.createRequest({ method: 'PUT', body: { id: '1', name: 'Agent' } });
    const res = httpMocks.createResponse();

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toEqual(updated);
  });

  it('returns 404 when agent not found', async () => {
    mockDb.run.mockResolvedValue({ changes: 0 });

    const req = httpMocks.createRequest({ method: 'PUT', body: { id: 'nope' } });
    const res = httpMocks.createResponse();

    await handler(req, res);

    expect(res._getStatusCode()).toBe(404);
  });
});
