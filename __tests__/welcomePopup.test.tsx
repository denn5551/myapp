/** @jest-environment jsdom */
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { WelcomePopup } from '../components/WelcomePopup';

beforeEach(() => {
  localStorage.clear();
});

test('renders popup when flag missing', async () => {
  const { findByText } = render(<WelcomePopup />);
  expect(await findByText('Добро пожаловать!')).toBeInTheDocument();
});

test('does not render when dismissed', async () => {
  localStorage.setItem('welcomePopupDismissed', 'true');
  const { queryByText } = render(<WelcomePopup />);
  await waitFor(() => {
    expect(queryByText('Добро пожаловать!')).toBeNull();
  });
});

test('saves flag when checkbox checked', async () => {
  const { findByLabelText, findByText } = render(<WelcomePopup />);
  const cb = await findByLabelText('Больше не показывать');
  fireEvent.click(cb);
  const closeBtn = await findByText('Закрыть');
  fireEvent.click(closeBtn);
  expect(localStorage.getItem('welcomePopupDismissed')).toBe('true');
});
