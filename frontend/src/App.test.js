import { render, screen } from '@testing-library/react';

// Mock fetch globally
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    headers: { get: () => 'application/json' },
    json: () => Promise.resolve([]),
  })
);

import App from './App';

test('renders app header', () => {
  render(<App />);
  expect(screen.getByText(/Employee Management System/i)).toBeInTheDocument();
});
