import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import type { DocumentRequestResponse } from '@/api/generated/smbdo.schemas';

import { ApprovedClientMaintenance } from './ApprovedClientMaintenance';
import type {
  MaintenanceClient,
  MaintenanceParty,
} from './models/maintenanceApi.types';

const updatePartyName = vi.fn();
const updateParty = vi.fn();
const createParty = vi.fn();
const applyOwnershipOperations = vi.fn();
const resetOwnershipOperations = vi.fn();
const updateClientTasks = vi.fn();
const downloadAttestation = vi.fn();
const addProduct = vi.fn();
const cancelProductAddition = vi.fn();
const cancelChanges = vi.fn();
const applyPartySteps = vi.fn();
const submitForReview = vi.fn();
const resetMutation = vi.fn();
const resetCancellation = vi.fn();
const resetVerificationAttempt = vi.fn();
const refetchClient = vi.fn();
const refetchMaintenance = vi.fn();
const refreshMaintenanceWorkspace = vi.fn();

const approvedClient: MaintenanceClient = {
  id: 'client-1',
  partyId: 'organization-1',
  status: 'APPROVED',
  products: ['EMBEDDED_PAYMENTS'],
  parties: [
    {
      id: 'organization-1',
      partyType: 'ORGANIZATION',
      roles: ['CLIENT'],
      organizationDetails: {
        organizationName: 'Marketplace Vendor LLC',
        dbaName: 'Marketplace Vendor',
        countryOfFormation: 'US',
        organizationType: 'LIMITED_LIABILITY_COMPANY',
        yearOfFormation: '2020',
        organizationDescription: 'Online marketplace services',
        organizationIds: [{ idType: 'EIN', value: '121234567', issuer: 'US' }],
        addresses: [
          {
            addressType: 'BUSINESS_ADDRESS',
            addressLines: ['100 Market Street'],
            city: 'San Francisco',
            state: 'CA',
            postalCode: '94105',
            country: 'US',
          },
        ],
      },
      email: 'business@example.com',
    },
    {
      id: 'person-1',
      partyType: 'INDIVIDUAL',
      roles: ['CONTROLLER'],
      individualDetails: {
        firstName: 'Jane',
        middleName: 'R',
        lastName: 'Doe',
        birthDate: '1975-03-12',
        countryOfResidence: 'US',
        jobTitle: 'CEO',
        individualIds: [{ idType: 'SSN', value: '555110001', issuer: 'US' }],
        addresses: [
          {
            addressType: 'RESIDENTIAL_ADDRESS',
            addressLines: ['100 Main Street'],
            city: 'New York',
            state: 'NY',
            postalCode: '10001',
            country: 'US',
          },
        ],
      },
      email: 'jane@example.com',
    },
  ],
};

const workspace = {
  clientQuery: {
    data: approvedClient,
    error: null as unknown,
    isPending: false,
    isError: false,
    isFetching: false,
    refetch: refetchClient,
  },
  maintenanceQuery: {
    data: { pages: [], parties: [] as MaintenanceParty[] },
    error: null as unknown,
    isPending: false,
    isError: false,
    isFetching: false,
    refetch: refetchMaintenance,
  },
  questionsQuery: {
    data: [] as Array<{
      id?: string;
      label: string;
      responseType?: 'enum' | 'string';
      options?: string[];
    }>,
    error: null as unknown,
    isPending: false,
  },
  documentRequestsQuery: {
    data: { documentRequests: [] as DocumentRequestResponse[] },
    error: null as unknown,
    isPending: false,
    isError: false,
  },
  expectedDocumentRequestIds: [] as string[],
  isDocumentDiscoveryPending: false,
  updatePartyNameMutation: {
    isPending: false,
    error: null as unknown,
    reset: resetMutation,
  },
  updatePartyName,
  updatePartyMutation: {
    isPending: false,
    error: null as unknown,
    reset: vi.fn(),
  },
  updateParty,
  createPartyMutation: {
    isPending: false,
    error: null as unknown,
    reset: vi.fn(),
  },
  createParty,
  ownershipOperationsMutation: {
    isPending: false,
    error: null as unknown,
    reset: vi.fn(),
  },
  applyOwnershipOperations,
  resetOwnershipOperations,
  clientTaskMutation: {
    isPending: false,
    error: null as unknown,
    reset: vi.fn(),
  },
  updateClientTasks,
  downloadAttestation,
  addProductMutation: {
    isPending: false,
    error: null as unknown,
    reset: vi.fn(),
  },
  addProduct,
  cancelProductAdditionMutation: {
    isPending: false,
    error: null as unknown,
    reset: vi.fn(),
  },
  cancelProductAddition,
  cancelMaintenanceMutation: {
    isPending: false,
    error: null as unknown,
    reset: resetCancellation,
  },
  cancelChanges,
  partyStepsMutation: {
    isPending: false,
    error: null as unknown,
    reset: vi.fn(),
  },
  applyPartySteps,
  verificationMutation: {
    data: undefined as { acceptedAt?: string; receivedAt: string } | undefined,
    isPending: false,
    error: null as unknown,
    reset: resetVerificationAttempt,
  },
  submitForReview,
  resetVerificationAttempt,
  refreshMaintenanceWorkspace,
};

vi.mock('./hooks/useMaintenanceWorkspace', () => ({
  useMaintenanceWorkspace: () => workspace,
}));

vi.mock('@/lib/hooks', () => ({
  useIPAddress: () => ({ data: '127.0.0.1', isLoading: false }),
  useLocale: () => 'en-US',
}));

vi.mock('@/api/generated/smbdo', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/generated/smbdo')>();
  return {
    ...actual,
    useSmbdoGetDocumentRequest: () => ({
      data: undefined,
      error: null,
      isPending: true,
    }),
  };
});

const eligible = [
  {
    country: 'US',
    organizationType: 'LIMITED_LIABILITY_COMPANY',
    operations: ['MANAGE_PROFILE'] as const,
  },
];

const createProposal = (
  lastName: string,
  status: 'NEW' | 'REVIEW_IN_PROGRESS' = 'NEW'
): MaintenanceParty => ({
  id: 'person-1',
  partyType: 'INDIVIDUAL',
  individualDetails: {
    firstName: 'Jane',
    middleName: 'R',
    lastName,
  },
  updateRequest: {
    status,
    action: 'MODIFY',
    requestId: 'request-1',
    submittedAt: '2026-08-26T12:00:00.000Z',
  },
});

const fillImportantDate = async (
  user: ReturnType<typeof userEvent.setup>,
  isoDate: string
) => {
  const [year, month, day] = isoDate.split('-');
  const monthLabel = new Date(2000, Number(month) - 1, 1).toLocaleString(
    'default',
    { month: 'long' }
  );
  await user.clear(screen.getByLabelText('Day'));
  await user.type(screen.getByLabelText('Day'), String(Number(day)));
  await user.click(screen.getByLabelText('Month'));
  await user.click(screen.getByRole('option', { name: monthLabel }));
  await user.clear(screen.getByLabelText('Year'));
  await user.type(screen.getByLabelText('Year'), year);
};

const fillRequiredAddPersonFields = async (
  user: ReturnType<typeof userEvent.setup>,
  isoDate: string
) => {
  await fillImportantDate(user, isoDate);
  await user.click(screen.getByLabelText('Job title'));
  await user.click(screen.getByRole('option', { name: 'CEO' }));
  await user.type(screen.getByLabelText('Email'), 'owner@example.com');
};

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const getOwnershipAddRow = (parentPartyId: string) =>
  document.querySelector<HTMLElement>(
    `[data-ownership-placeholder="${parentPartyId}"]`
  );

const openOwnershipMenu = async (
  user: ReturnType<typeof userEvent.setup>,
  partyName: string
) => {
  await user.click(screen.getByRole('button', { name: `Update ${partyName}` }));
};

const ownershipMenuItem = (label: string) =>
  screen.findByRole('menuitem', {
    name: new RegExp(`^${escapeRegExp(label)}`),
  });

const clickOwnershipMenuItem = async (
  user: ReturnType<typeof userEvent.setup>,
  partyName: string,
  label: string
) => {
  await openOwnershipMenu(user, partyName);
  await user.click(await ownershipMenuItem(label));
};

