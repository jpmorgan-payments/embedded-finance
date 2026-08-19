import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ClientResponse, PartyResponse } from '@/api/generated/smbdo.schemas';
import { EBComponentsProvider } from '@/core/EBComponentsProvider';

import { IndirectOwnership } from './IndirectOwnership';
import { INTERMEDIARY_OWNER_ROLE } from './IndirectOwnership.types';

/**
 * End-to-end / integration flows for the Indirect Ownership feature. These
 * exercise the component the way a user does (render → interact → assert) and
 * lock in the behaviours fixed across the recovery work:
 *  - direct vs indirect status labels ("Details Required" vs "Chain Required")
 *  - the chain builder ("Add to chain" → "Are there more?" → "Complete Chain")
 *  - the combobox "Add '<name>' as a new company" acting immediately
 *  - business owners toggling to indirect and gaining a chain
 *  - chain reconstruction from intermediary children (survives data refresh)
 *  - chain intermediaries not producing a backwards/circular chain
 *  - the max-4-owners rule
 *  - the delete-an-intermediary confirmation overlay
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

describe('IndirectOwnership flows', () => {
  describe('status labels', () => {
    it('shows "Details Required" for a direct owner missing details (no pending chain)', () => {
      const client = makeClient([
        {
          id: 'owner-direct',
          partyType: 'INDIVIDUAL',
          roles: ['BENEFICIAL_OWNER'],
          active: true,
          parentPartyId: 'client-1',
          individualDetails: {
            firstName: 'Dana',
            lastName: 'Direct',
            natureOfOwnership: 'Direct',
          },
          createdAt: '2024-01-02T00:00:00.000Z',
        },
      ]);

      renderComponent(client);

      const card = screen.getByRole('listitem', { name: /Dana Direct/i });
      expect(within(card).getByText('Direct Owner')).toBeInTheDocument();
      expect(within(card).getByText('Details Required')).toBeInTheDocument();
      expect(
        within(card).queryByText('Chain not defined')
      ).not.toBeInTheDocument();
    });

    it('shows pending chain visualization for an indirect owner that has no chain yet', () => {
      const client = makeClient([
        {
          id: 'owner-indirect',
          partyType: 'INDIVIDUAL',
          roles: ['BENEFICIAL_OWNER'],
          active: true,
          parentPartyId: 'client-1',
          individualDetails: {
            firstName: 'Ingrid',
            lastName: 'Indirect',
            natureOfOwnership: 'Indirect',
          },
          createdAt: '2024-01-02T00:00:00.000Z',
        },
      ]);

      renderComponent(client);

      const card = screen.getByRole('listitem', { name: /Ingrid Indirect/i });
      // The pending chain visualization should show the CTA button
      expect(
        within(card).getByRole('button', { name: /Add intermediary owner/i })
      ).toBeInTheDocument();
    });
  });

  describe('chain reconstruction from intermediary children', () => {
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

    it("rebuilds the owner's chain from its intermediary child and shows Edit Chain", () => {
      renderComponent(clientWithChain);

      const ownerCard = screen.getByRole('listitem', { name: /Otto Owner/i });
      // The chain is reconstructed from the persisted intermediary party.
      expect(
        within(ownerCard).getByText('Ownership Chain:')
      ).toBeInTheDocument();
      expect(within(ownerCard).getByText('MidCo Holdings')).toBeInTheDocument();
      expect(
        within(ownerCard).getByRole('button', {
          name: /Edit ownership hierarchy/i,
        })
      ).toBeInTheDocument();
    });

    it('does not give the intermediary its own backwards chain', () => {
      renderComponent(clientWithChain);

      const intermediaryCard = screen.getByRole('listitem', {
        name: /MidCo Holdings/i,
      });
      // The intermediary needs details, but must NOT display a chain that loops
      // back through its owner.
      expect(
        within(intermediaryCard).queryByText('Ownership Chain:')
      ).not.toBeInTheDocument();
      expect(
        within(intermediaryCard).queryByText('Otto Owner')
      ).not.toBeInTheDocument();
      expect(
        within(intermediaryCard).getByText('Details Required')
      ).toBeInTheDocument();
    });
  });

  describe('max 4 owners rule', () => {
    it('disables the Add button once four owners exist', () => {
      const client = makeClient(
        [1, 2, 3, 4].map((n) => ({
          id: `owner-${n}`,
          partyType: 'INDIVIDUAL' as const,
          roles: ['BENEFICIAL_OWNER' as const],
          active: true,
          parentPartyId: 'client-1',
          individualDetails: {
            firstName: `Owner${n}`,
            lastName: 'Person',
            natureOfOwnership: 'Direct' as const,
          },
          createdAt: '2024-01-02T00:00:00.000Z',
        }))
      );

      renderComponent(client);

      expect(
        screen.getByRole('button', { name: /Add new beneficial owner/i })
      ).toBeDisabled();
    });
  });

  describe('add a business owner', () => {
    it('adds a direct business owner through the dialog', async () => {
      const user = userEvent.setup();
      renderComponent(makeClient([]));

      await user.click(
        screen.getByRole('button', { name: /Add new beneficial owner/i })
      );

      const dialog = await screen.findByRole('dialog');
      // Choose Business tab
      await user.click(within(dialog).getByRole('tab', { name: /Business/i }));

      const nameField = within(dialog).getByRole('textbox');
      await user.type(nameField, 'Acquire Co');

      await user.click(
        within(dialog).getByRole('button', { name: /^Add Owner$/i })
      );

      await waitFor(() => {
        expect(screen.getByText('Acquire Co')).toBeInTheDocument();
      });
      const card = screen.getByRole('listitem', { name: /Acquire Co/i });
      expect(within(card).getByText('Business Owner')).toBeInTheDocument();
    });
  });

  describe('business toggle to indirect', () => {
    it('reveals Build Ownership Chain when a direct business is toggled to indirect', async () => {
      const user = userEvent.setup();
      const client = makeClient([
        {
          id: 'biz-1',
          partyType: 'ORGANIZATION',
          roles: [INTERMEDIARY_OWNER_ROLE],
          active: true,
          parentPartyId: 'client-1',
          organizationDetails: {
            organizationName: 'Toggle Corp',
            natureOfOwnership: 'Direct',
          } as PartyResponse['organizationDetails'],
          createdAt: '2024-01-02T00:00:00.000Z',
        },
      ]);

      renderComponent(client);

      const card = screen.getByRole('listitem', { name: /Toggle Corp/i });
      expect(within(card).getByText('Business Owner')).toBeInTheDocument();
      expect(
        within(card).queryByRole('button', {
          name: /Add intermediary owner/i,
        })
      ).not.toBeInTheDocument();

      await user.click(
        within(card).getByRole('switch', { name: /Toggle indirect ownership/i })
      );

      await waitFor(() => {
        expect(
          within(
            screen.getByRole('listitem', { name: /Toggle Corp/i })
          ).getByRole('button', { name: /Add intermediary owner/i })
        ).toBeInTheDocument();
      });
    });
  });

  describe('simplified chain builder', () => {
    const clientWithIndirect = makeClient([
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

    it('opens chain builder with "Add to chain" and shows confirmation after first add', async () => {
      const user = userEvent.setup();
      renderComponent(clientWithIndirect);

      const card = screen.getByRole('listitem', { name: /Cara Chain/i });
      await user.click(
        within(card).getByRole('button', { name: /Add intermediary owner/i })
      );

      const dialog = await screen.findByRole('dialog');
      expect(
        within(dialog).getByRole('button', { name: /Add to chain/i })
      ).toBeInTheDocument();
      // Confirmation prompt should not appear until at least one entity added.
      expect(
        within(dialog).queryByRole('button', {
          name: /Yes, save and complete/i,
        })
      ).not.toBeInTheDocument();
    });

    it('adds a new company to the chain and completes it', async () => {
      const user = userEvent.setup();
      renderComponent(clientWithIndirect);

      const card = screen.getByRole('listitem', { name: /Cara Chain/i });
      await user.click(
        within(card).getByRole('button', { name: /Add intermediary owner/i })
      );

      const dialog = await screen.findByRole('dialog');

      // Open the combobox and type a brand-new company name.
      await user.click(
        within(dialog).getByRole('combobox', { name: /Company Name/i })
      );
      const search = await screen.findByPlaceholderText('Search companies...');
      await user.type(search, 'Fresh Intermediary LLC');

      // The dropdown offers to add it as a new company; clicking adds it directly.
      await user.click(
        await screen.findByText('Add "Fresh Intermediary LLC" as a new company')
      );

      // It appears in the current chain steps (may appear multiple times
      // due to the confirmation prompt referencing the entity name too).
      await waitFor(() => {
        const dialog = screen.getByRole('dialog');
        expect(
          within(dialog).getAllByText('Fresh Intermediary LLC').length
        ).toBeGreaterThanOrEqual(1);
      });

      // After adding, the confirmation prompt appears.
      // Click "Yes, save and complete" to save.
      await user.click(
        within(screen.getByRole('dialog')).getByRole('button', {
          name: /Yes, save and complete/i,
        })
      );

      // The chain now shows on the owner card.
      await waitFor(() => {
        const updated = screen.getByRole('listitem', { name: /Cara Chain/i });
        expect(
          within(updated).getByText('Fresh Intermediary LLC')
        ).toBeInTheDocument();
      });
    });
  });

  describe('deleting an entity used in a chain', () => {
    it('warns with a confirmation overlay before removing', async () => {
      const user = userEvent.setup();
      // An owner whose chain runs through an intermediary, plus that same
      // intermediary declared as its own business entity card.
      const client = makeClient([
        {
          id: 'owner-x',
          partyType: 'INDIVIDUAL',
          roles: ['BENEFICIAL_OWNER'],
          active: true,
          parentPartyId: 'client-1',
          individualDetails: {
            firstName: 'Xavier',
            lastName: 'Xender',
            natureOfOwnership: 'Indirect',
          },
          createdAt: '2024-01-02T00:00:00.000Z',
        },
        {
          id: 'intermediary-x',
          partyType: 'ORGANIZATION',
          roles: [INTERMEDIARY_OWNER_ROLE],
          active: true,
          parentPartyId: 'owner-x',
          organizationDetails: {
            organizationName: 'Bridge Entity Inc',
            natureOfOwnership: 'Direct',
          } as PartyResponse['organizationDetails'],
          createdAt: '2024-01-03T00:00:00.000Z',
        },
      ]);

      renderComponent(client);

      const intermediaryCard = screen.getByRole('listitem', {
        name: /Bridge Entity Inc/i,
      });
      await user.click(
        within(intermediaryCard).getByRole('button', {
          name: /Remove Bridge Entity Inc/i,
        })
      );

      // A confirmation overlay warns the user before deleting.
      const confirm = await screen.findByRole('dialog');
      expect(within(confirm).getByText(/Remove owner\?/i)).toBeInTheDocument();
      expect(
        within(confirm).getByText(/used as an intermediary/i)
      ).toBeInTheDocument();
      expect(
        within(confirm).getByRole('button', { name: /Remove anyway/i })
      ).toBeInTheDocument();
      // The affected owner is named.
      expect(within(confirm).getByText('Xavier Xender')).toBeInTheDocument();
    });
  });
});
