/** @jest-environment jsdom */
import React from 'react';
import { render } from '@testing-library/react';
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
  it('renders when in trial', () => {
    mockedUseRouter.mockReturnValue({ pathname: '/' } as any);
    mockedUseUser.mockReturnValue({
      user: {
        id: 1,
        email: 'a',
        registeredAt: new Date().toISOString(),
        status: 'trial',
        subscriptionEndsAt: new Date(Date.now() + 3 * 86400000).toISOString(),
      },
      hasPlus: false,
    });
    const { container } = render(React.createElement(TrialBanner));
    expect(container.textContent).toMatch(/Осталось/);
  });

  it('hides when has plus', () => {
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
    const { container } = render(React.createElement(TrialBanner));
    expect(container.firstChild).toBeNull();
  });

  it('hides when trial expired', () => {
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
    const { container } = render(React.createElement(TrialBanner));
    expect(container.firstChild).toBeNull();
  });

  it('hides on admin pages', () => {
    mockedUseRouter.mockReturnValue({ pathname: '/admin/users' } as any);
    mockedUseUser.mockReturnValue({
      user: {
        id: 1,
        email: 'a',
        registeredAt: new Date().toISOString(),
        status: 'trial',
        subscriptionEndsAt: new Date(Date.now() + 3 * 86400000).toISOString(),
      },
      hasPlus: false,
    });
    const { container } = render(React.createElement(TrialBanner));
    expect(container.firstChild).toBeNull();
  });
});
