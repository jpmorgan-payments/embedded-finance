import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';

import { CancelMaintenanceDialog } from './CancelMaintenanceDialog';
import { RemoveRelatedPartyDialog } from './RemoveRelatedPartyDialog';

const noopAsync = vi.fn(async () => undefined);

describe('maintenance dialog presentation', () => {
  test('keeps cancellation content stable while live request state changes', () => {
    const { rerender } = render(
      <CancelMaintenanceDialog
        open
        scope="party"
        affectedNames={['Jane Doe']}
        changedFieldLabels={['Last name']}
        isPending={false}
        onOpenChange={vi.fn()}
        onConfirm={noopAsync}
      />
    );

    rerender(
      <CancelMaintenanceDialog
        open
        scope="all"
        affectedNames={['Wendy Darling']}
        changedFieldLabels={[]}
        isPending={false}
        onOpenChange={vi.fn()}
        onConfirm={noopAsync}
      />
    );

    expect(
      screen.getByRole('heading', { name: 'Discard changes for Jane Doe?' })
    ).toBeInTheDocument();
    expect(screen.getByText('Last name')).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Discard all pending changes?' })
    ).not.toBeInTheDocument();
  });

  test('keeps controller replacement content stable while party state changes', () => {
    const { rerender } = render(
      <RemoveRelatedPartyDialog
        open
        name="Jane Doe"
        isPending={false}
        replacementRequired
        controllerIsBeneficialOwner={false}
        canAddReplacement
        replacementAlreadyAdded={false}
        onOpenChange={vi.fn()}
        onConfirm={noopAsync}
        onAddReplacement={noopAsync}
      />
    );

    rerender(
      <RemoveRelatedPartyDialog
        open
        name="Wendy Darling"
        isPending={false}
        replacementRequired={false}
        controllerIsBeneficialOwner
        canAddReplacement={false}
        replacementAlreadyAdded
        onOpenChange={vi.fn()}
        onConfirm={noopAsync}
        onAddReplacement={noopAsync}
      />
    );

    expect(
      screen.getByRole('heading', {
        name: 'Replace Jane Doe as controller?',
      })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'A controller is required. Add a replacement to continue.'
      )
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Remove Wendy Darling?' })
    ).not.toBeInTheDocument();
  });
});
