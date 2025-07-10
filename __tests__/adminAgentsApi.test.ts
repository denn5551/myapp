import handler from '../pages/api/admin/agents';
import httpMocks from 'node-mocks-http';
import { openDb } from '../lib/db';

jest.mock('../lib/db');

const mockDb = {
  run: jest.fn(),
  get: jest.fn(),
  all: jest.fn(),
  close: jest.fn(),
};

beforeEach(() => {
  (openDb as jest.Mock).mockResolvedValue(mockDb);
  mockDb.run.mockReset();
  mockDb.get.mockReset();
  mockDb.all.mockReset();
  mockDb.close.mockReset();
});

describe('admin agents api', () => {
  it('paginates list', async () => {
    mockDb.get.mockResolvedValueOnce({ count: 5 });
    mockDb.all.mockResolvedValueOnce([{ id: '1' }, { id: '2' }]);
    const req = httpMocks.createRequest({ method: 'GET', query: { page: '2', perPage: '2' } });
    const res = httpMocks.createResponse();

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const data = res._getJSONData();
    expect(data.total).toBe(5);
    expect(data.pageCount).toBe(3);
    expect(Array.isArray(data.agents)).toBe(true);
    expect(data.agents.length).toBe(2);
  });

  it('updates display_on_main', async () => {
    const before = { id: '1', name: 'A', short_description: '', description: '', category_id: 1, display_on_main: 0 };
    const after = { ...before, display_on_main: 1 };
    mockDb.get.mockResolvedValueOnce(before); // select before
    mockDb.run.mockResolvedValueOnce({ changes: 1 });
    mockDb.get.mockResolvedValueOnce(after); // select after

    const req = httpMocks.createRequest({ method: 'PATCH', query: { id: '1' }, body: { displayOnMain: true } });
    const res = httpMocks.createResponse();

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const data = res._getJSONData();
    expect(data.display_on_main).toBe(true);
  });
});
