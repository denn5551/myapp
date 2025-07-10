import React from 'react';

export default function HeartIcon({ filled = false }: { filled?: boolean }) {
  return filled ? (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 21s-7-4.35-10-9a6 6 0 0 1 10-7 6 6 0 0 1 10 7c-3 4.65-10 9-10 9z" />
    </svg>
  ) : (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
    </svg>
  );
}
