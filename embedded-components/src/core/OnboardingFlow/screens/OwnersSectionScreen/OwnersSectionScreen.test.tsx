import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { render, screen, userEvent, waitFor } from '@test-utils';

import type { ClientResponse } from '@/api/generated/smbdo.schemas';
import { flowConfig } from '@/core/OnboardingFlow/config/flowConfig';
import {
  FlowProvider,
  OnboardingContext,
  type OnboardingContextType,
} from '@/core/OnboardingFlow/contexts';
import { OwnersSectionScreen } from '@/core/OnboardingFlow/screens/OwnersSectionScreen/OwnersSectionScreen';

vi.mock('@/api/generated/smbdo', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/generated/smbdo')>();
  return {
    ...actual,
    useSmbdoUpdateClient: () => ({ mutateAsync: vi.fn() }),
    useUpdatePartyLegacy: () => ({
      mutate: vi.fn(),
      error: null,
      status: 'idle',
    }),
    useSmbdoGetClient: () => ({
      data: undefined,
      status: 'success',
      error: null,
      refetch: vi.fn(),
    }),
    getSmbdoGetClientQueryKey: (id: string) => ['smbdo', 'getClient', id],
  };
});

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

const mockClientWithIncompleteOwners: ClientResponse = {
  id: '0030000132',
  partyId: 'party-1',
  parties: [
    {
      id: '2000000111',
      partyType: 'ORGANIZATION',
      roles: ['CLIENT'],
      active: true,
      organizationDetails: {
        organizationType: 'LIMITED_LIABILITY_COMPANY',
        organizationName: 'Test Corp',
      },
    },
    {
      id: '2000000112',
      partyType: 'INDIVIDUAL',
      parentPartyId: '2000000111',
      email: 'controller@test.com',
      active: true,
      roles: ['CONTROLLER'],
      individualDetails: {
        firstName: 'John',
        lastName: 'Controller',
        jobTitle: 'CEO',
      },
    },
    {
      id: '2000000113',
      partyType: 'INDIVIDUAL',
      parentPartyId: '2000000111',
      email: 'alice@test.com',
      active: true,
      roles: ['BENEFICIAL_OWNER'],
      individualDetails: {
        firstName: 'Alice',
        lastName: 'Owner',
        jobTitle: 'CFO',
        natureOfOwnership: 'Direct',
      },
      validationResponse: [
        {
          validationStatus: 'NEEDS_INFO',
          validationType: 'ENTITY_VALIDATION',
          fields: [{ name: 'birthDate' }],
        },
      ],
    },
  ],
  products: ['EMBEDDED_PAYMENTS'],
  outstanding: {
    attestationDocumentIds: [],
    documentRequestIds: [],
    partyIds: ['2000000113'],
    partyRoles: [],
    questionIds: [],
  },
  status: 'NEW',
};

const baseOnboardingContext: OnboardingContextType = {
  availableProducts: ['EMBEDDED_PAYMENTS'],
  availableJurisdictions: ['US'],
  clientData: mockClientWithIncompleteOwners,
  clientGetStatus: 'success',
  setClientId: vi.fn(),
  organizationType: 'LIMITED_LIABILITY_COMPANY',
};

function renderOwnersSectionScreen(
  contextOverrides: Partial<OnboardingContextType> = {}
) {
  return render(
    <QueryClientProvider client={queryClient}>
      <OnboardingContext.Provider
        value={{ ...baseOnboardingContext, ...contextOverrides }}
      >
        <FlowProvider initialScreenId="owners-section" flowConfig={flowConfig}>
          <OwnersSectionScreen />
        </FlowProvider>
      </OnboardingContext.Provider>
    </QueryClientProvider>
  );
}

