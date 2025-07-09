/** @jest-environment jsdom */
import React, { useEffect, useState } from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';

function AdminComponent() {
  const [page, setPage] = useState(1);
  const [perPage] = useState(25);
  useEffect(() => { fetch(`/api/admin/agents?page=${page}&perPage=${perPage}`); }, [page, perPage]);
  return React.createElement('button', { onClick: () => setPage(2) }, 'next');
}

function PublicComponent() {
  const [page, setPage] = useState(1);
  const [perPage] = useState(5);
  useEffect(() => { fetch(`/api/agents?page=${page}&perPage=${perPage}`); }, [page, perPage]);
  return React.createElement('button', { onClick: () => setPage(2) }, 'next');
}

global.fetch = jest.fn(() => Promise.resolve({ json: () => Promise.resolve({}) }));

describe('pagination ui', () => {
  it('loads next page in admin', async () => {
    render(React.createElement(AdminComponent));
    await waitFor(() => expect(fetch).toHaveBeenCalled());
    (fetch as jest.Mock).mockClear();
    fireEvent.click(document.querySelector('button')!);
    expect((fetch as jest.Mock).mock.calls[0][0]).toContain('page=2');
  });

  it('loads next page on public', async () => {
    render(React.createElement(PublicComponent));
    await waitFor(() => expect(fetch).toHaveBeenCalled());
    (fetch as jest.Mock).mockClear();
    fireEvent.click(document.querySelector('button')!);
    expect((fetch as jest.Mock).mock.calls[0][0]).toContain('page=2');
  });

  it('checkbox triggers update', async () => {
    function CheckComponent() {
      return React.createElement('input', { type: 'checkbox', onChange: () => fetch('/api/admin/agents?id=1', { method: 'PATCH' }) });
    }
    render(React.createElement(CheckComponent));
    await waitFor(() => expect(fetch).toHaveBeenCalled());
    (fetch as jest.Mock).mockClear();
    const box = document.querySelector('input')!;
    fireEvent.click(box);
    expect((fetch as jest.Mock).mock.calls[0][0]).toContain('/api/admin/agents?id=1');
  });
});
