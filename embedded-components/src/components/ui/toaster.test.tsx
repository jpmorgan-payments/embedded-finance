import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { Toaster } from './toaster';

vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({
    toasts: [
      {
        id: 'toast-1',
        title: 'Saved',
        description: 'Your changes were stored.',
        open: true,
      },
    ],
  }),
}));

describe('Toaster', () => {
  it('renders queued toasts from useToast', () => {
    render(<Toaster />);

    expect(screen.getByText('Saved')).toBeInTheDocument();
    expect(screen.getByText('Your changes were stored.')).toBeInTheDocument();
  });
});