describe('OwnersSectionScreen - Beneficial Owner Invitation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
  });

  describe('Without allowBeneficialOwnerInvitation flag', () => {
    test('does NOT render Invite Beneficial Owner button', async () => {
      renderOwnersSectionScreen({ allowBeneficialOwnerInvitation: false });

      // Add Owner button should be present
      expect(
        screen.getByRole('button', { name: /add owner/i })
      ).toBeInTheDocument();

      // Invite button should NOT be present
      expect(
        screen.queryByRole('button', { name: /invite beneficial owner/i })
      ).not.toBeInTheDocument();
    });
  });

  describe('With allowBeneficialOwnerInvitation flag', () => {
    test('renders both Add Owner and Invite Beneficial Owner buttons', async () => {
      renderOwnersSectionScreen({ allowBeneficialOwnerInvitation: true });

      expect(
        screen.getByRole('button', { name: /add owner/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /invite beneficial owner/i })
      ).toBeInTheDocument();
    });

    test('clicking Invite button opens the invite dialog', async () => {
      const user = userEvent.setup();
      renderOwnersSectionScreen({ allowBeneficialOwnerInvitation: true });

      const inviteButton = screen.getByRole('button', {
        name: /invite beneficial owner/i,
      });
      await user.click(inviteButton);

      expect(
        await screen.findByLabelText(/first name/i)
      ).toBeInTheDocument();
      expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    });

    test('Send Invitation button is disabled when fields are empty', async () => {
      const user = userEvent.setup();
      renderOwnersSectionScreen({ allowBeneficialOwnerInvitation: true });

      const inviteButton = screen.getByRole('button', {
        name: /invite beneficial owner/i,
      });
      await user.click(inviteButton);

      await screen.findByLabelText(/first name/i);

      const sendButton = screen.getByRole('button', {
        name: /send invitation/i,
      });
      expect(sendButton).toBeDisabled();
    });

    test('Send Invitation button is enabled after filling all fields', async () => {
      const user = userEvent.setup();
      renderOwnersSectionScreen({ allowBeneficialOwnerInvitation: true });

      const inviteButton = screen.getByRole('button', {
        name: /invite beneficial owner/i,
      });
      await user.click(inviteButton);

      const firstName = await screen.findByLabelText(/first name/i);
      const lastName = screen.getByLabelText(/last name/i);
      const email = screen.getByLabelText(/email address/i);

      await user.type(firstName, 'Jane');
      await user.type(lastName, 'Doe');
      await user.type(email, 'jane@example.com');

      const sendButton = screen.getByRole('button', {
        name: /send invitation/i,
      });
      expect(sendButton).toBeEnabled();
    });

    test('Invite button is disabled when 4 owners exist', async () => {
      const clientWith4Owners: ClientResponse = {
        ...mockClientWithIncompleteOwners,
        parties: [
          ...mockClientWithIncompleteOwners.parties!,
          {
            id: '2000000114',
            partyType: 'INDIVIDUAL',
            parentPartyId: '2000000111',
            active: true,
            roles: ['BENEFICIAL_OWNER'],
            individualDetails: {
              firstName: 'Bob',
              lastName: 'Two',
              jobTitle: 'CTO',
            },
          },
          {
            id: '2000000115',
            partyType: 'INDIVIDUAL',
            parentPartyId: '2000000111',
            active: true,
            roles: ['BENEFICIAL_OWNER'],
            individualDetails: {
              firstName: 'Carol',
              lastName: 'Three',
              jobTitle: 'VP',
            },
          },
          {
            id: '2000000116',
            partyType: 'INDIVIDUAL',
            parentPartyId: '2000000111',
            active: true,
            roles: ['BENEFICIAL_OWNER'],
            individualDetails: {
              firstName: 'Dave',
              lastName: 'Four',
              jobTitle: 'Director',
            },
          },
        ],
      };

      renderOwnersSectionScreen({
        allowBeneficialOwnerInvitation: true,
        clientData: clientWith4Owners,
      });

      const inviteButton = screen.getByRole('button', {
        name: /invite beneficial owner/i,
      });
      expect(inviteButton).toBeDisabled();
    });
  });
});
