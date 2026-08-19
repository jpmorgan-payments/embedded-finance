import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ClientResponse, PartyResponse } from '@/api/generated/smbdo.schemas';
import { EBComponentsProvider } from '@/core/EBComponentsProvider';

import { IndirectOwnership } from './IndirectOwnership';
import { INTERMEDIARY_OWNER_ROLE } from './IndirectOwnership.types';

/**
 * Interaction tests for the chain builder's validation branches and edit mode —
 * the paths the happy-path flow tests don't reach (rejecting the root company,
 * the owner itself, and duplicates as intermediaries; removing a step in edit
 * mode).
 */

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <EBComponentsProvider
    apiBaseUrl="https://api.test.com"
    headers={{ Authorization: 'Bearer test-token' }}
    contentTokens={{ name: 'enUS' }}
  >
    {children}
  </EBComponentsProvider>
);

const clientParty: PartyResponse = {
  id: 'client-1',
  partyType: 'ORGANIZATION',
  roles: ['CLIENT'],
  active: true,
  organizationDetails: {
    organizationName: 'Root Business Co.',
    organizationType: 'LIMITED_LIABILITY_COMPANY',
    countryOfFormation: 'US',
  },
  createdAt: '2024-01-01T00:00:00.000Z',
};

const makeClient = (parties: PartyResponse[]): ClientResponse => ({
  id: 'client-1',
  partyId: 'client-1',
  status: 'APPROVED',
  products: ['EMBEDDED_PAYMENTS'],
  parties: [clientParty, ...parties],
  outstanding: {
    partyIds: [],
    partyRoles: [],
    questionIds: [],
    documentRequestIds: [],
    attestationDocumentIds: [],
  },
  attestations: [],
  createdAt: '2024-01-01T00:00:00Z',
});

const renderComponent = (client: ClientResponse, props = {}) =>
  render(
    <TestWrapper>
      <IndirectOwnership client={client} {...props} />
    </TestWrapper>
  );

const indirectOwnerClient = makeClient([
  {
    id: 'owner-chain',
    partyType: 'INDIVIDUAL',
    roles: ['BENEFICIAL_OWNER'],
    active: true,
    parentPartyId: 'client-1',
    individualDetails: {
      firstName: 'Cara',
      lastName: 'Chain',
      natureOfOwnership: 'Indirect',
    },
    createdAt: '2024-01-02T00:00:00.000Z',
  },
]);

async function openChainBuilder(user: ReturnType<typeof userEvent.setup>) {
  const card = screen.getByRole('listitem', { name: /Cara Chain/i });
  await user.click(
    within(card).getByRole('button', { name: /Add intermediary owner/i })
  );
  return screen.findByRole('dialog');
}

async function addCompanyAsNew(
  user: ReturnType<typeof userEvent.setup>,
  dialog: HTMLElement,
  name: string
) {
  await user.click(
    within(dialog).getByRole('combobox', { name: /Company Name/i })
  );
  const search = await screen.findByPlaceholderText('Search companies...');
  await user.clear(search);
  await user.type(search, name);
  await user.click(await screen.findByText(`Add "${name}" as a new company`));
}

describe('IndirectOwnership chain builder — validation branches', () => {
  it('rejects the business being onboarded as an intermediary', async () => {
    const user = userEvent.setup();
    renderComponent(indirectOwnerClient);

    const dialog = await openChainBuilder(user);
    await addCompanyAsNew(user, dialog, 'Root Business Co.');

    expect(
      await screen.findByText(/is the business being onboarded/i)
    ).toBeInTheDocument();
  });

  it('rejects the owner itself as an intermediary in its own chain', async () => {
    const user = userEvent.setup();
    renderComponent(indirectOwnerClient);

    const dialog = await openChainBuilder(user);
    await addCompanyAsNew(user, dialog, 'Cara Chain');

    expect(
      await screen.findByText(
        /cannot be an intermediary in its own ownership chain/i
      )
    ).toBeInTheDocument();
  });
});

