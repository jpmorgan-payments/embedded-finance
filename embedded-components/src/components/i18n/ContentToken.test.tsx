import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import { EBComponentsProvider } from '@/core/EBComponentsProvider';

import { ContentToken } from './ContentToken';

describe('ContentToken', () => {
  test('renders children with data-content-token attribute', () => {
    render(
      <EBComponentsProvider apiBaseUrl="/" headers={{}}>
        <ContentToken tokenId="recipients:status.labels.ACTIVE">
          Active
        </ContentToken>
      </EBComponentsProvider>
    );

    const element = screen.getByText('Active');
    expect(element).toBeInTheDocument();
    expect(element).toHaveAttribute(
      'data-content-token',
      'recipients:status.labels.ACTIVE'
    );
  });

  test('does not show title when showTokenIds is false', () => {
    render(
      <EBComponentsProvider
        apiBaseUrl="/"
        headers={{}}
        contentTokens={{ showTokenIds: false }}
      >
        <ContentToken tokenId="recipients:title">Recipients</ContentToken>
      </EBComponentsProvider>
    );

    const element = screen.getByText('Recipients');
    expect(element).not.toHaveAttribute('title');
  });

  test('shows title with token ID when showTokenIds is true', () => {
    render(
      <EBComponentsProvider
        apiBaseUrl="/"
        headers={{}}
        contentTokens={{ showTokenIds: true }}
      >
        <ContentToken tokenId="recipients:title">Recipients</ContentToken>
      </EBComponentsProvider>
    );

    const element = screen.getByText('Recipients');
    expect(element).toHaveAttribute('title', 'Token: recipients:title');
  });

  test('renders as different HTML element when specified', () => {
    render(
      <EBComponentsProvider apiBaseUrl="/" headers={{}}>
        <ContentToken tokenId="common:submit" as="button">
          Submit
        </ContentToken>
      </EBComponentsProvider>
    );

    const element = screen.getByText('Submit');
    expect(element.tagName).toBe('BUTTON');
  });

  test('applies className when provided', () => {
    render(
      <EBComponentsProvider apiBaseUrl="/" headers={{}}>
        <ContentToken tokenId="common:cancel" className="eb-text-red-500">
          Cancel
        </ContentToken>
      </EBComponentsProvider>
    );

    const element = screen.getByText('Cancel');
    expect(element).toHaveClass('eb-text-red-500');
  });
});
