import handler from '../pages/api/admin/users/[id]';
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
  mockDb.close.mockReset();
});

describe('admin users api patch', () => {
  it('updates user fields', async () => {
    mockDb.get.mockResolvedValueOnce({ id: 1, status: 'trial', subscription_ends_at: null });
    mockDb.run.mockResolvedValueOnce({ changes: 1 });
    mockDb.get.mockResolvedValueOnce({
      id: 1,
      email: 'a@example.com',
      created_at: '2025-07-20',
      status: 'active',
      subscription_ends_at: '2025-07-30',
    });
    const req = httpMocks.createRequest({
      method: 'PATCH',
      query: { id: '1' },
      body: { status: 'active', subscriptionEndsAt: '2025-07-30' },
    });
    const res = httpMocks.createResponse();

    await handler(req, res);

    expect(mockDb.run).toHaveBeenCalledWith(
      'UPDATE users SET status = ?, subscription_ends_at = ? WHERE id = ?',
      ['active', '2025-07-30', '1']
    );
    expect(res._getStatusCode()).toBe(200);
  });
});
