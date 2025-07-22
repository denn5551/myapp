import handler from '../pages/api/me';
import httpMocks from 'node-mocks-http';
import { openDb } from '../lib/db';

jest.mock('../lib/db');

const mockDb = {
  get: jest.fn(),
  close: jest.fn(),
};

beforeEach(() => {
  (openDb as jest.Mock).mockResolvedValue(mockDb);
  mockDb.get.mockReset();
  mockDb.close.mockReset();
});

describe('me api', () => {
  it('returns user info when email cookie present', async () => {
    mockDb.get.mockResolvedValue({
      id: 1,
      email: 'test@example.com',
      created_at: new Date().toISOString(),
      status: 'active',
      subscriptionEndsAt: new Date().toISOString(),
    });
    const req = httpMocks.createRequest({
      method: 'GET',
      headers: {
        cookie: 'email=test%40example.com; subscriptionPaid=true'
      }
    });
    const res = httpMocks.createResponse();

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const data = res._getJSONData();
    expect(data.email).toBe('test@example.com');
    expect(data.status).toBe('active');
    expect(data.hasPlus).toBe(true);
  });

  it('computes subscriptionEndsAt when missing', async () => {
    const createdAt = new Date('2025-07-20T00:00:00.000Z').toISOString();
    mockDb.get.mockResolvedValue({
      id: 2,
      email: 'trial@example.com',
      created_at: createdAt,
      status: 'trial',
      subscriptionEndsAt: null,
    });
    const req = httpMocks.createRequest({
      method: 'GET',
      headers: { cookie: 'email=trial%40example.com' },
    });
    const res = httpMocks.createResponse();

    await handler(req, res);

    const expected = new Date(new Date(createdAt).getTime() + 7 * 86400000).toISOString();
    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData().subscriptionEndsAt).toBe(expected);
  });
});
