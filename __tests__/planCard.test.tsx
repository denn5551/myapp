/** @jest-environment jsdom */
import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import PlanCard, { Plan } from '../components/PlanCard';

test('inactive plan card disables button', () => {
  const plan: Plan = {
    id: 'standard12',
    title: 'Standard 12',
    price: '—',
    features: ['feat1', 'feat2'],
    isActive: false,
  };
  const { getByRole, getByText } = render(
    <PlanCard plan={plan} onSubscribe={() => {}} />
  );
  expect(getByRole('button')).toBeDisabled();
  expect(getByText('feat1')).toBeInTheDocument();
  expect(getByText('feat2')).toBeInTheDocument();
});

test('active plan card calls onSubscribe', () => {
  const plan: Plan = {
    id: 'standard',
    title: 'Standard',
    price: '999 ₽/мес',
    features: ['feat'],
    isActive: true,
  };
  const handle = jest.fn();
  const { getByRole } = render(<PlanCard plan={plan} onSubscribe={handle} />);
  fireEvent.click(getByRole('button'));
  expect(handle).toHaveBeenCalledWith('standard');
});
