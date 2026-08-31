import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import { MaintenanceChangeTable } from './MaintenanceChangeTable';

describe('MaintenanceChangeTable', () => {
  test('stacks field values in two columns on small screens and uses three columns from sm', () => {
    const { container } = render(
      <MaintenanceChangeTable
        mode="draft"
        changes={[
          {
            field: 'lastName',
            approvedValue: 'Doe',
            proposedValue: 'Diaz',
            source: {
              requestId: 'request-1',
              submittedAt: '2026-08-27T12:00:00.000Z',
              status: 'NEW',
            },
          },
        ]}
      />
    );

    expect(screen.getByLabelText('Current profile: Doe')).toBeInTheDocument();
    expect(screen.getByLabelText('Draft update: Diaz')).toBeInTheDocument();
    expect(container.querySelector('dl > div')).toHaveClass(
      'eb-grid-cols-2',
      'sm:eb-grid-cols-[minmax(5rem,0.7fr)_minmax(0,1fr)_minmax(0,1fr)]'
    );
  });
});
