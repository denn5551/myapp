/** @jest-environment jsdom */
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import AdminUsersPage from '../pages/admin/users';

const initialUser = {
  id: 1,
  email: 'a@example.com',
  created_at: '2025-07-20',
  status: 'trial' as const,
  subscription_ends_at: '2025-07-27',
};

describe('AdminUsersPage', () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [initialUser],
    }) as any;
  });

  it('sends PATCH on status change', async () => {
    const fetchMock = global.fetch as jest.Mock;
    const { findByDisplayValue } = render(<AdminUsersPage />);

    const select = await findByDisplayValue('trial');
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ...initialUser, status: 'active' }),
    });

    fireEvent.change(select, { target: { value: 'active' } });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenLastCalledWith(
        '/api/admin/users/1',
        expect.objectContaining({
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'active', subscriptionEndsAt: initialUser.subscription_ends_at }),
        })
      );
    });
  });

  it('updates row after successful patch', async () => {
    const fetchMock = global.fetch as jest.Mock;
    const { findByDisplayValue } = render(<AdminUsersPage />);
    const select = await findByDisplayValue('trial');
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ...initialUser, status: 'active' }),
    });
    fireEvent.change(select, { target: { value: 'active' } });
    expect(await findByDisplayValue('active')).toBeInTheDocument();
  });
});
