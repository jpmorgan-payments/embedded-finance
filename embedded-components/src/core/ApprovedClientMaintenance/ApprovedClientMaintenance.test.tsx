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
const updateClientTasks = vi.fn();
const downloadAttestation = vi.fn();
const addProduct = vi.fn();
const cancelProductAddition = vi.fn();
const cancelChanges = vi.fn();
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
    operations: ['EDIT_PARTY_NAME'] as const,
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
            operations: [
              'EDIT_PARTY_NAME',
              'ADD_BENEFICIAL_OWNER',
              'DISCLOSE_INDIRECT_OWNERSHIP',
            ],
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
            operations: ['EDIT_ORGANIZATION'],
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
            operations: ['EDIT_ORGANIZATION'],
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
            operations: ['EDIT_ORGANIZATION'],
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

  test('denies new edits when no exact eligibility rule is configured', () => {
    render(<ApprovedClientMaintenance clientId="client-1" eligibility={[]} />);

    expect(
      screen.getByText(
        "This client's country, legal entity type, or lifecycle is not configured for name changes."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Jane R Doe/ })
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
    expect(
      screen.queryByText('Maintenance request ID: request-1')
    ).not.toBeInTheDocument();
    const pendingSummaryHeading = screen.getByRole('heading', {
      name: 'Pending changes',
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
    expect(
      screen.getByText('Maintenance request ID: request-1')
    ).toBeInTheDocument();
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

    expect(screen.getByText('Changes submitted')).toBeInTheDocument();
    expect(
      screen.getByText('Changes submitted').closest('section')
    ).toHaveClass('eb-bg-informative-accent');
    expect(
      screen.queryByRole('button', { name: 'Discard all pending changes' })
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
      screen.queryByText("We couldn't load the complete maintenance record")
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

  test('renders multiple party proposals under one maintenance request', () => {
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

    expect(
      screen.queryByText('Maintenance request ID: request-1')
    ).not.toBeInTheDocument();
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
      screen.getByText('Pending requirements need attention')
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
    expect(
      screen.queryByText(/Maintenance request ID:/)
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Discard all pending changes' })
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
        name: 'View full maintenance request',
      }
    );
    expect(comparisonGroup).not.toContainElement(viewFullMaintenanceRequest);
    expect(draftSection).toContainElement(viewFullMaintenanceRequest);
    expect(viewFullMaintenanceRequest.parentElement).toHaveClass('eb-mt-3');
    expect(
      within(draftSection!).getByText(
        'Saved in this request. You can edit or discard these changes before submission.'
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
  });

  test('cancels the full change set from request details', async () => {
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
      screen.queryByRole('button', { name: 'Discard all pending changes' })
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Review and submit' }));
    const discardAll = screen.getByRole('button', {
      name: 'Discard all pending changes',
    });
    const requestNavigation = discardAll.closest('nav');
    expect(requestNavigation).not.toBeNull();
    expect(
      within(requestNavigation!).getByRole('button', {
        name: 'Back to business profile',
      })
    ).toBeInTheDocument();
    await user.click(discardAll);
    expect(screen.getByRole('alertdialog')).toHaveTextContent(
      'Changes for Jane R Doe'
    );
    await user.click(
      screen.getByRole('button', { name: 'Discard all pending changes' })
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
      screen.getByRole('heading', { name: 'Product update needs attention' })
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
      screen.getByRole('heading', { name: 'Product update ready to review' })
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

  test('shows a product update banner beside terminated maintenance history', () => {
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
      screen.getByRole('heading', { name: 'Product update ready to review' })
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
      screen.getByRole('heading', { name: 'Updates need attention' })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Complete the requirements before submitting your updates.'
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
    expect(screen.queryByText('Product addition')).not.toBeInTheDocument();
    expect(
      screen.getByText('Sub-product pending addition')
    ).toBeInTheDocument();
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
      'Limited DDA Payments will be removed from the updates being prepared for review.'
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
      'Your business and related-party maintenance changes will remain in progress.'
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

    expect(
      screen.getByRole('button', { name: 'Cancel product addition' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Discard all pending changes' })
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
        'Complete the requested items shown in the maintenance request so review can continue.'
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
              'DISCLOSE_INDIRECT_OWNERSHIP',
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
      screen.getByRole('heading', { name: 'Ownership structure', level: 3 })
    ).toBeInTheDocument();
    expect(
      screen.queryByText('All qualifying owners hold their interest directly')
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(
        'One or more qualifying owners hold their interest through another company'
      )
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Update ownership' })
    ).toBeInTheDocument();
    expect(screen.queryByText('Product addition')).not.toBeInTheDocument();
    expect(
      screen.getByText('Sub-product pending addition')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Pending requirements need attention')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Provide the required product upgrade document.')
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Update ownership' }));
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
            operations: ['DISCLOSE_INDIRECT_OWNERSHIP'],
          },
        ]}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Review and submit' }));
    expect(screen.queryByText('Product addition')).not.toBeInTheDocument();
    expect(
      screen.getByText('Sub-product pending addition')
    ).toBeInTheDocument();
    expect(screen.getByText(/Limited DDA Payments/)).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Ownership structure', level: 3 })
    ).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Update ownership' }));
    expect(screen.queryByRole('radio')).not.toBeInTheDocument();
    await user.click(
      screen.getByRole('button', { name: 'Add intermediary business' })
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
            operations: [
              'EDIT_ORGANIZATION',
              'ADD_CONTROLLER',
              'DISCLOSE_INDIRECT_OWNERSHIP',
            ],
          },
        ]}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Review and submit' }));
    expect(
      screen.getByRole('heading', { name: 'Review your changes' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Ownership structure', level: 3 })
    ).toBeInTheDocument();
    const submitButton = screen.getByRole('button', {
      name: 'Submit for review',
    });
    const informationConfirmation = screen.getByLabelText(
      'I reviewed the business and related-party information on file, including the updates shown here, and confirm no other changes are needed.'
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
            operations: ['EDIT_ORGANIZATION', 'ADD_BENEFICIAL_OWNER'],
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
            operations: [
              'ADD_CONTROLLER',
              'ADD_BENEFICIAL_OWNER',
              'REMOVE_RELATED_PARTY',
              'EDIT_PARTY_NAME',
            ],
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
    await user.click(screen.getByText('This person also owns 25% or more'));
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
            operations: ['ADD_CONTROLLER', 'REMOVE_RELATED_PARTY'],
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
    await user.click(screen.getByRole('button', { name: /Wendy Darling/ }));

    expect(updateParty).toHaveBeenNthCalledWith(1, 'person-2', {
      roles: ['BENEFICIAL_OWNER', 'CONTROLLER'],
    });
    expect(updateParty).toHaveBeenNthCalledWith(2, 'person-1', {
      active: false,
    });
    expect(createParty).not.toHaveBeenCalled();
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
            operations: ['ADD_CONTROLLER', 'REMOVE_RELATED_PARTY'],
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
            operations: ['ADD_CONTROLLER', 'REMOVE_RELATED_PARTY'],
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
            operations: ['ADD_BENEFICIAL_OWNER'],
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
      screen.getByText(/Choose how Jane R Doe holds their ownership interest/)
    ).toBeInTheDocument();
    await user.click(
      screen.getByRole('button', { name: /Owns the client directly/ })
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
            operations: ['ADD_BENEFICIAL_OWNER', 'DISCLOSE_INDIRECT_OWNERSHIP'],
          },
        ]}
      />
    );

    await user.click(screen.getByRole('button', { name: /Jane R Doe/ }));
    await user.click(
      screen.getByRole('button', { name: 'Add beneficial owner role' })
    );
    await user.click(
      screen.getByRole('button', { name: /Darling Holdings LLC/ })
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
      'Removing it requires discarding all pending changes for this person'
    );
    const discardPartyDraft = within(ownershipSection!).getByRole('button', {
      name: 'Discard all pending changes for this person',
    });
    expect(discardPartyDraft).toHaveClass('eb-text-destructive');
    await user.click(discardPartyDraft);
    const dialog = screen.getByRole('alertdialog');
    expect(dialog).toHaveTextContent(
      "This will discard this person's pending changes."
    );
    await user.click(
      within(dialog).getByRole('button', {
        name: 'Discard changes',
      })
    );

    expect(cancelChanges).toHaveBeenCalledWith('request-1', 'person-1');
    expect(updateParty).not.toHaveBeenCalled();
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
    expect(
      screen.queryByRole('heading', { name: 'Ownership and roles' })
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
      'View full maintenance request',
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
      'This person will not be added to the business profile. Other changes in the request will be preserved.'
    );
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
            operations: ['EDIT_PARTY_NAME', 'DISCLOSE_INDIRECT_OWNERSHIP'],
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
      .getByRole('heading', { name: 'Pending roles' })
      .closest('section');
    const ownerRole = rolesSection!.querySelector(
      '[data-role="BENEFICIAL_OWNER"]'
    );
    expect(ownerRole).toHaveAttribute('data-role-state', 'pending-addition');
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
            operations: ['ADD_BENEFICIAL_OWNER'],
          },
        ]}
      />
    );
    await user.click(
      screen.getByRole('button', { name: /John Darling.*Pending addition/ })
    );

    const rolesSection = screen
      .getByRole('heading', { name: 'Pending roles' })
      .closest('section');
    const controllerRole = rolesSection!.querySelector(
      '[data-role="CONTROLLER"]'
    );
    expect(controllerRole).toHaveAttribute(
      'data-role-state',
      'pending-addition'
    );
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
            operations: ['DISCLOSE_INDIRECT_OWNERSHIP'],
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
      .getByRole('heading', { name: 'Pending roles' })
      .closest('section');
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

  test('changes a pending controller owner path without replacing the controller', async () => {
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
            operations: ['DISCLOSE_INDIRECT_OWNERSHIP'],
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
        name: 'Choose an intermediary for Michael Darling',
      })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Choose a replacement controller' })
    ).not.toBeInTheDocument();
    await user.click(
      screen.getByRole('button', { name: /Existing Holdings LLC/ })
    );
    await user.click(
      screen.getByRole('button', { name: 'Create new ownership path' })
    );

    expect(createParty).toHaveBeenCalledWith(
      expect.objectContaining({
        parentPartyId: 'intermediary-existing',
        roles: ['BENEFICIAL_OWNER'],
      })
    );
    expect(updateParty).toHaveBeenCalledWith('pending-controller-owner', {
      roles: ['CONTROLLER'],
    });
    expect(createParty.mock.invocationCallOrder[0]).toBeLessThan(
      updateParty.mock.invocationCallOrder[0]!
    );
    expect(cancelChanges).not.toHaveBeenCalled();
  });

  test('rebuilds a pending owner beneath an existing intermediary before canceling the old draft', async () => {
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
            operations: ['DISCLOSE_INDIRECT_OWNERSHIP'],
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
    await user.click(
      screen.getByRole('button', { name: 'Create new ownership path' })
    );

    expect(createParty).toHaveBeenCalledWith(
      expect.objectContaining({
        parentPartyId: 'intermediary-existing',
        roles: ['BENEFICIAL_OWNER'],
      })
    );
    expect(cancelChanges).toHaveBeenCalledWith('request-1', 'pending-owner');
    expect(createParty.mock.invocationCallOrder[0]).toBeLessThan(
      cancelChanges.mock.invocationCallOrder[0]!
    );
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

    const pendingParty = within(
      screen.getByRole('region', { name: 'Changes in this request' })
    )
      .getByText('Wendy Darling')
      .closest('li');
    expect(pendingParty).toHaveTextContent(
      'Pending addition · Beneficial owner'
    );
    expect(
      within(pendingParty!).getByText('Proposed party details')
    ).toBeInTheDocument();
    expect(
      within(pendingParty!).queryByText('Current value')
    ).not.toBeInTheDocument();
    await user.click(
      within(pendingParty!).getByRole('button', { name: 'More actions' })
    );
    expect(
      screen.getByRole('menuitem', { name: 'Edit pending party' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('menuitem', { name: 'Discard pending addition' })
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
            operations: ['ADD_BENEFICIAL_OWNER'],
          },
        ]}
      />
    );

    await user.click(
      screen.getByRole('button', { name: 'View ownership structure' })
    );
    await user.click(
      screen.getByRole('button', { name: 'Add beneficial owner' })
    );
    await user.click(
      screen.getByRole('button', { name: /Owns the client directly/ })
    );
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
            operations: ['ADD_BENEFICIAL_OWNER'],
          },
        ]}
      />
    );

    await user.click(
      screen.getByRole('button', { name: 'View ownership structure' })
    );
    await user.click(
      screen.getByRole('button', { name: 'Add beneficial owner' })
    );
    await user.click(
      screen.getByRole('button', { name: /Owns the client directly/ })
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
            operations: ['DISCLOSE_INDIRECT_OWNERSHIP'],
          },
        ]}
      />
    );

    await user.click(
      screen.getByRole('button', { name: 'View ownership structure' })
    );
    await user.click(
      screen.getByRole('button', { name: 'Add intermediary business' })
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
            operations: ['DISCLOSE_INDIRECT_OWNERSHIP'],
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
    await user.click(screen.getByRole('button', { name: 'Business profile' }));
    await user.click(screen.getByRole('button', { name: 'Review and submit' }));

    const requestCard = within(
      screen.getByRole('region', { name: 'Changes in this request' })
    )
      .getByText('Central Park Cookie')
      .closest('li');
    expect(requestCard).toHaveTextContent(
      'Intermediary owner · Pending addition'
    );
    await user.click(
      within(requestCard!).getByRole('button', {
        name: 'Discard pending addition',
      })
    );
    await user.click(
      screen.getByRole('button', { name: 'Discard pending addition' })
    );
    expect(cancelChanges).toHaveBeenCalledWith('request-1', 'intermediary-1');
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
            operations: ['DISCLOSE_INDIRECT_OWNERSHIP'],
          },
        ]}
      />
    );

    await user.click(
      screen.getByRole('button', { name: 'View ownership structure' })
    );
    await user.click(
      screen.getByRole('button', { name: 'Add intermediary business' })
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
            operations: ['DISCLOSE_INDIRECT_OWNERSHIP'],
          },
        ]}
      />
    );

    await user.click(
      screen.getByRole('button', { name: 'View ownership structure' })
    );
    await user.click(
      screen.getByRole('button', { name: 'Add intermediary business' })
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
            operations: ['ADD_BENEFICIAL_OWNER', 'DISCLOSE_INDIRECT_OWNERSHIP'],
          },
        ]}
      />
    );

    await user.click(
      screen.getByRole('button', { name: 'View ownership structure' })
    );
    await user.click(
      screen.getByRole('button', {
        name: 'Add owner through this business',
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

  test('rebuilds an existing owner path through a new intermediary without removing their controller role', async () => {
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
    createParty
      .mockResolvedValueOnce({ id: 'intermediary-1' })
      .mockResolvedValueOnce({ id: 'indirect-owner-1' });
    updateParty.mockResolvedValue(undefined);

    render(
      <ApprovedClientMaintenance
        clientId="client-1"
        eligibility={[
          {
            country: 'US',
            organizationType: 'LIMITED_LIABILITY_COMPANY',
            operations: ['ADD_BENEFICIAL_OWNER', 'DISCLOSE_INDIRECT_OWNERSHIP'],
          },
        ]}
      />
    );

    await user.click(
      screen.getByRole('button', { name: 'View ownership structure' })
    );
    const janeOwner = screen.getByText('Jane R Doe').closest('li');
    await user.click(
      within(janeOwner!).getByRole('button', {
        name: 'Change to indirect ownership',
      })
    );
    expect(
      screen.getByRole('heading', {
        name: 'Choose an intermediary for Jane R Doe',
      })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Owns the client directly/ })
    ).not.toBeInTheDocument();
    await user.click(
      screen.getByRole('button', {
        name: 'Add a new intermediary for this owner',
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

    expect(
      screen.getByRole('heading', { name: 'Confirm owner details' })
    ).toBeInTheDocument();
    expect(screen.getByLabelText('First name')).toHaveValue('Jane');
    expect(screen.getByLabelText('Last name')).toHaveValue('Doe');
    await user.click(screen.getByLabelText('Job title'));
    await user.click(screen.getByRole('option', { name: 'CEO' }));
    const email = screen.getByLabelText('Email');
    await user.clear(email);
    await user.type(email, 'owner@example.com');
    await user.click(
      screen.getByRole('button', { name: 'Create new ownership path' })
    );

    expect(createParty).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        parentPartyId: 'intermediary-1',
        roles: ['BENEFICIAL_OWNER'],
        individualDetails: expect.objectContaining({
          natureOfOwnership: 'Indirect',
        }),
      })
    );
    expect(updateParty).toHaveBeenCalledWith('person-1', {
      roles: ['CONTROLLER'],
    });
    expect(updateParty.mock.invocationCallOrder[0]).toBeLessThan(
      createParty.mock.invocationCallOrder[1]!
    );
  });

  test('rebuilds a direct owner beneath an existing intermediary', async () => {
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
            operations: ['ADD_BENEFICIAL_OWNER', 'DISCLOSE_INDIRECT_OWNERSHIP'],
          },
        ]}
      />
    );

    await user.click(
      screen.getByRole('button', { name: 'View ownership structure' })
    );
    const janeOwner = screen.getByText('Jane R Doe').closest('li');
    await user.click(
      within(janeOwner!).getByRole('button', {
        name: 'Change to indirect ownership',
      })
    );
    await user.click(
      screen.getByRole('button', { name: /Existing Holdings LLC/ })
    );

    expect(
      screen.getByRole('heading', { name: 'Confirm owner details' })
    ).toBeInTheDocument();
    expect(screen.getByLabelText('First name')).toHaveValue('Jane');
    await user.click(
      screen.getByRole('button', { name: 'Create new ownership path' })
    );

    expect(createParty).toHaveBeenCalledTimes(1);
    expect(createParty).toHaveBeenCalledWith(
      expect.objectContaining({
        parentPartyId: 'intermediary-existing',
        roles: ['BENEFICIAL_OWNER'],
      })
    );
    expect(updateParty).toHaveBeenCalledWith('person-1', {
      roles: ['CONTROLLER'],
    });
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
            operations: ['ADD_CONTROLLER', 'ADD_BENEFICIAL_OWNER'],
          },
        ]}
      />
    );

    await user.click(
      screen.getByRole('button', { name: 'View ownership structure' })
    );

    expect(
      screen.getByRole('button', { name: 'Add beneficial owner' })
    ).toBeDisabled();
    expect(
      screen.queryByRole('button', { name: 'Choose replacement controller' })
    ).not.toBeInTheDocument();
  });

  test('returns an organization edit to maintenance request review after save', async () => {
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
            operations: ['EDIT_ORGANIZATION'],
          },
        ]}
      />
    );

    await user.click(screen.getByRole('button', { name: 'Review and submit' }));
    const businessChange = within(
      screen.getByRole('region', { name: 'Changes in this request' })
    )
      .getByText('Marketplace Vendor LLC')
      .closest('li');
    expect(within(businessChange!).getByText('Business')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'More actions' }));
    await user.click(
      screen.getByRole('menuitem', { name: 'Add or edit changes' })
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
            operations: ['REMOVE_RELATED_PARTY'],
          },
        ]}
      />
    );

    await user.click(screen.getByRole('button', { name: /Wendy Darling/ }));
    await user.click(
      screen.getByRole('button', { name: 'Remove related party' })
    );
    await user.click(
      screen.getByRole('button', { name: 'Remove related party' })
    );
    expect(updateParty).toHaveBeenCalledWith('person-2', { active: false });
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

    expect(screen.getByText('Legal entity on file')).toBeInTheDocument();
    expect(screen.getByText('1 active product')).toBeInTheDocument();
    expect(
      screen.getByText('Key roles and intermediary businesses')
    ).toBeInTheDocument();
    expect(screen.getByText('Controller')).toBeInTheDocument();
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
      screen.getByText('Controller · Beneficial owner · Direct')
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
      'eb-border-warning/60',
      'eb-bg-warning-accent/40'
    );

    await user.click(pendingRemovalRow);

    const removedPartyHeading = screen.getByRole('heading', {
      name: 'Jane R Doe',
    });
    const removedPartyHeader = removedPartyHeading.closest('header');
    expect(removedPartyHeader).toHaveClass(
      'eb-border-warning/50',
      'eb-bg-warning-accent/40'
    );
    expect(
      within(removedPartyHeader!).getByText('Pending removal')
    ).toBeInTheDocument();
    expect(
      removedPartyHeader?.querySelector('.lucide-circle-minus')
    ).not.toBeNull();

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

  test('keeps ownership details compact and relationship actions explicit', async () => {
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
            operations: ['ADD_BENEFICIAL_OWNER', 'DISCLOSE_INDIRECT_OWNERSHIP'],
          },
        ]}
      />
    );
    await user.click(
      screen.getByRole('button', { name: 'View ownership structure' })
    );

    expect(
      screen.getByRole('button', { name: 'Add beneficial owner' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Add intermediary business' })
    ).toBeInTheDocument();
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
    expect(businessDetails).toHaveLength(1);
    expect(ownerDetails[0]).toHaveTextContent('View details');
    expect(businessDetails[0]).toHaveTextContent('View details');
    expect(
      screen.getByRole('button', { name: 'Change to indirect ownership' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: 'Add owner through this business',
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
    ).toHaveClass('eb--top-3');
    expect(ownershipNodes?.[1]).toHaveAttribute(
      'data-last-ownership-node',
      'true'
    );
    expect(
      ownershipNodes?.[1].querySelector('[data-ownership-tree-spine]')
    ).toHaveClass('eb-bottom-1/2');
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
            operations: ['ADD_BENEFICIAL_OWNER', 'DISCLOSE_INDIRECT_OWNERSHIP'],
          },
        ]}
      />
    );
    await user.click(
      screen.getByRole('button', { name: 'View ownership structure' })
    );
    await user.click(
      screen.getByRole('button', { name: 'Add beneficial owner' })
    );

    expect(
      screen.getByRole('heading', { name: 'Add a beneficial owner' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Owns the client directly/ })
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
      screen.getByRole('button', { name: 'Add Limited DDA Payments' })
    ).toBeDisabled();
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
    await user.click(screen.getByRole('button', { name: 'More actions' }));
    expect(
      screen.getByRole('menuitem', { name: 'Add or edit changes' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('menuitem', { name: 'Discard changes' })
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
    expect(
      screen.getByRole('heading', { name: 'Submission blocked' })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Complete the required items shown above before submitting these updates.'
      )
    ).toBeInTheDocument();
    const blockedSubmit = screen.getByRole('button', {
      name: 'Submit for review',
    });
    expect(blockedSubmit).toBeDisabled();
    expect(
      screen.getByLabelText(
        'I reviewed the business and related-party information on file, including the updates shown here, and confirm no other changes are needed.'
      )
    ).toBeDisabled();
    expect(
      screen
        .getByRole('heading', { name: 'Submission blocked' })
        .closest('section')
    ).toHaveClass('eb-bg-warning-accent/40');
    expect(
      screen.getByRole('heading', { name: 'Before submission' })
    ).toBeInTheDocument();
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
    await user.click(screen.getByRole('button', { name: 'More actions' }));
    await user.click(
      screen.getByRole('menuitem', { name: 'Add or edit changes' })
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
    expect(
      screen.getByRole('heading', { name: 'Ownership structure', level: 3 })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Update ownership' })
    ).toBeInTheDocument();
    const businessConfirmation = screen.getByLabelText(
      'I reviewed the business and related-party information on file, including the updates shown here, and confirm no other changes are needed.'
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
    expect(screen.getByText('Changes submitted')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Discard all pending changes' })
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

    expect(screen.getByText('Changes submitted')).toBeInTheDocument();
    expect(screen.queryByText('Submitted change')).not.toBeInTheDocument();
    const viewSubmittedUpdates = screen.getByRole('button', {
      name: 'View submitted updates',
    });
    expect(
      viewSubmittedUpdates.querySelector('.lucide-arrow-right')
    ).toBeInTheDocument();
    expect(
      viewSubmittedUpdates.querySelector('.lucide-clock3')
    ).not.toBeInTheDocument();
    await user.click(viewSubmittedUpdates);

    expect(
      screen.getByRole('heading', { name: 'Maintenance request details' })
    ).toBeInTheDocument();
    expect(screen.getByText(/Submitted .*Aug.*26.*2026/)).toBeInTheDocument();
    expect(screen.getByText('Jane R Doe')).toBeInTheDocument();
    expect(screen.getByText('Alex Smith')).toBeInTheDocument();
    const profileUpdatesHeading = screen.getByRole('heading', {
      name: 'Changes in this request',
    });
    const profileUpdatesContent =
      profileUpdatesHeading.parentElement?.nextElementSibling;
    expect(profileUpdatesContent).not.toHaveClass(
      'eb-rounded-md',
      'eb-border',
      'eb-bg-background'
    );
    const partyCards = ['Jane R Doe', 'Alex Smith'].map((name) =>
      screen.getByText(name).closest('li')
    );
    partyCards.forEach((partyCard) => {
      expect(partyCard).toHaveClass(
        'eb-rounded-md',
        'eb-border',
        'eb-bg-background'
      );
      expect(partyCard?.parentElement).toBe(
        profileUpdatesContent?.firstElementChild
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
      screen.queryByRole('button', { name: 'Edit business details' })
    ).not.toBeInTheDocument();
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

  test('maintenance request details link directly to each document task without duplicate party blockers', async () => {
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
        .getByRole('heading', { name: 'More information is required' })
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

    const partyUpdate = screen.getByText('Jane R Doe').closest('li');
    expect(partyUpdate).not.toBeNull();
    expect(screen.getByText('Jane R Doe')).toBeInTheDocument();
    const partyHeader = within(partyUpdate!).getByText('Jane R Doe')
      .parentElement?.parentElement;
    expect(partyHeader).toHaveClass('eb-bg-muted/20', 'eb-px-4', 'eb-py-3');
    expect(partyHeader?.nextElementSibling).toHaveClass('eb-border-t');
    expect(screen.queryByText('Previously Jane R Doe')).not.toBeInTheDocument();
    const documentAction = within(partyUpdate!).getByRole('button', {
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
      screen.getByRole('button', { name: 'Maintenance request details' })
    );
    expect(
      screen.getByRole('heading', { name: 'Maintenance request details' })
    ).toBeInTheDocument();
  });

  test('keeps a document-only party visible in request changes', async () => {
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
      ],
    };

    render(
      <ApprovedClientMaintenance clientId="client-1" eligibility={eligible} />
    );
    await user.click(
      screen.getByRole('button', { name: 'Complete required actions' })
    );

    const partyWorkUnit = within(
      screen.getByRole('region', { name: 'Changes in this request' })
    )
      .getByText('Alex Smith')
      .closest('li');
    expect(partyWorkUnit).not.toBeNull();
    expect(
      within(partyWorkUnit!).getByRole('button', {
        name: /Required documents/,
      })
    ).toBeInTheDocument();
    expect(
      within(partyWorkUnit!).queryByText('Current value')
    ).not.toBeInTheDocument();
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
