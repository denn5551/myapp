/** @jest-environment jsdom */
import React from 'react';
import { render } from '@testing-library/react';
import { TrialBanner } from '../components/TrialBanner';
import { useUser } from '../hooks/useUser';

jest.mock('../hooks/useUser');
const mockedUseUser = useUser as jest.MockedFunction<typeof useUser>;

describe('TrialBanner', () => {
  it('renders when in trial', () => {
    mockedUseUser.mockReturnValue({
      user: { email: 'a', registeredAt: new Date().toISOString(), subscriptionStatus: 'trial' },
      hasPlus: false,
    });
    const { container } = render(React.createElement(TrialBanner));
    expect(container.textContent).toMatch(/Осталось/);
  });

  it('hides when has plus', () => {
    mockedUseUser.mockReturnValue({
      user: { email: 'a', registeredAt: new Date().toISOString(), subscriptionStatus: 'active' },
      hasPlus: true,
    });
    const { container } = render(React.createElement(TrialBanner));
    expect(container.firstChild).toBeNull();
  });

  it('hides when trial expired', () => {
    const past = new Date();
    past.setDate(past.getDate() - 10);
    mockedUseUser.mockReturnValue({
      user: { email: 'a', registeredAt: past.toISOString(), subscriptionStatus: 'trial' },
      hasPlus: false,
    });
    const { container } = render(React.createElement(TrialBanner));
    expect(container.firstChild).toBeNull();
  });
});
