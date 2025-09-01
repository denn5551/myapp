import handler from '../pages/api/users';
import httpMocks from 'node-mocks-http';
import openDb from '../lib/db';
import bcrypt from 'bcrypt';

jest.mock('../lib/db');
jest.mock('bcrypt');

const mockDb = {
  run: jest.fn(),
  get: jest.fn(),
  close: jest.fn(),
  all: jest.fn(),
};

beforeEach(() => {
  (openDb as jest.Mock).mockResolvedValue(mockDb);
  mockDb.run.mockReset();
  mockDb.get.mockReset();
  mockDb.close.mockReset();
  mockDb.all.mockReset();
  (bcrypt.hash as jest.Mock).mockResolvedValue('hashed');
});

describe('POST /api/users', () => {
  it('creates user with 7-day trial', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2025-08-03T08:00:00Z'));
    const nowIso = new Date('2025-08-03T08:00:00Z').toISOString();
    const expectedEnd = new Date('2025-08-10T23:59:59.999Z').toISOString();
    mockDb.get.mockResolvedValue({
      id: 1,
      email: 'new@example.com',
      created_at: nowIso,
      subscriptionStatus: 'trial',
      subscriptionStart: nowIso,
      subscriptionEnd: expectedEnd,
    });

    const req = httpMocks.createRequest({
      method: 'POST',
      body: { email: 'new@example.com', password: 'pass' },
    });
    const res = httpMocks.createResponse();

    await handler(req, res);

    expect(res._getStatusCode()).toBe(201);
    expect(mockDb.run).toHaveBeenCalledWith(
      expect.any(String),
      [
        'new@example.com',
        'hashed',
        'trial',
        nowIso,
        expectedEnd,
        nowIso,
      ]
    );
    expect(res._getJSONData()).toEqual({
      id: 1,
      email: 'new@example.com',
      created_at: nowIso,
      subscriptionStatus: 'trial',
      subscriptionStart: nowIso,
      subscriptionEnd: expectedEnd,
    });
    jest.useRealTimers();
  });
});
