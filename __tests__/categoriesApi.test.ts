import handler from '../pages/api/categories';
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

describe('categories api', () => {
  it('paginates list', async () => {
    mockDb.get.mockResolvedValueOnce({ count: 7 });
    mockDb.all.mockResolvedValueOnce([{ id: 1 }, { id: 2 }]);
    mockDb.all.mockResolvedValue([]); // agents for each category
    const req = httpMocks.createRequest({ method: 'GET', query: { page: '2', perPage: '2' } });
    const res = httpMocks.createResponse();

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const data = res._getJSONData();
    expect(data.total).toBe(7);
    expect(data.pageCount).toBe(4);
    expect(Array.isArray(data.categories)).toBe(true);
    expect(data.categories.length).toBe(2);
  });
});
