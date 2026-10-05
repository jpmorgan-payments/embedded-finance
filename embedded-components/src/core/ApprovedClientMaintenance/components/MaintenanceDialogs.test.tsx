import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';

import type { MaintenanceParty } from '../models/maintenanceApi.types';
import type {
  MaintenanceDiscardContent,
  MaintenanceDiscardEntry,
} from '../utils/buildMaintenanceDiscardContent';
import type { PartyFieldChange } from '../utils/buildMaintenanceProjection';
import { CancelMaintenanceDialog } from './CancelMaintenanceDialog';
import { RemoveRelatedPartyDialog } from './RemoveRelatedPartyDialog';

const noopAsync = vi.fn(async () => undefined);

const person = (
  id: string,
  firstName: string,
  lastName: string
): MaintenanceParty =>
  ({
    id,
    partyType: 'INDIVIDUAL',
    roles: ['CONTROLLER'],
    individualDetails: { firstName, lastName },
  }) as unknown as MaintenanceParty;

const lastNameChange = {
  field: 'lastName',
  labelKey: 'editor.lastName',
  approvedValue: 'Doe',
  proposedValue: 'Diaz',
  proposedRawValue: 'Diaz',
  sensitivity: 'public',
} as unknown as PartyFieldChange;

const entry = (
  party: MaintenanceParty,
  fieldChanges: PartyFieldChange[] = []
): MaintenanceDiscardEntry => ({
  id: party.id!,
  entityKind: 'person',
  isOrganization: false,
  party,
  proposedParty: party,
  fieldChanges,
});

describe('maintenance dialog presentation', () => {
  test('keeps cancellation content stable while live request state changes', () => {
    const editContent: MaintenanceDiscardContent = {
      kind: 'edit',
      entry: entry(person('person-1', 'Jane', 'Doe'), [lastNameChange]),
      hasOtherChanges: true,
    };
    const allContent: MaintenanceDiscardContent = {
      kind: 'all',
      products: [],
      added: [entry(person('person-2', 'Wendy', 'Darling'))],
      updated: [],
      removed: [],
    };
    const { rerender } = render(
      <CancelMaintenanceDialog
        open
        content={editContent}
        updateScope="maintenance"
        isPending={false}
        onOpenChange={vi.fn()}
        onConfirm={noopAsync}
      />
    );

    rerender(
      <CancelMaintenanceDialog
        open
        content={allContent}
        updateScope="maintenance"
        isPending={false}
        onOpenChange={vi.fn()}
        onConfirm={noopAsync}
      />
    );

    expect(
      screen.getByRole('heading', { name: 'Discard changes to Jane Doe?' })
    ).toBeInTheDocument();
    expect(screen.getByText('Last name')).toBeInTheDocument();
    expect(
      screen.getByText(/Your other pending changes stay\./)
    ).toBeInTheDocument();
    expect(screen.queryByText('Wendy Darling')).not.toBeInTheDocument();
  });

  test('names each change kind in the full-request discard', () => {
    render(
      <CancelMaintenanceDialog
        open
        content={{
          kind: 'all',
          products: [],
          added: [entry(person('person-2', 'Wendy', 'Darling'))],
          updated: [entry(person('person-1', 'Jane', 'Doe'), [lastNameChange])],
          removed: [entry(person('person-3', 'Peter', 'Pan'))],
        }}
        updateScope="maintenance"
        isPending={false}
        onOpenChange={vi.fn()}
        onConfirm={noopAsync}
      />
    );

    const group = (kind: string) =>
      document.querySelector(`[data-discard-group="${kind}"]`);
    expect(group('added')).toHaveTextContent('Wendy Darling');
    expect(group('updated')).toHaveTextContent(/Jane Doe.*Last name/);
    expect(group('removed')).toHaveTextContent('Peter Pan');
    expect(group('product')).toBeNull();
    expect(
      screen.getByRole('button', { name: 'Discard all changes' })
    ).toBeInTheDocument();
  });

  test('keeps a cancelled removal free of empty change lists and irreversible warnings', () => {
    render(
      <CancelMaintenanceDialog
        open
        content={{
          kind: 'removal',
          entry: entry(person('person-3', 'Peter', 'Pan')),
          hasOtherChanges: false,
        }}
        updateScope="maintenance"
        isPending={false}
        onOpenChange={vi.fn()}
        onConfirm={noopAsync}
      />
    );

    expect(
      screen.getByRole('heading', { name: 'Cancel removing Peter Pan?' })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Peter Pan stays on the profile as/)
    ).toBeInTheDocument();
    expect(document.querySelector('[data-discard-changes]')).toBeNull();
    expect(screen.queryByText("This can't be undone.")).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Your other pending changes stay/)
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Keep removal' })
    ).toBeInTheDocument();
  });

  test('keeps controller replacement content stable while party state changes', () => {
    const { rerender } = render(
      <RemoveRelatedPartyDialog
        open
        name="Jane Doe"
        isPending={false}
        replacementRequired
        controllerIsBeneficialOwner={false}
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

  test('asks nothing extra when the outgoing controller is not an owner and blocks the dialog while saving', async () => {
    const user = userEvent.setup();
    let finishReplacement: () => void = () => undefined;
    const onAddReplacement = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finishReplacement = resolve;
        })
    );
    render(
      <RemoveRelatedPartyDialog
        open
        name="Jane Doe"
        isPending={false}
        replacementRequired
        controllerIsBeneficialOwner={false}
        replacementAlreadyAdded
        onOpenChange={vi.fn()}
        onConfirm={noopAsync}
        onAddReplacement={onAddReplacement}
      />
    );

    expect(screen.queryByText(/25% or more/)).not.toBeInTheDocument();
    const finish = screen.getByRole('button', {
      name: 'Finish replacing controller',
    });
    await user.click(finish);

    expect(onAddReplacement).toHaveBeenCalledWith(false);
    expect(finish).toBeDisabled();
    expect(
      screen.getByRole('button', { name: 'Keep related party' })
    ).toBeDisabled();
    await user.click(finish);
    expect(onAddReplacement).toHaveBeenCalledTimes(1);
    await act(async () => finishReplacement());
    expect(finish).toBeEnabled();
  });

  test('undoes a controller replacement as a whole', () => {
    render(
      <CancelMaintenanceDialog
        open
        content={{
          kind: 'controller-replacement',
          outgoing: entry(person('person-1', 'Jane', 'Doe')),
          incoming: entry(person('person-2', 'Wendy', 'Darling')),
          incomingIsAddition: true,
          hasOtherChanges: false,
        }}
        updateScope="maintenance"
        isPending={false}
        onOpenChange={vi.fn()}
        onConfirm={noopAsync}
      />
    );

    expect(
      screen.getByRole('heading', {
        name: 'Undo replacing Jane Doe as controller?',
      })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Jane Doe stays the controller, and Wendy Darling won't be added to the profile."
      )
    ).toBeInTheDocument();
    expect(document.querySelector('[data-discard-reason]')).toHaveTextContent(
      'exactly one controller'
    );
    expect(
      screen.getByRole('button', { name: 'Undo replacement' })
    ).not.toHaveClass('eb-bg-destructive');
    expect(
      screen.getByRole('button', { name: 'Keep replacement' })
    ).toBeInTheDocument();
  });
});
