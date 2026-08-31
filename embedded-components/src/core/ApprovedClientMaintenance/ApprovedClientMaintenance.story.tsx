import type { Meta, StoryObj } from '@storybook/react-vite';
import { http, HttpResponse } from 'msw';

import type { BaseStoryArgs } from '../../../.storybook/preview';
import { ApprovedClientMaintenance } from './ApprovedClientMaintenance';
import type { ApprovedClientMaintenanceProps } from './ApprovedClientMaintenance.types';
import type { MaintenanceParty } from './models/maintenanceApi.types';

const CLIENT_ID = '0030000131';
const MAINTENANCE_REQUEST_ID = 'maintenance-2026-00482';
const ORGANIZATION_PARTY_ID = '2200000111';
const CONTROLLER_PARTY_ID = '2200000112';
const OWNER_PARTY_ID = '2200000113';

const approvedClient = {
  id: CLIENT_ID,
  partyId: ORGANIZATION_PARTY_ID,
  status: 'APPROVED',
  products: ['EMBEDDED_PAYMENTS'],
  productDetails: [
    {
      product: 'EMBEDDED_PAYMENTS',
      subProduct: 'LIMITED_DDA_PAYMENTS',
    },
  ],
  parties: [
    {
      id: ORGANIZATION_PARTY_ID,
      partyType: 'ORGANIZATION',
      roles: ['CLIENT'],
      organizationDetails: {
        organizationName: 'Neverland Books',
        countryOfFormation: 'US',
        organizationType: 'LIMITED_LIABILITY_COMPANY',
      },
    },
    {
      id: CONTROLLER_PARTY_ID,
      partyType: 'INDIVIDUAL',
      roles: ['CONTROLLER', 'BENEFICIAL_OWNER'],
      individualDetails: {
        firstName: 'Peiter',
        lastName: 'Pan',
      },
    },
    {
      id: OWNER_PARTY_ID,
      partyType: 'INDIVIDUAL',
      roles: ['BENEFICIAL_OWNER'],
      individualDetails: {
        firstName: 'Tinker',
        lastName: 'Ball',
      },
    },
  ],
};

const createHandlers = () => {
  let pendingProposals: MaintenanceParty[] = [];

  return [
    http.get('/clients/:clientId', () =>
      HttpResponse.json({
        ...approvedClient,
        updateRequest:
          pendingProposals.length > 0
            ? { status: 'NEW', requestId: MAINTENANCE_REQUEST_ID }
            : undefined,
      })
    ),
    http.get('/maintenance-requests', ({ request }) => {
      const requestUrl = new URL(request.url);
      const page = Number(requestUrl.searchParams.get('page') ?? 0);
      const limit = Number(requestUrl.searchParams.get('limit') ?? 25);
      return HttpResponse.json({
        parties: pendingProposals,
        metadata: { page, limit, total: pendingProposals.length },
      });
    }),
    http.patch('/parties/:partyId', async ({ request, params }) => {
      const body = (await request.json()) as {
        individualDetails?: {
          firstName?: string;
          middleName?: string;
          lastName?: string;
        };
      };
      const partyId = String(params.partyId);
      const nextProposal: MaintenanceParty = {
        id: partyId,
        partyType: 'INDIVIDUAL',
        individualDetails: body.individualDetails,
        updateRequest: {
          status: 'NEW',
          action: 'MODIFY',
          requestId: MAINTENANCE_REQUEST_ID,
          submittedAt: '2026-08-26T12:00:00.000Z',
        },
      };
      pendingProposals = [
        ...pendingProposals.filter((proposal) => proposal.id !== partyId),
        nextProposal,
      ];

      // The mutation response keeps approved persisted values. The proposal is
      // intentionally available only from GET /maintenance-requests.
      return HttpResponse.json({
        ...approvedClient.parties.find((party) => party.id === partyId),
        updateRequest: nextProposal.updateRequest,
      });
    }),
    http.delete('/maintenance-requests/:requestId', ({ request }) => {
      const requestUrl = new URL(request.url);
      const partyId = requestUrl.searchParams.get('partyId');
      const terminated = pendingProposals.filter(
        (proposal) => !partyId || proposal.id === partyId
      );
      pendingProposals = partyId
        ? pendingProposals.filter((proposal) => proposal.id !== partyId)
        : [];
      return HttpResponse.json({
        parties: terminated.map((proposal) => ({
          ...proposal,
          updateRequest: {
            ...proposal.updateRequest,
            status: 'TERMINATED',
          },
        })),
      });
    }),
    http.post('/clients/:clientId/verifications', () =>
      HttpResponse.json(
        { acceptedAt: new Date().toISOString() },
        { status: 202 }
      )
    ),
  ];
};

