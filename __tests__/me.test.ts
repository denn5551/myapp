import handler from '../pages/api/me';
import httpMocks from 'node-mocks-http';

describe('me api', () => {
  it('returns user info when email cookie present', async () => {
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
    expect(data.subscriptionStatus).toBe('active');
  });
});
