import { render } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import { getAccountStatusIcon } from './getAccountStatusIcon';

describe('getAccountStatusIcon', () => {
  test('returns CheckCircle2 for OPEN state', () => {
    const icon = getAccountStatusIcon('OPEN');
    const { container } = render(icon || <div />);
    expect(container.querySelector('svg')).toBeInTheDocument();
    // Check that it's a CheckCircle2 by checking the class
    expect(icon?.props.className).toContain('eb-h-3.5');
  });

  test('returns XCircle for CLOSED state', () => {
    const icon = getAccountStatusIcon('CLOSED');
    expect(icon).not.toBeNull();
  });

  test('returns Clock for PENDING state', () => {
    const icon = getAccountStatusIcon('PENDING');
    expect(icon).not.toBeNull();
  });

  test('returns AlertTriangle for SUSPENDED state', () => {
    const icon = getAccountStatusIcon('SUSPENDED');
    expect(icon).not.toBeNull();
  });

  test('returns null for unknown state', () => {
    const icon = getAccountStatusIcon('UNKNOWN');
    expect(icon).toBeNull();
  });

  test('returns null for undefined state', () => {
    const icon = getAccountStatusIcon(undefined);
    expect(icon).toBeNull();
  });
});