const createActiveMaintenanceRequestHandlers = () => {
  let pendingProposals: MaintenanceParty[] = [
    {
      id: CONTROLLER_PARTY_ID,
      individualDetails: {
        firstName: 'Peter',
        lastName: 'Pan',
      },
      updateRequest: {
        status: 'NEW',
        action: 'MODIFY',
        requestId: MAINTENANCE_REQUEST_ID,
        submittedAt: '2026-08-26T18:16:06.210Z',
      },
    },
    {
      id: OWNER_PARTY_ID,
      individualDetails: { lastName: 'Bell' },
      updateRequest: {
        status: 'NEW',
        action: 'MODIFY',
        requestId: MAINTENANCE_REQUEST_ID,
        submittedAt: '2026-08-26T18:15:00.535Z',
      },
    },
  ];
  const documentRequests = [
    {
      id: 'document-peiter-pan',
      clientId: CLIENT_ID,
      partyId: CONTROLLER_PARTY_ID,
      status: 'ACTIVE',
      description:
        'Provide a current government-issued photo ID for Peiter Pan.',
      requirements: [
        {
          description:
            "Passport or driver's license showing Peiter's current legal name",
          documentTypes: ['DRIVERS_LICENSE', 'PASSPORT'],
          minRequired: 1,
          optional: false,
        },
      ],
    },
    {
      id: 'document-tinker-ball',
      clientId: CLIENT_ID,
      partyId: OWNER_PARTY_ID,
      status: 'ACTIVE',
      description:
        'Provide a current government-issued photo ID for Tinker Ball.',
      requirements: [
        {
          description:
            "Passport or driver's license showing Tinker's current legal name",
          documentTypes: ['DRIVERS_LICENSE', 'PASSPORT'],
          minRequired: 1,
          optional: false,
        },
      ],
    },
  ];

  const getClient = () => ({
    ...approvedClient,
    parties: approvedClient.parties.map((party) => {
      const documentRequest = documentRequests.find(
        (request) => request.partyId === party.id && request.status !== 'CLOSED'
      );
      return party.partyType === 'INDIVIDUAL'
        ? {
            ...party,
            validationResponse: [
              {
                validationStatus: documentRequest ? 'NEEDS_INFO' : 'VALIDATED',
                validationType: 'ENTITY_VALIDATION',
                documentRequestIds: documentRequest ? [documentRequest.id] : [],
              },
            ],
          }
        : party;
    }),
    outstanding: {
      partyIds: documentRequests
        .filter((request) => request.status !== 'CLOSED')
        .map((request) => request.partyId),
      documentRequestIds: [],
      questionIds: [],
      attestationDocumentIds: [],
      partyRoles: [],
    },
    updateRequest:
      pendingProposals.length > 0
        ? { status: 'NEW', requestId: MAINTENANCE_REQUEST_ID }
        : undefined,
  });

  return [
    http.get('/clients/:clientId', () => HttpResponse.json(getClient())),
    http.get('/maintenance-requests', ({ request }) => {
      const requestUrl = new URL(request.url);
      const page = Number(requestUrl.searchParams.get('page') ?? 0);
      return HttpResponse.json({
        parties: pendingProposals,
        metadata: { page, total: pendingProposals.length },
      });
    }),
    http.get('/document-requests', () =>
      HttpResponse.json({ documentRequests })
    ),
    http.get('/document-requests/:documentRequestId', ({ params }) => {
      const documentRequest = documentRequests.find(
        (request) => request.id === params.documentRequestId
      );
      return documentRequest
        ? HttpResponse.json(documentRequest)
        : new HttpResponse(null, { status: 404 });
    }),
    http.post('/documents', () =>
      HttpResponse.json(
        { id: crypto.randomUUID(), status: 'ACTIVE' },
        { status: 201 }
      )
    ),
    http.post('/document-requests/:documentRequestId/submit', ({ params }) => {
      const documentRequest = documentRequests.find(
        (request) => request.id === params.documentRequestId
      );
      if (!documentRequest) return new HttpResponse(null, { status: 404 });
      documentRequest.status = 'CLOSED';
      return HttpResponse.json(documentRequest);
    }),
    http.delete('/maintenance-requests/:requestId', ({ request }) => {
      const requestUrl = new URL(request.url);
      const partyId = requestUrl.searchParams.get('partyId');
      const terminated = pendingProposals.filter(
        (proposal) => !partyId || proposal.id === partyId
      );
      pendingProposals = partyId
        ? pendingProposals.filter((proposal) => proposal.id !== partyId)
        : [];
      return HttpResponse.json({ parties: terminated });
    }),
    http.post('/clients/:clientId/verifications', () =>
      HttpResponse.json(
        { acceptedAt: new Date().toISOString() },
        { status: 202 }
      )
    ),
  ];
};