describe('IndirectOwnership chain builder — edit mode', () => {
  const clientWithChain = makeClient([
    {
      id: 'owner-1',
      partyType: 'INDIVIDUAL',
      roles: ['BENEFICIAL_OWNER'],
      active: true,
      parentPartyId: 'client-1',
      individualDetails: {
        firstName: 'Otto',
        lastName: 'Owner',
        natureOfOwnership: 'Indirect',
      },
      createdAt: '2024-01-02T00:00:00.000Z',
    },
    {
      id: 'intermediary-1',
      partyType: 'ORGANIZATION',
      roles: [INTERMEDIARY_OWNER_ROLE],
      active: true,
      parentPartyId: 'owner-1',
      organizationDetails: {
        organizationName: 'MidCo Holdings',
        natureOfOwnership: 'Direct',
      } as PartyResponse['organizationDetails'],
      createdAt: '2024-01-03T00:00:00.000Z',
    },
  ]);

  it('opens in edit mode and removes an existing step', async () => {
    const user = userEvent.setup();
    renderComponent(clientWithChain);

    const ownerCard = screen.getByRole('listitem', { name: /Otto Owner/i });
    await user.click(
      within(ownerCard).getByRole('button', {
        name: /Edit ownership hierarchy/i,
      })
    );

    const dialog = await screen.findByRole('dialog');
    expect(
      within(dialog).getByText(/Current Steps \(click to remove\)/i)
    ).toBeInTheDocument();
    expect(within(dialog).getByText('Step 1:')).toBeInTheDocument();

    // Remove the only step; the "Current Steps" section then disappears.
    const stepRow = within(dialog).getByText('Step 1:').closest('div')
      ?.parentElement as HTMLElement;
    await user.click(within(stepRow).getByRole('button'));

    await waitFor(() =>
      expect(
        within(screen.getByRole('dialog')).queryByText('Step 1:')
      ).not.toBeInTheDocument()
    );
  });
});

describe('IndirectOwnership add-owner dialog', () => {
  async function openAddOwnerDialog(user: ReturnType<typeof userEvent.setup>) {
    await user.click(
      screen.getByRole('button', { name: /Add new beneficial owner/i })
    );
    return screen.findByRole('dialog');
  }

  it('validates required fields for an individual owner', async () => {
    const user = userEvent.setup();
    renderComponent(makeClient([]));

    const dialog = await openAddOwnerDialog(user);
    await user.click(
      within(dialog).getByRole('button', { name: /^Add Owner$/i })
    );

    expect(
      await within(dialog).findByText(/First name is required/i)
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText(/Last name is required/i)
    ).toBeInTheDocument();
  });

  it('validates the required business name', async () => {
    const user = userEvent.setup();
    renderComponent(makeClient([]));

    const dialog = await openAddOwnerDialog(user);
    await user.click(within(dialog).getByRole('tab', { name: /Business/i }));
    await user.click(
      within(dialog).getByRole('button', { name: /^Add Owner$/i })
    );

    expect(
      await within(dialog).findByText(/Business name is required/i)
    ).toBeInTheDocument();
  });

  it('rejects a duplicate individual owner', async () => {
    const user = userEvent.setup();
    renderComponent(
      makeClient([
        {
          id: 'owner-existing',
          partyType: 'INDIVIDUAL',
          roles: ['BENEFICIAL_OWNER'],
          active: true,
          parentPartyId: 'client-1',
          individualDetails: {
            firstName: 'Grace',
            lastName: 'Hopper',
            natureOfOwnership: 'Direct',
          },
          createdAt: '2024-01-02T00:00:00.000Z',
        },
      ])
    );

    const dialog = await openAddOwnerDialog(user);
    await user.type(within(dialog).getByLabelText(/First Name/i), 'Grace');
    await user.type(within(dialog).getByLabelText(/Last Name/i), 'Hopper');
    await user.click(
      within(dialog).getByRole('button', { name: /^Add Owner$/i })
    );

    expect(
      await within(dialog).findByText(/already exists/i)
    ).toBeInTheDocument();
  });

  it('adds a direct individual owner through the dialog', async () => {
    const user = userEvent.setup();
    renderComponent(makeClient([]));

    const dialog = await openAddOwnerDialog(user);
    await user.type(within(dialog).getByLabelText(/First Name/i), 'Ada');
    await user.type(within(dialog).getByLabelText(/Last Name/i), 'Lovelace');
    await user.click(
      within(dialog).getByRole('button', { name: /^Add Owner$/i })
    );

    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    );
    expect(
      screen.getByRole('listitem', { name: /Ada Lovelace/i })
    ).toBeInTheDocument();
  });

  it('adds an individual owner marked as indirect', async () => {
    const user = userEvent.setup();
    renderComponent(makeClient([]));

    const dialog = await openAddOwnerDialog(user);
    await user.type(within(dialog).getByLabelText(/First Name/i), 'Ivy');
    await user.type(within(dialog).getByLabelText(/Last Name/i), 'Indirect');
    await user.click(within(dialog).getByRole('checkbox'));
    await user.click(
      within(dialog).getByRole('button', { name: /^Add Owner$/i })
    );

    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    );
    expect(
      screen.getByRole('listitem', { name: /Ivy Indirect/i })
    ).toBeInTheDocument();
  });
});

