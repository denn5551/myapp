import handler from '../pages/api/login';
import httpMocks from 'node-mocks-http';
import { open } from 'sqlite';
import bcrypt from 'bcrypt';

jest.mock('sqlite');
jest.mock('bcrypt');

describe('login api', () => {
  it('sets email cookie on success', async () => {
    (open as jest.Mock).mockResolvedValue({
      get: jest.fn().mockResolvedValue({ id: 1, password: 'hash' }),
      all: jest.fn().mockResolvedValue([]),
      run: jest.fn(),
      close: jest.fn()
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    const req = httpMocks.createRequest({
      method: 'POST',
      body: { email: 'test@example.com', password: 'pass' }
    });
    const res = httpMocks.createResponse();

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const cookie = res.getHeader('Set-Cookie') as string | string[] | undefined;
    expect(cookie).toBeDefined();
    const cookieStr = Array.isArray(cookie) ? cookie.join(';') : cookie as string;
    expect(cookieStr).toContain('email=test%40example.com');
  });
});
