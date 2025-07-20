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
      email: 'test@example.com',
      created_at: new Date().toISOString(),
      status: 'active',
      subscription_ends_at: new Date().toISOString(),
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
  });
});