describe('IndirectOwnership gating question and owner removal', () => {
  it('reports "direct-only" when the user says no one owns indirectly', async () => {
    const user = userEvent.setup();
    const onGatingAnswer = vi.fn();
    renderComponent(indirectOwnerClient, {
      showGatingQuestion: true,
      onGatingAnswer,
    });

    await user.click(
      screen.getByLabelText(/all owners hold their shares directly/i)
    );
    expect(onGatingAnswer).toHaveBeenCalledWith('direct-only');
  });

  it('reveals the ownership structure when the user says yes', async () => {
    const user = userEvent.setup();
    const onGatingAnswer = vi.fn();
    renderComponent(indirectOwnerClient, {
      showGatingQuestion: true,
      onGatingAnswer,
    });

    await user.click(
      screen.getByLabelText(/hold shares through other companies/i)
    );
    expect(onGatingAnswer).toHaveBeenCalledWith('has-indirect');
    expect(
      await screen.findByRole('listitem', { name: /Cara Chain/i })
    ).toBeInTheDocument();
  });

  it('invokes onRemoveOwner from the owner card trash action', async () => {
    const user = userEvent.setup();
    const onRemoveOwner = vi.fn();
    renderComponent(indirectOwnerClient, { onRemoveOwner });

    const card = screen.getByRole('listitem', { name: /Cara Chain/i });
    await user.click(
      within(card).getByRole('button', {
        name: /Remove Cara Chain from ownership list/i,
      })
    );
    expect(onRemoveOwner).toHaveBeenCalledWith('owner-chain');
  });

  it('invokes onEditOwner from the owner card details action', async () => {
    const user = userEvent.setup();
    const onEditOwner = vi.fn();
    renderComponent(indirectOwnerClient, { onEditOwner });

    const card = screen.getByRole('listitem', { name: /Cara Chain/i });
    await user.click(
      within(card).getByRole('button', { name: /details for Cara Chain/i })
    );
    expect(onEditOwner).toHaveBeenCalledWith('owner-chain');
  });
});

describe('IndirectOwnership nature toggle', () => {
  const directOwnerClient = makeClient([
    {
      id: 'owner-direct',
      partyType: 'INDIVIDUAL',
      roles: ['BENEFICIAL_OWNER'],
      active: true,
      parentPartyId: 'client-1',
      individualDetails: {
        firstName: 'Dan',
        lastName: 'Direct',
        natureOfOwnership: 'Direct',
      },
      createdAt: '2024-01-02T00:00:00.000Z',
    },
  ]);

  const chainedOwnerClient = makeClient([
    {
      id: 'owner-1',
      partyType: 'INDIVIDUAL',
      roles: ['BENEFICIAL_OWNER'],
      active: true,
      parentPartyId: 'client-1',
      individualDetails: {
        firstName: 'Otto',
        lastName: 'Owner',
        natureOfOwnership: 'Indirect',
      },
      createdAt: '2024-01-02T00:00:00.000Z',
    },
    {
      id: 'intermediary-1',
      partyType: 'ORGANIZATION',
      roles: [INTERMEDIARY_OWNER_ROLE],
      active: true,
      parentPartyId: 'owner-1',
      organizationDetails: {
        organizationName: 'MidCo Holdings',
        natureOfOwnership: 'Direct',
      } as PartyResponse['organizationDetails'],
      createdAt: '2024-01-03T00:00:00.000Z',
    },
  ]);

  it('marks a direct owner as indirect and prompts for a chain', async () => {
    const user = userEvent.setup();
    renderComponent(directOwnerClient);

    const card = screen.getByRole('listitem', { name: /Dan Direct/i });
    await user.click(
      within(card).getByRole('switch', { name: /Toggle indirect ownership/i })
    );

    await waitFor(() =>
      expect(
        within(screen.getByRole('listitem', { name: /Dan Direct/i })).getByText(
          /Pending/i
        )
      ).toBeInTheDocument()
    );
  });

  it('confirms before unlinking an indirect chain back to direct', async () => {
    const user = userEvent.setup();
    renderComponent(chainedOwnerClient);

    const card = screen.getByRole('listitem', { name: /Otto Owner/i });
    await user.click(
      within(card).getByRole('switch', { name: /Toggle indirect ownership/i })
    );

    const dialog = await screen.findByRole('dialog');
    expect(
      within(dialog).getByText(/Remove ownership chain\?/i)
    ).toBeInTheDocument();
    await user.click(
      within(dialog).getByRole('button', { name: /Remove chain/i })
    );

    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    );
  });
});