describe('ApprovedClientMaintenance', () => {
  beforeEach(() => {
    workspace.clientQuery.data = approvedClient;
    workspace.clientQuery.error = null;
    workspace.clientQuery.isError = false;
    workspace.maintenanceQuery.data = { pages: [], parties: [] };
    workspace.maintenanceQuery.error = null;
    workspace.maintenanceQuery.isError = false;
    workspace.maintenanceQuery.isFetching = false;
    workspace.questionsQuery.data = [];
    workspace.questionsQuery.error = null;
    workspace.questionsQuery.isPending = false;
    workspace.documentRequestsQuery.data = { documentRequests: [] };
    workspace.documentRequestsQuery.error = null;
    workspace.isDocumentDiscoveryPending = false;
    workspace.updatePartyNameMutation.error = null;
    workspace.cancelMaintenanceMutation.error = null;
    workspace.verificationMutation.data = undefined;
    workspace.verificationMutation.error = null;
    workspace.verificationMutation.isPending = false;
    workspace.clientTaskMutation.error = null;
    workspace.clientTaskMutation.isPending = false;
    vi.clearAllMocks();
  });

  test('opens a focused editor and returns to the person after refetch', async () => {
    const user = userEvent.setup();
    workspace.clientQuery.data = {
      ...approvedClient,
      parties: approvedClient.parties?.map((party) =>
        party.id === 'person-1'
          ? {
              ...party,
              email: 'jane@example.com',
              individualDetails: {
                ...party.individualDetails,
                birthDate: '1980-01-01',
                countryOfResidence: 'US',
                jobTitle: 'CEO',
                individualIds: [
                  { idType: 'SSN', value: '555110000', issuer: 'US' },
                ],
                addresses: [
                  {
                    addressType: 'RESIDENTIAL_ADDRESS',
                    addressLines: ['100 Main Street'],
                    city: 'New York',
                    state: 'NY',
                    postalCode: '10001',
                    country: 'US',
                  },
                ],
              },
            }
          : party
      ),
    };
    updatePartyName.mockImplementation(async () => {
      workspace.maintenanceQuery.data = {
        pages: [],
        parties: [createProposal('Diaz')],
      };
    });
    render(
      <ApprovedClientMaintenance
        clientId="client-1"
        eligibility={[
          {
            country: 'US',
            organizationType: 'LIMITED_LIABILITY_COMPANY',
            operations: ['MANAGE_PROFILE', 'MANAGE_INDIRECT_OWNERSHIP'],
          },
        ]}
      />
    );

    expect(screen.getAllByText('Marketplace Vendor LLC')).toHaveLength(2);
    expect(screen.getByText('Jane R Doe')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Jane R Doe/ }));
    expect(screen.getByText('Profile details')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Edit details' }));

    const lastName = screen.getByRole('textbox', { name: 'Last name' });
    await user.clear(lastName);
    await user.type(lastName, 'Diaz');
    expect(screen.getByText('Original value: Doe')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(updatePartyName).toHaveBeenCalledWith('person-1', {
      individualDetails: { lastName: 'Diaz' },
    });
    const pendingDetailHeading = await screen.findByRole('heading', {
      name: 'Pending changes',
    });
    expect(
      pendingDetailHeading.querySelector('.lucide-pencil-line')
    ).toBeInTheDocument();
    expect(pendingDetailHeading.closest('section')).toHaveClass(
      'eb-bg-informative-accent/40'
    );
    expect(screen.getByLabelText('Current value: Doe')).toBeInTheDocument();
    expect(screen.getByLabelText('Pending change: Diaz')).toBeInTheDocument();
    await user.click(
      screen.getByRole('button', { name: 'Add or edit changes' })
    );
    expect(
      screen.getByRole('button', { name: 'Cancel editing' })
    ).toBeInTheDocument();
  });

  test('opens a newly generated document request after the first draft save', async () => {
    const user = userEvent.setup();
    updatePartyName.mockImplementation(async () => {
      workspace.clientQuery.data = {
        ...approvedClient,
        parties: (approvedClient.parties ?? []).map((party) =>
          party.id === 'person-1'
            ? {
                ...party,
                validationResponse: [
                  {
                    validationStatus: 'NEEDS_INFO',
                    documentRequestIds: ['document-1'],
                  },
                ],
              }
            : party
        ),
      };
      workspace.maintenanceQuery.data = {
        pages: [],
        parties: [createProposal('Diaz')],
      };
      workspace.documentRequestsQuery.data = {
        documentRequests: [
          {
            id: 'document-1',
            partyId: 'person-1',
            status: 'ACTIVE',
            description: 'Provide a government-issued identity document.',
            requirements: [],
          },
        ],
      };
    });

    render(
      <ApprovedClientMaintenance clientId="client-1" eligibility={eligible} />
    );

    await user.click(screen.getByRole('button', { name: /Jane R Doe/ }));
    await user.click(screen.getByRole('button', { name: 'Edit details' }));
    const lastName = screen.getByRole('textbox', { name: 'Last name' });
    await user.clear(lastName);
    await user.type(lastName, 'Diaz');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(
      await screen.findByRole('heading', {
        name: 'Upload documents for Jane R Diaz',
      })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Profile details' })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Required documents/ })
    ).not.toBeInTheDocument();
  });

  test('sends only a changed birth date', async () => {
    const user = userEvent.setup();
    workspace.clientQuery.data = {
      ...approvedClient,
      parties: (approvedClient.parties ?? []).map((party) =>
        party.id === 'person-1'
          ? {
              ...party,
              individualDetails: {
                ...party.individualDetails,
                birthDate: '1975-03-12',
              },
            }
          : party
      ),
    };
    render(
      <ApprovedClientMaintenance clientId="client-1" eligibility={eligible} />
    );

    await user.click(screen.getByRole('button', { name: /Jane R Doe/ }));
    expect(screen.getByText('••••••••')).toBeInTheDocument();
    expect(screen.queryByText('1975-03-12')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Edit details' }));
    await fillImportantDate(user, '1976-04-13');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(updatePartyName).toHaveBeenCalledWith('person-1', {
      individualDetails: { birthDate: '1976-04-13' },
    });
  });

  test('edits supported individual profile fields in responsive sections', async () => {
    const user = userEvent.setup();
    workspace.clientQuery.data = {
      ...approvedClient,
      parties: (approvedClient.parties ?? []).map((party) =>
        party.id === 'person-1'
          ? {
              ...party,
              email: 'jane@example.com',
              individualDetails: {
                ...party.individualDetails,
                birthDate: '1975-03-12',
                countryOfResidence: 'US',
                jobTitle: 'CEO',
                addresses: [
                  {
                    addressType: 'RESIDENTIAL_ADDRESS',
                    addressLines: ['100 Main Street'],
                    city: 'New York',
                    state: 'NY',
                    postalCode: '10001',
                    country: 'US',
                  },
                ],
              },
            }
          : party
      ),
    };
    updatePartyName.mockResolvedValue(undefined);

    render(
      <ApprovedClientMaintenance clientId="client-1" eligibility={eligible} />
    );
    await user.click(screen.getByRole('button', { name: /Jane R Doe/ }));
    await user.click(screen.getByRole('button', { name: 'Edit details' }));

    expect(
      screen.getByRole('group', { name: 'Contact and address' })
    ).toHaveClass('@[48rem]:eb-grid-cols-[minmax(9rem,0.8fr)_minmax(0,2fr)]');
    expect(
      screen.getByRole('group', { name: 'Business responsibility' })
    ).toBeInTheDocument();

    const email = screen.getByLabelText('Email');
    await user.clear(email);
    await user.type(email, 'jane.doe@example.com');
    await user.click(screen.getByLabelText('Job title'));
    await user.click(screen.getByRole('option', { name: 'CFO' }));
    const city = screen.getByLabelText('City / Town');
    await user.clear(city);
    await user.type(city, 'Brooklyn');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(updatePartyName).toHaveBeenCalledWith('person-1', {
      email: 'jane.doe@example.com',
      individualDetails: {
        jobTitle: 'CFO',
        addresses: [
          {
            addressType: 'RESIDENTIAL_ADDRESS',
            addressLines: ['100 Main Street'],
            city: 'Brooklyn',
            state: 'NY',
            postalCode: '10001',
            country: 'US',
          },
        ],
      },
    });
  });

  test('explains that clearing an optional middle name is not supported', async () => {
    const user = userEvent.setup();
    workspace.clientQuery.data = {
      ...approvedClient,
      parties: (approvedClient.parties ?? []).map((party) =>
        party.id === 'person-1'
          ? {
              ...party,
              individualDetails: {
                ...party.individualDetails,
                birthDate: '1975-03-12',
                countryOfResidence: 'US',
                jobTitle: 'CEO',
              },
            }
          : party
      ),
    };
    updatePartyName.mockResolvedValue(undefined);
    render(
      <ApprovedClientMaintenance clientId="client-1" eligibility={eligible} />
    );

    await user.click(screen.getByRole('button', { name: /Jane R Doe/ }));
    await user.click(screen.getByRole('button', { name: 'Edit details' }));
    const middleName = screen.getByLabelText(/Middle name/);
    await user.clear(middleName);
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(updatePartyName).not.toHaveBeenCalled();
    expect(middleName).toHaveAttribute('aria-invalid', 'true');
    expect(
      screen.getByText(/Clearing Middle name is not yet supported by the API\./)
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Restore value' }));
    expect(middleName).toHaveValue('R');
    expect(middleName).toHaveAttribute('aria-invalid', 'false');
    expect(
      screen.queryByText(
        /Clearing Middle name is not yet supported by the API\./
      )
    ).not.toBeInTheDocument();
  });

  test('edits the client organization through a sparse organization block', async () => {
    const user = userEvent.setup();
    updateParty.mockResolvedValue(undefined);
    render(
      <ApprovedClientMaintenance
        clientId="client-1"
        eligibility={[
          {
            country: 'US',
            organizationType: 'LIMITED_LIABILITY_COMPANY',
            operations: ['MANAGE_PROFILE'],
          },
        ]}
      />
    );

    await user.click(
      screen.getByRole('button', { name: /Marketplace Vendor LLC/ })
    );
    await user.click(
      screen.getByRole('button', { name: 'Edit business details' })
    );
    const dbaName = screen.getByLabelText(/Doing business as/);
    await user.clear(dbaName);
    await user.type(dbaName, 'Marketplace Collective');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(updateParty).toHaveBeenCalledWith('organization-1', {
      organizationDetails: { dbaName: 'Marketplace Collective' },
    });
  });

  test('shows registration details an approved business cannot change as read-only', async () => {
    const user = userEvent.setup();
    render(
      <ApprovedClientMaintenance
        clientId="client-1"
        eligibility={[
          {
            country: 'US',
            organizationType: 'LIMITED_LIABILITY_COMPANY',
            operations: ['MANAGE_PROFILE'],
          },
        ]}
      />
    );

    await user.click(
      screen.getByRole('button', { name: /Marketplace Vendor LLC/ })
    );
    await user.click(
      screen.getByRole('button', { name: 'Edit business details' })
    );

    expect(screen.getAllByText('Contact support to change this.')).toHaveLength(
      3
    );
    expect(
      screen.queryByRole('textbox', { name: /Year of formation/ })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('textbox', { name: /Employer Identification Number/ })
    ).not.toBeInTheDocument();
  });

  test('shows identity details an approved person cannot change as read-only', async () => {
    const user = userEvent.setup();
    workspace.clientQuery.data = {
      ...approvedClient,
      parties: (approvedClient.parties ?? []).map((party) =>
        party.id === 'person-1'
          ? {
              ...party,
              individualDetails: {
                ...party.individualDetails,
                countryOfResidence: 'US',
                individualIds: [
                  { idType: 'SSN', value: '555110000', issuer: 'US' },
                ],
              },
            }
          : party
      ),
    };
    render(
      <ApprovedClientMaintenance clientId="client-1" eligibility={eligible} />
    );

    await user.click(screen.getByRole('button', { name: /Jane R Doe/ }));
    await user.click(screen.getByRole('button', { name: 'Edit details' }));

    expect(screen.getAllByText('Contact support to change this.')).toHaveLength(
      3
    );
    expect(
      screen.queryByRole('textbox', { name: /Suffix/ })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText(/Social security number \(SSN\)/i)
    ).not.toBeInTheDocument();
    expect(screen.getByText('••••0000')).toBeInTheDocument();
    expect(screen.queryByText('555110000')).not.toBeInTheDocument();
  });

  test('explains that clearing an optional DBA is not supported', async () => {
    const user = userEvent.setup();
    updateParty.mockResolvedValue(undefined);
    render(
      <ApprovedClientMaintenance
        clientId="client-1"
        eligibility={[
          {
            country: 'US',
            organizationType: 'LIMITED_LIABILITY_COMPANY',
            operations: ['MANAGE_PROFILE'],
          },
        ]}
      />
    );

    await user.click(
      screen.getByRole('button', { name: /Marketplace Vendor LLC/ })
    );
    await user.click(
      screen.getByRole('button', { name: 'Edit business details' })
    );
    const dbaName = screen.getByLabelText(/Doing business as/);
    await user.clear(dbaName);
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(updateParty).not.toHaveBeenCalled();
    expect(dbaName).toHaveAttribute('aria-invalid', 'true');
    expect(
      screen.getByText(
        /Clearing Doing business as \(DBA name\) is not yet supported by the API\./
      )
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Restore value' }));
    expect(dbaName).toHaveValue('Marketplace Vendor');
    expect(dbaName).toHaveAttribute('aria-invalid', 'false');
  });

  test('highlights and restores an unsupported optional address-line clear', async () => {
    const user = userEvent.setup();
    workspace.clientQuery.data = {
      ...approvedClient,
      parties: (approvedClient.parties ?? []).map((party) =>
        party.id === 'organization-1'
          ? {
              ...party,
              organizationDetails: {
                ...party.organizationDetails,
                addresses: [
                  {
                    ...party.organizationDetails?.addresses?.[0],
                    addressType: 'BUSINESS_ADDRESS',
                    addressLines: ['100 Market Street', 'Suite 200'],
                  },
                ],
              },
            }
          : party
      ),
    };

    render(
      <ApprovedClientMaintenance
        clientId="client-1"
        eligibility={[
          {
            country: 'US',
            organizationType: 'LIMITED_LIABILITY_COMPANY',
            operations: ['MANAGE_PROFILE'],
          },
        ]}
      />
    );

    await user.click(
      screen.getByRole('button', { name: /Marketplace Vendor LLC/ })
    );
    await user.click(
      screen.getByRole('button', { name: 'Edit business details' })
    );
    const addressLine2 = screen.getByLabelText(/Address line 2/);
    await user.clear(addressLine2);
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(updateParty).not.toHaveBeenCalled();
    expect(addressLine2).toHaveAttribute('aria-invalid', 'true');
    expect(
      screen.getByText(
        /Clearing Address line 2 is not yet supported by the API\./
      )
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Restore value' }));
    expect(addressLine2).toHaveValue('Suite 200');
    expect(addressLine2).toHaveAttribute('aria-invalid', 'false');
  });

  test('shows a view-only profile when no exact eligibility rule is configured', async () => {
    const user = userEvent.setup();
    render(<ApprovedClientMaintenance clientId="client-1" eligibility={[]} />);

    await user.click(screen.getByRole('button', { name: /Jane R Doe/ }));
    expect(
      screen.queryByRole('button', { name: 'Edit details' })
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/not configured/)).not.toBeInTheDocument();
  });

  test('has no ownership structure for a sole proprietorship', async () => {
    const user = userEvent.setup();
    workspace.clientQuery.data = {
      ...approvedClient,
      parties: approvedClient.parties?.map((party) =>
        party.id === 'organization-1'
          ? {
              ...party,
              organizationDetails: {
                ...party.organizationDetails,
                organizationType: 'SOLE_PROPRIETORSHIP',
              },
            }
          : party
      ),
    };
    render(
      <ApprovedClientMaintenance
        clientId="client-1"
        eligibility={[
          {
            country: 'US',
            organizationType: 'SOLE_PROPRIETORSHIP',
            operations: ['MANAGE_PROFILE', 'MANAGE_INDIRECT_OWNERSHIP'],
          },
        ]}
      />
    );

    expect(
      screen.queryByRole('button', { name: 'View ownership structure' })
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Jane R Doe/ }));
    expect(screen.getByRole('button', { name: 'Edit details' })).toBeEnabled();
    expect(
      screen.queryByRole('button', { name: 'Add beneficial owner role' })
    ).not.toBeInTheDocument();
  });

  test('blocks submission with a contact-support message when the API requires a missing role', async () => {
    const user = userEvent.setup();
    workspace.clientQuery.data = {
      ...approvedClient,
      outstanding: { partyRoles: ['CONTROLLER'] },
    };
    workspace.maintenanceQuery.data = {
      pages: [],
      parties: [createProposal('Diaz')],
    };
    render(
      <ApprovedClientMaintenance clientId="client-1" eligibility={eligible} />
    );

    await user.click(screen.getByRole('button', { name: 'Review and submit' }));
    expect(
      screen.getByText(
        'This profile is missing a required role, such as a controller. Contact support to submit these changes.'
      )
    ).toBeInTheDocument();
  });

  test('keeps the request ID in details but hides it from the profile overview', async () => {
    const user = userEvent.setup();
    workspace.maintenanceQuery.data = {
      pages: [],
      parties: [createProposal('Diaz')],
    };

    render(
      <ApprovedClientMaintenance clientId="client-1" eligibility={eligible} />
    );

    expect(screen.getByText('Business profile')).toBeInTheDocument();
    expect(screen.queryByText('Request ID: request-1')).not.toBeInTheDocument();
    const pendingSummaryHeading = screen.getByRole('heading', {
      name: 'Draft maintenance request',
    });
    const pendingSummary = pendingSummaryHeading.closest('section');
    expect(pendingSummary).toHaveClass(
      'eb-border-informative/50',
      'eb-bg-informative-accent'
    );
    expect(
      pendingSummary?.querySelector('.lucide-pencil-line')
    ).toBeInTheDocument();
    const draftPartyRow = screen.getByRole('button', { name: /Jane R Diaz/ });
    expect(
      draftPartyRow.querySelector('.lucide-pencil-line')
    ).toBeInTheDocument();
    expect(screen.queryByText('Previously Jane R Doe')).not.toBeInTheDocument();
    expect(screen.queryByText(/field changed/)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Review and submit' }));
    expect(screen.getByText('Request ID: request-1')).toBeInTheDocument();
  });

  test('locks editing and cancellation while the active request is in review', async () => {
    const user = userEvent.setup();
    workspace.maintenanceQuery.data = {
      pages: [],
      parties: [createProposal('Diaz', 'REVIEW_IN_PROGRESS')],
    };

    render(
      <ApprovedClientMaintenance clientId="client-1" eligibility={eligible} />
    );

    expect(
      screen.getByText('Maintenance request submitted')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Maintenance request submitted').closest('section')
    ).toHaveClass('eb-bg-informative-accent');
    expect(
      screen.queryByRole('button', { name: 'Discard all changes' })
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Jane R Diaz/ }));
    expect(
      screen.queryByRole('button', { name: 'Edit details' })
    ).not.toBeInTheDocument();
    expect(screen.queryByText('Discard changes')).not.toBeInTheDocument();
  });

  test('keeps save disabled until a name field actually changes', async () => {
    const user = userEvent.setup();
    render(
      <ApprovedClientMaintenance clientId="client-1" eligibility={eligible} />
    );

    await user.click(screen.getByRole('button', { name: /Jane R Doe/ }));
    await user.click(screen.getByRole('button', { name: 'Edit details' }));

    expect(screen.getByRole('button', { name: 'Save changes' })).toBeDisabled();

    await user.type(screen.getByRole('textbox', { name: 'Last name' }), 'ndez');

    expect(screen.getByRole('button', { name: 'Save changes' })).toBeEnabled();
  });

  test('renders API context for maintenance failures', () => {
    workspace.maintenanceQuery.isError = true;
    workspace.maintenanceQuery.error = {
      message: 'Request failed with status code 500',
      response: {
        data: {
          title: 'Internal Server Error',
          httpStatus: 500,
          message: 'Error details not available',
          context: [
            {
              message: 'Maintenance service is temporarily unavailable',
            },
          ],
        },
      },
    };

    render(
      <ApprovedClientMaintenance clientId="client-1" eligibility={eligible} />
    );

    expect(screen.getByText('Internal Server Error')).toBeInTheDocument();
    expect(
      screen.getByText('Maintenance service is temporarily unavailable')
    ).toBeInTheDocument();
    expect(
      screen.queryByText("We couldn't load the complete business profile")
    ).not.toBeInTheDocument();
  });

  test('confirms submitted input without showing a false retry warning', async () => {
    const user = userEvent.setup();
    updatePartyName.mockResolvedValue(undefined);
    render(
      <ApprovedClientMaintenance clientId="client-1" eligibility={eligible} />
    );

    await user.click(screen.getByRole('button', { name: /Jane R Doe/ }));
    await user.click(screen.getByRole('button', { name: 'Edit details' }));
    const lastName = screen.getByRole('textbox', { name: 'Last name' });
    await user.clear(lastName);
    await user.type(lastName, 'Diaz');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(
      await screen.findByText('Confirming your changes…')
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Retry' })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Profile details' })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('textbox', { name: 'Last name' })
    ).not.toBeInTheDocument();
  });

  test('renders multiple party proposals together as pending changes', () => {
    workspace.clientQuery.data = {
      ...approvedClient,
      parties: [
        ...(approvedClient.parties ?? []),
        {
          id: 'person-2',
          partyType: 'INDIVIDUAL',
          roles: ['BENEFICIAL_OWNER'],
          individualDetails: { firstName: 'Alex', lastName: 'Smith' },
        },
      ],
    };
    workspace.maintenanceQuery.data = {
      pages: [],
      parties: [
        createProposal('Diaz'),
        {
          id: 'person-2',
          individualDetails: { firstName: 'Alexander', lastName: 'Smith' },
          updateRequest: {
            status: 'NEW',
            action: 'MODIFY',
            requestId: 'request-1',
            submittedAt: '2026-08-26T12:01:00.000Z',
          },
        },
      ],
    };

    render(
      <ApprovedClientMaintenance clientId="client-1" eligibility={eligible} />
    );

    expect(screen.queryByText('Request ID: request-1')).not.toBeInTheDocument();
    expect(screen.getByText('Jane R Diaz')).toBeInTheDocument();
    expect(screen.getByText('Alexander Smith')).toBeInTheDocument();
    expect(screen.queryByText(/parties changed/)).not.toBeInTheDocument();
  });

  test('shows a document requirement only on its owning person', async () => {
    const user = userEvent.setup();
    workspace.clientQuery.data = {
      ...approvedClient,
      updateRequest: { status: 'NEW', requestId: 'request-1' },
      parties: (approvedClient.parties ?? []).map((party) =>
        party.id === 'person-1'
          ? {
              ...party,
              validationResponse: [
                {
                  validationStatus: 'NEEDS_INFO',
                  documentRequestIds: ['document-1'],
                },
              ],
            }
          : party
      ),
    };
    workspace.documentRequestsQuery.data = {
      documentRequests: [
        {
          id: 'document-1',
          partyId: 'person-1',
          status: 'ACTIVE',
          description:
            'Provide a government-issued document showing the full legal name, date of birth, photograph, and all identifying information for this person.',
          requirements: [],
        },
      ],
    };
    workspace.maintenanceQuery.data = {
      pages: [],
      parties: [createProposal('Diaz')],
    };

    render(
      <ApprovedClientMaintenance clientId="client-1" eligibility={eligible} />
    );

    expect(
      screen.getByText('Maintenance request needs attention')
    ).toBeInTheDocument();
    expect(screen.getByText('Action required')).toBeInTheDocument();
    expect(screen.queryByText('Upload documents')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Documents' })
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Jane R Diaz/ }));
    const draftUpdates = screen.getByRole('heading', {
      name: 'Pending changes',
    });
    const requestWorkSection = draftUpdates.closest('section');
    const changeTable = screen
      .getByLabelText('Current value: Doe')
      .closest('.eb-rounded-md');
    const documentAction = screen.getByRole('button', {
      name: /Required documents/,
    });
    const documentContainer = documentAction.closest('.eb-rounded-md');
    expect(requestWorkSection).toContainElement(documentAction);
    expect(changeTable).toHaveClass('eb-rounded-md', 'eb-border');
    expect(documentContainer).toHaveClass(
      'eb-rounded-md',
      'eb-border',
      'eb-border-warning/50'
    );
    expect(changeTable?.nextElementSibling).toHaveClass('eb-mt-3');
    expect(changeTable?.nextElementSibling).not.toHaveClass('eb-border-t');
    const profileDetails = screen.getByRole('heading', {
      name: 'Profile details',
    });
    expect(
      requestWorkSection?.compareDocumentPosition(
        profileDetails.closest('section')!
      ) ?? 0
    ).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(profileDetails).toHaveClass('eb-uppercase', 'eb-tracking-wider');
    expect(screen.getByText('Required documents')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Continue/ })
    ).toBeInTheDocument();
  });

  test('waits for newly published document requests without showing a load failure', async () => {
    const user = userEvent.setup();
    workspace.clientQuery.data = {
      ...approvedClient,
      parties: (approvedClient.parties ?? []).map((party) =>
        party.id === 'person-1'
          ? {
              ...party,
              validationResponse: [
                {
                  validationStatus: 'NEEDS_INFO',
                  documentRequestIds: ['document-1'],
                },
              ],
            }
          : party
      ),
    };
    workspace.isDocumentDiscoveryPending = true;

    render(
      <ApprovedClientMaintenance clientId="client-1" eligibility={eligible} />
    );

    expect(screen.getByText('Preparing documents')).toBeInTheDocument();
    expect(screen.queryByText(/could not be loaded/i)).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Jane R Doe/ }));
    expect(screen.queryByText(/could not be loaded/i)).not.toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Required documents' })
    ).toBeInTheDocument();
  });

  test('shows the action-required warning icon on the business row', () => {
    workspace.clientQuery.data = {
      ...approvedClient,
      parties: (approvedClient.parties ?? []).map((party) =>
        party.id === 'organization-1'
          ? {
              ...party,
              validationResponse: [
                {
                  validationStatus: 'NEEDS_INFO',
                  documentRequestIds: ['business-document-1'],
                },
              ],
            }
          : party
      ),
    };
    workspace.documentRequestsQuery.data = {
      documentRequests: [
        {
          id: 'business-document-1',
          partyId: 'organization-1',
          status: 'ACTIVE',
          requirements: [],
        },
      ],
    };

    render(
      <ApprovedClientMaintenance clientId="client-1" eligibility={eligible} />
    );

    const businessRow = screen.getByRole('button', {
      name: /Marketplace Vendor LLC.*Action required/,
    });
    expect(businessRow.querySelector('.lucide-triangle-alert')).not.toBeNull();
  });

  test('renders a terminated request as the default client profile', () => {
    workspace.clientQuery.data = {
      ...approvedClient,
      updateRequest: {
        status: 'TERMINATED',
        requestId: 'request-1',
      },
    };
    workspace.maintenanceQuery.data = {
      pages: [],
      parties: [
        {
          ...createProposal('Diaz'),
          updateRequest: {
            status: 'TERMINATED',
            action: 'MODIFY',
            requestId: 'request-1',
            submittedAt: '2026-08-26T12:00:00.000Z',
          },
        },
      ],
    };

    render(
      <ApprovedClientMaintenance clientId="client-1" eligibility={eligible} />
    );

    expect(screen.getByText('Business profile')).toBeInTheDocument();
    expect(screen.queryByText('Cancelled')).not.toBeInTheDocument();
    expect(screen.queryByText(/Request ID:/)).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Discard all changes' })
    ).not.toBeInTheDocument();
  });

  test('cancels one person from their focused view', async () => {
    const user = userEvent.setup();
    workspace.maintenanceQuery.data = {
      pages: [],
      parties: [createProposal('Diaz')],
    };
    cancelChanges.mockResolvedValue(undefined);

    render(
      <ApprovedClientMaintenance clientId="client-1" eligibility={eligible} />
    );

    await user.click(screen.getByRole('button', { name: /Jane R Diaz/ }));
    const draftSection = screen
      .getByRole('heading', { name: 'Pending changes' })
      .closest('section');
    expect(draftSection).not.toBeNull();
    const profileSection = screen
      .getByRole('heading', { name: 'Profile details' })
      .closest('section');
    expect(draftSection?.compareDocumentPosition(profileSection!) ?? 0).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING
    );
    const editChanges = within(draftSection!).getByRole('button', {
      name: 'Add or edit changes',
    });
    const discardChanges = within(draftSection!).getByRole('button', {
      name: 'Discard changes',
    });
    const comparisonGroup = screen
      .getByLabelText('Current value: Doe')
      .closest('.eb-rounded-md');
    const viewFullMaintenanceRequest = within(draftSection!).getByRole(
      'button',
      {
        name: 'View maintenance request',
      }
    );
    expect(comparisonGroup).not.toContainElement(viewFullMaintenanceRequest);
    expect(draftSection).toContainElement(viewFullMaintenanceRequest);
    expect(viewFullMaintenanceRequest.parentElement).toHaveClass('eb-mt-3');
    expect(
      within(draftSection!).getByText(
        'Saved as a pending change. You can keep correcting this information or discard it before you submit.'
      )
    ).toBeInTheDocument();
    expect(comparisonGroup).not.toContainElement(editChanges);
    expect(comparisonGroup).not.toContainElement(discardChanges);
    expect(discardChanges).toHaveClass(
      'eb-border-destructive/50',
      'eb-text-destructive'
    );
    expect(
      screen.queryByRole('button', { name: 'More actions' })
    ).not.toBeInTheDocument();
    await user.click(discardChanges);
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Discard changes' }));

    expect(cancelChanges).toHaveBeenCalledWith('request-1', 'person-1');
    // Jane stays on the profile, so her page stays open.
    expect(
      screen.getByRole('heading', { name: 'Profile details' })
    ).toBeInTheDocument();
  });

  test('discards the maintenance request from the review page', async () => {
    const user = userEvent.setup();
    workspace.maintenanceQuery.data = {
      pages: [],
      parties: [createProposal('Diaz')],
    };
    cancelChanges.mockResolvedValue(undefined);

    render(
      <ApprovedClientMaintenance clientId="client-1" eligibility={eligible} />
    );

    expect(
      screen.queryByRole('button', { name: 'Discard all changes' })
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Review and submit' }));
    const discardAll = screen.getByRole('button', {
      name: 'Discard all changes',
    });
    const requestNavigation = discardAll.closest('nav');
    expect(requestNavigation).not.toBeNull();
    expect(
      within(requestNavigation!).getByRole('button', {
        name: 'Back to business profile',
      })
    ).toBeInTheDocument();
    await user.click(discardAll);
    const dialog = screen.getByRole('alertdialog');
    expect(
      within(dialog).getByRole('heading', {
        name: 'Discard this maintenance request?',
      })
    ).toBeInTheDocument();
    // The list mirrors the review: what kind of change, to whom, and which fields.
    expect(
      dialog.querySelector('[data-discard-group="updated"]')
    ).toHaveTextContent(/Updated\s*1.*Jane R Diaz.*Last name/);
    expect(dialog).not.toHaveTextContent(/document|Affected people/i);
    await user.click(
      within(dialog).getByRole('button', { name: 'Discard all changes' })
    );

    expect(cancelChanges).toHaveBeenCalledWith('request-1', undefined);
  });

  test('falls back to products when productDetails is present but empty', () => {
    workspace.clientQuery.data = {
      ...approvedClient,
      products: ['EMBEDDED_PAYMENTS'],
      productDetails: [],
    };

    render(
      <ApprovedClientMaintenance clientId="client-1" eligibility={eligible} />
    );

    expect(screen.getByText('Embedded Payments')).toBeInTheDocument();
    expect(screen.getByText('Limited DDA')).toBeInTheDocument();
    expect(
      screen.queryByText('No product details available')
    ).not.toBeInTheDocument();
  });

  test('treats a missing Embedded Payments sub-product as Limited DDA', () => {
    workspace.clientQuery.data = {
      ...approvedClient,
      outstanding: { documentRequestIds: ['combined-document-1'] },
      productDetails: [
        {
          product: 'EMBEDDED_PAYMENTS',
          onboardingStatus: 'APPROVED',
        },
      ],
    };
    workspace.documentRequestsQuery.data = {
      documentRequests: [
        {
          id: 'combined-document-1',
          status: 'ACTIVE',
          description: 'Provide combined update documentation.',
          requirements: [],
        },
      ],
    };

    render(
      <ApprovedClientMaintenance
        clientId="client-1"
        initialProductVerificationAcceptedAt="2020-01-01T00:00:00.000Z"
        eligibility={[
          {
            country: 'US',
            organizationType: 'LIMITED_LIABILITY_COMPANY',
            operations: ['ADD_LIMITED_DDA_PAYMENTS'],
          },
        ]}
      />
    );

    expect(screen.getByText('Limited DDA')).toBeInTheDocument();
    const addPayments = screen.getByRole('button', {
      name: 'Add Limited DDA Payments',
    });
    expect(addPayments).toBeEnabled();
    const availableNode = addPayments.closest('li');
    expect(availableNode).toHaveAttribute('data-presentation', 'action-only');
    expect(
      within(availableNode!).queryByText('Limited DDA Payments')
    ).not.toBeInTheDocument();
    expect(availableNode!.querySelector('.lucide-boxes')).toBeNull();
    expect(
      screen.queryByRole('button', { name: 'Add Limited DDA' })
    ).not.toBeInTheDocument();
  });

  test('groups a pending sub-product under Embedded Payments and resumes its upgrade', async () => {
    const user = userEvent.setup();
    workspace.clientQuery.data = {
      ...approvedClient,
      outstanding: { documentRequestIds: ['product-document-1'] },
      productDetails: [
        {
          subProduct: 'LIMITED_DDA_PAYMENTS',
          onboardingStatus: 'NEW',
        },
      ],
    };

    render(
      <ApprovedClientMaintenance
        clientId="client-1"
        eligibility={[
          {
            country: 'US',
            organizationType: 'LIMITED_LIABILITY_COMPANY',
            operations: ['ADD_LIMITED_DDA_PAYMENTS'],
          },
        ]}
      />
    );

    const productFamily = screen
      .getByRole('heading', { name: 'Embedded Payments', level: 4 })
      .closest<HTMLElement>('[data-product-family]');
    expect(productFamily).not.toBeNull();
    const productIcon = productFamily!.querySelector('.lucide-package');
    expect(productIcon).not.toBeNull();
    expect(productIcon?.parentElement).not.toHaveClass('eb-bg-primary');
    expect(productFamily).toHaveAttribute('data-product-tree');
    expect(productFamily).not.toHaveClass('eb-border', 'eb-rounded-md');
    expect(within(productFamily!).getByText('Limited DDA')).toBeInTheDocument();
    expect(
      within(productFamily!).queryByText('Active')
    ).not.toBeInTheDocument();
    const pendingSubProduct = within(productFamily!)
      .getByText('Limited DDA Payments')
      .closest('li');
    expect(pendingSubProduct).toHaveAttribute(
      'data-sub-product',
      'limited-dda-payments'
    );
    expect(pendingSubProduct).not.toHaveClass('eb-bg-informative-accent/30');
    expect(pendingSubProduct).not.toHaveClass('eb-border');
    expect(pendingSubProduct).toHaveAttribute('data-last-sub-product', 'true');
    expect(
      within(pendingSubProduct!).getByText('Sub-product pending addition')
    ).toBeInTheDocument();
    expect(
      within(pendingSubProduct!).queryByText('Pending')
    ).not.toBeInTheDocument();
    expect(
      pendingSubProduct!.querySelector('[data-product-state-icon="pending"]')
    ).not.toBeNull();
    expect(
      pendingSubProduct!.querySelector('.lucide-package-plus')
    ).not.toBeNull();
    expect(pendingSubProduct!.querySelector('.lucide-clock-3')).toBeNull();
    expect(pendingSubProduct!.querySelector('.lucide-boxes')).toBeNull();
    expect(
      screen.getByRole('heading', { name: 'Product upgrade needs attention' })
    ).toBeInTheDocument();
    expect(
      within(productFamily!).queryByRole('button', {
        name: 'Continue upgrade',
      })
    ).not.toBeInTheDocument();
    const completeProductRequirements = screen.getByRole('button', {
      name: 'Complete requirements',
    });
    expect(
      completeProductRequirements.querySelector('.lucide-arrow-right')
    ).toBeInTheDocument();
    expect(
      completeProductRequirements.querySelector('.lucide-clipboard-list')
    ).not.toBeInTheDocument();
    await user.click(completeProductRequirements);
    expect(
      screen.getByRole('heading', { name: 'Review your changes' })
    ).toBeInTheDocument();
    expect(addProduct).not.toHaveBeenCalled();
  });

  test('shows the shared review banner for a product-only update without requirements', async () => {
    const user = userEvent.setup();
    workspace.clientQuery.data = {
      ...approvedClient,
      productDetails: [
        {
          subProduct: 'LIMITED_DDA_PAYMENTS',
          onboardingStatus: 'NEW',
        },
      ],
    };

    render(
      <ApprovedClientMaintenance clientId="client-1" eligibility={eligible} />
    );

    expect(
      screen.getByRole('heading', { name: 'Product upgrade ready to review' })
    ).toBeInTheDocument();
    const reviewAndSubmit = screen.getByRole('button', {
      name: 'Review and submit',
    });
    expect(
      reviewAndSubmit.querySelector('.lucide-arrow-right')
    ).toBeInTheDocument();
    expect(
      reviewAndSubmit.querySelector('.lucide-send')
    ).not.toBeInTheDocument();
    await user.click(reviewAndSubmit);
    expect(
      screen.getByRole('heading', { name: 'Review your changes' })
    ).toBeInTheDocument();
  });

  test('shows a product upgrade banner beside terminated maintenance history', () => {
    workspace.clientQuery.data = {
      ...approvedClient,
      updateRequest: {
        status: 'TERMINATED',
        requestId: 'terminated-request',
      },
      parties: (approvedClient.parties ?? []).map((party) =>
        party.id === 'person-1'
          ? {
              ...party,
              updateRequest: {
                status: 'TERMINATED',
                action: 'MODIFY',
                requestId: 'terminated-request',
                submittedAt: '2026-09-10T14:04:00.492Z',
              },
            }
          : party
      ),
      productDetails: [
        {
          product: 'EMBEDDED_PAYMENTS',
          subProduct: 'LIMITED_DDA',
          onboardingStatus: 'APPROVED',
        },
        {
          product: 'EMBEDDED_PAYMENTS',
          subProduct: 'LIMITED_DDA_PAYMENTS',
          onboardingStatus: 'NEW',
        },
      ],
    };
    workspace.maintenanceQuery.data = {
      pages: [],
      parties: [
        {
          id: 'person-1',
          updateRequest: {
            status: 'TERMINATED',
            action: 'MODIFY',
            requestId: 'terminated-request',
            submittedAt: '2026-09-10T14:04:00.492Z',
          },
        },
      ],
    };

    render(
      <ApprovedClientMaintenance clientId="client-1" eligibility={eligible} />
    );

    expect(
      screen.getByRole('heading', { name: 'Product upgrade ready to review' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Review and submit' })
    ).toBeEnabled();
    expect(screen.queryByText('Cancelled')).not.toBeInTheDocument();
  });

  test('presents product and party changes as one combined update banner', async () => {
    const user = userEvent.setup();
    workspace.clientQuery.data = {
      ...approvedClient,
      outstanding: { documentRequestIds: ['combined-document-1'] },
      productDetails: [
        {
          product: 'EMBEDDED_PAYMENTS',
          subProduct: 'LIMITED_DDA_PAYMENTS',
          action: 'ADD',
          onboardingStatus: 'NEW',
        },
      ],
    };
    workspace.documentRequestsQuery.data = {
      documentRequests: [
        {
          id: 'combined-document-1',
          status: 'ACTIVE',
          description: 'Provide combined update documentation.',
          requirements: [],
        },
      ],
    };
    workspace.maintenanceQuery.data = {
      pages: [],
      parties: [createProposal('Diaz')],
    };

    render(
      <ApprovedClientMaintenance clientId="client-1" eligibility={eligible} />
    );

    expect(
      screen.getByRole('heading', {
        name: 'Product upgrade and maintenance request need attention',
      })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Complete the requirements before submitting the product upgrade and profile changes.'
      )
    ).toBeInTheDocument();
    const completeRequirements = screen.getByRole('button', {
      name: 'Complete requirements',
    });
    expect(
      completeRequirements.querySelector('.lucide-arrow-right')
    ).toBeInTheDocument();
    expect(
      completeRequirements.querySelector('.lucide-clipboard-list')
    ).not.toBeInTheDocument();
    await user.click(completeRequirements);
    expect(
      screen.getByText(
        'Check the product upgrade and profile changes. They are submitted for review together.'
      )
    ).toBeInTheDocument();
    expect(screen.queryByText('Product addition')).not.toBeInTheDocument();
    const productSection = screen
      .getByRole('heading', { name: 'Product upgrade' })
      .closest('section')!;
    const productRow = productSection.querySelector(
      '[data-review-change="product-LIMITED_DDA_PAYMENTS"]'
    );
    expect(productRow).toHaveTextContent(
      /Limited DDA Payments.*Sub-product of Embedded Payments/
    );
    expect(
      productRow?.querySelector('[data-party-status="pendingAddition"]')
    ).toHaveTextContent('Pending addition');
    expect(
      document.querySelector(
        '[data-review-group] [data-review-change^="product"]'
      )
    ).toBeNull();
    expect(screen.getByText('Diaz')).toBeInTheDocument();
  });

  test('cancels a pending product addition separately from maintenance changes', async () => {
    const user = userEvent.setup();
    workspace.clientQuery.data = {
      ...approvedClient,
      productDetails: [
        {
          product: 'EMBEDDED_PAYMENTS',
          subProduct: 'LIMITED_DDA_PAYMENTS',
          action: 'ADD',
          onboardingStatus: 'NEW',
        },
      ],
    };
    cancelProductAddition.mockResolvedValue(undefined);

    render(
      <ApprovedClientMaintenance clientId="client-1" eligibility={eligible} />
    );
    const pendingProduct = screen
      .getByText('Limited DDA Payments')
      .closest('li');
    const cancelProduct = within(pendingProduct!).getByRole('button', {
      name: 'Cancel product addition',
    });
    await user.click(cancelProduct);

    const dialog = screen.getByRole('alertdialog');
    expect(dialog).toHaveTextContent(
      'Limited DDA Payments will be removed from your pending changes.'
    );
    await user.click(
      within(dialog).getByRole('button', {
        name: 'Cancel product addition',
      })
    );

    expect(cancelProductAddition).toHaveBeenCalledTimes(1);
    expect(cancelChanges).not.toHaveBeenCalled();
  });

  test('preserves party maintenance when canceling a product from combined updates', async () => {
    const user = userEvent.setup();
    workspace.clientQuery.data = {
      ...approvedClient,
      productDetails: [
        {
          product: 'EMBEDDED_PAYMENTS',
          subProduct: 'LIMITED_DDA_PAYMENTS',
          action: 'ADD',
          onboardingStatus: 'NEW',
        },
      ],
    };
    workspace.maintenanceQuery.data = {
      pages: [],
      parties: [createProposal('Diaz')],
    };
    cancelProductAddition.mockResolvedValue(undefined);

    render(
      <ApprovedClientMaintenance clientId="client-1" eligibility={eligible} />
    );
    const pendingProduct = screen
      .getByText('Limited DDA Payments')
      .closest('li');
    await user.click(
      within(pendingProduct!).getByRole('button', {
        name: 'Cancel product addition',
      })
    );

    expect(screen.getByRole('alertdialog')).toHaveTextContent(
      'Your business and related-party changes stay pending.'
    );
  });

  test('offers product and maintenance cancellation separately in combined review', async () => {
    const user = userEvent.setup();
    workspace.clientQuery.data = {
      ...approvedClient,
      productDetails: [
        {
          product: 'EMBEDDED_PAYMENTS',
          subProduct: 'LIMITED_DDA_PAYMENTS',
          action: 'ADD',
          onboardingStatus: 'NEW',
        },
      ],
    };
    workspace.maintenanceQuery.data = {
      pages: [],
      parties: [createProposal('Diaz')],
    };

    render(
      <ApprovedClientMaintenance clientId="client-1" eligibility={eligible} />
    );
    await user.click(screen.getByRole('button', { name: 'Review and submit' }));

    await user.click(
      screen.getByRole('button', { name: 'Actions for Limited DDA Payments' })
    );
    expect(
      screen.getByRole('menuitem', { name: /^Cancel product addition/ })
    ).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(
      screen.getByRole('button', { name: 'Discard all changes' })
    ).toBeInTheDocument();
  });

  test('does not offer product cancellation after submission starts', () => {
    workspace.clientQuery.data = {
      ...approvedClient,
      productDetails: [
        {
          product: 'EMBEDDED_PAYMENTS',
          subProduct: 'LIMITED_DDA_PAYMENTS',
          action: 'ADD',
          onboardingStatus: 'REVIEW_IN_PROGRESS',
        },
      ],
    };

    render(
      <ApprovedClientMaintenance clientId="client-1" eligibility={eligible} />
    );

    expect(
      screen.queryByRole('button', { name: 'Cancel product addition' })
    ).not.toBeInTheDocument();
  });

  test('keeps approved status quiet and delegates a missing Limited DDA prerequisite to the host', async () => {
    const user = userEvent.setup();
    const onRequestLimitedDda = vi.fn();
    workspace.clientQuery.data = {
      ...approvedClient,
      products: [],
      productDetails: [],
    };

    render(
      <ApprovedClientMaintenance
        clientId="client-1"
        eligibility={eligible}
        onRequestLimitedDda={onRequestLimitedDda}
      />
    );

    expect(screen.queryByText(/Client status:/)).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Add Limited DDA' }));
    expect(onRequestLimitedDda).toHaveBeenCalledTimes(1);
  });

  test('shows helpful client status guidance only when the client is not approved', () => {
    workspace.clientQuery.data = {
      ...approvedClient,
      status: 'INFORMATION_REQUESTED',
    };

    render(
      <ApprovedClientMaintenance clientId="client-1" eligibility={eligible} />
    );

    expect(
      screen.getByRole('heading', {
        name: 'The client profile needs more information',
      })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Complete the requested items so review of your submitted changes can continue.'
      )
    ).toBeInTheDocument();
  });

  test('disables the Limited DDA host action while it is in flight', async () => {
    const user = userEvent.setup();
    let finishRequest: (() => void) | undefined;
    const onRequestLimitedDda = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finishRequest = resolve;
        })
    );
    workspace.clientQuery.data = {
      ...approvedClient,
      products: [],
      productDetails: [],
    };
    render(
      <ApprovedClientMaintenance
        clientId="client-1"
        eligibility={eligible}
        onRequestLimitedDda={onRequestLimitedDda}
      />
    );

    const addLimitedDda = screen.getByRole('button', {
      name: 'Add Limited DDA',
    });
    await user.click(addLimitedDda);
    expect(addLimitedDda).toBeDisabled();
    expect(onRequestLimitedDda).toHaveBeenCalledTimes(1);
    finishRequest?.();
  });

  test('adds Limited DDA Payments for an eligible approved Limited DDA client', async () => {
    const user = userEvent.setup();
    workspace.clientQuery.data = {
      ...approvedClient,
      productDetails: [
        {
          product: 'EMBEDDED_PAYMENTS',
          subProduct: 'LIMITED_DDA',
          onboardingStatus: 'APPROVED',
        },
      ],
    };
    addProduct.mockImplementation(async () => {
      workspace.clientQuery.data = {
        ...workspace.clientQuery.data,
        outstanding: { documentRequestIds: ['product-document-1'] },
        productDetails: [
          {
            product: 'EMBEDDED_PAYMENTS',
            subProduct: 'LIMITED_DDA',
            onboardingStatus: 'APPROVED',
          },
          {
            product: 'EMBEDDED_PAYMENTS',
            subProduct: 'LIMITED_DDA_PAYMENTS',
            action: 'ADD',
            onboardingStatus: 'NEW',
          },
        ],
      };
      workspace.documentRequestsQuery.data = {
        documentRequests: [
          {
            id: 'product-document-1',
            status: 'ACTIVE',
            description: 'Provide the required product upgrade document.',
            requirements: [],
          },
        ],
      };
    });

    render(
      <ApprovedClientMaintenance
        clientId="client-1"
        initialProductVerificationAcceptedAt="2020-01-01T00:00:00.000Z"
        eligibility={[
          {
            country: 'US',
            organizationType: 'LIMITED_LIABILITY_COMPANY',
            operations: [
              'ADD_LIMITED_DDA_PAYMENTS',
              'MANAGE_PROFILE',
              'MANAGE_INDIRECT_OWNERSHIP',
            ],
          },
        ]}
      />
    );

    const addProductButton = screen.getByRole('button', {
      name: 'Add Limited DDA Payments',
    });
    expect(addProductButton).toBeEnabled();
    expect(
      addProductButton.querySelector('.lucide-package-plus')
    ).not.toBeNull();
    await user.click(addProductButton);
    const addProductHeading = screen.getByRole('heading', {
      name: 'Add Limited DDA Payments',
    });
    expect(addProductHeading).toBeInTheDocument();
    expect(
      addProductHeading.parentElement?.querySelector('.lucide-package-plus')
    ).not.toBeNull();
    expect(addProductHeading.parentElement).toHaveClass('eb-flex');
    expect(
      screen.queryByRole('heading', { name: 'Embedded Payments', level: 4 })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'About Limited DDA Payments' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Before you request' })
    ).toBeInTheDocument();
    expect(addProduct).not.toHaveBeenCalled();
    await user.click(
      screen.getByRole('button', { name: 'Request Limited DDA Payments' })
    );
    expect(addProduct).toHaveBeenCalledTimes(1);
    expect(
      screen.getByRole('heading', { name: 'Review your changes' })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', {
        name: 'Has anything changed since this business was approved?',
      })
    ).not.toBeInTheDocument();
    expect(
      document.querySelector('[data-review-ownership-link]')
    ).toBeInTheDocument();
    expect(
      screen.queryByText('All qualifying owners hold their interest directly')
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(
        'One or more qualifying owners hold their interest through another company'
      )
    ).not.toBeInTheDocument();
    expect(screen.queryByText('Product addition')).not.toBeInTheDocument();
    expect(
      document.querySelector(
        '[data-review-change="product-LIMITED_DDA_PAYMENTS"]'
      )
    ).toHaveTextContent('Pending addition');
    // The business's document sits with the business; Submit only summarizes what is left.
    const businessRow = document.querySelector<HTMLElement>(
      '[data-review-group="documents"] [data-review-change="organization"]'
    )!;
    expect(businessRow).toHaveTextContent(
      'Provide the required product upgrade document.'
    );
    const submission = screen
      .getByRole('heading', { name: 'Submission' })
      .closest('section')!;
    expect(submission).toHaveTextContent(
      'Upload the required documents for Marketplace Vendor LLC'
    );
    expect(submission).not.toHaveTextContent(
      'Provide the required product upgrade document.'
    );
    expect(within(submission).queryByRole('checkbox')).not.toBeInTheDocument();
    expect(
      within(submission).getByRole('button', { name: 'Submit for review' })
    ).toBeDisabled();
    await user.click(
      screen.getByRole('button', { name: 'View ownership structure' })
    );
    expect(
      screen.getAllByRole('heading', { name: 'Ownership structure' })
    ).toHaveLength(1);
    expect(screen.getByText('Your business')).toBeInTheDocument();
    expect(
      screen.queryByText('Business being maintained')
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText('Add the first intermediary entity to continue.')
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText('Less common ownership arrangement')
    ).not.toBeInTheDocument();
    expect(screen.queryByRole('radio')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Back to review' }));
    expect(
      screen.getByRole('heading', { name: 'Review your changes' })
    ).toBeInTheDocument();
  });

  test('updates ownership from the combined review and collects full intermediary details', async () => {
    const user = userEvent.setup();
    workspace.clientQuery.data = {
      ...approvedClient,
      updateRequest: {
        status: 'NEW',
        requestId: 'product-request-1',
        submittedAt: '2026-09-01T12:00:00.000Z',
      },
      productDetails: [
        {
          product: 'EMBEDDED_PAYMENTS',
          subProduct: 'LIMITED_DDA_PAYMENTS',
          action: 'ADD',
          onboardingStatus: 'NEW',
        },
      ],
    };

    render(
      <ApprovedClientMaintenance
        clientId="client-1"
        eligibility={[
          {
            country: 'US',
            organizationType: 'LIMITED_LIABILITY_COMPANY',
            operations: ['MANAGE_PROFILE', 'MANAGE_INDIRECT_OWNERSHIP'],
          },
        ]}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Review and submit' }));
    expect(screen.queryByText('Product addition')).not.toBeInTheDocument();
    expect(
      document.querySelector(
        '[data-review-change="product-LIMITED_DDA_PAYMENTS"]'
      )
    ).toHaveTextContent('Pending addition');
    expect(screen.getByText(/Limited DDA Payments/)).toBeInTheDocument();
    await user.click(
      screen.getByRole('button', { name: 'View ownership structure' })
    );
    expect(screen.queryByRole('radio')).not.toBeInTheDocument();
    await user.click(
      within(getOwnershipAddRow('organization-1')!).getByRole('button', {
        name: 'Add intermediary business',
      })
    );

    expect(
      screen.getByRole('heading', { name: 'Add intermediary business' })
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(/Employer Identification Number/)
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Address line 1')).toBeInTheDocument();
  });

  test('requires both review confirmations when approved information has not changed', async () => {
    const user = userEvent.setup();
    workspace.clientQuery.data = {
      ...approvedClient,
      updateRequest: {
        status: 'NEW',
        requestId: 'product-request-1',
        submittedAt: '2026-09-01T12:00:00.000Z',
      },
      productDetails: [
        {
          product: 'EMBEDDED_PAYMENTS',
          subProduct: 'LIMITED_DDA_PAYMENTS',
          action: 'ADD',
          onboardingStatus: 'NEW',
        },
      ],
    };

    render(
      <ApprovedClientMaintenance
        clientId="client-1"
        eligibility={[
          {
            country: 'US',
            organizationType: 'LIMITED_LIABILITY_COMPANY',
            operations: ['MANAGE_PROFILE', 'MANAGE_INDIRECT_OWNERSHIP'],
          },
        ]}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Review and submit' }));
    expect(
      screen.getByRole('heading', { name: 'Review your changes' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'View ownership structure' })
    ).toBeInTheDocument();
    const submitButton = screen.getByRole('button', {
      name: 'Submit for review',
    });
    const informationConfirmation = screen.getByLabelText(
      'I reviewed the business and related-party information on file, including the changes shown here, and confirm no other changes are needed.'
    );
    const ownershipConfirmation = screen.getByLabelText(
      'I reviewed the ownership structure and confirm it includes every individual and intermediary business that owns 25% or more.'
    );
    expect(submitButton).toBeDisabled();
    await user.click(informationConfirmation);
    expect(submitButton).toBeDisabled();
    await user.click(ownershipConfirmation);
    expect(submitButton).toBeEnabled();
  });

  test('unlocks business and people tasks when approved information changed', async () => {
    const user = userEvent.setup();
    workspace.clientQuery.data = {
      ...approvedClient,
      updateRequest: {
        status: 'NEW',
        requestId: 'product-request-1',
      },
      productDetails: [
        {
          product: 'EMBEDDED_PAYMENTS',
          subProduct: 'LIMITED_DDA_PAYMENTS',
          action: 'ADD',
          onboardingStatus: 'NEW',
        },
      ],
    };

    render(
      <ApprovedClientMaintenance
        clientId="client-1"
        eligibility={[
          {
            country: 'US',
            organizationType: 'LIMITED_LIABILITY_COMPANY',
            operations: ['MANAGE_PROFILE'],
          },
        ]}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Review and submit' }));
    await user.click(
      screen.getByRole('button', { name: 'Back to business profile' })
    );

    expect(
      screen.getByRole('button', { name: 'View ownership structure' })
    ).toBeEnabled();
    expect(
      screen.getByRole('button', { name: /Marketplace Vendor LLC/ })
    ).toBeEnabled();
  });

  test('replaces the only controller without duplicating the replacement on retry', async () => {
    const user = userEvent.setup();
    createParty.mockResolvedValue(undefined);
    updateParty
      .mockRejectedValueOnce(new Error('Removal failed'))
      .mockResolvedValueOnce(undefined);
    render(
      <ApprovedClientMaintenance
        clientId="client-1"
        eligibility={[
          {
            country: 'US',
            organizationType: 'LIMITED_LIABILITY_COMPANY',
            operations: ['MANAGE_PROFILE'],
          },
        ]}
      />
    );

    expect(
      screen.queryByRole('button', { name: 'Add related party' })
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Jane R Doe/ }));
    expect(screen.getAllByText('Replace controller')).toHaveLength(1);
    const replaceController = screen.getByRole('button', {
      name: 'Replace controller',
    });
    expect(
      replaceController.querySelector('.lucide-user-round-cog')
    ).not.toBeNull();
    await user.click(replaceController);
    expect(screen.getByRole('alertdialog')).toHaveTextContent(
      'A controller is required. Add a replacement to continue.'
    );
    await user.click(
      screen.getByRole('button', { name: 'Choose replacement controller' })
    );
    expect(
      screen.getByRole('heading', { name: 'Choose a replacement controller' })
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Add a new person' }));
    expect(
      screen.getByRole('heading', { name: 'Add replacement controller' })
    ).toBeInTheDocument();
    expect(screen.getByText('Controller')).toBeInTheDocument();
    await user.click(
      screen.getByText('This person is also a direct beneficial owner')
    );
    await user.type(screen.getByLabelText('First name'), 'Wendy');
    await user.type(screen.getByLabelText('Last name'), 'Darling');
    await fillRequiredAddPersonFields(user, '1990-05-12');
    await user.type(
      screen.getByLabelText(/Social security number \(SSN\)/i),
      '555110000'
    );
    await user.type(
      screen.getByLabelText('Address line 1'),
      '14 Market Street'
    );
    await user.type(screen.getByLabelText('City / Town'), 'New York');
    await user.click(screen.getByLabelText('State'));
    await user.click(screen.getByRole('option', { name: 'New York' }));
    await user.type(screen.getByLabelText('ZIP code'), '10001');
    await user.click(
      screen.getByRole('button', {
        name: 'Add replacement and remove current controller',
      })
    );

    expect(createParty).toHaveBeenCalledTimes(1);
    expect(updateParty).toHaveBeenCalledTimes(1);
    await user.click(
      screen.getByRole('button', {
        name: 'Add replacement and remove current controller',
      })
    );

    expect(createParty).toHaveBeenCalledTimes(1);
    expect(createParty).toHaveBeenCalledWith(
      expect.objectContaining({ roles: ['CONTROLLER', 'BENEFICIAL_OWNER'] })
    );
    expect(updateParty).toHaveBeenCalledTimes(2);
    expect(updateParty).toHaveBeenCalledWith('person-1', { active: false });
  });

  test('reuses an existing direct related person as replacement controller', async () => {
    const user = userEvent.setup();
    workspace.clientQuery.data = {
      ...approvedClient,
      parties: [
        ...(approvedClient.parties ?? []),
        {
          id: 'person-2',
          parentPartyId: 'organization-1',
          partyType: 'INDIVIDUAL',
          roles: ['BENEFICIAL_OWNER'],
          individualDetails: {
            firstName: 'Wendy',
            lastName: 'Darling',
            natureOfOwnership: 'Direct',
          },
        },
      ],
    };
    updateParty.mockResolvedValue(undefined);

    render(
      <ApprovedClientMaintenance
        clientId="client-1"
        eligibility={[
          {
            country: 'US',
            organizationType: 'LIMITED_LIABILITY_COMPANY',
            operations: ['MANAGE_PROFILE'],
          },
        ]}
      />
    );

    await user.click(screen.getByRole('button', { name: /Jane R Doe/ }));
    await user.click(
      screen.getByRole('button', { name: 'Replace controller' })
    );
    await user.click(
      screen.getByRole('button', { name: 'Choose replacement controller' })
    );

    expect(
      screen.getByRole('heading', { name: 'Choose a replacement controller' })
    ).toBeInTheDocument();
    let finishSteps: () => void = () => undefined;
    applyPartySteps.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          finishSteps = resolve;
        })
    );
    const candidate = screen.getByRole('button', { name: /Wendy Darling/ });
    await user.click(candidate);

    // Both sides go out as one action, so the page refreshes once, at the end.
    expect(applyPartySteps).toHaveBeenCalledTimes(1);
    expect(applyPartySteps).toHaveBeenCalledWith([
      {
        kind: 'update',
        partyId: 'person-2',
        requestBody: { roles: ['BENEFICIAL_OWNER', 'CONTROLLER'] },
      },
      { kind: 'update', partyId: 'person-1', requestBody: { active: false } },
    ]);
    expect(candidate).toBeDisabled();
    expect(candidate.closest('section')).toHaveAttribute('aria-busy', 'true');
    finishSteps();
    await waitFor(() =>
      expect(
        screen.queryByRole('heading', {
          name: 'Choose a replacement controller',
        })
      ).not.toBeInTheDocument()
    );
    expect(updateParty).not.toHaveBeenCalled();
    expect(createParty).not.toHaveBeenCalled();
  });

  test("undoes a controller replacement in one step without discarding the new controller's other edits", async () => {
    const user = userEvent.setup();
    workspace.clientQuery.data = {
      ...approvedClient,
      parties: [
        ...(approvedClient.parties ?? []),
        {
          id: 'person-2',
          parentPartyId: 'organization-1',
          partyType: 'INDIVIDUAL',
          roles: ['BENEFICIAL_OWNER'],
          individualDetails: {
            firstName: 'Wendy',
            lastName: 'Darling',
            natureOfOwnership: 'Direct',
          },
        },
      ],
    };
    const pending = {
      status: 'NEW' as const,
      action: 'MODIFY' as const,
      requestId: 'request-1',
      submittedAt: '2026-09-03T10:00:00.000Z',
    };
    workspace.maintenanceQuery.data = {
      pages: [],
      parties: [
        { id: 'person-1', active: false, updateRequest: pending },
        {
          id: 'person-2',
          roles: ['BENEFICIAL_OWNER', 'CONTROLLER'],
          individualDetails: { lastName: 'Darling-Smith' },
          updateRequest: pending,
        },
      ],
    };
    applyPartySteps.mockResolvedValue(undefined);
    render(
      <ApprovedClientMaintenance clientId="client-1" eligibility={eligible} />
    );

    await user.click(screen.getByRole('button', { name: /Jane R Doe/ }));
    await user.click(screen.getByRole('button', { name: 'Cancel removal' }));
    const dialog = screen.getByRole('alertdialog');
    expect(dialog).toHaveTextContent(
      'Jane R Doe stays the controller, and Wendy Darling-Smith keeps their current roles. Their other pending changes stay.'
    );
    await user.click(
      within(dialog).getByRole('button', { name: 'Undo replacement' })
    );

    expect(applyPartySteps).toHaveBeenCalledTimes(1);
    expect(applyPartySteps).toHaveBeenCalledWith([
      { kind: 'discard', requestId: 'request-1', partyId: 'person-1' },
      {
        kind: 'update',
        partyId: 'person-2',
        requestBody: { roles: ['BENEFICIAL_OWNER'] },
      },
    ]);
    expect(cancelChanges).not.toHaveBeenCalled();
  });

  test('keeps a replaced controller on as a direct beneficial owner in one step', async () => {
    const user = userEvent.setup();
    workspace.clientQuery.data = {
      ...approvedClient,
      parties: [
        ...(approvedClient.parties ?? []),
        {
          id: 'person-2',
          parentPartyId: 'organization-1',
          partyType: 'INDIVIDUAL',
          roles: ['BENEFICIAL_OWNER'],
          individualDetails: {
            firstName: 'Wendy',
            lastName: 'Darling',
            natureOfOwnership: 'Direct',
          },
        },
      ],
    };
    const pending = {
      status: 'NEW' as const,
      action: 'MODIFY' as const,
      requestId: 'request-1',
      submittedAt: '2026-09-03T10:00:00.000Z',
    };
    workspace.maintenanceQuery.data = {
      pages: [],
      parties: [
        { id: 'person-1', active: false, updateRequest: pending },
        {
          id: 'person-2',
          roles: ['BENEFICIAL_OWNER', 'CONTROLLER'],
          updateRequest: pending,
        },
      ],
    };
    applyPartySteps.mockResolvedValue(undefined);
    render(
      <ApprovedClientMaintenance
        clientId="client-1"
        eligibility={[
          {
            country: 'US',
            organizationType: 'LIMITED_LIABILITY_COMPANY',
            operations: ['MANAGE_PROFILE'],
          },
        ]}
      />
    );

    await user.click(screen.getByRole('button', { name: /Jane R Doe/ }));
    await user.click(
      screen.getByRole('button', { name: 'Keep as beneficial owner' })
    );

    expect(applyPartySteps).toHaveBeenCalledWith([
      { kind: 'discard', requestId: 'request-1', partyId: 'person-1' },
      {
        kind: 'update',
        partyId: 'person-1',
        requestBody: {
          roles: ['BENEFICIAL_OWNER'],
          individualDetails: { natureOfOwnership: 'Direct' },
        },
      },
    ]);
    expect(cancelChanges).not.toHaveBeenCalled();
    expect(updateParty).not.toHaveBeenCalled();
  });

  test('does not offer to keep an ordinary removed person as an owner', async () => {
    const user = userEvent.setup();
    workspace.clientQuery.data = {
      ...approvedClient,
      parties: [
        ...(approvedClient.parties ?? []),
        {
          id: 'person-2',
          parentPartyId: 'organization-1',
          partyType: 'INDIVIDUAL',
          roles: ['BENEFICIAL_OWNER'],
          individualDetails: {
            firstName: 'Wendy',
            lastName: 'Darling',
            natureOfOwnership: 'Direct',
          },
        },
      ],
    };
    workspace.maintenanceQuery.data = {
      pages: [],
      parties: [
        {
          id: 'person-2',
          active: false,
          updateRequest: {
            status: 'NEW',
            action: 'MODIFY',
            requestId: 'request-1',
            submittedAt: '2026-09-03T10:00:00.000Z',
          },
        },
      ],
    };
    render(
      <ApprovedClientMaintenance clientId="client-1" eligibility={eligible} />
    );

    await user.click(screen.getByRole('button', { name: /Wendy Darling/ }));
    expect(
      screen.getByRole('button', { name: 'Cancel removal' })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Keep as beneficial owner' })
    ).not.toBeInTheDocument();
  });

  test('finishes a server-returned partial controller replacement without creating another controller', async () => {
    const user = userEvent.setup();
    workspace.maintenanceQuery.data = {
      pages: [],
      parties: [
        {
          id: 'replacement-controller-1',
          parentPartyId: 'organization-1',
          partyType: 'INDIVIDUAL',
          roles: ['CONTROLLER'],
          individualDetails: { firstName: 'Wendy', lastName: 'Darling' },
          updateRequest: {
            status: 'NEW',
            action: 'ADD',
            requestId: 'request-1',
            submittedAt: '2026-09-02T10:00:00.000Z',
          },
        },
      ],
    };
    updateParty.mockResolvedValue(undefined);
    render(
      <ApprovedClientMaintenance
        clientId="client-1"
        eligibility={[
          {
            country: 'US',
            organizationType: 'LIMITED_LIABILITY_COMPANY',
            operations: ['MANAGE_PROFILE'],
          },
        ]}
      />
    );

    await user.click(screen.getByRole('button', { name: /Jane R Doe/ }));
    await user.click(
      screen.getByRole('button', { name: 'Replace controller' })
    );
    await user.click(
      screen.getByRole('button', { name: 'Finish replacing controller' })
    );

    expect(createParty).not.toHaveBeenCalled();
    expect(updateParty).toHaveBeenCalledWith('person-1', { active: false });
    expect(
      screen.getByRole('heading', { name: 'Jane R Doe' })
    ).toBeInTheDocument();
  });

  test('keeps an outgoing controller as a beneficial owner during replacement', async () => {
    const user = userEvent.setup();
    workspace.clientQuery.data = {
      ...approvedClient,
      parties: (approvedClient.parties ?? []).map((party) =>
        party.id === 'person-1'
          ? { ...party, roles: ['CONTROLLER', 'BENEFICIAL_OWNER'] }
          : party
      ),
    };
    workspace.maintenanceQuery.data = {
      pages: [],
      parties: [
        {
          id: 'replacement-controller-1',
          parentPartyId: 'organization-1',
          partyType: 'INDIVIDUAL',
          roles: ['CONTROLLER'],
          individualDetails: { firstName: 'Wendy', lastName: 'Darling' },
          updateRequest: {
            status: 'NEW',
            action: 'ADD',
            requestId: 'request-1',
            submittedAt: '2026-09-02T10:00:00.000Z',
          },
        },
      ],
    };
    updateParty.mockResolvedValue(undefined);
    render(
      <ApprovedClientMaintenance
        clientId="client-1"
        eligibility={[
          {
            country: 'US',
            organizationType: 'LIMITED_LIABILITY_COMPANY',
            operations: ['MANAGE_PROFILE'],
          },
        ]}
      />
    );

    const peopleSection = screen
      .getByRole('heading', { name: 'Related parties' })
      .closest('section');
    await user.click(
      within(peopleSection!).getByRole('button', { name: /Jane R Doe/ })
    );
    await user.click(
      screen.getByRole('button', { name: 'Replace controller' })
    );
    await user.click(
      screen.getByRole('button', {
        name: 'Yes, keep as a beneficial owner',
      })
    );
    await user.click(
      screen.getByRole('button', { name: 'Finish replacing controller' })
    );

    expect(createParty).not.toHaveBeenCalled();
    expect(updateParty).toHaveBeenCalledWith('person-1', {
      roles: ['BENEFICIAL_OWNER'],
    });
  });

  test('adds a direct beneficial owner role while preserving controller', async () => {
    const user = userEvent.setup();
    updateParty.mockResolvedValue(undefined);
    render(
      <ApprovedClientMaintenance
        clientId="client-1"
        eligibility={[
          {
            country: 'US',
            organizationType: 'LIMITED_LIABILITY_COMPANY',
            operations: ['MANAGE_PROFILE'],
          },
        ]}
      />
    );

    await user.click(screen.getByRole('button', { name: /Jane R Doe/ }));
    await user.click(
      screen.getByRole('button', { name: 'Add beneficial owner role' })
    );
    expect(
      screen.getByRole('heading', { name: 'Add beneficial owner role' })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Choose how Jane R Doe owns part of the business/)
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole('button', { name: /Owns your business directly/ })
    );

    expect(updateParty).toHaveBeenCalledWith('person-1', {
      roles: ['CONTROLLER', 'BENEFICIAL_OWNER'],
      individualDetails: { natureOfOwnership: 'Direct' },
    });
  });

  test('adds a controller as an indirect owner through an existing business', async () => {
    const user = userEvent.setup();
    workspace.clientQuery.data = {
      ...approvedClient,
      parties: [
        ...(approvedClient.parties ?? []).map((party) =>
          party.id === 'person-1'
            ? {
                ...party,
                email: 'jane@example.com',
                individualDetails: {
                  ...party.individualDetails,
                  birthDate: '1990-05-12',
                  countryOfResidence: 'US',
                  jobTitle: 'CEO',
                  addresses: [
                    {
                      addressType: 'RESIDENTIAL_ADDRESS',
                      addressLines: ['14 Market Street'],
                      city: 'New York',
                      state: 'NY',
                      postalCode: '10001',
                      country: 'US',
                    },
                  ],
                  individualIds: [
                    { idType: 'SSN', value: '555110003', issuer: 'US' },
                  ],
                },
              }
            : party
        ),
        {
          id: 'intermediary-1',
          parentPartyId: 'organization-1',
          partyType: 'ORGANIZATION',
          roles: ['INTERMEDIARY_OWNER'],
          organizationDetails: {
            organizationName: 'Darling Holdings LLC',
            natureOfOwnership: 'Direct',
          },
        },
      ],
    };
    createParty.mockResolvedValue({ id: 'indirect-owner-1' });

    render(
      <ApprovedClientMaintenance
        clientId="client-1"
        eligibility={[
          {
            country: 'US',
            organizationType: 'LIMITED_LIABILITY_COMPANY',
            operations: ['MANAGE_PROFILE', 'MANAGE_INDIRECT_OWNERSHIP'],
          },
        ]}
      />
    );

    await user.click(screen.getByRole('button', { name: /Jane R Doe/ }));
    await user.click(
      screen.getByRole('button', { name: 'Add beneficial owner role' })
    );
    await user.click(
      screen.getByRole('button', { name: /^Darling Holdings LLC/ })
    );
    expect(
      screen.getByRole('heading', { name: 'Add indirect beneficial owner' })
    ).toBeInTheDocument();
    expect(screen.getByLabelText('First name')).toHaveValue('Jane');
    await user.click(
      screen.getByRole('button', { name: 'Add beneficial owner' })
    );

    expect(createParty).toHaveBeenCalledWith(
      expect.objectContaining({
        parentPartyId: 'intermediary-1',
        roles: ['BENEFICIAL_OWNER'],
        individualDetails: expect.objectContaining({
          natureOfOwnership: 'Indirect',
        }),
      })
    );
    expect(updateParty).not.toHaveBeenCalled();
  });

  test('discards all party changes when removing a pending owner role', async () => {
    const user = userEvent.setup();
    cancelChanges.mockResolvedValue(undefined);
    workspace.maintenanceQuery.data = {
      pages: [],
      parties: [
        {
          id: 'person-1',
          roles: ['CONTROLLER', 'BENEFICIAL_OWNER'],
          individualDetails: { natureOfOwnership: 'Direct' },
          updateRequest: {
            status: 'NEW',
            action: 'MODIFY',
            requestId: 'request-1',
            submittedAt: '2026-09-03T10:00:00.000Z',
          },
        },
        {
          id: 'person-1',
          individualDetails: { lastName: 'Diaz' },
          updateRequest: {
            status: 'NEW',
            action: 'MODIFY',
            requestId: 'request-1',
            submittedAt: '2026-09-03T10:01:00.000Z',
          },
        },
      ],
    };
    render(
      <ApprovedClientMaintenance clientId="client-1" eligibility={eligible} />
    );
    await user.click(screen.getByRole('button', { name: /Jane R Diaz/ }));

    const ownershipSection = screen
      .getByRole('heading', { name: 'Ownership and roles' })
      .closest('section');
    const controllerRole = ownershipSection!.querySelector(
      '[data-role="CONTROLLER"]'
    );
    const ownerRole = ownershipSection!.querySelector(
      '[data-role="BENEFICIAL_OWNER"]'
    );
    expect(controllerRole).toHaveAttribute('data-role-state', 'active');
    expect(controllerRole).not.toHaveTextContent('Pending addition');
    expect(ownerRole).toHaveAttribute('data-role-state', 'pending-addition');
    expect(ownerRole).toHaveTextContent('Pending addition');
    expect(ownerRole).toHaveTextContent(
      'This role is added once your changes are approved.'
    );
    // Discard lives once, with the pending changes, not again on the role card.
    expect(
      within(ownershipSection!).queryByRole('button', { name: /Discard/ })
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Discard changes' }));
    const dialog = screen.getByRole('alertdialog');
    expect(dialog).toHaveTextContent(
      'Jane R Doe keeps the details on the approved profile.'
    );
    // Role edits show what is being dropped, from current to pending.
    expect(dialog.querySelector('[data-discard-changes]')).toHaveTextContent(
      /Roles.*Controller.*Controller, Beneficial owner/
    );
    await user.click(
      within(dialog).getByRole('button', {
        name: 'Discard changes',
      })
    );

    expect(cancelChanges).toHaveBeenCalledWith('request-1', 'person-1');
    expect(updateParty).not.toHaveBeenCalled();
  });

  test('replaces a controller who was just made an owner and keeps them on as an owner', async () => {
    const user = userEvent.setup();
    workspace.maintenanceQuery.data = {
      pages: [],
      parties: [
        {
          id: 'person-1',
          roles: ['CONTROLLER', 'BENEFICIAL_OWNER'],
          individualDetails: { natureOfOwnership: 'Direct' },
          updateRequest: {
            status: 'NEW',
            action: 'MODIFY',
            requestId: 'request-1',
            submittedAt: '2026-09-03T10:00:00.000Z',
          },
        },
      ],
    };
    render(
      <ApprovedClientMaintenance
        clientId="client-1"
        eligibility={[
          {
            country: 'US',
            organizationType: 'LIMITED_LIABILITY_COMPANY',
            operations: ['MANAGE_PROFILE'],
          },
        ]}
      />
    );

    await user.click(screen.getByRole('button', { name: /Jane R Doe/ }));
    // An ownership-only pending change does not block replacing the controller.
    await user.click(
      screen.getByRole('button', { name: 'Replace controller' })
    );
    const dialog = screen.getByRole('alertdialog');
    expect(dialog).toHaveTextContent(
      'After the controller is replaced, will this person still own 25% or more?'
    );
    await user.click(
      within(dialog).getByRole('button', {
        name: 'Yes, keep as a beneficial owner',
      })
    );
    await user.click(
      within(dialog).getByRole('button', {
        name: 'Choose replacement controller',
      })
    );

    expect(
      screen.getByRole('heading', { name: 'Choose a replacement controller' })
    ).toBeInTheDocument();
  });

  test('keeps an approved owner role visible while its removal is pending', async () => {
    const user = userEvent.setup();
    workspace.clientQuery.data = {
      ...approvedClient,
      parties: approvedClient.parties?.map((party) =>
        party.id === 'person-1'
          ? {
              ...party,
              roles: ['CONTROLLER', 'BENEFICIAL_OWNER'],
              individualDetails: {
                ...party.individualDetails,
                natureOfOwnership: 'Direct',
              },
            }
          : party
      ),
    };
    workspace.maintenanceQuery.data = {
      pages: [],
      parties: [
        {
          id: 'person-1',
          roles: ['CONTROLLER'],
          updateRequest: {
            status: 'NEW',
            action: 'MODIFY',
            requestId: 'request-1',
            submittedAt: '2026-09-03T10:00:00.000Z',
          },
        },
      ],
    };

    render(
      <ApprovedClientMaintenance clientId="client-1" eligibility={eligible} />
    );
    await user.click(screen.getByRole('button', { name: /Jane R Doe/ }));

    const ownershipSection = screen
      .getByRole('heading', { name: 'Ownership and roles' })
      .closest('section');
    const controllerRole = ownershipSection!.querySelector(
      '[data-role="CONTROLLER"]'
    );
    const ownerRole = ownershipSection!.querySelector(
      '[data-role="BENEFICIAL_OWNER"]'
    );

    expect(controllerRole).toHaveAttribute('data-role-state', 'active');
    expect(ownerRole).toHaveAttribute('data-role-state', 'pending-removal');
    expect(ownerRole).toHaveTextContent('Pending removal');
    expect(ownerRole).toHaveTextContent(
      'This role remains active on the approved profile'
    );
    expect(
      within(ownerRole as HTMLElement).queryByRole('button', {
        name: 'Change to indirect ownership',
      })
    ).not.toBeInTheDocument();
  });

  test('presents a new party as a pending profile without a delta table', async () => {
    const user = userEvent.setup();
    cancelChanges.mockResolvedValue(undefined);
    workspace.maintenanceQuery.data = {
      pages: [],
      parties: [
        {
          id: 'person-2',
          parentPartyId: 'organization-1',
          partyType: 'INDIVIDUAL',
          roles: ['BENEFICIAL_OWNER'],
          individualDetails: {
            firstName: 'Wendy',
            lastName: 'Darling',
            birthDate: '1988-06-18',
            natureOfOwnership: 'Direct',
          },
          updateRequest: {
            status: 'NEW',
            action: 'ADD',
            requestId: 'request-1',
            submittedAt: '2026-09-03T10:00:00.000Z',
          },
        },
      ],
    };

    render(
      <ApprovedClientMaintenance clientId="client-1" eligibility={eligible} />
    );

    const pendingParty = screen.getByRole('button', {
      name: /Wendy Darling.*Pending addition/,
    });
    expect(pendingParty).toHaveClass(
      'eb-border-informative/60',
      'eb-bg-informative-accent/40'
    );
    expect(pendingParty.querySelector('.lucide-circle-plus')).not.toBeNull();
    await user.click(pendingParty);

    const pendingHeading = screen.getByRole('heading', {
      name: 'Wendy Darling',
    });
    const pendingHeader = pendingHeading.closest('header');
    expect(pendingHeader).toHaveClass('eb-bg-informative-accent/40');
    expect(
      within(pendingHeader!).getByText('Pending addition')
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Proposed person details' })
    ).toBeInTheDocument();
    const pendingRolesSection = screen
      .getByRole('heading', { name: 'Ownership and roles' })
      .closest('section');
    expect(pendingRolesSection).toHaveTextContent('Direct beneficial owner');
    expect(
      within(pendingRolesSection!).queryByText('Pending addition')
    ).not.toBeInTheDocument();
    expect(
      within(pendingHeader!).getByRole('button', {
        name: 'Edit pending party',
      })
    ).toBeInTheDocument();
    expect(
      within(pendingHeader!).getByRole('button', {
        name: 'Discard pending addition',
      })
    ).toBeInTheDocument();
    [
      'View maintenance request',
      'Edit pending party',
      'Discard pending addition',
    ].forEach((buttonName) => {
      expect(
        within(pendingHeader!).getByRole('button', { name: buttonName })
      ).toHaveClass('eb-bg-background');
    });
    expect(screen.queryByText('Current value')).not.toBeInTheDocument();
    expect(screen.queryByText('Pending change')).not.toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: 'Discard pending addition' })
    );
    const dialog = screen.getByRole('alertdialog');
    expect(dialog).toHaveTextContent('Discard Wendy Darling?');
    expect(dialog).toHaveTextContent(
      "Wendy Darling won't be added to the profile."
    );
    // Nothing else is pending, so the dialog does not promise that other changes stay.
    expect(dialog).not.toHaveTextContent('Your other pending changes stay.');
    await user.click(
      within(dialog).getByRole('button', {
        name: 'Discard pending addition',
      })
    );
    expect(cancelChanges).toHaveBeenCalledWith('request-1', 'person-2');
  });

  test('labels a reviewed party addition without losing its proposed-party highlight', async () => {
    const user = userEvent.setup();
    workspace.maintenanceQuery.data = {
      pages: [],
      parties: [
        {
          id: 'person-2',
          parentPartyId: 'organization-1',
          partyType: 'INDIVIDUAL',
          roles: ['BENEFICIAL_OWNER'],
          individualDetails: {
            firstName: 'Wendy',
            lastName: 'Darling',
            birthDate: '1988-06-18',
            natureOfOwnership: 'Direct',
          },
          updateRequest: {
            status: 'REVIEW_IN_PROGRESS',
            action: 'ADD',
            requestId: 'request-1',
            submittedAt: '2026-09-03T10:00:00.000Z',
          },
        },
      ],
    };

    render(
      <ApprovedClientMaintenance clientId="client-1" eligibility={eligible} />
    );

    const reviewedAddition = screen.getByRole('button', {
      name: /Wendy Darling.*Addition under review/,
    });
    expect(reviewedAddition).toHaveClass(
      'eb-border-informative/60',
      'eb-bg-informative-accent/40'
    );
    expect(reviewedAddition.querySelector('.lucide-clock3')).not.toBeNull();
    expect(reviewedAddition).not.toHaveTextContent('Pending addition');

    await user.click(reviewedAddition);

    const reviewedHeading = screen.getByRole('heading', {
      name: 'Wendy Darling',
    });
    const reviewedHeader = reviewedHeading.closest('header');
    expect(reviewedHeader).toHaveClass('eb-bg-informative-accent/40');
    expect(
      within(reviewedHeader!).getByText('Addition under review')
    ).toBeInTheDocument();
    expect(reviewedHeader?.querySelector('.lucide-clock3')).not.toBeNull();
  });

  test('renders an embedded ADD party in the dedicated draft-person shell', async () => {
    const user = userEvent.setup();
    workspace.clientQuery.data = {
      ...approvedClient,
      updateRequest: {
        status: 'NEW',
        requestId: 'request-1',
      },
      parties: [
        ...(approvedClient.parties ?? []),
        {
          id: 'person-embedded-add',
          parentPartyId: 'organization-1',
          partyType: 'INDIVIDUAL',
          roles: ['BENEFICIAL_OWNER'],
          email: 'wendy@example.com',
          individualDetails: {
            firstName: 'Wendy',
            lastName: 'Darling',
            birthDate: '1990-05-12',
            countryOfResidence: 'US',
            jobTitle: 'CEO',
            natureOfOwnership: 'Direct',
            addresses: [
              {
                addressType: 'RESIDENTIAL_ADDRESS',
                addressLines: ['14 Market Street'],
                city: 'New York',
                state: 'NY',
                postalCode: '10001',
                country: 'US',
              },
            ],
            individualIds: [
              { idType: 'SSN', value: '555110000', issuer: 'US' },
            ],
          },
          updateRequest: {
            status: 'NEW',
            action: 'ADD',
            requestId: 'request-1',
            submittedAt: '2026-09-03T10:00:00.000Z',
          },
        },
      ],
    };

    render(
      <ApprovedClientMaintenance
        clientId="client-1"
        eligibility={[
          {
            country: 'US',
            organizationType: 'LIMITED_LIABILITY_COMPANY',
            operations: ['MANAGE_PROFILE', 'MANAGE_INDIRECT_OWNERSHIP'],
          },
        ]}
      />
    );
    await user.click(
      screen.getByRole('button', { name: /Wendy Darling.*Pending addition/ })
    );

    const heading = screen.getByRole('heading', { name: 'Wendy Darling' });
    const header = heading.closest('header');
    expect(header).toHaveClass('eb-bg-informative-accent/40');
    expect(within(header!).getByText('Pending addition')).toBeInTheDocument();
    expect(
      within(header!).getByRole('button', { name: 'Edit pending party' })
    ).toBeInTheDocument();
    expect(
      within(header!).getByRole('button', {
        name: 'Discard pending addition',
      })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Proposed person details' })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Pending changes' })
    ).not.toBeInTheDocument();
    expect(screen.queryByText('Current value')).not.toBeInTheDocument();
    const rolesSection = screen
      .getByRole('heading', { name: 'Ownership and roles' })
      .closest('section');
    const ownerRole = rolesSection!.querySelector(
      '[data-role="BENEFICIAL_OWNER"]'
    );
    expect(ownerRole).toHaveAttribute('data-role-state', 'active');
    expect(ownerRole).not.toHaveTextContent('Pending addition');
    expect(ownerRole).toHaveTextContent('Direct beneficial owner');
    expect(
      within(ownerRole as HTMLElement).getByRole('button', {
        name: 'Change to indirect ownership',
      })
    ).toBeInTheDocument();
  });

  test('offers safe role controls for a pending controller', async () => {
    const user = userEvent.setup();
    workspace.maintenanceQuery.data = {
      pages: [],
      parties: [
        {
          id: 'pending-controller',
          parentPartyId: 'organization-1',
          partyType: 'INDIVIDUAL',
          roles: ['CONTROLLER'],
          individualDetails: { firstName: 'John', lastName: 'Darling' },
          updateRequest: {
            status: 'NEW',
            action: 'ADD',
            requestId: 'request-1',
            submittedAt: '2026-09-03T10:00:00.000Z',
          },
        },
      ],
    };

    render(
      <ApprovedClientMaintenance
        clientId="client-1"
        eligibility={[
          {
            country: 'US',
            organizationType: 'LIMITED_LIABILITY_COMPANY',
            operations: ['MANAGE_PROFILE'],
          },
        ]}
      />
    );
    await user.click(
      screen.getByRole('button', { name: /John Darling.*Pending addition/ })
    );

    const rolesSection = screen
      .getByRole('heading', { name: 'Ownership and roles' })
      .closest('section');
    const controllerRole = rolesSection!.querySelector(
      '[data-role="CONTROLLER"]'
    );
    expect(controllerRole).toHaveAttribute('data-role-state', 'active');
    expect(controllerRole).not.toHaveTextContent('Pending addition');
    await user.click(
      within(controllerRole as HTMLElement).getByRole('button', {
        name: 'Add beneficial owner role',
      })
    );
    expect(
      screen.getByRole('heading', { name: 'Add beneficial owner role' })
    ).toBeInTheDocument();
  });

  test('offers path conversion for a combined pending controller owner', async () => {
    const user = userEvent.setup();
    workspace.maintenanceQuery.data = {
      pages: [],
      parties: [
        {
          id: 'pending-controller-owner',
          parentPartyId: 'organization-1',
          partyType: 'INDIVIDUAL',
          roles: ['CONTROLLER', 'BENEFICIAL_OWNER'],
          individualDetails: {
            firstName: 'Michael',
            lastName: 'Darling',
            natureOfOwnership: 'Direct',
          },
          updateRequest: {
            status: 'NEW',
            action: 'ADD',
            requestId: 'request-1',
            submittedAt: '2026-09-03T10:00:00.000Z',
          },
        },
      ],
    };

    render(
      <ApprovedClientMaintenance
        clientId="client-1"
        eligibility={[
          {
            country: 'US',
            organizationType: 'LIMITED_LIABILITY_COMPANY',
            operations: ['MANAGE_PROFILE', 'MANAGE_INDIRECT_OWNERSHIP'],
          },
        ]}
      />
    );
    await user.click(
      screen.getByRole('button', {
        name: /Michael Darling.*Pending addition/,
      })
    );

    const rolesSection = screen
      .getByRole('heading', { name: 'Ownership and roles' })
      .closest('section');
    expect(rolesSection).not.toHaveTextContent('Pending addition');
    expect(
      within(rolesSection!).getByRole('button', {
        name: 'Change to indirect ownership',
      })
    ).toBeInTheDocument();
    expect(
      within(rolesSection!).queryByRole('button', {
        name: 'Replace controller',
      })
    ).not.toBeInTheDocument();
  });

  test('moves a pending controller owner beneath a business as one party', async () => {
    const user = userEvent.setup();
    workspace.clientQuery.data = {
      ...approvedClient,
      parties: [
        ...(approvedClient.parties ?? []).map((party) =>
          party.id === 'person-1'
            ? {
                ...party,
                roles: ['BENEFICIAL_OWNER'],
                individualDetails: {
                  ...party.individualDetails,
                  natureOfOwnership: 'Direct',
                },
              }
            : party
        ),
        {
          id: 'intermediary-existing',
          parentPartyId: 'organization-1',
          partyType: 'ORGANIZATION',
          roles: ['INTERMEDIARY_OWNER'],
          organizationDetails: {
            organizationName: 'Existing Holdings LLC',
            natureOfOwnership: 'Direct',
          },
        },
      ],
    };
    workspace.maintenanceQuery.data = {
      pages: [],
      parties: [
        {
          id: 'pending-controller-owner',
          parentPartyId: 'organization-1',
          partyType: 'INDIVIDUAL',
          roles: ['CONTROLLER', 'BENEFICIAL_OWNER'],
          email: 'michael@example.com',
          individualDetails: {
            firstName: 'Michael',
            lastName: 'Darling',
            birthDate: '1990-05-12',
            countryOfResidence: 'US',
            jobTitle: 'CEO',
            natureOfOwnership: 'Direct',
            addresses: [
              {
                addressType: 'RESIDENTIAL_ADDRESS',
                addressLines: ['14 Market Street'],
                city: 'New York',
                state: 'NY',
                postalCode: '10001',
                country: 'US',
              },
            ],
            individualIds: [
              { idType: 'SSN', value: '555110000', issuer: 'US' },
            ],
          },
          updateRequest: {
            status: 'NEW',
            action: 'ADD',
            requestId: 'request-1',
            submittedAt: '2026-09-03T10:00:00.000Z',
          },
        },
      ],
    };
    createParty.mockResolvedValue({ id: 'replacement-owner' });
    updateParty.mockResolvedValue(undefined);

    render(
      <ApprovedClientMaintenance
        clientId="client-1"
        eligibility={[
          {
            country: 'US',
            organizationType: 'LIMITED_LIABILITY_COMPANY',
            operations: ['MANAGE_PROFILE', 'MANAGE_INDIRECT_OWNERSHIP'],
          },
        ]}
      />
    );
    await user.click(
      screen.getByRole('button', {
        name: /Michael Darling.*Pending addition/,
      })
    );
    await user.click(
      screen.getByRole('button', { name: 'Change to indirect ownership' })
    );

    expect(
      screen.getByRole('heading', {
        name: 'Choose where Michael Darling connects',
      })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Choose a replacement controller' })
    ).not.toBeInTheDocument();
    await user.click(
      screen.getByRole('button', { name: /Existing Holdings LLC/ })
    );

    expect(applyOwnershipOperations).toHaveBeenCalledWith([
      {
        partyId: 'pending-controller-owner',
        request: { parentPartyId: 'intermediary-existing' },
      },
      {
        partyId: 'pending-controller-owner',
        request: { individualDetails: { natureOfOwnership: 'Indirect' } },
      },
    ]);
    expect(createParty).not.toHaveBeenCalled();
    expect(updateParty).not.toHaveBeenCalled();
    expect(cancelChanges).not.toHaveBeenCalled();
  });

  test('moves a pending owner beneath an existing intermediary', async () => {
    const user = userEvent.setup();
    workspace.clientQuery.data = {
      ...approvedClient,
      parties: [
        ...(approvedClient.parties ?? []),
        {
          id: 'intermediary-existing',
          parentPartyId: 'organization-1',
          partyType: 'ORGANIZATION',
          roles: ['INTERMEDIARY_OWNER'],
          organizationDetails: {
            organizationName: 'Existing Holdings LLC',
            natureOfOwnership: 'Direct',
          },
        },
      ],
    };
    workspace.maintenanceQuery.data = {
      pages: [],
      parties: [
        {
          id: 'pending-owner',
          parentPartyId: 'organization-1',
          partyType: 'INDIVIDUAL',
          roles: ['BENEFICIAL_OWNER'],
          email: 'wendy@example.com',
          individualDetails: {
            firstName: 'Wendy',
            lastName: 'Darling',
            birthDate: '1990-05-12',
            countryOfResidence: 'US',
            jobTitle: 'CEO',
            natureOfOwnership: 'Direct',
            addresses: [
              {
                addressType: 'RESIDENTIAL_ADDRESS',
                addressLines: ['14 Market Street'],
                city: 'New York',
                state: 'NY',
                postalCode: '10001',
                country: 'US',
              },
            ],
            individualIds: [
              { idType: 'SSN', value: '555110000', issuer: 'US' },
            ],
          },
          updateRequest: {
            status: 'NEW',
            action: 'ADD',
            requestId: 'request-1',
            submittedAt: '2026-09-03T10:00:00.000Z',
          },
        },
      ],
    };
    createParty.mockResolvedValue({ id: 'replacement-owner' });
    cancelChanges.mockResolvedValue(undefined);

    render(
      <ApprovedClientMaintenance
        clientId="client-1"
        eligibility={[
          {
            country: 'US',
            organizationType: 'LIMITED_LIABILITY_COMPANY',
            operations: ['MANAGE_PROFILE', 'MANAGE_INDIRECT_OWNERSHIP'],
          },
        ]}
      />
    );
    await user.click(
      screen.getByRole('button', { name: /Wendy Darling.*Pending addition/ })
    );
    await user.click(
      screen.getByRole('button', { name: 'Change to indirect ownership' })
    );
    await user.click(
      screen.getByRole('button', { name: /Existing Holdings LLC/ })
    );

    expect(applyOwnershipOperations).toHaveBeenCalledWith([
      {
        partyId: 'pending-owner',
        request: { parentPartyId: 'intermediary-existing' },
      },
      {
        partyId: 'pending-owner',
        request: { individualDetails: { natureOfOwnership: 'Indirect' } },
      },
    ]);
    expect(createParty).not.toHaveBeenCalled();
    expect(cancelChanges).not.toHaveBeenCalled();
    expect(updateParty).not.toHaveBeenCalled();
  });

  test('reviews a pending party without an empty-baseline comparison table', async () => {
    const user = userEvent.setup();
    workspace.maintenanceQuery.data = {
      pages: [],
      parties: [
        {
          id: 'person-2',
          parentPartyId: 'organization-1',
          partyType: 'INDIVIDUAL',
          roles: ['BENEFICIAL_OWNER'],
          individualDetails: {
            firstName: 'Wendy',
            lastName: 'Darling',
            natureOfOwnership: 'Direct',
          },
          updateRequest: {
            status: 'NEW',
            action: 'ADD',
            requestId: 'request-1',
            submittedAt: '2026-09-03T10:00:00.000Z',
          },
        },
      ],
    };

    render(
      <ApprovedClientMaintenance clientId="client-1" eligibility={eligible} />
    );
    await user.click(screen.getByRole('button', { name: 'Review and submit' }));

    const pendingParty = document.querySelector<HTMLElement>(
      '[data-review-group="added"] [data-review-change="person-2"]'
    )!;
    expect(pendingParty).toHaveTextContent('Wendy Darling');
    expect(pendingParty).toHaveTextContent('Direct beneficial owner');
    // The row summarizes; the full proposed record lives on the details page.
    expect(pendingParty.querySelector('[data-change-table]')).toBeNull();
    expect(
      within(pendingParty).queryByText('Current value')
    ).not.toBeInTheDocument();
    await user.click(
      within(pendingParty).getByRole('button', {
        name: 'Actions for Wendy Darling',
      })
    );
    expect(
      screen.getByRole('menuitem', { name: /^Edit pending party/ })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('menuitem', { name: /^Discard pending addition/ })
    ).toBeInTheDocument();
    await user.keyboard('{Escape}');

    await user.click(
      within(pendingParty).getByRole('button', { name: /^Wendy Darling/ })
    );
    expect(
      screen.getByRole('heading', { name: 'Wendy Darling' })
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Back to review' }));
    expect(
      screen.getByRole('heading', { name: 'Review your changes' })
    ).toBeInTheDocument();
  });

  test('edits a pending party while preserving its pending-addition state', async () => {
    const user = userEvent.setup();
    const pendingParty: MaintenanceParty = {
      id: 'person-2',
      parentPartyId: 'organization-1',
      partyType: 'INDIVIDUAL',
      roles: ['BENEFICIAL_OWNER'],
      individualDetails: {
        firstName: 'Wendy',
        lastName: 'Darling',
        birthDate: '1988-06-18',
        countryOfResidence: 'US',
        jobTitle: 'CEO',
        natureOfOwnership: 'Direct',
        individualIds: [{ idType: 'SSN', value: '555110002', issuer: 'US' }],
        addresses: [
          {
            addressType: 'RESIDENTIAL_ADDRESS',
            addressLines: ['14 Kensington Gardens'],
            city: 'New York',
            state: 'NY',
            postalCode: '10001',
            country: 'US',
          },
        ],
      },
      email: 'wendy@example.com',
      updateRequest: {
        status: 'NEW',
        action: 'ADD',
        requestId: 'request-1',
        submittedAt: '2026-09-03T10:00:00.000Z',
      },
    };
    workspace.maintenanceQuery.data = {
      pages: [],
      parties: [pendingParty],
    };
    updatePartyName.mockImplementation(async () => {
      workspace.maintenanceQuery.data = {
        pages: [],
        parties: [
          {
            ...pendingParty,
            individualDetails: {
              ...pendingParty.individualDetails,
              lastName: 'Pan',
            },
          },
        ],
      };
    });

    render(
      <ApprovedClientMaintenance clientId="client-1" eligibility={eligible} />
    );
    await user.click(
      screen.getByRole('button', { name: /Wendy Darling.*Pending addition/ })
    );
    await user.click(
      screen.getByRole('button', { name: 'Edit pending party' })
    );
    const lastName = screen.getByRole('textbox', { name: 'Last name' });
    await user.clear(lastName);
    await user.type(lastName, 'Pan');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(updatePartyName).toHaveBeenCalledWith('person-2', {
      individualDetails: { lastName: 'Pan' },
    });
    const pendingHeading = await screen.findByRole('heading', {
      name: 'Wendy Pan',
    });
    expect(
      within(pendingHeading.closest('header')!).getByText('Pending addition')
    ).toBeInTheDocument();
    expect(screen.queryByText('Current value')).not.toBeInTheDocument();
  });

  test('creates a direct beneficial owner with complete identity and address details', async () => {
    const user = userEvent.setup();
    createParty.mockResolvedValue(undefined);
    render(
      <ApprovedClientMaintenance
        clientId="client-1"
        eligibility={[
          {
            country: 'US',
            organizationType: 'LIMITED_LIABILITY_COMPANY',
            operations: ['MANAGE_PROFILE'],
          },
        ]}
      />
    );

    await user.click(
      screen.getByRole('button', { name: 'View ownership structure' })
    );
    await user.click(
      within(getOwnershipAddRow('organization-1')!).getByRole('button', {
        name: 'Add beneficial owner',
      })
    );
    // Only direct ownership is allowed, so there is no direct-or-indirect choice to make.
    expect(
      screen.queryByRole('button', { name: /Owns your business directly/ })
    ).not.toBeInTheDocument();
    await user.type(screen.getByLabelText('First name'), 'Wendy');
    await user.type(screen.getByLabelText(/Middle name/), 'Moira');
    await user.type(screen.getByLabelText('Last name'), 'Darling');
    await fillRequiredAddPersonFields(user, '1990-05-12');
    await user.type(
      screen.getByLabelText(/Social security number \(SSN\)/i),
      '555110004'
    );
    await user.type(
      screen.getByLabelText('Address line 1'),
      '14 Kensington Gardens'
    );
    await user.type(screen.getByLabelText(/Address line 2/), 'Flat 2');
    await user.type(screen.getByLabelText('City / Town'), 'London');
    await user.click(screen.getByLabelText('State'));
    await user.click(screen.getByRole('option', { name: 'New York' }));
    await user.type(screen.getByLabelText('ZIP code'), '10001');
    await user.click(
      screen.getByRole('button', { name: 'Add beneficial owner' })
    );

    expect(createParty).toHaveBeenCalledWith({
      partyType: 'INDIVIDUAL',
      parentPartyId: 'organization-1',
      email: 'owner@example.com',
      roles: ['BENEFICIAL_OWNER'],
      individualDetails: {
        firstName: 'Wendy',
        middleName: 'Moira',
        lastName: 'Darling',
        birthDate: '1990-05-12',
        countryOfResidence: 'US',
        natureOfOwnership: 'Direct',
        jobTitle: 'CEO',
        jobTitleDescription: undefined,
        phone: undefined,
        addresses: [
          {
            addressType: 'RESIDENTIAL_ADDRESS',
            addressLines: ['14 Kensington Gardens', 'Flat 2'],
            city: 'London',
            state: 'NY',
            postalCode: '10001',
            country: 'US',
          },
        ],
        individualIds: [{ idType: 'SSN', value: '555110004', issuer: 'US' }],
      },
    });
  });

  test('derives non-US identity and address controls from country selections', async () => {
    const user = userEvent.setup();
    createParty.mockResolvedValue(undefined);
    render(
      <ApprovedClientMaintenance
        clientId="client-1"
        eligibility={[
          {
            country: 'US',
            organizationType: 'LIMITED_LIABILITY_COMPANY',
            operations: ['MANAGE_PROFILE'],
          },
        ]}
      />
    );

    await user.click(
      screen.getByRole('button', { name: 'View ownership structure' })
    );
    await user.click(
      within(getOwnershipAddRow('organization-1')!).getByRole('button', {
        name: 'Add beneficial owner',
      })
    );
    await user.type(screen.getByLabelText('First name'), 'Tinker');
    await user.type(screen.getByLabelText('Last name'), 'Bell');
    await fillRequiredAddPersonFields(user, '1992-07-18');
    await user.click(screen.getByLabelText('Country of residence'));
    await user.type(screen.getByPlaceholderText('Search countries'), 'Canada');
    await user.click(screen.getByRole('option', { name: '[CA] Canada' }));

    expect(
      screen.queryByLabelText(/Social security number \(SSN\)/i)
    ).not.toBeInTheDocument();
    await user.click(screen.getByLabelText('Identification type'));
    await user.click(screen.getByRole('option', { name: 'Passport' }));
    await user.type(screen.getByLabelText('Passport'), 'PA123456');
    await user.click(screen.getByLabelText('Country'));
    await user.type(screen.getByPlaceholderText('Search countries'), 'Canada');
    await user.click(screen.getByRole('option', { name: '[CA] Canada' }));
    await user.type(screen.getByLabelText('Address line 1'), '10 King Street');
    await user.type(screen.getByLabelText('City'), 'Toronto');
    await user.click(screen.getByLabelText('Province'));
    await user.click(screen.getByRole('option', { name: 'Ontario' }));
    await user.type(screen.getByLabelText('Postal code'), 'M5H 1A1');
    await user.click(
      screen.getByRole('button', { name: 'Add beneficial owner' })
    );

    expect(createParty).toHaveBeenCalledWith(
      expect.objectContaining({
        individualDetails: expect.objectContaining({
          countryOfResidence: 'CA',
          individualIds: [
            { idType: 'PASSPORT', value: 'PA123456', issuer: 'CA' },
          ],
          addresses: [
            expect.objectContaining({
              country: 'CA',
              state: 'ON',
              postalCode: 'M5H 1A1',
            }),
          ],
        }),
      })
    );
  });

  test('creates a root intermediary owner with direct ownership details', async () => {
    const user = userEvent.setup();
    createParty.mockResolvedValue(undefined);
    render(
      <ApprovedClientMaintenance
        clientId="client-1"
        eligibility={[
          {
            country: 'US',
            organizationType: 'LIMITED_LIABILITY_COMPANY',
            operations: ['MANAGE_PROFILE', 'MANAGE_INDIRECT_OWNERSHIP'],
          },
        ]}
      />
    );

    await user.click(
      screen.getByRole('button', { name: 'View ownership structure' })
    );
    await user.click(
      within(getOwnershipAddRow('organization-1')!).getByRole('button', {
        name: 'Add intermediary business',
      })
    );
    await user.type(
      screen.getByLabelText('Legal name of the company'),
      'Darling Holdings LLC'
    );
    await user.click(screen.getByLabelText('Organization type'));
    await user.click(
      screen.getByRole('option', { name: /Limited liability company/i })
    );
    await user.type(
      screen.getByLabelText(/Employer Identification Number/),
      '121234567'
    );
    await user.type(
      screen.getByLabelText('Address line 1'),
      '200 Market Street'
    );
    await user.type(screen.getByLabelText('City / Town'), 'San Francisco');
    await user.click(screen.getByLabelText('State'));
    await user.click(screen.getByRole('option', { name: 'California' }));
    await user.type(screen.getByLabelText('ZIP code'), '94105');
    await user.click(
      screen.getByRole('button', { name: 'Add intermediary owner' })
    );

    expect(createParty).toHaveBeenCalledWith({
      partyType: 'ORGANIZATION',
      parentPartyId: 'organization-1',
      roles: ['INTERMEDIARY_OWNER'],
      organizationDetails: {
        organizationName: 'Darling Holdings LLC',
        organizationType: 'LIMITED_LIABILITY_COMPANY',
        countryOfFormation: 'US',
        natureOfOwnership: 'Direct',
        addresses: [
          {
            addressType: 'LEGAL_ADDRESS',
            addressLines: ['200 Market Street'],
            city: 'San Francisco',
            state: 'CA',
            postalCode: '94105',
            country: 'US',
          },
        ],
        organizationIds: [{ idType: 'EIN', value: '121234567', issuer: 'US' }],
      },
    });
  });

  test('shows a pending intermediary consistently across ownership views', async () => {
    const user = userEvent.setup();
    workspace.maintenanceQuery.data = {
      pages: [],
      parties: [
        {
          id: 'intermediary-1',
          parentPartyId: 'organization-1',
          partyType: 'ORGANIZATION',
          roles: ['INTERMEDIARY_OWNER'],
          organizationDetails: {
            organizationName: 'Central Park Cookie',
            dbaName: 'Central Park Cookie Co.',
            organizationType: 'C_CORPORATION',
            countryOfFormation: 'US',
            natureOfOwnership: 'Direct',
            addresses: [
              {
                addressType: 'LEGAL_ADDRESS',
                addressLines: ['200 Market Street'],
                city: 'San Francisco',
                state: 'CA',
                postalCode: '94105',
                country: 'US',
              },
            ],
          },
          updateRequest: {
            status: 'NEW',
            action: 'ADD',
            requestId: 'request-1',
            submittedAt: '2026-09-03T10:00:00.000Z',
          },
        },
      ],
    };
    cancelChanges.mockResolvedValue(undefined);

    render(
      <ApprovedClientMaintenance
        clientId="client-1"
        eligibility={[
          {
            country: 'US',
            organizationType: 'LIMITED_LIABILITY_COMPANY',
            operations: ['MANAGE_PROFILE', 'MANAGE_INDIRECT_OWNERSHIP'],
          },
        ]}
      />
    );

    await user.click(
      screen.getByRole('button', { name: 'View ownership structure' })
    );
    const fullNode = screen.getByText('Central Park Cookie').closest('article');
    expect(fullNode).toHaveClass(
      'eb-border-informative/60',
      'eb-bg-informative-accent/20'
    );
    expect(fullNode).toHaveTextContent('Pending addition');
    await user.click(
      within(fullNode!).getByRole('button', { name: 'View business details' })
    );
    const intermediaryHeading = screen.getByRole('heading', {
      name: 'Central Park Cookie',
    });
    const intermediaryHeader = intermediaryHeading.closest('header');
    expect(intermediaryHeader).toHaveClass('eb-bg-informative-accent/40');
    expect(
      screen.getByRole('heading', { name: 'Proposed business details' })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Pending changes' })
    ).not.toBeInTheDocument();
    const legalAddressSection = screen
      .getByText('Legal address')
      .closest('section');
    expect(legalAddressSection).toHaveTextContent('200 Market Street');
    expect(legalAddressSection).toHaveTextContent('San Francisco');
    expect(legalAddressSection).toHaveTextContent('94105');
    expect(
      screen.getByRole('button', { name: 'Back to ownership structure' })
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Business profile' }));
    await user.click(screen.getByRole('button', { name: 'Review and submit' }));

    const requestCard = document.querySelector<HTMLElement>(
      '[data-review-group="added"] [data-review-change="intermediary-1"]'
    )!;
    expect(requestCard).toHaveTextContent('Central Park Cookie');
    expect(requestCard).toHaveTextContent('Intermediary owner');
    await user.click(
      within(requestCard).getByRole('button', {
        name: 'Actions for Central Park Cookie',
      })
    );
    expect(
      await screen.findByRole('menuitem', { name: /^Edit/ })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('menuitem', { name: /^Discard pending addition/ })
    ).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(
      screen.getByRole('button', { name: 'Discard all changes' })
    ).toBeInTheDocument();
  });

  test('offers to discard a pending business from the ownership structure', async () => {
    const user = userEvent.setup();
    workspace.maintenanceQuery.data = {
      pages: [],
      parties: [
        {
          id: 'intermediary-1',
          parentPartyId: 'organization-1',
          partyType: 'ORGANIZATION',
          roles: ['INTERMEDIARY_OWNER'],
          organizationDetails: {
            organizationName: 'Darling Holdings LLC',
            organizationType: 'LIMITED_LIABILITY_COMPANY',
            countryOfFormation: 'US',
          },
          updateRequest: {
            status: 'NEW',
            action: 'ADD',
            requestId: 'request-1',
            submittedAt: '2026-09-03T10:00:00.000Z',
          },
        },
      ],
    };
    cancelChanges.mockResolvedValue(undefined);

    render(
      <ApprovedClientMaintenance
        clientId="client-1"
        eligibility={[
          {
            country: 'US',
            organizationType: 'LIMITED_LIABILITY_COMPANY',
            operations: ['MANAGE_PROFILE', 'MANAGE_INDIRECT_OWNERSHIP'],
          },
        ]}
      />
    );

    await user.click(
      screen.getByRole('button', { name: 'View ownership structure' })
    );
    await openOwnershipMenu(user, 'Darling Holdings LLC');
    expect(
      await ownershipMenuItem('Discard pending addition')
    ).toBeInTheDocument();
  });

  test('asks what happens to the owners under a pending business before discarding it', async () => {
    const user = userEvent.setup();
    const pendingAddition = {
      status: 'NEW' as const,
      action: 'ADD' as const,
      requestId: 'request-1',
      submittedAt: '2026-09-03T10:00:00.000Z',
    };
    workspace.maintenanceQuery.data = {
      pages: [],
      parties: [
        {
          id: 'intermediary-1',
          parentPartyId: 'organization-1',
          partyType: 'ORGANIZATION',
          roles: ['INTERMEDIARY_OWNER'],
          organizationDetails: { organizationName: 'Darling Holdings LLC' },
          updateRequest: pendingAddition,
        },
        {
          id: 'person-2',
          parentPartyId: 'intermediary-1',
          partyType: 'INDIVIDUAL',
          roles: ['BENEFICIAL_OWNER'],
          individualDetails: {
            firstName: 'Wendy',
            lastName: 'Darling',
            natureOfOwnership: 'Indirect',
          },
          updateRequest: pendingAddition,
        },
      ],
    };

    render(
      <ApprovedClientMaintenance
        clientId="client-1"
        eligibility={[
          {
            country: 'US',
            organizationType: 'LIMITED_LIABILITY_COMPANY',
            operations: ['MANAGE_PROFILE', 'MANAGE_INDIRECT_OWNERSHIP'],
          },
        ]}
      />
    );

    await user.click(
      screen.getByRole('button', { name: 'View ownership structure' })
    );
    await openOwnershipMenu(user, 'Darling Holdings LLC');
    await user.click(await ownershipMenuItem('Discard pending addition'));

    const dialog = await screen.findByRole('alertdialog');
    expect(dialog).toHaveTextContent('Discard Darling Holdings LLC?');
    expect(dialog).toHaveTextContent(
      'Wendy Darling will connect directly to Marketplace Vendor LLC'
    );
    await user.click(
      within(dialog).getByRole('button', {
        name: 'Keep owners and update profile',
      })
    );

    expect(cancelChanges).not.toHaveBeenCalled();
    expect(applyOwnershipOperations).toHaveBeenCalledWith([
      { partyId: 'person-2', request: { parentPartyId: 'organization-1' } },
      {
        partyId: 'person-2',
        request: { individualDetails: { natureOfOwnership: 'Direct' } },
      },
      { partyId: 'intermediary-1', withdrawFromRequestId: 'request-1' },
    ]);
  });

  test('moves a pending ownership addition to a different business', async () => {
    const user = userEvent.setup();
    workspace.clientQuery.data = {
      ...approvedClient,
      parties: [
        ...(approvedClient.parties ?? []),
        {
          id: 'intermediary-1',
          parentPartyId: 'organization-1',
          partyType: 'ORGANIZATION',
          roles: ['INTERMEDIARY_OWNER'],
          organizationDetails: {
            organizationName: 'Darling Holdings LLC',
            organizationType: 'LIMITED_LIABILITY_COMPANY',
            countryOfFormation: 'US',
          },
        },
      ],
    };
    workspace.maintenanceQuery.data = {
      pages: [],
      parties: [
        {
          id: 'person-2',
          parentPartyId: 'intermediary-1',
          partyType: 'INDIVIDUAL',
          roles: ['BENEFICIAL_OWNER'],
          individualDetails: {
            firstName: 'Wendy',
            lastName: 'Darling',
            natureOfOwnership: 'Indirect',
          },
          updateRequest: {
            status: 'NEW',
            action: 'ADD',
            requestId: 'request-1',
            submittedAt: '2026-09-03T10:00:00.000Z',
          },
        },
      ],
    };

    render(
      <ApprovedClientMaintenance
        clientId="client-1"
        eligibility={[
          {
            country: 'US',
            organizationType: 'LIMITED_LIABILITY_COMPANY',
            operations: ['MANAGE_PROFILE', 'MANAGE_INDIRECT_OWNERSHIP'],
          },
        ]}
      />
    );

    await user.click(
      screen.getByRole('button', { name: 'View ownership structure' })
    );
    await openOwnershipMenu(user, 'Wendy Darling');
    expect(
      await ownershipMenuItem('Discard pending addition')
    ).toBeInTheDocument();
    await user.click(await ownershipMenuItem('Update connection'));
    await user.click(screen.getByLabelText('Marketplace Vendor LLC'));
    await user.click(screen.getByRole('button', { name: 'Update connection' }));

    expect(applyOwnershipOperations).toHaveBeenCalledWith([
      { partyId: 'person-2', request: { parentPartyId: 'organization-1' } },
      {
        partyId: 'person-2',
        request: { individualDetails: { natureOfOwnership: 'Direct' } },
      },
    ]);
  });

  test('moves an approved owner who already has draft edits', async () => {
    const user = userEvent.setup();
    workspace.clientQuery.data = {
      ...approvedClient,
      parties: [
        ...(approvedClient.parties ?? []),
        {
          id: 'intermediary-1',
          parentPartyId: 'organization-1',
          partyType: 'ORGANIZATION',
          roles: ['INTERMEDIARY_OWNER'],
          organizationDetails: { organizationName: 'Darling Holdings LLC' },
        },
        {
          id: 'person-2',
          parentPartyId: 'intermediary-1',
          partyType: 'INDIVIDUAL',
          roles: ['BENEFICIAL_OWNER'],
          individualDetails: {
            firstName: 'Wendy',
            lastName: 'Darling',
            natureOfOwnership: 'Indirect',
          },
        },
      ],
    };
    workspace.maintenanceQuery.data = {
      pages: [],
      parties: [
        {
          id: 'person-2',
          individualDetails: { jobTitle: 'CFO' },
          updateRequest: {
            status: 'NEW',
            action: 'MODIFY',
            requestId: 'request-1',
            submittedAt: '2026-09-03T10:00:00.000Z',
          },
        },
      ],
    };

    render(
      <ApprovedClientMaintenance
        clientId="client-1"
        eligibility={[
          {
            country: 'US',
            organizationType: 'LIMITED_LIABILITY_COMPANY',
            operations: ['MANAGE_PROFILE', 'MANAGE_INDIRECT_OWNERSHIP'],
          },
        ]}
      />
    );

    await user.click(
      screen.getByRole('button', { name: 'View ownership structure' })
    );
    await openOwnershipMenu(user, 'Wendy Darling');
    expect(await ownershipMenuItem('Update connection')).toBeInTheDocument();
    // Edits aren't visible here, so they're discarded from the review or the party's page.
    expect(
      screen.queryByRole('menuitem', { name: /^Discard changes/ })
    ).not.toBeInTheDocument();
    await user.keyboard('{Escape}');

    await user.click(
      within(
        document.querySelector<HTMLElement>('[data-ownership-node="person-2"]')!
      ).getAllByRole('button')[0]
    );
    await user.click(screen.getByRole('button', { name: 'Update connection' }));
    await user.click(screen.getByLabelText('Marketplace Vendor LLC'));
    await user.click(
      within(screen.getByRole('alertdialog')).getByRole('button', {
        name: 'Update connection',
      })
    );

    expect(applyOwnershipOperations).toHaveBeenCalledWith([
      { partyId: 'person-2', request: { parentPartyId: 'organization-1' } },
      {
        partyId: 'person-2',
        request: { individualDetails: { natureOfOwnership: 'Direct' } },
      },
    ]);
  });

  test('marks a business that was never reviewed and offers nothing that would fail', async () => {
    const user = userEvent.setup();
    workspace.clientQuery.data = {
      ...approvedClient,
      parties: [
        ...(approvedClient.parties ?? []),
        {
          id: 'intermediary-1',
          parentPartyId: 'organization-1',
          partyType: 'ORGANIZATION',
          roles: ['INTERMEDIARY_OWNER'],
          profileStatus: 'NEW',
          organizationDetails: { organizationName: 'Darling Holdings LLC' },
        },
      ],
    };

    render(
      <ApprovedClientMaintenance
        clientId="client-1"
        eligibility={[
          {
            country: 'US',
            organizationType: 'LIMITED_LIABILITY_COMPANY',
            operations: ['MANAGE_PROFILE', 'MANAGE_INDIRECT_OWNERSHIP'],
          },
        ]}
      />
    );

    await user.click(
      screen.getByRole('button', { name: 'View ownership structure' })
    );
    const node = document.querySelector<HTMLElement>(
      '[data-ownership-node="intermediary-1"]'
    )!;
    expect(node).toHaveTextContent('Not reviewed');
    expect(
      within(node).queryByRole('button', {
        name: 'Actions for Darling Holdings LLC',
      })
    ).not.toBeInTheDocument();

    await user.click(within(node).getAllByRole('button')[0]);
    expect(screen.getByText('Added without review')).toBeInTheDocument();
    expect(
      screen.getByText(/isn't part of the approved profile/)
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Edit/ })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Remove from ownership profile' })
    ).not.toBeInTheDocument();
  });

  test('moves a pending intermediary to a different ownership level', async () => {
    const user = userEvent.setup();
    workspace.clientQuery.data = {
      ...approvedClient,
      parties: [
        ...(approvedClient.parties ?? []),
        {
          id: 'intermediary-existing',
          parentPartyId: 'organization-1',
          partyType: 'ORGANIZATION',
          roles: ['INTERMEDIARY_OWNER'],
          organizationDetails: {
            organizationName: 'Existing Holdings LLC',
            organizationType: 'LIMITED_LIABILITY_COMPANY',
            countryOfFormation: 'US',
          },
        },
      ],
    };
    workspace.maintenanceQuery.data = {
      pages: [],
      parties: [
        {
          id: 'intermediary-pending',
          parentPartyId: 'organization-1',
          partyType: 'ORGANIZATION',
          roles: ['INTERMEDIARY_OWNER'],
          organizationDetails: {
            organizationName: 'Pending Holdings LLC',
            organizationType: 'LIMITED_LIABILITY_COMPANY',
            countryOfFormation: 'US',
            natureOfOwnership: 'Direct',
          },
          updateRequest: {
            status: 'NEW',
            action: 'ADD',
            requestId: 'request-1',
            submittedAt: '2026-09-03T10:00:00.000Z',
          },
        },
      ],
    };

    render(
      <ApprovedClientMaintenance
        clientId="client-1"
        eligibility={[
          {
            country: 'US',
            organizationType: 'LIMITED_LIABILITY_COMPANY',
            operations: ['MANAGE_PROFILE', 'MANAGE_INDIRECT_OWNERSHIP'],
          },
        ]}
      />
    );

    await user.click(
      screen.getByRole('button', { name: 'View ownership structure' })
    );
    await clickOwnershipMenuItem(
      user,
      'Pending Holdings LLC',
      'Update connection'
    );
    await user.click(screen.getByLabelText('Existing Holdings LLC'));
    await user.click(screen.getByRole('button', { name: 'Update connection' }));

    expect(applyOwnershipOperations).toHaveBeenCalledWith([
      {
        partyId: 'intermediary-pending',
        request: { parentPartyId: 'intermediary-existing' },
      },
      {
        partyId: 'intermediary-pending',
        request: { organizationDetails: { natureOfOwnership: 'Indirect' } },
      },
    ]);
  });

  test('keeps a pending-removal owner in their connection diagram and the ownership structure', async () => {
    const user = userEvent.setup();
    workspace.clientQuery.data = {
      ...approvedClient,
      parties: [
        ...(approvedClient.parties ?? []),
        {
          id: 'intermediary-1',
          parentPartyId: 'organization-1',
          partyType: 'ORGANIZATION',
          roles: ['INTERMEDIARY_OWNER'],
          organizationDetails: {
            organizationName: 'Darling Holdings LLC',
            natureOfOwnership: 'Direct',
          },
        },
        {
          id: 'person-2',
          parentPartyId: 'intermediary-1',
          partyType: 'INDIVIDUAL',
          roles: ['BENEFICIAL_OWNER'],
          individualDetails: {
            firstName: 'Wendy',
            lastName: 'Darling',
            natureOfOwnership: 'Indirect',
          },
        },
      ],
    };
    workspace.maintenanceQuery.data = {
      pages: [],
      parties: [
        {
          id: 'person-2',
          active: false,
          updateRequest: {
            status: 'NEW',
            action: 'MODIFY',
            requestId: 'request-1',
            submittedAt: '2026-09-03T10:00:00.000Z',
          },
        },
      ],
    };

    render(
      <ApprovedClientMaintenance
        clientId="client-1"
        eligibility={[
          {
            country: 'US',
            organizationType: 'LIMITED_LIABILITY_COMPANY',
            operations: ['MANAGE_PROFILE', 'MANAGE_INDIRECT_OWNERSHIP'],
          },
        ]}
      />
    );

    await user.click(
      screen.getByRole('button', { name: /Wendy Darling.*Pending removal/ })
    );

    const steps = document
      .querySelector('[data-ownership-chain]')!
      .querySelectorAll('li');
    expect(steps).toHaveLength(3);
    expect(steps[1]).toHaveTextContent('Darling Holdings LLC');
    expect(steps[2]).toHaveTextContent('Wendy Darling');

    await user.click(
      screen.getByRole('button', { name: 'View ownership structure' })
    );

    const removedNode = document.querySelector<HTMLElement>(
      '[data-ownership-node="person-2"]'
    );
    expect(removedNode).toBeInTheDocument();
    expect(within(removedNode!).getByText('Pending removal')).toHaveClass(
      'eb-text-destructive'
    );
    expect(removedNode!.querySelector('article')).toHaveClass(
      'eb-border-destructive/50',
      'eb-bg-destructive-accent/20'
    );

    await openOwnershipMenu(user, 'Wendy Darling');
    const menuItems = await screen.findAllByRole('menuitem');
    expect(menuItems).toHaveLength(1);
    expect(menuItems[0]).toHaveTextContent('Cancel removal');

    await user.click(menuItems[0]);
    const dialog = await screen.findByRole('alertdialog');
    expect(
      within(dialog).getByRole('heading', {
        name: 'Cancel removing Wendy Darling?',
      })
    ).toBeInTheDocument();
    // A removal has no field delta; the dialog says what the person keeps instead.
    expect(dialog).toHaveTextContent(/Wendy Darling stays on the profile as/);
    expect(dialog).not.toHaveTextContent(/Pending changes|can't be undone/);
    expect(
      within(dialog).getByRole('button', { name: 'Cancel removal' })
    ).not.toHaveClass('eb-bg-destructive');
  });

  test('reviews an owner edit as a change without repeating the ownership structure', async () => {
    const user = userEvent.setup();
    workspace.clientQuery.data = {
      ...approvedClient,
      parties: [
        ...(approvedClient.parties ?? []),
        {
          id: 'person-2',
          parentPartyId: 'organization-1',
          partyType: 'INDIVIDUAL',
          roles: ['BENEFICIAL_OWNER'],
          individualDetails: {
            firstName: 'Wendy',
            lastName: 'Darling',
            natureOfOwnership: 'Direct',
          },
        },
      ],
    };
    workspace.maintenanceQuery.data = {
      pages: [],
      parties: [
        {
          id: 'person-2',
          individualDetails: { lastName: 'Pan' },
          updateRequest: {
            status: 'NEW',
            action: 'MODIFY',
            requestId: 'request-1',
            submittedAt: '2026-09-03T10:00:00.000Z',
          },
        },
      ],
    };

    render(
      <ApprovedClientMaintenance clientId="client-1" eligibility={eligible} />
    );
    await user.click(screen.getByRole('button', { name: 'Review and submit' }));

    const editedCard = document.querySelector<HTMLElement>(
      '[data-review-group="updated"] [data-review-change="person-2"]'
    )!;
    expect(editedCard).toHaveTextContent(/Last name.*Darling.*Pan/);
    expect(document.querySelector('[data-ownership-node]')).toBeNull();
    expect(
      document.querySelector('[data-review-ownership-link]')
    ).toHaveTextContent('View ownership structure');
  });

  test('groups changes as added, updated, and removed, with the structure on its own page', async () => {
    const user = userEvent.setup();
    workspace.clientQuery.data = {
      ...approvedClient,
      parties: [
        ...(approvedClient.parties ?? []),
        {
          id: 'intermediary-1',
          parentPartyId: 'organization-1',
          partyType: 'ORGANIZATION',
          roles: ['INTERMEDIARY_OWNER'],
          organizationDetails: { organizationName: 'Darling Holdings LLC' },
        },
        {
          id: 'person-2',
          parentPartyId: 'intermediary-1',
          partyType: 'INDIVIDUAL',
          roles: ['BENEFICIAL_OWNER'],
          individualDetails: {
            firstName: 'Wendy',
            lastName: 'Darling',
            natureOfOwnership: 'Indirect',
          },
        },
        {
          id: 'person-3',
          parentPartyId: 'organization-1',
          partyType: 'INDIVIDUAL',
          roles: ['BENEFICIAL_OWNER'],
          individualDetails: {
            firstName: 'Peter',
            lastName: 'Pan',
            natureOfOwnership: 'Direct',
          },
        },
      ],
    };
    const updateRequest = {
      status: 'NEW' as const,
      action: 'MODIFY' as const,
      requestId: 'request-1',
      submittedAt: '2026-09-03T10:00:00.000Z',
    };
    workspace.maintenanceQuery.data = {
      pages: [],
      parties: [
        {
          id: 'person-2',
          parentPartyId: 'organization-1',
          individualDetails: { natureOfOwnership: 'Direct' },
          updateRequest,
        },
        { id: 'person-3', active: false, updateRequest },
        createProposal('Diaz'),
        {
          id: 'person-4',
          parentPartyId: 'intermediary-1',
          partyType: 'INDIVIDUAL',
          roles: ['BENEFICIAL_OWNER'],
          individualDetails: {
            firstName: 'Tinker',
            lastName: 'Bell',
            natureOfOwnership: 'Indirect',
          },
          updateRequest: { ...updateRequest, action: 'ADD' },
        },
      ],
    };

    render(
      <ApprovedClientMaintenance
        clientId="client-1"
        eligibility={[
          {
            country: 'US',
            organizationType: 'LIMITED_LIABILITY_COMPANY',
            operations: ['MANAGE_PROFILE', 'MANAGE_INDIRECT_OWNERSHIP'],
          },
        ]}
      />
    );
    await user.click(screen.getByRole('button', { name: 'Review and submit' }));

    const groupRows = (group: string) =>
      [
        ...document.querySelectorAll(
          `[data-review-group="${group}"] [data-review-change]`
        ),
      ].map((row) => row.getAttribute('data-review-change'));
    expect(
      [...document.querySelectorAll('[data-review-group]')].map((group) =>
        group.getAttribute('data-review-group')
      )
    ).toEqual(['added', 'updated', 'removed']);
    expect(groupRows('added')).toEqual(['person-4']);
    expect(groupRows('updated')).toEqual(['person-1', 'person-2']);
    expect(groupRows('removed')).toEqual(['person-3']);
    expect(
      screen.getByRole('heading', { name: /^Updated\s*2$/ })
    ).toBeInTheDocument();
    expect(document.querySelector('[data-ownership-node]')).toBeNull();
    // Status pills would only repeat the group heading.
    expect(
      document.querySelector('[data-review-group] [data-party-status]')
    ).toBeNull();

    expect(
      document.querySelector('[data-review-change="person-4"]')
    ).toHaveTextContent(
      'Indirect beneficial owner · Owned through Darling Holdings LLC'
    );

    // The move reads as one connection change, without a separate direct/indirect row.
    const movedRow = document.querySelector<HTMLElement>(
      '[data-review-change="person-2"]'
    )!;
    const movedChanges = movedRow.querySelectorAll('dl > div');
    expect(movedChanges).toHaveLength(1);
    expect(movedChanges[0]).toHaveTextContent(
      /Owned through.*Darling Holdings LLC.*Marketplace Vendor LLC/
    );

    const removalRow = document.querySelector<HTMLElement>(
      '[data-review-change="person-3"]'
    )!;
    expect(removalRow).toHaveTextContent('Direct beneficial owner');
    await user.click(
      within(removalRow).getByRole('button', { name: 'Actions for Peter Pan' })
    );
    const menuItems = await screen.findAllByRole('menuitem');
    expect(menuItems).toHaveLength(1);
    expect(menuItems[0]).toHaveTextContent('Cancel removal');
    await user.keyboard('{Escape}');

    await user.click(
      screen.getByRole('button', { name: 'View ownership structure' })
    );
    expect(
      screen.getByRole('heading', { name: 'Ownership structure' })
    ).toBeInTheDocument();
    const movedNode = document.querySelector<HTMLElement>(
      '[data-ownership-node="person-2"]'
    )!;
    expect(movedNode).toHaveTextContent('Moved from Darling Holdings LLC');
    // The move marker sits beside the party's pending-change count, not instead of it.
    expect(movedNode.querySelector('[data-party-status]')).toHaveTextContent(
      /pending change/
    );
    expect(
      document.querySelector('[data-ownership-node="person-3"]')
    ).toHaveTextContent('Pending removal');
    await user.click(screen.getByRole('button', { name: 'Back to review' }));
    expect(
      screen.getByRole('heading', { name: 'Review your changes' })
    ).toBeInTheDocument();
  });

  test('shows an indirect owner their connection diagram and a route to the structure', async () => {
    const user = userEvent.setup();
    workspace.clientQuery.data = {
      ...approvedClient,
      parties: [
        ...(approvedClient.parties ?? []),
        {
          id: 'intermediary-1',
          parentPartyId: 'organization-1',
          partyType: 'ORGANIZATION',
          roles: ['INTERMEDIARY_OWNER'],
          organizationDetails: {
            organizationName: 'Darling Holdings LLC',
            natureOfOwnership: 'Direct',
          },
        },
        {
          id: 'person-2',
          parentPartyId: 'intermediary-1',
          partyType: 'INDIVIDUAL',
          roles: ['BENEFICIAL_OWNER'],
          individualDetails: {
            firstName: 'Wendy',
            lastName: 'Darling',
            natureOfOwnership: 'Indirect',
          },
        },
      ],
    };

    render(
      <ApprovedClientMaintenance
        clientId="client-1"
        eligibility={[
          {
            country: 'US',
            organizationType: 'LIMITED_LIABILITY_COMPANY',
            operations: ['MANAGE_PROFILE', 'MANAGE_INDIRECT_OWNERSHIP'],
          },
        ]}
      />
    );

    await user.click(screen.getByRole('button', { name: /Wendy Darling/ }));

    const chain = document.querySelector('[data-ownership-chain]');
    expect(chain).toBeInTheDocument();
    const steps = chain!.querySelectorAll('li');
    expect(steps).toHaveLength(3);
    expect(steps[0]).toHaveTextContent('Marketplace Vendor LLC');
    expect(steps[0]).toHaveTextContent('Your business');
    expect(steps[1]).toHaveTextContent('Darling Holdings LLC');
    expect(steps[1]).toHaveTextContent('Intermediary owner');
    expect(steps[2]).toHaveTextContent('Wendy Darling');
    expect(steps[2]).toHaveTextContent('This person');

    expect(
      screen.getByRole('button', { name: 'View ownership structure' })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Change to indirect ownership' })
    ).not.toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: 'View ownership structure' })
    );
    expect(
      screen.getByRole('heading', { name: 'Ownership structure' })
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: 'View owner details' })
    );
    expect(
      screen.getByRole('button', { name: 'Back to ownership structure' })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'View ownership structure' })
    ).not.toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: 'Back to ownership structure' })
    );
    // Viewing the structure was a lateral jump, so Back skips Wendy's page.
    await user.click(
      screen.getByRole('button', { name: 'Back to business profile' })
    );
    expect(
      screen.getByRole('heading', { name: 'Business profile' })
    ).toBeInTheDocument();
  });

  test('offers the ownership structure link even when ownership cannot be edited', async () => {
    const user = userEvent.setup();
    workspace.clientQuery.data = {
      ...approvedClient,
      parties: (approvedClient.parties ?? []).map((party) =>
        party.id === 'person-1'
          ? {
              ...party,
              roles: ['CONTROLLER', 'BENEFICIAL_OWNER'],
              individualDetails: {
                ...party.individualDetails,
                natureOfOwnership: 'Direct',
              },
            }
          : party
      ),
    };

    render(
      <ApprovedClientMaintenance
        clientId="client-1"
        eligibility={[
          {
            country: 'US',
            organizationType: 'LIMITED_LIABILITY_COMPANY',
            operations: ['MANAGE_PROFILE'],
          },
        ]}
      />
    );

    await user.click(screen.getByRole('button', { name: /Jane R Doe/ }));

    expect(
      screen.getByRole('button', { name: 'View ownership structure' })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Change to indirect ownership' })
    ).not.toBeInTheDocument();
  });

  test('keeps the intermediary ownership section when arriving from the structure', async () => {
    const user = userEvent.setup();
    workspace.clientQuery.data = {
      ...approvedClient,
      parties: [
        ...(approvedClient.parties ?? []),
        {
          id: 'intermediary-1',
          parentPartyId: 'organization-1',
          partyType: 'ORGANIZATION',
          roles: ['INTERMEDIARY_OWNER'],
          organizationDetails: {
            organizationName: 'Darling Holdings LLC',
            natureOfOwnership: 'Direct',
          },
        },
      ],
    };

    render(
      <ApprovedClientMaintenance
        clientId="client-1"
        eligibility={[
          {
            country: 'US',
            organizationType: 'LIMITED_LIABILITY_COMPANY',
            operations: ['MANAGE_PROFILE', 'MANAGE_INDIRECT_OWNERSHIP'],
          },
        ]}
      />
    );

    await user.click(
      screen.getByRole('button', { name: 'View ownership structure' })
    );
    const intermediaryNode = document.querySelector<HTMLElement>(
      '[data-ownership-node="intermediary-1"]'
    );
    await user.click(
      within(intermediaryNode!).getByRole('button', {
        name: 'View business details',
      })
    );

    expect(
      screen.getByRole('heading', { name: 'Role and ownership' })
    ).toBeInTheDocument();
    expect(
      document.querySelector('[data-ownership-chain]')
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'View ownership structure' })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Back to ownership structure' })
    ).toBeInTheDocument();
  });

  test('promotes an intermediary ownership chain before removing it', async () => {
    const user = userEvent.setup();
    workspace.clientQuery.data = {
      ...approvedClient,
      parties: [
        ...(approvedClient.parties ?? []),
        {
          id: 'intermediary-1',
          parentPartyId: 'organization-1',
          partyType: 'ORGANIZATION',
          roles: ['INTERMEDIARY_OWNER'],
          organizationDetails: {
            organizationName: 'Darling Holdings LLC',
            organizationType: 'LIMITED_LIABILITY_COMPANY',
            countryOfFormation: 'US',
            addresses: [
              {
                addressType: 'LEGAL_ADDRESS',
                addressLines: ['200 Market Street'],
                city: 'San Francisco',
                state: 'CA',
                postalCode: '94105',
                country: 'US',
              },
            ],
          },
        },
        {
          id: 'person-2',
          parentPartyId: 'intermediary-1',
          partyType: 'INDIVIDUAL',
          roles: ['BENEFICIAL_OWNER'],
          individualDetails: {
            firstName: 'Wendy',
            lastName: 'Darling',
            natureOfOwnership: 'Indirect',
          },
        },
      ],
    };

    render(
      <ApprovedClientMaintenance
        clientId="client-1"
        eligibility={[
          {
            country: 'US',
            organizationType: 'LIMITED_LIABILITY_COMPANY',
            operations: ['MANAGE_PROFILE', 'MANAGE_INDIRECT_OWNERSHIP'],
          },
        ]}
      />
    );

    await user.click(
      screen.getByRole('button', { name: /^Darling Holdings LLC/ })
    );

    expect(
      screen.getByRole('heading', { name: 'Role and ownership' })
    ).toBeInTheDocument();
    const branchPreview = document.querySelector(
      '[data-role="INTERMEDIARY_OWNER"]'
    );
    expect(branchPreview).toHaveTextContent('Marketplace Vendor LLC');
    expect(branchPreview).toHaveTextContent('Darling Holdings LLC');
    expect(branchPreview).toHaveTextContent('Wendy Darling');
    const intermediaryHeader = screen
      .getByRole('heading', { name: 'Darling Holdings LLC' })
      .closest('header');
    expect(
      within(intermediaryHeader!).getByRole('button', {
        name: 'Edit business details',
      })
    ).toBeInTheDocument();
    expect(
      within(intermediaryHeader!).getByRole('button', {
        name: 'Remove from ownership profile',
      })
    ).toBeInTheDocument();

    await user.click(
      within(intermediaryHeader!).getByRole('button', {
        name: 'Remove from ownership profile',
      })
    );

    const removalDialog = screen.getByRole('alertdialog');
    expect(removalDialog).toHaveTextContent('Keep them');
    expect(removalDialog).toHaveTextContent(
      'Wendy Darling will connect directly to Marketplace Vendor LLC'
    );
    expect(removalDialog).toHaveTextContent('Remove them too');

    await user.click(
      within(removalDialog).getByRole('button', {
        name: 'Keep owners and update profile',
      })
    );

    expect(applyOwnershipOperations).toHaveBeenCalledWith([
      { partyId: 'person-2', request: { parentPartyId: 'organization-1' } },
      {
        partyId: 'person-2',
        request: { individualDetails: { natureOfOwnership: 'Direct' } },
      },
      { partyId: 'intermediary-1', request: { active: false } },
    ]);
  });

  test('removes an intermediary that has no dependent ownership chain', async () => {
    const user = userEvent.setup();
    workspace.clientQuery.data = {
      ...approvedClient,
      parties: [
        ...(approvedClient.parties ?? []),
        {
          id: 'intermediary-1',
          parentPartyId: 'organization-1',
          partyType: 'ORGANIZATION',
          roles: ['INTERMEDIARY_OWNER'],
          organizationDetails: {
            organizationName: 'Darling Holdings LLC',
            organizationType: 'LIMITED_LIABILITY_COMPANY',
            countryOfFormation: 'US',
          },
        },
      ],
    };
    updateParty.mockResolvedValue(undefined);

    render(
      <ApprovedClientMaintenance
        clientId="client-1"
        eligibility={[
          {
            country: 'US',
            organizationType: 'LIMITED_LIABILITY_COMPANY',
            operations: ['MANAGE_PROFILE', 'MANAGE_INDIRECT_OWNERSHIP'],
          },
        ]}
      />
    );

    await user.click(
      screen.getByRole('button', { name: /Darling Holdings LLC/ })
    );
    await user.click(
      screen.getByRole('button', { name: 'Remove from ownership profile' })
    );
    await user.click(
      within(screen.getByRole('alertdialog')).getByRole('button', {
        name: 'Remove from ownership profile',
      })
    );

    expect(applyOwnershipOperations).toHaveBeenCalledWith([
      { partyId: 'intermediary-1', request: { active: false } },
    ]);
  });

  test('moves an indirect owner from the ownership edit workspace', async () => {
    const user = userEvent.setup();
    workspace.clientQuery.data = {
      ...approvedClient,
      parties: [
        ...(approvedClient.parties ?? []),
        {
          id: 'intermediary-1',
          parentPartyId: 'organization-1',
          partyType: 'ORGANIZATION',
          roles: ['INTERMEDIARY_OWNER'],
          organizationDetails: {
            organizationName: 'Darling Holdings LLC',
            organizationType: 'LIMITED_LIABILITY_COMPANY',
            countryOfFormation: 'US',
          },
        },
        {
          id: 'person-2',
          parentPartyId: 'intermediary-1',
          partyType: 'INDIVIDUAL',
          roles: ['BENEFICIAL_OWNER'],
          individualDetails: {
            firstName: 'Wendy',
            lastName: 'Darling',
            natureOfOwnership: 'Indirect',
          },
        },
      ],
    };

    render(
      <ApprovedClientMaintenance
        clientId="client-1"
        eligibility={[
          {
            country: 'US',
            organizationType: 'LIMITED_LIABILITY_COMPANY',
            operations: ['MANAGE_PROFILE', 'MANAGE_INDIRECT_OWNERSHIP'],
          },
        ]}
      />
    );

    await user.click(
      screen.getByRole('button', { name: 'View ownership structure' })
    );
    expect(
      screen.queryByRole('menuitem', { name: /^Update connection/ })
    ).not.toBeInTheDocument();
    await clickOwnershipMenuItem(user, 'Wendy Darling', 'Update connection');
    await user.click(screen.getByLabelText('Marketplace Vendor LLC'));
    await user.click(screen.getByRole('button', { name: 'Update connection' }));

    expect(applyOwnershipOperations).toHaveBeenCalledWith([
      { partyId: 'person-2', request: { parentPartyId: 'organization-1' } },
      {
        partyId: 'person-2',
        request: { individualDetails: { natureOfOwnership: 'Direct' } },
      },
    ]);
  });

  test('removes an entire intermediary branch from the strategy chooser', async () => {
    const user = userEvent.setup();
    workspace.clientQuery.data = {
      ...approvedClient,
      parties: [
        ...(approvedClient.parties ?? []),
        {
          id: 'intermediary-1',
          parentPartyId: 'organization-1',
          partyType: 'ORGANIZATION',
          roles: ['INTERMEDIARY_OWNER'],
          organizationDetails: {
            organizationName: 'Darling Holdings LLC',
            organizationType: 'LIMITED_LIABILITY_COMPANY',
            countryOfFormation: 'US',
          },
        },
        {
          id: 'person-2',
          parentPartyId: 'intermediary-1',
          partyType: 'INDIVIDUAL',
          roles: ['BENEFICIAL_OWNER'],
          individualDetails: {
            firstName: 'Wendy',
            lastName: 'Darling',
            natureOfOwnership: 'Indirect',
          },
        },
      ],
    };

    render(
      <ApprovedClientMaintenance
        clientId="client-1"
        eligibility={[
          {
            country: 'US',
            organizationType: 'LIMITED_LIABILITY_COMPANY',
            operations: ['MANAGE_PROFILE', 'MANAGE_INDIRECT_OWNERSHIP'],
          },
        ]}
      />
    );

    await user.click(
      screen.getByRole('button', { name: /^Darling Holdings LLC/ })
    );
    await user.click(
      screen.getByRole('button', { name: 'Remove from ownership profile' })
    );
    await user.click(
      screen.getByRole('radio', {
        name: /Remove them too/,
      })
    );
    await user.click(
      screen.getByRole('button', {
        name: 'Remove all from ownership profile',
      })
    );

    expect(applyOwnershipOperations).toHaveBeenCalledWith([
      { partyId: 'person-2', request: { active: false } },
      { partyId: 'intermediary-1', request: { active: false } },
    ]);
  });

  test('guards dirty add-form navigation before leaving ownership', async () => {
    const user = userEvent.setup();
    render(
      <ApprovedClientMaintenance
        clientId="client-1"
        eligibility={[
          {
            country: 'US',
            organizationType: 'LIMITED_LIABILITY_COMPANY',
            operations: ['MANAGE_PROFILE', 'MANAGE_INDIRECT_OWNERSHIP'],
          },
        ]}
      />
    );

    await user.click(
      screen.getByRole('button', { name: 'View ownership structure' })
    );
    await user.click(
      within(getOwnershipAddRow('organization-1')!).getByRole('button', {
        name: 'Add intermediary business',
      })
    );
    await user.type(
      screen.getByLabelText('Legal name of the company'),
      'Central Park Cookie'
    );
    await user.click(screen.getByRole('button', { name: 'Back' }));

    const dialog = screen.getByRole('alertdialog');
    expect(dialog).toHaveTextContent('Discard this unsaved entry?');
    await user.click(
      within(dialog).getByRole('button', { name: 'Keep editing' })
    );
    expect(screen.getByLabelText('Legal name of the company')).toHaveValue(
      'Central Park Cookie'
    );
  });

  test('maps intermediary API validation errors to the owning field', async () => {
    const user = userEvent.setup();
    createParty.mockRejectedValue({
      response: {
        data: {
          context: [
            {
              field: '$.organizationDetails.organizationIds[0].value',
              message: 'The EIN [050110294] is already in use.',
            },
          ],
        },
      },
    });
    render(
      <ApprovedClientMaintenance
        clientId="client-1"
        eligibility={[
          {
            country: 'US',
            organizationType: 'LIMITED_LIABILITY_COMPANY',
            operations: ['MANAGE_PROFILE', 'MANAGE_INDIRECT_OWNERSHIP'],
          },
        ]}
      />
    );

    await user.click(
      screen.getByRole('button', { name: 'View ownership structure' })
    );
    await user.click(
      within(getOwnershipAddRow('organization-1')!).getByRole('button', {
        name: 'Add intermediary business',
      })
    );
    await user.type(
      screen.getByLabelText('Legal name of the company'),
      'Central Park Cookie'
    );
    await user.click(screen.getByLabelText('Organization type'));
    await user.click(screen.getByRole('option', { name: /C corporation/i }));
    const ein = screen.getByLabelText(/Employer Identification Number/);
    await user.type(ein, '050110294');
    await user.type(screen.getByLabelText('Address line 1'), '124 Central Se');
    await user.type(screen.getByLabelText('City / Town'), 'Palo Alto');
    await user.click(screen.getByLabelText('State'));
    await user.click(screen.getByRole('option', { name: 'California' }));
    await user.type(screen.getByLabelText('ZIP code'), '94303');
    await user.click(
      screen.getByRole('button', { name: 'Add intermediary owner' })
    );

    expect(createParty).toHaveBeenCalledTimes(1);
    await waitFor(() =>
      expect(ein).toHaveAccessibleDescription(
        /Server Error: The EIN 050110294 is already in use\./
      )
    );
    expect(ein).toHaveFocus();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  test('creates an indirect beneficial owner beneath its intermediary parent', async () => {
    const user = userEvent.setup();
    createParty.mockResolvedValue(undefined);
    workspace.clientQuery.data = {
      ...approvedClient,
      parties: [
        ...(approvedClient.parties ?? []),
        {
          id: 'intermediary-1',
          partyType: 'ORGANIZATION',
          roles: ['INTERMEDIARY_OWNER'],
          organizationDetails: {
            organizationName: 'Darling Holdings LLC',
            natureOfOwnership: 'Direct',
          },
        },
      ],
    };
    render(
      <ApprovedClientMaintenance
        clientId="client-1"
        eligibility={[
          {
            country: 'US',
            organizationType: 'LIMITED_LIABILITY_COMPANY',
            operations: ['MANAGE_PROFILE', 'MANAGE_INDIRECT_OWNERSHIP'],
          },
        ]}
      />
    );

    await user.click(
      screen.getByRole('button', { name: 'View ownership structure' })
    );
    await user.click(
      within(getOwnershipAddRow('intermediary-1')!).getByRole('button', {
        name: 'Add beneficial owner',
      })
    );
    await user.type(screen.getByLabelText('First name'), 'Peter');
    await user.type(screen.getByLabelText('Last name'), 'Pan');
    await fillRequiredAddPersonFields(user, '1985-02-14');
    await user.type(
      screen.getByLabelText(/Social security number \(SSN\)/i),
      '111223333'
    );
    await user.type(screen.getByLabelText('Address line 1'), '1 Neverland Way');
    await user.type(screen.getByLabelText('City / Town'), 'New York');
    await user.click(screen.getByLabelText('State'));
    await user.click(screen.getByRole('option', { name: 'New York' }));
    await user.type(screen.getByLabelText('ZIP code'), '10001');
    await user.click(
      screen.getByRole('button', { name: 'Add beneficial owner' })
    );

    expect(createParty).toHaveBeenCalledWith({
      partyType: 'INDIVIDUAL',
      parentPartyId: 'intermediary-1',
      email: 'owner@example.com',
      roles: ['BENEFICIAL_OWNER'],
      individualDetails: {
        firstName: 'Peter',
        middleName: undefined,
        lastName: 'Pan',
        birthDate: '1985-02-14',
        countryOfResidence: 'US',
        natureOfOwnership: 'Indirect',
        jobTitle: 'CEO',
        jobTitleDescription: undefined,
        phone: undefined,
        addresses: [
          {
            addressType: 'RESIDENTIAL_ADDRESS',
            addressLines: ['1 Neverland Way'],
            city: 'New York',
            state: 'NY',
            postalCode: '10001',
            country: 'US',
          },
        ],
        individualIds: [{ idType: 'SSN', value: '111223333', issuer: 'US' }],
      },
    });
  });

  test('moves a controller owner beneath a new intermediary as one party', async () => {
    const user = userEvent.setup();
    workspace.clientQuery.data = {
      ...approvedClient,
      parties: (approvedClient.parties ?? []).map((party) =>
        party.id === 'person-1'
          ? {
              ...party,
              parentPartyId: 'organization-1',
              roles: ['CONTROLLER', 'BENEFICIAL_OWNER'],
              individualDetails: {
                ...party.individualDetails,
                birthDate: '1990-05-12',
                countryOfResidence: 'US',
                natureOfOwnership: 'Direct',
                addresses: [
                  {
                    addressType: 'RESIDENTIAL_ADDRESS',
                    addressLines: ['14 Market Street'],
                    city: 'New York',
                    state: 'NY',
                    postalCode: '10001',
                    country: 'US',
                  },
                ],
                individualIds: [
                  { idType: 'SSN', value: '555110000', issuer: 'US' },
                ],
              },
            }
          : party
      ),
    };
    createParty.mockResolvedValueOnce({ id: 'intermediary-1' });
    updateParty.mockResolvedValue(undefined);

    render(
      <ApprovedClientMaintenance
        clientId="client-1"
        eligibility={[
          {
            country: 'US',
            organizationType: 'LIMITED_LIABILITY_COMPANY',
            operations: ['MANAGE_PROFILE', 'MANAGE_INDIRECT_OWNERSHIP'],
          },
        ]}
      />
    );

    await user.click(
      screen.getByRole('button', { name: 'View ownership structure' })
    );
    await clickOwnershipMenuItem(
      user,
      'Jane R Doe',
      'Change to indirect ownership'
    );
    expect(
      screen.getByRole('heading', {
        name: 'Choose where Jane R Doe connects',
      })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Owns your business directly/ })
    ).not.toBeInTheDocument();
    await user.click(
      screen.getByRole('button', {
        name: 'Add a new intermediary business',
      })
    );
    await user.type(
      screen.getByLabelText('Legal name of the company'),
      'Darling Holdings LLC'
    );
    await user.click(screen.getByLabelText('Organization type'));
    await user.click(
      screen.getByRole('option', { name: /Limited Liability Company/ })
    );
    await user.type(
      screen.getByLabelText(/Employer Identification Number/),
      '121234567'
    );
    await user.type(
      screen.getByLabelText('Address line 1'),
      '200 Market Street'
    );
    await user.type(screen.getByLabelText('City / Town'), 'New York');
    await user.click(screen.getByLabelText('State'));
    await user.click(screen.getByRole('option', { name: 'New York' }));
    await user.type(screen.getByLabelText('ZIP code'), '10001');
    await user.click(
      screen.getByRole('button', { name: 'Add intermediary owner' })
    );

    expect(createParty).toHaveBeenCalledTimes(1);
    expect(applyOwnershipOperations).toHaveBeenCalledWith([
      { partyId: 'person-1', request: { parentPartyId: 'intermediary-1' } },
      {
        partyId: 'person-1',
        request: { individualDetails: { natureOfOwnership: 'Indirect' } },
      },
    ]);
    expect(updateParty).not.toHaveBeenCalled();
    expect(
      screen.getByRole('heading', { name: 'Ownership structure' })
    ).toBeInTheDocument();
  });

  test('moves a direct owner beneath an existing intermediary', async () => {
    const user = userEvent.setup();
    workspace.clientQuery.data = {
      ...approvedClient,
      parties: [
        ...(approvedClient.parties ?? []).map((party) =>
          party.id === 'person-1'
            ? {
                ...party,
                parentPartyId: 'organization-1',
                roles: ['CONTROLLER', 'BENEFICIAL_OWNER'],
                email: 'jane@example.com',
                individualDetails: {
                  ...party.individualDetails,
                  birthDate: '1990-05-12',
                  countryOfResidence: 'US',
                  jobTitle: 'CEO',
                  natureOfOwnership: 'Direct',
                  addresses: [
                    {
                      addressType: 'RESIDENTIAL_ADDRESS',
                      addressLines: ['14 Market Street'],
                      city: 'New York',
                      state: 'NY',
                      postalCode: '10001',
                      country: 'US',
                    },
                  ],
                  individualIds: [
                    { idType: 'SSN', value: '555110000', issuer: 'US' },
                  ],
                },
              }
            : party
        ),
        {
          id: 'intermediary-existing',
          parentPartyId: 'organization-1',
          partyType: 'ORGANIZATION',
          roles: ['INTERMEDIARY_OWNER'],
          organizationDetails: {
            organizationName: 'Existing Holdings LLC',
            natureOfOwnership: 'Direct',
          },
        },
      ],
    };
    createParty.mockResolvedValue({ id: 'indirect-owner-1' });
    updateParty.mockResolvedValue(undefined);

    render(
      <ApprovedClientMaintenance
        clientId="client-1"
        eligibility={[
          {
            country: 'US',
            organizationType: 'LIMITED_LIABILITY_COMPANY',
            operations: ['MANAGE_PROFILE', 'MANAGE_INDIRECT_OWNERSHIP'],
          },
        ]}
      />
    );

    await user.click(
      screen.getByRole('button', { name: 'View ownership structure' })
    );
    await clickOwnershipMenuItem(
      user,
      'Jane R Doe',
      'Change to indirect ownership'
    );
    await user.click(
      screen.getByRole('button', { name: /Existing Holdings LLC/ })
    );

    expect(applyOwnershipOperations).toHaveBeenCalledWith([
      {
        partyId: 'person-1',
        request: { parentPartyId: 'intermediary-existing' },
      },
      {
        partyId: 'person-1',
        request: { individualDetails: { natureOfOwnership: 'Indirect' } },
      },
    ]);
    expect(createParty).not.toHaveBeenCalled();
    expect(updateParty).not.toHaveBeenCalled();
  });

  test('unlocks nothing when indirect ownership is configured without profile management', async () => {
    const user = userEvent.setup();
    render(
      <ApprovedClientMaintenance
        clientId="client-1"
        eligibility={[
          {
            country: 'US',
            organizationType: 'LIMITED_LIABILITY_COMPANY',
            operations: ['MANAGE_INDIRECT_OWNERSHIP'],
          },
        ]}
      />
    );

    expect(
      screen.queryByRole('button', { name: 'Add Limited DDA Payments' })
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Jane R Doe/ }));
    expect(
      screen.queryByRole('button', { name: 'Edit details' })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Replace controller' })
    ).not.toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: 'Back to business profile' })
    );
    await user.click(
      screen.getByRole('button', { name: 'View ownership structure' })
    );
    expect(
      screen.queryByRole('button', { name: 'Add beneficial owner' })
    ).not.toBeInTheDocument();
  });

  test('stops offering beneficial-owner addition once four owners are proposed', async () => {
    const user = userEvent.setup();
    workspace.clientQuery.data = {
      ...approvedClient,
      parties: [
        ...(approvedClient.parties ?? []),
        ...Array.from({ length: 4 }, (_, index) => ({
          id: `owner-${index + 1}`,
          partyType: 'INDIVIDUAL' as const,
          roles: ['BENEFICIAL_OWNER'],
          individualDetails: {
            firstName: `Owner ${index + 1}`,
            lastName: 'Example',
          },
        })),
      ],
    };
    render(
      <ApprovedClientMaintenance
        clientId="client-1"
        eligibility={[
          {
            country: 'US',
            organizationType: 'LIMITED_LIABILITY_COMPANY',
            operations: ['MANAGE_PROFILE'],
          },
        ]}
      />
    );

    await user.click(
      screen.getByRole('button', { name: 'View ownership structure' })
    );

    // The limit is a state, not a permission, so the action stays visible and explains itself.
    expect(
      screen.getByRole('button', { name: 'Add beneficial owner' })
    ).toBeDisabled();
    expect(
      screen.getByRole('button', { name: 'Add beneficial owner' })
    ).toHaveAttribute('title', 'You can list up to 4 beneficial owners.');
    expect(
      screen.queryByRole('button', { name: 'Choose replacement controller' })
    ).not.toBeInTheDocument();
  });

  test('returns an organization edit to the review page after save', async () => {
    const user = userEvent.setup();
    updateParty.mockResolvedValue(undefined);
    workspace.maintenanceQuery.data = {
      pages: [],
      parties: [
        {
          id: 'organization-1',
          partyType: 'ORGANIZATION',
          organizationDetails: {
            organizationName: 'Marketplace Vendor LLC',
            dbaName: 'Marketplace Collective',
            countryOfFormation: 'US',
            organizationType: 'LIMITED_LIABILITY_COMPANY',
            addresses: [
              {
                addressType: 'BUSINESS_ADDRESS',
                addressLines: ['100 Market Street'],
                city: 'San Francisco',
                state: 'CA',
                postalCode: '94105',
                country: 'US',
              },
            ],
          },
          updateRequest: {
            status: 'NEW',
            action: 'MODIFY',
            requestId: 'request-1',
            submittedAt: '2026-08-26T12:00:00.000Z',
          },
        },
      ],
    };
    render(
      <ApprovedClientMaintenance
        clientId="client-1"
        eligibility={[
          {
            country: 'US',
            organizationType: 'LIMITED_LIABILITY_COMPANY',
            operations: ['MANAGE_PROFILE'],
          },
        ]}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Review and submit' }));
    const businessChange = document.querySelector<HTMLElement>(
      '[data-review-change="organization"]'
    )!;
    expect(businessChange).toHaveTextContent('Marketplace Vendor LLC');
    expect(businessChange).toHaveTextContent('Business details');
    await user.click(
      within(businessChange).getByRole('button', {
        name: 'Actions for Marketplace Vendor LLC',
      })
    );
    await user.click(
      screen.getByRole('menuitem', { name: /^Add or edit changes/ })
    );
    const dbaName = screen.getByLabelText(/Doing business as/);
    await user.clear(dbaName);
    await user.type(dbaName, 'Marketplace Books');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));

    expect(updateParty).toHaveBeenCalledWith('organization-1', {
      organizationDetails: { dbaName: 'Marketplace Books' },
    });
    expect(
      screen.getByRole('heading', { name: 'Review your changes' })
    ).toBeInTheDocument();
  });

  test('removes a beneficial owner with a sparse active false update', async () => {
    const user = userEvent.setup();
    workspace.clientQuery.data = {
      ...approvedClient,
      parties: [
        ...(approvedClient.parties ?? []),
        {
          id: 'person-2',
          partyType: 'INDIVIDUAL',
          roles: ['BENEFICIAL_OWNER'],
          individualDetails: { firstName: 'Wendy', lastName: 'Darling' },
        },
      ],
    };
    updateParty.mockResolvedValue(undefined);
    render(
      <ApprovedClientMaintenance
        clientId="client-1"
        eligibility={[
          {
            country: 'US',
            organizationType: 'LIMITED_LIABILITY_COMPANY',
            operations: ['MANAGE_PROFILE'],
          },
        ]}
      />
    );

    await user.click(screen.getByRole('button', { name: /Wendy Darling/ }));
    const partyHeader = screen
      .getByRole('heading', { name: 'Wendy Darling' })
      .closest('header');
    expect(
      within(partyHeader!).getByRole('button', { name: 'Edit details' })
    ).toBeInTheDocument();
    expect(
      within(partyHeader!).getByRole('button', {
        name: 'Remove from business profile',
      })
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole('button', { name: 'Remove from business profile' })
    );
    await user.click(
      within(screen.getByRole('alertdialog')).getByRole('button', {
        name: 'Remove from business profile',
      })
    );
    expect(updateParty).toHaveBeenCalledWith('person-2', { active: false });
    expect(
      screen.getByRole('heading', { name: 'Wendy Darling' })
    ).toBeInTheDocument();
  });

  test('separates overview sections with a label gutter and bounded content groups', () => {
    render(
      <ApprovedClientMaintenance clientId="client-1" eligibility={eligible} />
    );

    ['Business details', 'Products', 'Related parties'].forEach((heading) => {
      const sectionHeading = screen.getByRole('heading', { name: heading });
      expect(sectionHeading.closest('section')).toHaveClass(
        'eb-grid',
        'eb-bg-muted/20',
        '@[48rem]:eb-grid-cols-[minmax(8rem,1fr)_2.5fr]'
      );
    });

    ['Business details', 'Related parties'].forEach((heading) => {
      const sectionHeading = screen.getByRole('heading', { name: heading });
      const sectionContent = sectionHeading.parentElement?.nextElementSibling;
      expect(sectionContent).toHaveClass(
        'eb-rounded-md',
        'eb-border',
        'eb-bg-background'
      );
    });

    const productTree = document.querySelector('[data-product-tree]');
    expect(productTree).toHaveClass('eb-bg-background');
    expect(productTree).not.toHaveClass('eb-rounded-md', 'eb-border');

    ['Products', 'Related parties'].forEach((heading) => {
      expect(
        screen.getByRole('heading', { name: heading }).closest('section')
      ).toHaveClass('eb-border-t');
    });

    expect(
      screen.getByText('Current business information')
    ).toBeInTheDocument();
    expect(screen.getByText('1 active product')).toBeInTheDocument();
    expect(
      screen.getByText('Key roles and intermediary businesses')
    ).toBeInTheDocument();
    expect(screen.getByText('Controller')).toBeInTheDocument();
  });

  test('matches the sidebar action to the state of the pending changes', async () => {
    const user = userEvent.setup();
    const widthSpy = vi
      .spyOn(HTMLElement.prototype, 'offsetWidth', 'get')
      .mockReturnValue(1200);
    workspace.clientQuery.data = {
      ...approvedClient,
      updateRequest: {
        requestId: 'request-1',
        status: 'REVIEW_IN_PROGRESS',
      },
    };
    workspace.maintenanceQuery.data = {
      pages: [],
      parties: [
        {
          id: 'person-1',
          partyType: 'INDIVIDUAL',
          roles: ['CONTROLLER'],
          individualDetails: { lastName: 'Diaz' },
          updateRequest: {
            status: 'REVIEW_IN_PROGRESS',
            action: 'MODIFY',
            requestId: 'request-1',
            submittedAt: '2026-09-03T10:00:00.000Z',
          },
        },
      ],
    };

    render(
      <ApprovedClientMaintenance clientId="client-1" eligibility={eligible} />
    );

    await user.click(
      screen.getByRole('button', { name: /Marketplace Vendor LLC/ })
    );

    const sidebar = document.querySelector(
      '[data-maintenance-navigator]'
    ) as HTMLElement;
    expect(
      sidebar.querySelector('[data-navigator-request-state]')
    ).toHaveAttribute('data-navigator-request-state', 'submitted');
    expect(
      within(sidebar).queryByRole('button', { name: /Review and submit/ })
    ).not.toBeInTheDocument();
    const requestGroup = sidebar.querySelector<HTMLElement>(
      '[data-navigator-request-state]'
    )!;
    expect(requestGroup).toHaveTextContent('Maintenance request');
    const requestRow = within(requestGroup).getByRole('button', {
      name: /Request details.*Maintenance request submitted/,
    });
    // One control per row: no button nested inside the clickable row.
    expect(
      requestRow.querySelector('button, [class*="eb-bg-primary"]')
    ).toBeNull();
    // Neutral background so the shared active highlight reads the same as other rows.
    expect(requestGroup.className).not.toMatch(/eb-bg-(informative|warning)/);
    expect(requestRow.querySelector('.lucide-chevron-right')).not.toBeNull();
    const janeRow = within(sidebar).getByRole('button', {
      name: /Jane.*Diaz/,
    });
    expect(
      janeRow.querySelector('[data-party-status="changeUnderReview"]')
    ).toHaveTextContent('Changes under review');
    expect(janeRow).toHaveTextContent('Controller');

    await user.click(requestRow);
    expect(
      screen.getByRole('heading', { name: 'Maintenance request' })
    ).toBeInTheDocument();
    expect(
      within(
        document.querySelector<HTMLElement>(
          '[data-maintenance-navigator] [data-navigator-request-state]'
        )!
      ).getByRole('button', { name: /Request details/ })
    ).toHaveAttribute('aria-current', 'page');

    widthSpy.mockRestore();
  });

  test('keeps the overview beside active detail content in a wide container', async () => {
    const user = userEvent.setup();
    const widthSpy = vi
      .spyOn(HTMLElement.prototype, 'offsetWidth', 'get')
      .mockReturnValue(1200);

    render(
      <ApprovedClientMaintenance clientId="client-1" eligibility={eligible} />
    );

    await user.click(
      screen.getByRole('button', { name: /Marketplace Vendor LLC/ })
    );

    const splitLayout = document.querySelector(
      '[data-maintenance-layout="split"]'
    );
    expect(splitLayout).toHaveClass(
      'eb-grid',
      'eb-grid-cols-[minmax(0,17rem)_minmax(0,1fr)]'
    );
    expect(splitLayout?.querySelector('aside')).toHaveClass(
      'eb-sticky',
      'eb-overflow-y-auto'
    );
    expect(splitLayout?.querySelector('main')).toHaveClass(
      'eb-overflow-y-auto',
      'eb-@container'
    );
    const sidebar = splitLayout?.querySelector(
      '[data-maintenance-navigator]'
    ) as HTMLElement;
    expect(sidebar).toBeInTheDocument();
    expect(
      within(sidebar).queryByRole('heading', { name: 'Business profile' })
    ).not.toBeInTheDocument();
    expect(
      within(sidebar).getByRole('button', { name: 'Business profile' })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('navigation', { name: 'Business profile navigation' })
    ).not.toBeInTheDocument();
    const businessDetails = within(sidebar).getByRole('button', {
      name: /Marketplace Vendor LLC.*Business details/,
    });
    expect(businessDetails).toHaveAttribute('aria-current', 'page');
    expect(sidebar).toHaveTextContent('Related parties');
    expect(sidebar).not.toHaveTextContent(/^People$|Businesses/);
    expect(sidebar.querySelector('[data-pending-change]')).toBeNull();
    expect(
      within(sidebar).getByRole('button', { name: 'Ownership structure' })
    ).not.toHaveAttribute('aria-current');
    expect(
      within(sidebar).getByRole('button', { name: /Jane R Doe/ })
    ).toBeInTheDocument();
    expect(
      within(splitLayout?.querySelector('main') as HTMLElement).getByRole(
        'heading',
        { name: 'Marketplace Vendor LLC' }
      )
    ).toBeInTheDocument();

    await user.click(
      within(sidebar).getByRole('button', { name: /Jane R Doe/ })
    );
    expect(
      within(splitLayout?.querySelector('main') as HTMLElement).getByRole(
        'heading',
        { name: 'Jane R Doe' }
      )
    ).toBeInTheDocument();
    expect(
      within(sidebar).getByRole('button', { name: /Jane R Doe/ })
    ).toHaveAttribute('aria-current', 'page');

    await user.click(
      within(splitLayout?.querySelector('main') as HTMLElement).getByRole(
        'button',
        { name: 'Edit details' }
      )
    );
    expect(
      within(sidebar).getByRole('button', { name: /Jane R Doe/ })
    ).toHaveAttribute('aria-current', 'page');

    widthSpy.mockRestore();
  });

  test('shows breadcrumbs only when the navigator sidebar is hidden', async () => {
    const user = userEvent.setup();
    render(
      <ApprovedClientMaintenance clientId="client-1" eligibility={eligible} />
    );

    await user.click(
      screen.getByRole('button', { name: /Marketplace Vendor LLC/ })
    );

    expect(
      document.querySelector('[data-maintenance-navigator]')
    ).not.toBeInTheDocument();
    const breadcrumb = screen.getByRole('navigation', {
      name: 'Business profile navigation',
    });
    expect(breadcrumb).toHaveTextContent('Business profile');
    expect(breadcrumb).toHaveTextContent('Business details');
  });

  test('marks related parties with the same entity medallions as the ownership structure', async () => {
    const user = userEvent.setup();
    const widthSpy = vi
      .spyOn(HTMLElement.prototype, 'offsetWidth', 'get')
      .mockReturnValue(1200);
    workspace.clientQuery.data = {
      ...approvedClient,
      parties: [
        ...(approvedClient.parties ?? []),
        {
          id: 'intermediary-1',
          parentPartyId: 'organization-1',
          partyType: 'ORGANIZATION',
          roles: ['INTERMEDIARY_OWNER'],
          organizationDetails: {
            organizationName: 'Darling Holdings LLC',
            natureOfOwnership: 'Direct',
          },
        },
      ],
    };
    workspace.maintenanceQuery.data = {
      pages: [],
      parties: [
        {
          id: 'person-2',
          parentPartyId: 'organization-1',
          partyType: 'INDIVIDUAL',
          roles: ['BENEFICIAL_OWNER'],
          individualDetails: {
            firstName: 'Wendy',
            lastName: 'Darling',
            natureOfOwnership: 'Direct',
          },
          updateRequest: {
            status: 'NEW',
            action: 'ADD',
            requestId: 'request-1',
            submittedAt: '2026-09-03T10:00:00.000Z',
          },
        },
      ],
    };

    render(
      <ApprovedClientMaintenance clientId="client-1" eligibility={eligible} />
    );

    const personMedallion = document.querySelector(
      '[data-party-id="person-1"] [data-entity-medallion]'
    );
    const intermediaryMedallion = document.querySelector(
      '[data-party-id="intermediary-1"] [data-entity-medallion]'
    );
    const pendingMedallion = document.querySelector(
      '[data-party-id="person-2"] [data-entity-medallion]'
    );
    expect(personMedallion).toHaveAttribute('data-entity-medallion', 'person');
    expect(intermediaryMedallion).toHaveAttribute(
      'data-entity-medallion',
      'business'
    );
    expect(pendingMedallion).toHaveClass('eb-bg-informative-accent');
    expect(personMedallion).toHaveClass('eb-bg-muted');

    await user.click(
      screen.getByRole('button', { name: /Marketplace Vendor LLC/ })
    );
    const sidebar = document.querySelector(
      '[data-maintenance-navigator]'
    ) as HTMLElement;
    expect(
      within(sidebar)
        .getByRole('button', { name: /Darling Holdings LLC/ })
        .querySelector('[data-entity-medallion]')
    ).toHaveAttribute('data-entity-medallion', 'business');
    expect(
      within(sidebar)
        .getByRole('button', { name: /Wendy Darling/ })
        .querySelector('[data-entity-medallion]')
    ).toHaveClass('eb-bg-informative-accent');
    expect(sidebar).toHaveTextContent(/Related parties\s*3/);

    widthSpy.mockRestore();
  });

  test('distinguishes edits, additions, and removals in the sidebar without displacing roles', async () => {
    const user = userEvent.setup();
    const widthSpy = vi
      .spyOn(HTMLElement.prototype, 'offsetWidth', 'get')
      .mockReturnValue(1200);
    workspace.clientQuery.data = {
      ...approvedClient,
      parties: [
        ...(approvedClient.parties ?? []),
        {
          id: 'intermediary-1',
          parentPartyId: 'organization-1',
          partyType: 'ORGANIZATION',
          roles: ['INTERMEDIARY_OWNER'],
          organizationDetails: {
            organizationName: 'Darling Holdings LLC',
            natureOfOwnership: 'Direct',
          },
        },
      ],
    };
    const newRequest = {
      status: 'NEW' as const,
      requestId: 'request-1',
      submittedAt: '2026-09-03T10:00:00.000Z',
    };
    workspace.maintenanceQuery.data = {
      pages: [],
      parties: [
        {
          id: 'person-1',
          partyType: 'INDIVIDUAL',
          individualDetails: { lastName: 'Diaz' },
          updateRequest: { ...newRequest, action: 'MODIFY' },
        },
        {
          id: 'person-2',
          parentPartyId: 'organization-1',
          partyType: 'INDIVIDUAL',
          roles: ['BENEFICIAL_OWNER'],
          individualDetails: {
            firstName: 'Wendy',
            lastName: 'Darling',
            natureOfOwnership: 'Direct',
          },
          updateRequest: { ...newRequest, action: 'ADD' },
        },
        {
          id: 'intermediary-1',
          partyType: 'ORGANIZATION',
          active: false,
          updateRequest: { ...newRequest, action: 'MODIFY' },
        },
      ],
    };

    render(
      <ApprovedClientMaintenance clientId="client-1" eligibility={eligible} />
    );
    await user.click(
      screen.getByRole('button', { name: /Marketplace Vendor LLC/ })
    );

    const sidebar = document.querySelector(
      '[data-maintenance-navigator]'
    ) as HTMLElement;
    const editedRow = within(sidebar).getByRole('button', {
      name: /Jane R Diaz/,
    });
    const addedRow = within(sidebar).getByRole('button', {
      name: /Wendy Darling/,
    });
    const removedRow = within(sidebar).getByRole('button', {
      name: /Darling Holdings LLC/,
    });

    expect(editedRow).toHaveTextContent('Controller');
    expect(
      editedRow.querySelector('[data-party-status="changeStatus"]')
    ).toHaveTextContent('1 pending change');
    expect(addedRow).toHaveTextContent('Direct beneficial owner');
    expect(
      within(addedRow).getByText('Direct beneficial owner')
    ).not.toHaveClass('eb-truncate');
    const additionPill = addedRow.querySelector(
      '[data-party-status="pendingAddition"]'
    );
    expect(additionPill).toHaveTextContent('Pending addition');
    expect(additionPill).toHaveClass('eb-bg-informative-accent');
    expect(removedRow).toHaveTextContent('Intermediary owner');
    const removalPill = removedRow.querySelector(
      '[data-party-status="pendingRemoval"]'
    );
    expect(removalPill).toHaveTextContent('Pending removal');
    expect(removalPill).toHaveClass('eb-bg-destructive-accent');
    expect(removalPill).not.toHaveClass('eb-bg-warning-accent');
    expect(removedRow.querySelector('[data-entity-medallion]')).toHaveClass(
      'eb-bg-destructive-accent'
    );

    widthSpy.mockRestore();
  });

  test('lists a controller who is also an owner once with both roles', () => {
    workspace.clientQuery.data = {
      ...approvedClient,
      parties: (approvedClient.parties ?? []).map((party) =>
        party.id === 'person-1'
          ? {
              ...party,
              roles: ['CONTROLLER', 'BENEFICIAL_OWNER'],
              individualDetails: {
                ...party.individualDetails,
                natureOfOwnership: 'Direct',
              },
            }
          : party
      ),
    };

    render(
      <ApprovedClientMaintenance clientId="client-1" eligibility={eligible} />
    );

    const peopleSection = screen
      .getByRole('heading', { name: 'Related parties' })
      .closest('section');
    expect(within(peopleSection!).getAllByText('Jane R Doe')).toHaveLength(1);
    expect(
      screen.getByText('Controller · Direct beneficial owner')
    ).toBeInTheDocument();
  });

  test('lists every related party with pending addition and removal statuses', async () => {
    const user = userEvent.setup();
    workspace.clientQuery.data = {
      ...approvedClient,
      parties: [
        ...(approvedClient.parties ?? []),
        {
          id: 'intermediary-1',
          parentPartyId: 'organization-1',
          partyType: 'ORGANIZATION',
          roles: ['INTERMEDIARY_OWNER'],
          organizationDetails: {
            organizationName: 'Darling Holdings LLC',
            organizationType: 'LIMITED_LIABILITY_COMPANY',
            countryOfFormation: 'US',
          },
        },
      ],
    };
    workspace.maintenanceQuery.data = {
      pages: [],
      parties: [
        {
          id: 'person-1',
          active: false,
          updateRequest: {
            status: 'NEW',
            action: 'MODIFY',
            requestId: 'request-1',
            submittedAt: '2026-09-03T10:00:00.000Z',
          },
        },
        {
          id: 'person-pending',
          parentPartyId: 'organization-1',
          partyType: 'INDIVIDUAL',
          roles: ['BENEFICIAL_OWNER'],
          individualDetails: {
            firstName: 'Wendy',
            lastName: 'Darling',
            natureOfOwnership: 'Direct',
          },
          updateRequest: {
            status: 'NEW',
            action: 'ADD',
            requestId: 'request-1',
            submittedAt: '2026-09-03T10:01:00.000Z',
          },
        },
      ],
    };

    render(
      <ApprovedClientMaintenance clientId="client-1" eligibility={eligible} />
    );

    const relatedPartiesSection = screen
      .getByRole('heading', { name: 'Related parties' })
      .closest('section');
    const pendingRemovalRow = within(relatedPartiesSection!).getByRole(
      'button',
      { name: /Jane R Doe.*Pending removal/ }
    );
    const pendingAdditionRow = within(relatedPartiesSection!).getByRole(
      'button',
      { name: /Wendy Darling.*Pending addition/ }
    );
    expect(
      pendingRemovalRow.querySelector('.lucide-circle-minus')
    ).not.toBeNull();
    expect(
      pendingAdditionRow.querySelector('.lucide-circle-plus')
    ).not.toBeNull();
    expect(pendingAdditionRow).toHaveClass(
      'eb-border-informative/60',
      'eb-bg-informative-accent/40'
    );
    expect(pendingRemovalRow).toHaveClass(
      'eb-border-destructive/50',
      'eb-bg-destructive-accent/40'
    );

    await user.click(pendingRemovalRow);

    const removedPartyHeading = screen.getByRole('heading', {
      name: 'Jane R Doe',
    });
    const removedPartyHeader = removedPartyHeading.closest('header');
    expect(removedPartyHeader).toHaveClass(
      'eb-border-destructive/50',
      'eb-bg-destructive-accent/40'
    );
    expect(
      within(removedPartyHeader!).getByText('Pending removal')
    ).toBeInTheDocument();
    expect(
      removedPartyHeader?.querySelector('.lucide-circle-minus')
    ).not.toBeNull();
    expect(removedPartyHeader).toHaveTextContent(
      "This is saved as a pending change. The person stays on the profile until you submit your changes and they're approved."
    );
    expect(
      screen.queryByRole('heading', { name: 'Pending changes' })
    ).not.toBeInTheDocument();
    expect(
      within(removedPartyHeader!).getByRole('button', {
        name: 'View maintenance request',
      })
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: 'Back to business profile' })
    );

    const refreshedRelatedPartiesSection = screen
      .getByRole('heading', { name: 'Related parties' })
      .closest('section');
    await user.click(
      within(refreshedRelatedPartiesSection!).getByRole('button', {
        name: /Darling Holdings LLC.*Intermediary owner/,
      })
    );
    expect(
      screen.getByRole('heading', { name: 'Darling Holdings LLC' })
    ).toBeInTheDocument();
  });

  test('opens ownership structure without requiring ownership mutation eligibility', async () => {
    const user = userEvent.setup();
    render(
      <ApprovedClientMaintenance clientId="client-1" eligibility={eligible} />
    );

    expect(
      screen.getByText('Key roles and intermediary businesses')
    ).toBeInTheDocument();
    const viewOwnershipButton = screen.getByRole('button', {
      name: 'View ownership structure',
    });
    expect(viewOwnershipButton).toBeEnabled();
    await user.click(viewOwnershipButton);

    expect(
      screen.getAllByRole('heading', { name: 'Ownership structure' })
    ).toHaveLength(1);
    expect(screen.getByText('Your business')).toBeInTheDocument();
    expect(
      screen.queryByText('Business being maintained')
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText('Add the first intermediary entity to continue.')
    ).not.toBeInTheDocument();
  });

  test('keeps ownership browsing compact and centralizes edit actions', async () => {
    const user = userEvent.setup();
    workspace.clientQuery.data = {
      ...approvedClient,
      parties: [
        ...(approvedClient.parties ?? []).map((party) =>
          party.id === 'person-1'
            ? {
                ...party,
                roles: ['CONTROLLER', 'BENEFICIAL_OWNER'],
                individualDetails: {
                  ...party.individualDetails,
                  natureOfOwnership: 'Direct',
                },
              }
            : party
        ),
        {
          id: 'intermediary-1',
          parentPartyId: 'organization-1',
          partyType: 'ORGANIZATION',
          roles: ['INTERMEDIARY_OWNER'],
          organizationDetails: {
            organizationName: 'Darling Holdings LLC',
            natureOfOwnership: 'Direct',
          },
        },
      ],
    };

    render(
      <ApprovedClientMaintenance
        clientId="client-1"
        eligibility={[
          {
            country: 'US',
            organizationType: 'LIMITED_LIABILITY_COMPANY',
            operations: ['MANAGE_PROFILE', 'MANAGE_INDIRECT_OWNERSHIP'],
          },
        ]}
      />
    );
    await user.click(
      screen.getByRole('button', { name: 'View ownership structure' })
    );

    expect(
      screen.queryByRole('button', { name: 'Edit ownership' })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Edit business details' })
    ).not.toBeInTheDocument();
    const ownerDetails = screen.getAllByRole('button', {
      name: 'View owner details',
    });
    const businessDetails = screen.getAllByRole('button', {
      name: 'View business details',
    });
    expect(ownerDetails).toHaveLength(1);
    expect(businessDetails).toHaveLength(2);
    expect(ownerDetails[0]).toHaveTextContent('Jane R Doe');
    expect(businessDetails[0]).toHaveTextContent('Marketplace Vendor LLC');
    expect(businessDetails[1]).toHaveTextContent('Darling Holdings LLC');
    expect(ownerDetails[0].closest('article')).toHaveClass('eb-border-border');
    expect(businessDetails[1].closest('article')).toHaveClass(
      'eb-border-border'
    );
    const rootAddRow = getOwnershipAddRow('organization-1');
    expect(
      within(rootAddRow!).getByRole('button', { name: 'Add beneficial owner' })
    ).toBeInTheDocument();
    expect(
      within(rootAddRow!).getByRole('button', {
        name: 'Add intermediary business',
      })
    ).toBeInTheDocument();
    const rootOwnershipList = screen
      .getByText('Your business')
      .closest('article')
      ?.nextElementSibling?.querySelector('ul');
    expect(rootOwnershipList).not.toHaveClass('eb-border-l');
    const ownershipNodes = rootOwnershipList?.querySelectorAll(
      ':scope > [data-ownership-node]'
    );
    expect(ownershipNodes?.length).toBe(2);
    expect(ownershipNodes?.[0]).toHaveAttribute(
      'data-last-ownership-node',
      'false'
    );
    expect(
      ownershipNodes?.[0].querySelector('[data-ownership-tree-spine]')
    ).toHaveClass('eb--top-3', 'eb-border-border');
    expect(ownershipNodes?.[1]).toHaveAttribute(
      'data-last-ownership-node',
      'false'
    );
    expect(
      ownershipNodes?.[1].querySelector('[data-ownership-tree-junction]')
    ).toHaveClass('eb-top-6', 'eb-bg-border');

    await openOwnershipMenu(user, 'Jane R Doe');
    expect(
      await ownershipMenuItem('Change to indirect ownership')
    ).toBeInTheDocument();
    await user.keyboard('{Escape}');

    const intermediaryAddRow = getOwnershipAddRow('intermediary-1');
    expect(intermediaryAddRow).toBeInTheDocument();
    expect(
      within(intermediaryAddRow!).getByRole('button', {
        name: 'Add beneficial owner',
      })
    ).toBeInTheDocument();
    expect(
      within(intermediaryAddRow!).getByRole('button', {
        name: 'Add intermediary business',
      })
    ).toBeInTheDocument();
  });

  test('shows full ownership paths when choosing nested intermediary destinations', async () => {
    const user = userEvent.setup();
    workspace.clientQuery.data = {
      ...approvedClient,
      parties: [
        ...(approvedClient.parties ?? []),
        {
          id: 'intermediary-1',
          parentPartyId: 'organization-1',
          partyType: 'ORGANIZATION',
          roles: ['INTERMEDIARY_OWNER'],
          organizationDetails: {
            organizationName: 'Darling Holdings LLC',
            natureOfOwnership: 'Direct',
          },
        },
        {
          id: 'intermediary-2',
          parentPartyId: 'intermediary-1',
          partyType: 'ORGANIZATION',
          roles: ['INTERMEDIARY_OWNER'],
          organizationDetails: {
            organizationName: 'Neverland Holdings LLC',
            natureOfOwnership: 'Indirect',
          },
        },
        {
          id: 'person-2',
          parentPartyId: 'intermediary-1',
          partyType: 'INDIVIDUAL',
          roles: ['BENEFICIAL_OWNER'],
          individualDetails: {
            firstName: 'Wendy',
            lastName: 'Darling',
            natureOfOwnership: 'Indirect',
          },
        },
      ],
    };

    render(
      <ApprovedClientMaintenance
        clientId="client-1"
        eligibility={[
          {
            country: 'US',
            organizationType: 'LIMITED_LIABILITY_COMPANY',
            operations: ['MANAGE_PROFILE', 'MANAGE_INDIRECT_OWNERSHIP'],
          },
        ]}
      />
    );

    await user.click(
      screen.getByRole('button', { name: 'View ownership structure' })
    );
    await clickOwnershipMenuItem(user, 'Wendy Darling', 'Update connection');

    expect(
      screen.getByText(
        'Marketplace Vendor LLC › Darling Holdings LLC › Neverland Holdings LLC'
      )
    ).toBeInTheDocument();
    expect(
      screen.getByRole('radio', { name: 'Neverland Holdings LLC' })
    ).toBeInTheDocument();
  });

  test('asks how a new beneficial owner holds their interest before opening the form', async () => {
    const user = userEvent.setup();
    workspace.clientQuery.data = {
      ...approvedClient,
      parties: [
        ...(approvedClient.parties ?? []),
        {
          id: 'intermediary-1',
          parentPartyId: 'organization-1',
          partyType: 'ORGANIZATION',
          roles: ['INTERMEDIARY_OWNER'],
          organizationDetails: {
            organizationName: 'Darling Holdings LLC',
            natureOfOwnership: 'Direct',
          },
        },
      ],
    };

    render(
      <ApprovedClientMaintenance
        clientId="client-1"
        eligibility={[
          {
            country: 'US',
            organizationType: 'LIMITED_LIABILITY_COMPANY',
            operations: ['MANAGE_PROFILE', 'MANAGE_INDIRECT_OWNERSHIP'],
          },
        ]}
      />
    );
    await user.click(
      screen.getByRole('button', { name: 'View ownership structure' })
    );
    await user.click(
      within(getOwnershipAddRow('organization-1')!).getByRole('button', {
        name: 'Add beneficial owner',
      })
    );

    expect(
      screen.getByRole('heading', { name: 'Add a beneficial owner' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Owns your business directly/ })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Darling Holdings LLC/ })
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: /Darling Holdings LLC/ })
    );
    expect(
      screen.getByRole('heading', { name: 'Add indirect beneficial owner' })
    ).toBeInTheDocument();
    expect(screen.getByText(/Darling Holdings LLC/)).toBeInTheDocument();
  });

  test('uses a full-width detail layout in focused views', async () => {
    const user = userEvent.setup();
    render(
      <ApprovedClientMaintenance clientId="client-1" eligibility={eligible} />
    );

    await user.click(screen.getByRole('button', { name: /Jane R Doe/ }));

    const profileHeading = screen.getByRole('heading', {
      name: 'Profile details',
    });
    expect(profileHeading.closest('section')).toHaveClass(
      'eb-border-t',
      'eb-px-4',
      'eb-py-5'
    );
    expect(profileHeading.closest('section')).not.toHaveClass(
      '@[48rem]:eb-grid-cols-[minmax(8rem,1fr)_2.5fr]'
    );
    expect(
      screen.queryByText('Approved values on file')
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Legal identity' }).parentElement
    ).not.toHaveClass('eb-bg-muted/20');
  });

  test('renders products and sub-products as separate labels', () => {
    workspace.clientQuery.data = {
      ...approvedClient,
      productDetails: [
        {
          product: 'EMBEDDED_PAYMENTS',
          subProduct: 'LIMITED_DDA_PAYMENTS',
        },
      ],
    };

    render(
      <ApprovedClientMaintenance clientId="client-1" eligibility={eligible} />
    );

    expect(screen.getByText('Embedded Payments')).toBeInTheDocument();
    expect(screen.getByText('Limited DDA Payments')).toBeInTheDocument();
    expect(screen.getAllByText('Sub-product').length).toBeGreaterThan(0);
    expect(
      screen.queryByText('Embedded Payments / Limited DDA Payments')
    ).not.toBeInTheDocument();
  });

  test('makes the bulk draft boundary explicit and exposes planned operations', () => {
    workspace.maintenanceQuery.data = {
      pages: [],
      parties: [createProposal('Diaz')],
    };

    render(
      <ApprovedClientMaintenance clientId="client-1" eligibility={eligible} />
    );

    expect(
      screen.getByText(
        'Your changes are saved here but have not been submitted for review.'
      )
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Review and submit' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Marketplace Vendor LLC/ })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Add Limited DDA Payments' })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Add related party' })
    ).not.toBeInTheDocument();
  });

  test('shows the complete bulk draft and unsupported blockers before submission', async () => {
    const user = userEvent.setup();
    workspace.clientQuery.data = {
      ...approvedClient,
      outstanding: {
        questionIds: ['question-1'],
        attestationDocumentIds: ['attestation-1'],
      },
    };
    workspace.maintenanceQuery.data = {
      pages: [],
      parties: [createProposal('Diaz')],
    };

    render(
      <ApprovedClientMaintenance clientId="client-1" eligibility={eligible} />
    );
    await user.click(screen.getByRole('button', { name: 'Review and submit' }));

    expect(
      screen.getByRole('heading', { name: 'Review your changes' })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Add or edit changes' })
    ).not.toBeInTheDocument();
    await user.click(
      screen.getByRole('button', { name: 'Actions for Jane R Diaz' })
    );
    expect(
      screen.getByRole('menuitem', { name: /^Add or edit changes/ })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('menuitem', { name: /^Discard changes/ })
    ).toBeInTheDocument();
    await user.keyboard('{Escape}');
    const backToProfile = screen.getByRole('button', {
      name: 'Back to business profile',
    });
    expect(backToProfile).toHaveClass('eb-border');
    expect(backToProfile.querySelector('.lucide-arrow-left')).not.toBeNull();
    expect(screen.getByText('Doe')).toBeInTheDocument();
    expect(screen.getByText('Diaz')).toBeInTheDocument();
    expect(
      screen.getByText('1 question requires an answer.')
    ).toBeInTheDocument();
    expect(
      screen.getByText('1 attestation must be reviewed and accepted.')
    ).toBeInTheDocument();
    const blockedSection = screen
      .getByRole('heading', { name: 'Submission' })
      .closest('section');
    expect(blockedSection).toHaveTextContent(
      'You can submit once these are done:'
    );
    const blockedSubmit = screen.getByRole('button', {
      name: 'Submit for review',
    });
    expect(blockedSubmit).toBeDisabled();
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    // Not interactive, so it stays quiet: no warning fill or warning icons.
    expect(blockedSection).not.toHaveClass('eb-bg-warning-accent/40');
    expect(blockedSection?.querySelector('.eb-text-warning')).toBeNull();
    expect(blockedSection).toHaveTextContent('1 question requires an answer.');
    expect(
      screen.getByRole('button', { name: 'Business profile' })
    ).toBeInTheDocument();
  });

  test('completes an outstanding maintenance question from review', async () => {
    const user = userEvent.setup();
    workspace.clientQuery.data = {
      ...approvedClient,
      outstanding: { questionIds: ['30005'] },
    };
    workspace.maintenanceQuery.data = {
      pages: [],
      parties: [createProposal('Diaz')],
    };
    workspace.questionsQuery.data = [
      {
        id: '30005',
        label: 'What is your expected monthly volume?',
        responseType: 'enum',
        options: ['$10,000', '$25,000'],
      },
    ];
    updateClientTasks.mockResolvedValue(undefined);

    render(
      <ApprovedClientMaintenance clientId="client-1" eligibility={eligible} />
    );
    await user.click(screen.getByRole('button', { name: 'Review and submit' }));
    await user.click(screen.getByRole('button', { name: 'Complete' }));
    await user.click(
      screen.getByLabelText('What is your expected monthly volume?')
    );
    await user.click(screen.getByRole('option', { name: '$10,000' }));
    await user.click(screen.getByRole('button', { name: 'Save answers' }));

    expect(updateClientTasks).toHaveBeenCalledWith({
      questionResponses: [{ questionId: '30005', values: ['$10,000'] }],
    });
  });

  test('requires attestation document review before structured submission', async () => {
    const user = userEvent.setup();
    workspace.clientQuery.data = {
      ...approvedClient,
      outstanding: { attestationDocumentIds: ['attestation-1'] },
    };
    workspace.maintenanceQuery.data = {
      pages: [],
      parties: [createProposal('Diaz')],
    };
    downloadAttestation.mockResolvedValue(
      new Blob(['attestation'], { type: 'application/pdf' })
    );
    updateClientTasks.mockResolvedValue(undefined);
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: vi.fn(() => 'blob:attestation'),
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: vi.fn(),
    });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    render(
      <ApprovedClientMaintenance clientId="client-1" eligibility={eligible} />
    );
    await user.click(screen.getByRole('button', { name: 'Review and submit' }));
    await user.click(screen.getByRole('button', { name: 'Complete' }));
    const submit = screen.getByRole('button', { name: 'Submit attestation' });
    expect(submit).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Review document' }));
    await user.type(screen.getByLabelText('First name'), 'Peiter');
    await user.type(screen.getByLabelText('Last name'), 'Pan');
    await user.type(screen.getByLabelText('Job title'), 'CFO');
    await user.click(
      screen.getByText(
        'I have reviewed the required documents and attest that the information is complete and accurate.'
      )
    );
    expect(submit).toBeEnabled();
    await user.click(submit);

    expect(updateClientTasks).toHaveBeenCalledWith({
      addAttestations: [
        expect.objectContaining({
          documentId: 'attestation-1',
          ipAddress: '127.0.0.1',
          attester: {
            firstName: 'Peiter',
            middleName: undefined,
            lastName: 'Pan',
            designation: 'CFO',
          },
        }),
      ],
    });
  });

  test('returns to draft review after cancelling an edit opened from review', async () => {
    const user = userEvent.setup();
    workspace.maintenanceQuery.data = {
      pages: [],
      parties: [createProposal('Diaz')],
    };

    render(
      <ApprovedClientMaintenance clientId="client-1" eligibility={eligible} />
    );
    await user.click(screen.getByRole('button', { name: 'Review and submit' }));
    await user.click(
      screen.getByRole('button', { name: 'Actions for Jane R Diaz' })
    );
    await user.click(
      screen.getByRole('menuitem', { name: /^Add or edit changes/ })
    );

    expect(
      screen.getByRole('heading', { name: 'Edit details' })
    ).toBeInTheDocument();
    const reviewBreadcrumb = screen.getByRole('button', {
      name: 'Review your changes',
    });
    expect(reviewBreadcrumb).not.toHaveClass('eb-button');
    const profileBreadcrumb = screen.getByRole('button', {
      name: 'Business profile',
    });
    expect(profileBreadcrumb.querySelector('.lucide-arrow-left')).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Cancel editing' }));

    expect(
      screen.getByRole('heading', { name: 'Review your changes' })
    ).toBeInTheDocument();
    expect(screen.queryByText('Business information')).not.toBeInTheDocument();
  });

  test('submits the reviewed bulk draft and shows the 202 receipt', async () => {
    const user = userEvent.setup();
    workspace.maintenanceQuery.data = {
      pages: [],
      parties: [createProposal('Diaz')],
    };
    submitForReview.mockImplementation(async () => {
      workspace.verificationMutation.data = {
        acceptedAt: '2026-08-26T16:15:00.000Z',
        receivedAt: '2026-08-26T16:15:01.000Z',
      };
      return workspace.verificationMutation.data;
    });

    render(
      <ApprovedClientMaintenance clientId="client-1" eligibility={eligible} />
    );
    await user.click(screen.getByRole('button', { name: 'Review and submit' }));
    // The structure has its own page; the review links to it in one fixed place.
    expect(document.querySelector('[data-ownership-node]')).toBeNull();
    expect(
      document.querySelector('[data-review-ownership-link]')
    ).toHaveTextContent('View ownership structure');
    const businessConfirmation = screen.getByLabelText(
      'I reviewed the business and related-party information on file, including the changes shown here, and confirm no other changes are needed.'
    );
    const ownershipConfirmation = screen.getByLabelText(
      'I reviewed the ownership structure and confirm it includes every individual and intermediary business that owns 25% or more.'
    );
    const submitButton = screen.getByRole('button', {
      name: 'Submit for review',
    });
    expect(submitButton).toBeDisabled();
    await user.click(businessConfirmation);
    expect(submitButton).toBeDisabled();
    await user.click(ownershipConfirmation);
    expect(submitButton).toBeEnabled();
    await user.click(submitButton);

    expect(submitForReview).toHaveBeenCalledWith(expect.any(String));
    expect(await screen.findByText('Submitted for review')).toBeInTheDocument();
    await user.click(
      screen.getByRole('button', { name: 'Return to business profile' })
    );
    expect(
      screen.getByText('Maintenance request submitted')
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Discard all changes' })
    ).not.toBeInTheDocument();
  });

  test('provides one request-level view of all submitted changes', async () => {
    const user = userEvent.setup();
    workspace.clientQuery.data = {
      ...approvedClient,
      parties: [
        ...(approvedClient.parties ?? []),
        {
          id: 'person-2',
          partyType: 'INDIVIDUAL',
          roles: ['BENEFICIAL_OWNER'],
          individualDetails: { firstName: 'Alex', lastName: 'Smith' },
        },
      ],
    };
    workspace.maintenanceQuery.data = {
      pages: [],
      parties: [
        createProposal('Diaz', 'REVIEW_IN_PROGRESS'),
        {
          id: 'person-2',
          individualDetails: { firstName: 'Alexander' },
          updateRequest: {
            status: 'REVIEW_IN_PROGRESS',
            action: 'MODIFY',
            requestId: 'request-1',
            submittedAt: '2026-08-26T12:01:00.000Z',
          },
        },
      ],
    };

    render(
      <ApprovedClientMaintenance clientId="client-1" eligibility={eligible} />
    );

    expect(
      screen.getByText('Maintenance request submitted')
    ).toBeInTheDocument();
    expect(screen.queryByText('Submitted change')).not.toBeInTheDocument();
    const viewSubmittedUpdates = screen.getByRole('button', {
      name: 'View request details',
    });
    expect(
      viewSubmittedUpdates.querySelector('.lucide-arrow-right')
    ).toBeInTheDocument();
    expect(
      viewSubmittedUpdates.querySelector('.lucide-clock3')
    ).not.toBeInTheDocument();
    await user.click(viewSubmittedUpdates);

    expect(
      screen.getByRole('heading', { name: 'Maintenance request' })
    ).toBeInTheDocument();
    expect(screen.getByText(/Submitted .*Aug.*26.*2026/)).toBeInTheDocument();
    const partyCards = ['person-1', 'person-2'].map((partyId) =>
      document.querySelector<HTMLElement>(`[data-review-change="${partyId}"]`)
    );
    expect(partyCards[0]).toHaveTextContent('Jane R Diaz');
    expect(partyCards[1]).toHaveTextContent('Alexander Smith');
    const profileUpdatesHeading = screen.getByRole('heading', {
      name: 'Profile changes',
    });
    const profileUpdatesContent =
      profileUpdatesHeading.parentElement?.nextElementSibling;
    expect(profileUpdatesContent).not.toHaveClass(
      'eb-rounded-md',
      'eb-border',
      'eb-bg-background'
    );
    partyCards.forEach((partyCard) => {
      expect(partyCard?.closest('[data-review-group]')).toHaveAttribute(
        'data-review-group',
        'updated'
      );
      expect(partyCard?.parentElement).toHaveClass(
        'eb-divide-y',
        'eb-rounded-md',
        'eb-border',
        'eb-bg-background'
      );
    });
    expect(screen.queryByText('Previously Jane R Doe')).not.toBeInTheDocument();
    expect(screen.queryByText('Previously Alex Smith')).not.toBeInTheDocument();
    expect(screen.getByText('Controller')).toBeInTheDocument();
    expect(screen.queryByText('CONTROLLER')).not.toBeInTheDocument();
    expect(screen.getByText('Last name')).toBeInTheDocument();
    expect(screen.getAllByText('Current value').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Submitted change').length).toBeGreaterThan(0);
    expect(
      screen.queryByRole('button', { name: 'Edit' })
    ).not.toBeInTheDocument();
  });

  test('opens organization details through the same row interaction as people', async () => {
    const user = userEvent.setup();
    render(
      <ApprovedClientMaintenance clientId="client-1" eligibility={eligible} />
    );

    await user.click(
      screen.getByRole('button', { name: /Marketplace Vendor LLC/ })
    );

    expect(
      screen.getByRole('heading', { name: 'Marketplace Vendor LLC' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Edit business details' })
    ).toBeInTheDocument();
    expect(
      screen.getByText('Limited Liability Company (LLC)')
    ).toBeInTheDocument();
  });

  test('shows complete business and party details while masking sensitive values', async () => {
    const user = userEvent.setup();
    workspace.clientQuery.data = {
      ...approvedClient,
      parties: [
        {
          ...(approvedClient.parties ?? [])[0],
          email: 'operations@example.com',
          organizationDetails: {
            ...(approvedClient.parties ?? [])[0]?.organizationDetails,
            dbaName: 'Marketplace Collective',
            yearOfFormation: '2018',
            organizationIds: [
              { idType: 'EIN', value: '123456789', issuer: 'US' },
            ],
            phone: { countryCode: '+1', phoneNumber: '2125550142' },
            website: 'https://marketplace.example',
            addresses: [
              {
                addressType: 'BUSINESS_ADDRESS',
                addressLines: ['100 Market Street'],
                city: 'San Francisco',
                state: 'CA',
                postalCode: '94105',
                country: 'US',
              },
            ],
          },
        },
        {
          ...(approvedClient.parties ?? [])[1],
          email: 'jane@example.com',
          individualDetails: {
            ...(approvedClient.parties ?? [])[1]?.individualDetails,
            birthDate: '1990-01-01',
            countryOfResidence: 'US',
            jobTitle: 'CEO',
            individualIds: [
              { idType: 'SSN', value: '111223333', issuer: 'US' },
            ],
            phone: { countryCode: '+1', phoneNumber: '6465550199' },
          },
        },
      ],
    };

    render(
      <ApprovedClientMaintenance clientId="client-1" eligibility={eligible} />
    );
    await user.click(
      screen.getByRole('button', { name: /Marketplace Vendor LLC/ })
    );
    expect(
      screen.getByText('Doing business as (DBA name)')
    ).toBeInTheDocument();
    expect(screen.getByText('Marketplace Collective')).toBeInTheDocument();
    expect(screen.getByText('EIN ••••6789')).toBeInTheDocument();
    expect(screen.getByText('+1 ••••0142')).toBeInTheDocument();
    expect(screen.queryByText('123456789')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Business profile' }));
    await user.click(screen.getByRole('button', { name: /Jane R Doe/ }));
    expect(screen.getByText('CEO')).toBeInTheDocument();
    expect(screen.getByText('SSN ••••3333')).toBeInTheDocument();
    expect(screen.getByText('+1 ••••0199')).toBeInTheDocument();
    expect(screen.queryByText('111223333')).not.toBeInTheDocument();
    expect(screen.queryByText('1990-01-01')).not.toBeInTheDocument();
  });

  test('lists the fields the API still needs from a person and opens their edit form', async () => {
    const user = userEvent.setup();
    workspace.clientQuery.data = {
      ...approvedClient,
      outstanding: { partyIds: ['person-1'] },
      parties: (approvedClient.parties ?? []).map((party) =>
        party.id === 'person-1'
          ? {
              ...party,
              individualDetails: {
                ...party.individualDetails,
                firstName: undefined,
                middleName: undefined,
                lastName: undefined,
              },
              validationResponse: [
                {
                  validationStatus: 'NEEDS_INFO',
                  validationType: 'ENTITY_VALIDATION',
                  fields: [{ name: 'firstName' }, { name: 'lastName' }],
                  documentRequestIds: [],
                },
              ],
            }
          : party
      ),
    };
    workspace.maintenanceQuery.data = {
      pages: [],
      parties: [
        {
          id: 'organization-1',
          organizationDetails: { dbaName: 'Vendor Market' },
          updateRequest: {
            status: 'NEW',
            action: 'MODIFY',
            requestId: 'request-1',
            submittedAt: '2026-09-03T10:00:00.000Z',
          },
        },
      ],
    };
    render(
      <ApprovedClientMaintenance clientId="client-1" eligibility={eligible} />
    );

    await user.click(screen.getByRole('button', { name: 'Review and submit' }));
    // A count alone said neither who nor what; the unnamed person falls back to their role.
    expect(
      screen.queryByText('1 person requires additional information.')
    ).not.toBeInTheDocument();
    const requirement = document.querySelector<HTMLElement>(
      '[data-review-requirement="party-information"]'
    );
    expect(requirement).toHaveTextContent(
      'Provide First name and Last name for Controller'
    );
    await user.click(
      within(requirement!).getByRole('button', { name: 'Complete' })
    );
    expect(
      screen.getByRole('heading', { name: 'Edit details' })
    ).toBeInTheDocument();
  });

  test('submitted changes link directly to each document task without duplicate party blockers', async () => {
    const user = userEvent.setup();
    workspace.clientQuery.data = {
      ...approvedClient,
      updateRequest: {
        status: 'INFORMATION_REQUESTED',
        requestId: 'request-1',
      },
      outstanding: { partyIds: ['person-1'] },
      parties: (approvedClient.parties ?? []).map((party) =>
        party.id === 'person-1'
          ? {
              ...party,
              validationResponse: [
                {
                  validationStatus: 'NEEDS_INFO',
                  documentRequestIds: ['document-1'],
                },
              ],
            }
          : party
      ),
    };
    workspace.maintenanceQuery.data = {
      pages: [],
      parties: [
        {
          ...createProposal('Diaz'),
          updateRequest: {
            ...createProposal('Diaz').updateRequest,
            status: 'INFORMATION_REQUESTED',
          },
        },
      ],
    };
    workspace.documentRequestsQuery.data = {
      documentRequests: [
        {
          id: 'document-1',
          partyId: 'person-1',
          status: 'ACTIVE',
          description:
            'Provide a government-issued document showing the full legal name, date of birth, photograph, and all identifying information for this person.',
          requirements: [],
        },
      ],
    };

    render(
      <ApprovedClientMaintenance clientId="client-1" eligibility={eligible} />
    );
    expect(
      screen
        .getByRole('heading', {
          name: 'Maintenance request needs more information',
        })
        .closest('section')
    ).toHaveClass('eb-border-warning/50', 'eb-bg-warning-accent');
    const completeRequiredActions = screen.getByRole('button', {
      name: 'Complete required actions',
    });
    expect(completeRequiredActions).toHaveClass('eb-bg-primary');
    expect(
      completeRequiredActions.querySelector('.lucide-arrow-right')
    ).toBeInTheDocument();
    expect(
      completeRequiredActions.querySelector('.lucide-triangle-alert')
    ).not.toBeInTheDocument();
    await user.click(completeRequiredActions);

    const partyUpdate = document.querySelector<HTMLElement>(
      '[data-review-change="person-1"]'
    );
    expect(partyUpdate).toHaveTextContent('Jane R Diaz');
    expect(partyUpdate).toHaveTextContent(/Last name.*Doe.*Diaz/);
    expect(screen.queryByText('Previously Jane R Doe')).not.toBeInTheDocument();
    // The document request sits with the party it is for.
    const partyDocuments = partyUpdate!.querySelector<HTMLElement>(
      '[data-review-documents]'
    )!;
    expect(
      document.querySelector('[data-review-requirement="person-1"]')
    ).toBeNull();
    expect(
      document.querySelector('[data-review-requirement="documents"]')
    ).toHaveTextContent('Upload the required documents for Jane R Diaz');
    const documentAction = within(partyDocuments).getByRole('button', {
      name: /Required documents/,
    });
    expect(documentAction).toBeInTheDocument();
    const documentDescription = within(documentAction).getByText(
      'Provide a government-issued document showing the full legal name, date of birth, photograph, and all identifying information for this person.'
    );
    expect(documentDescription).toHaveClass('eb-line-clamp-2');
    expect(documentDescription).toHaveAttribute(
      'title',
      'Provide a government-issued document showing the full legal name, date of birth, photograph, and all identifying information for this person.'
    );
    expect(
      screen.queryByRole('heading', { name: 'Before submission' })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText('1 person requires additional information.')
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Return to business profile' })
    ).not.toBeInTheDocument();

    await user.click(documentAction);
    expect(
      screen.getByRole('heading', {
        name: 'Upload documents for Jane R Diaz',
      })
    ).toBeInTheDocument();
    expect(
      screen.getByText('Current profile name: Jane R Doe')
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole('button', { name: 'Maintenance request' })
    );
    expect(
      screen.getByRole('heading', { name: 'Maintenance request' })
    ).toBeInTheDocument();
  });

  test('lists document-only parties under documents needed, and unowned documents with the remaining work', async () => {
    const user = userEvent.setup();
    workspace.clientQuery.data = {
      ...approvedClient,
      updateRequest: {
        status: 'INFORMATION_REQUESTED',
        requestId: 'request-1',
      },
      parties: [
        ...(approvedClient.parties ?? []),
        {
          id: 'person-2',
          partyType: 'INDIVIDUAL',
          roles: ['BENEFICIAL_OWNER'],
          individualDetails: { firstName: 'Alex', lastName: 'Smith' },
          validationResponse: [
            {
              validationStatus: 'NEEDS_INFO',
              documentRequestIds: ['document-2'],
            },
          ],
        },
      ],
    };
    workspace.maintenanceQuery.data = {
      pages: [],
      parties: [
        {
          ...createProposal('Diaz'),
          updateRequest: {
            ...createProposal('Diaz').updateRequest,
            status: 'INFORMATION_REQUESTED',
          },
        },
      ],
    };
    workspace.documentRequestsQuery.data = {
      documentRequests: [
        {
          id: 'document-2',
          partyId: 'person-2',
          status: 'ACTIVE',
          requirements: [],
        },
        {
          id: 'document-ghost',
          partyId: 'party-missing-from-profile',
          status: 'ACTIVE',
          description: 'Provide proof of address.',
          requirements: [],
        },
      ],
    };
    workspace.clientQuery.data = {
      ...workspace.clientQuery.data,
      outstanding: { documentRequestIds: ['document-ghost'] },
    };

    render(
      <ApprovedClientMaintenance clientId="client-1" eligibility={eligible} />
    );
    await user.click(
      screen.getByRole('button', { name: 'Complete required actions' })
    );

    const documentOnlyRow = document.querySelector<HTMLElement>(
      '[data-review-group="documents"] [data-review-change="person-2"]'
    )!;
    expect(documentOnlyRow).toHaveTextContent('Alex Smith');
    expect(
      within(documentOnlyRow).getByRole('button', {
        name: /Required documents/,
      })
    ).toBeInTheDocument();

    // An API inconsistency: the owning party is not on the profile.
    const unassigned = document.querySelector<HTMLElement>(
      '[data-review-requirement="unassigned"]'
    )!;
    expect(unassigned).toHaveTextContent('Other required documents');
    expect(unassigned).toHaveTextContent('Provide proof of address.');
    expect(
      unassigned.closest('section')?.querySelector('h3')
    ).toHaveTextContent('Action required');
  });

  test('keeps profile details visible beside a labeled submitted change section', async () => {
    const user = userEvent.setup();
    workspace.clientQuery.data = {
      ...approvedClient,
      parties: (approvedClient.parties ?? []).map((party) =>
        party.id === 'person-1'
          ? {
              ...party,
              individualDetails: {
                ...party.individualDetails,
                birthDate: '1990-01-01',
              },
            }
          : party
      ),
    };
    workspace.maintenanceQuery.data = {
      pages: [],
      parties: [createProposal('Diaz', 'REVIEW_IN_PROGRESS')],
    };

    render(
      <ApprovedClientMaintenance clientId="client-1" eligibility={eligible} />
    );
    const partyRow = screen.getByRole('button', { name: /Jane R Diaz/ });
    expect(
      within(partyRow).getByText('Changes under review')
    ).toBeInTheDocument();
    expect(partyRow.querySelector('.lucide-clock3')).toBeInTheDocument();
    await user.click(partyRow);

    expect(screen.getByText('Profile details')).toBeInTheDocument();
    expect(screen.getByText('Date of birth')).toBeInTheDocument();
    expect(screen.getByText('••••••••')).toBeInTheDocument();
    expect(screen.queryByText('1990-01-01')).not.toBeInTheDocument();
    const reviewHeading = screen.getByRole('heading', {
      name: 'Changes under review',
    });
    expect(reviewHeading.querySelector('.lucide-clock3')).toBeInTheDocument();
    expect(screen.getAllByText('Current value').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Submitted change').length).toBeGreaterThan(0);
    expect(screen.queryByText('Edit birth date')).not.toBeInTheDocument();
    expect(screen.queryByText('Discard changes')).not.toBeInTheDocument();
  });

  test('renders missing profile fields as muted N/A values', async () => {
    const user = userEvent.setup();
    workspace.clientQuery.data = {
      ...approvedClient,
      parties: (approvedClient.parties ?? []).map((party) =>
        party.id === 'person-1'
          ? {
              ...party,
              individualDetails: {
                firstName: 'Jane',
                lastName: 'Doe',
              },
            }
          : party
      ),
    };

    render(
      <ApprovedClientMaintenance clientId="client-1" eligibility={eligible} />
    );
    await user.click(screen.getByRole('button', { name: /Jane Doe/ }));

    const missingValues = screen.getAllByText('N/A');
    expect(missingValues.length).toBeGreaterThanOrEqual(2);
    missingValues.forEach((value) =>
      expect(value).toHaveClass('eb-text-muted-foreground')
    );
  });
});