type ApprovedClientMaintenanceStoryArgs = ApprovedClientMaintenanceProps &
  BaseStoryArgs;

const STORY_ELIGIBILITY: ApprovedClientMaintenanceProps['eligibility'] = [
  'SOLE_PROPRIETORSHIP',
  'LIMITED_LIABILITY_COMPANY',
  'LIMITED_LIABILITY_PARTNERSHIP',
  'C_CORPORATION',
  'S_CORPORATION',
  'GENERAL_PARTNERSHIP',
  'LIMITED_PARTNERSHIP',
  'PARTNERSHIP',
  'NON_PROFIT_CORPORATION',
  'GOVERNMENT_ENTITY',
  'UNINCORPORATED_ASSOCIATION',
].flatMap((organizationType) =>
  ['US', 'CA'].map((country) => ({
    country,
    organizationType,
    operations: ['EDIT_PARTY_NAME'] as const,
  }))
);

const meta: Meta<ApprovedClientMaintenanceStoryArgs> = {
  title: 'Draft/ApprovedClientMaintenance',
  component: ApprovedClientMaintenance,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div className="eb-mx-auto eb-w-full eb-max-w-[960px]">
        <Story />
      </div>
    ),
  ],
  parameters: {
    layout: 'padded',
  },
  args: {
    eligibility: STORY_ELIGIBILITY,
  },
  argTypes: {
    apiBaseUrl: {
      control: { type: 'text' },
      description: 'API gateway base URL',
      table: { category: 'API Testing' },
    },
    clientId: {
      control: { type: 'text' },
      description: 'Approved client ID to load',
      table: { category: 'API Testing' },
    },
    headers: {
      control: { type: 'object' },
      description: 'Authentication and platform headers',
      table: { category: 'API Testing' },
    },
    eligibility: {
      control: { type: 'object' },
      description:
        'Exact country and legal-entity eligibility rules for maintenance writes',
      table: { category: 'Maintenance' },
    },
  },
  render: (args) => <ApprovedClientMaintenance {...args} />,
};

export default meta;
type Story = StoryObj<ApprovedClientMaintenanceStoryArgs>;

/**
 * Connects to the configured API without MSW. Set `VITE_API_BASE_URL`,
 * `VITE_API_CLIENT_ID`, and `VITE_API_PLATFORM_ID`, or edit the Controls.
 * The broad draft eligibility matrix can also be replaced in Controls for a
 * client's exact supported country and legal-entity configuration.
 */
export const Default: Story = {
  parameters: {
    msw: { handlers: [] },
  },
  args: {
    clientId: import.meta.env.VITE_API_CLIENT_ID ?? '',
    headers: {
      platform_id: import.meta.env.VITE_API_PLATFORM_ID ?? '',
    },
  },
};

export const EditExistingPartyName: Story = {
  parameters: {
    msw: { handlers: createHandlers() },
  },
  args: {
    clientId: CLIENT_ID,
    eligibility: [
      {
        country: 'US',
        organizationType: 'LIMITED_LIABILITY_COMPANY',
        operations: ['EDIT_PARTY_NAME'],
      },
    ],
  },
};

/**
 * Two party changes share one maintenance request. Each person's required
 * document remains attached to that person's focused view. The secondary menu
 * supports discarding the full draft, and each person supports scoped discard.
 */
export const ActiveMaintenanceRequestWithDocuments: Story = {
  parameters: {
    msw: { handlers: createActiveMaintenanceRequestHandlers() },
  },
  args: {
    clientId: CLIENT_ID,
    eligibility: [
      {
        country: 'US',
        organizationType: 'LIMITED_LIABILITY_COMPANY',
        operations: ['EDIT_PARTY_NAME'],
      },
    ],
  },
};