describe('IndirectOwnership chain reordering', () => {
  // Owner held through two chained intermediaries → a reorderable 2-step chain.
  const twoStepChainClient = makeClient([
    {
      id: 'mid-a',
      partyType: 'ORGANIZATION',
      roles: [INTERMEDIARY_OWNER_ROLE],
      active: true,
      parentPartyId: 'client-1',
      organizationDetails: {
        organizationName: 'Alpha Holdings',
        natureOfOwnership: 'Direct',
      } as PartyResponse['organizationDetails'],
      createdAt: '2024-01-02T00:00:00.000Z',
    },
    {
      id: 'mid-b',
      partyType: 'ORGANIZATION',
      roles: [INTERMEDIARY_OWNER_ROLE],
      active: true,
      parentPartyId: 'mid-a',
      organizationDetails: {
        organizationName: 'Beta Holdings',
        natureOfOwnership: 'Indirect',
      } as PartyResponse['organizationDetails'],
      createdAt: '2024-01-03T00:00:00.000Z',
    },
    {
      id: 'owner-2step',
      partyType: 'INDIVIDUAL',
      roles: ['BENEFICIAL_OWNER'],
      active: true,
      parentPartyId: 'mid-b',
      individualDetails: {
        firstName: 'Rita',
        lastName: 'Reorder',
        natureOfOwnership: 'Indirect',
      },
      createdAt: '2024-01-04T00:00:00.000Z',
    },
  ]);

  function makeDataTransfer() {
    const store: Record<string, string> = {};
    return {
      setData: (k: string, v: string) => {
        store[k] = v;
      },
      getData: (k: string) => store[k] ?? '',
      effectAllowed: '',
      dropEffect: '',
    };
  }

  it('reorders intermediaries via drag and drop', async () => {
    renderComponent(twoStepChainClient);

    const card = screen.getByRole('listitem', { name: /Rita Reorder/i });
    expect(within(card).getByText('Ownership Chain:')).toBeInTheDocument();

    const chipA = within(card)
      .getByText('Alpha Holdings')
      .closest('[draggable="true"]') as HTMLElement;
    const chipB = within(card)
      .getByText('Beta Holdings')
      .closest('[draggable="true"]') as HTMLElement;
    expect(chipA).toBeTruthy();
    expect(chipB).toBeTruthy();

    const dataTransfer = makeDataTransfer();
    fireEvent.dragStart(chipA, { dataTransfer });
    fireEvent.dragOver(chipB, { dataTransfer });
    fireEvent.dragLeave(chipB, { dataTransfer });
    fireEvent.drop(chipB, { dataTransfer });
    fireEvent.dragEnd(chipA, { dataTransfer });

    // Both chained intermediaries remain visible after the reorder.
    await waitFor(() => {
      const updated = screen.getByRole('listitem', { name: /Rita Reorder/i });
      expect(within(updated).getByText('Alpha Holdings')).toBeInTheDocument();
      expect(within(updated).getByText('Beta Holdings')).toBeInTheDocument();
    });
  });
});

describe('IndirectOwnership chain builder — carries selected party id', () => {
  // An existing intermediary the user can reuse in a chain.
  const clientWithReusableEntity = makeClient([
    {
      id: 'own-indirect',
      partyType: 'INDIVIDUAL',
      roles: ['BENEFICIAL_OWNER'],
      active: true,
      parentPartyId: 'client-1',
      individualDetails: {
        firstName: 'Cara',
        lastName: 'Chain',
        natureOfOwnership: 'Indirect',
      },
      createdAt: '2024-01-02T00:00:00.000Z',
    },
    {
      id: 'int-shared',
      partyType: 'ORGANIZATION',
      roles: [INTERMEDIARY_OWNER_ROLE],
      active: true,
      parentPartyId: 'client-1',
      organizationDetails: {
        organizationName: 'Shared Holdings',
        natureOfOwnership: 'Direct',
      } as PartyResponse['organizationDetails'],
      createdAt: '2024-01-03T00:00:00.000Z',
    },
  ]);

  it('passes the reused entity\u2019s stable partyId to onSaveHierarchy', async () => {
    const user = userEvent.setup();
    const onSaveHierarchy = vi.fn();
    renderComponent(clientWithReusableEntity, { onSaveHierarchy });

    const card = screen.getByRole('listitem', { name: /Cara Chain/i });
    await user.click(
      within(card).getByRole('button', { name: /Add intermediary owner/i })
    );
    const dialog = await screen.findByRole('dialog');

    // Pick the existing "Shared Holdings" entity from the combobox list.
    await user.click(
      within(dialog).getByRole('combobox', { name: /Company Name/i })
    );
    const search = await screen.findByPlaceholderText('Search companies...');
    await user.type(search, 'Shared');
    await user.click(
      await screen.findByRole('option', { name: /Shared Holdings/i })
    );

    // Complete the chain.
    await user.click(
      within(screen.getByRole('dialog')).getByRole('button', {
        name: /Yes, save and complete/i,
      })
    );

    await waitFor(() => expect(onSaveHierarchy).toHaveBeenCalled());
    const [, steps] = onSaveHierarchy.mock.calls[0];
    expect(steps).toEqual([
      expect.objectContaining({
        entityName: 'Shared Holdings',
        partyId: 'int-shared',
      }),
    ]);
  });
});
