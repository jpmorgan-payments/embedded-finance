import { describe, expect, it } from 'vitest';
import { render, screen } from '@test-utils';

import {
  Toast,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from './toast';

describe('Toast primitives', () => {
  it('renders title and description when open', () => {
    render(
      <ToastProvider>
        <Toast open>
          <ToastTitle>Notice</ToastTitle>
          <ToastDescription>Details here.</ToastDescription>
        </Toast>
        <ToastViewport />
      </ToastProvider>
    );

    expect(screen.getByText('Notice')).toBeInTheDocument();
    expect(screen.getByText('Details here.')).toBeInTheDocument();
  });
});
