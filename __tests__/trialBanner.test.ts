/** @jest-environment jsdom */
import React from 'react';
import { render, cleanup, waitFor } from '@testing-library/react';
import { TrialBanner } from '../components/TrialBanner';
import { useUser } from '../hooks/useUser';
import { useRouter } from 'next/router';

jest.mock('../hooks/useUser');
const mockedUseUser = useUser as jest.MockedFunction<typeof useUser>;
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));
const mockedUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;

describe('TrialBanner', () => {
  afterEach(() => {
    cleanup();
    jest.clearAllMocks();
  });
  it('does not render before mount', async () => {
    mockedUseRouter.mockReturnValue({ pathname: '/' } as any);
    mockedUseUser.mockReturnValue({
      user: {
        id: 1,
        email: 'a',
        registeredAt: new Date().toISOString(),
        status: 'trial',
        subscriptionEndsAt: new Date(Date.now() + 7 * 86400000).toISOString(),
      },
      hasPlus: false,
    });
    const { container } = render(React.createElement(TrialBanner));
    expect(container.textContent).toBe('');
    await waitFor(() => {
      expect(document.body.textContent).toMatch(/Осталось/);
    });
  });
  it('renders when in trial', async () => {
    mockedUseRouter.mockReturnValue({ pathname: '/' } as any);
    mockedUseUser.mockReturnValue({
      user: {
        id: 1,
        email: 'a',
        registeredAt: new Date().toISOString(),
        status: 'trial',
        subscriptionEndsAt: new Date(Date.now() + 7 * 86400000).toISOString(),
      },
      hasPlus: false,
    });
    render(React.createElement(TrialBanner));
    await waitFor(() => {
      expect(document.body.textContent).toMatch(/Осталось/);
    });
  });

  it('hides when has plus', async () => {
    mockedUseRouter.mockReturnValue({ pathname: '/' } as any);
    mockedUseUser.mockReturnValue({
      user: {
        id: 1,
        email: 'a',
        registeredAt: new Date().toISOString(),
        status: 'active',
        subscriptionEndsAt: new Date().toISOString(),
      },
      hasPlus: true,
    });
    render(React.createElement(TrialBanner));
    await waitFor(() => {
      expect(document.body.textContent).toBe('');
    });
  });

  it('hides when trial expired', async () => {
    mockedUseRouter.mockReturnValue({ pathname: '/' } as any);
    const past = new Date();
    past.setDate(past.getDate() - 10);
    mockedUseUser.mockReturnValue({
      user: {
        id: 1,
        email: 'a',
        registeredAt: past.toISOString(),
        status: 'trial',
        subscriptionEndsAt: past.toISOString(),
      },
      hasPlus: false,
    });
    render(React.createElement(TrialBanner));
    await waitFor(() => {
      expect(document.body.textContent).toBe('');
    });
  });

  it('hides on admin pages', async () => {
    mockedUseRouter.mockReturnValue({ pathname: '/admin/users' } as any);
    mockedUseUser.mockReturnValue({
      user: {
        id: 1,
        email: 'a',
        registeredAt: new Date().toISOString(),
        status: 'trial',
        subscriptionEndsAt: new Date(Date.now() + 7 * 86400000).toISOString(),
      },
      hasPlus: false,
    });
    render(React.createElement(TrialBanner));
    await waitFor(() => {
      expect(document.body.textContent).toBe('');
    });
  });
});
