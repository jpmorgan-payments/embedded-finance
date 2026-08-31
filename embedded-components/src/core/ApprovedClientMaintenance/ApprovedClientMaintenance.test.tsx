import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import type { DocumentRequestResponse } from '@/api/generated/smbdo.schemas';

import { ApprovedClientMaintenance } from './ApprovedClientMaintenance';
import type {
  MaintenanceClient,
  MaintenanceParty,
} from './models/maintenanceApi.types';

const updatePartyName = vi.fn();
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
        countryOfFormation: 'US',
        organizationType: 'LIMITED_LIABILITY_COMPANY',
      },
    },
    {
      id: 'person-1',
      partyType: 'INDIVIDUAL',
      roles: ['CONTROLLER'],
      individualDetails: {
        firstName: 'Jane',
        middleName: 'R',
        lastName: 'Doe',
      },
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
  individualDetails: { lastName },
  updateRequest: {
    status,
    action: 'MODIFY',
    requestId: 'request-1',
    submittedAt: '2026-08-26T12:00:00.000Z',
  },
});

describe('ApprovedClientMaintenance', () => {
  beforeEach(() => {
    workspace.clientQuery.data = approvedClient;
    workspace.clientQuery.error = null;
    workspace.clientQuery.isError = false;
    workspace.maintenanceQuery.data = { pages: [], parties: [] };
    workspace.maintenanceQuery.error = null;
    workspace.maintenanceQuery.isError = false;
    workspace.maintenanceQuery.isFetching = false;
    workspace.documentRequestsQuery.data = { documentRequests: [] };
    workspace.documentRequestsQuery.error = null;
    workspace.isDocumentDiscoveryPending = false;
    workspace.updatePartyNameMutation.error = null;
    workspace.cancelMaintenanceMutation.error = null;
    workspace.verificationMutation.data = undefined;
    workspace.verificationMutation.error = null;
    workspace.verificationMutation.isPending = false;
    vi.clearAllMocks();
  });

  test('opens a focused editor and returns to the person after refetch', async () => {
    const user = userEvent.setup();
    updatePartyName.mockImplementation(async () => {
      workspace.maintenanceQuery.data = {
        pages: [],
        parties: [createProposal('Diaz')],
      };
    });
    render(
      <ApprovedClientMaintenance clientId="client-1" eligibility={eligible} />
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
    expect(await screen.findByText('Draft updates')).toBeInTheDocument();
    expect(screen.getByLabelText('Current profile: Doe')).toBeInTheDocument();
    expect(screen.getByLabelText('Draft update: Diaz')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Edit changes' }));
    expect(
      screen.getByRole('button', { name: 'Cancel editing' })
    ).toBeInTheDocument();
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

  test('keeps the familiar profile overview when a change set is active', () => {
    workspace.maintenanceQuery.data = {
      pages: [],
      parties: [createProposal('Diaz')],
    };

    render(
      <ApprovedClientMaintenance clientId="client-1" eligibility={eligible} />
    );

    expect(screen.getByText('Business profile')).toBeInTheDocument();
    expect(
      screen.getByText('Maintenance request ID: request-1')
    ).toBeInTheDocument();
    expect(screen.getByText('Draft profile updates')).toBeInTheDocument();
    expect(screen.getByText('Jane R Doe')).toBeInTheDocument();
    expect(screen.queryByText('Previously Jane R Doe')).not.toBeInTheDocument();
    expect(screen.queryByText(/field changed/)).not.toBeInTheDocument();
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

    expect(screen.getByText('Profile updates submitted')).toBeInTheDocument();
    expect(
      screen.getByText('Profile updates submitted').closest('section')
    ).toHaveClass('eb-bg-informative-accent');
    expect(
      screen.queryByRole('button', { name: 'Discard all changes' })
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Jane R Doe/ }));
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
    expect(screen.getByRole('textbox', { name: 'Last name' })).toHaveValue(
      'Diaz'
    );
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
      screen.getByText('Maintenance request ID: request-1')
    ).toBeInTheDocument();
    expect(screen.getByText('Jane R Doe')).toBeInTheDocument();
    expect(screen.getByText('Alex Smith')).toBeInTheDocument();
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

    render(
      <ApprovedClientMaintenance clientId="client-1" eligibility={eligible} />
    );

    expect(
      screen.getByText('More information is required')
    ).toBeInTheDocument();
    expect(screen.getByText('Action required')).toBeInTheDocument();
    expect(screen.queryByText('Upload documents')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Documents' })
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Jane R Doe/ }));
    const requiredNext = screen.getByRole('heading', { name: 'Required next' });
    expect(requiredNext.closest('section')).toHaveClass(
      'eb-bg-warning-accent/40'
    );
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
    expect(screen.getByText('Required next')).toBeInTheDocument();
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

    await user.click(screen.getByRole('button', { name: /Jane R Doe/ }));
    const draftSection = screen
      .getByRole('heading', { name: 'Draft updates' })
      .closest('section');
    expect(draftSection).not.toBeNull();
    const editChanges = within(draftSection!).getByRole('button', {
      name: 'Edit changes',
    });
    const discardChanges = within(draftSection!).getByRole('button', {
      name: 'Discard changes',
    });
    const comparisonGroup = screen
      .getByLabelText('Current profile: Doe')
      .closest('.eb-rounded-md');
    const viewFullMaintenanceRequest = within(draftSection!).getByRole(
      'button',
      {
        name: 'View full maintenance request',
      }
    );
    expect(comparisonGroup).not.toContainElement(viewFullMaintenanceRequest);
    expect(comparisonGroup?.parentElement?.lastElementChild).toContainElement(
      viewFullMaintenanceRequest
    );
    expect(comparisonGroup?.parentElement?.lastElementChild).toHaveClass(
      'eb-mt-3'
    );
    expect(
      within(draftSection!).getByText('Draft changes not yet submitted')
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
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    await user.click(
      screen.getByRole('button', { name: 'Discard all changes' })
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
    expect(
      screen.queryByText('No product details available')
    ).not.toBeInTheDocument();
  });

  test('separates overview sections with a label gutter and bounded content groups', () => {
    render(
      <ApprovedClientMaintenance clientId="client-1" eligibility={eligible} />
    );

    ['Business details', 'Products', 'People'].forEach((heading) => {
      const sectionHeading = screen.getByRole('heading', { name: heading });
      expect(sectionHeading.closest('section')).toHaveClass(
        'eb-grid',
        'eb-bg-muted/20',
        'sm:eb-grid-cols-[minmax(8rem,1fr)_2.5fr]'
      );
      expect(sectionHeading.parentElement?.nextElementSibling).toHaveClass(
        'eb-rounded-md',
        'eb-border',
        'eb-bg-background'
      );
    });

    ['Products', 'People'].forEach((heading) => {
      expect(
        screen.getByRole('heading', { name: heading }).closest('section')
      ).toHaveClass('eb-border-t');
    });

    expect(screen.getByText('Legal entity on file')).toBeInTheDocument();
    expect(screen.getByText('1 active product')).toBeInTheDocument();
    expect(screen.getByText('1 related party')).toBeInTheDocument();
  });

  test('reuses the same section pattern in focused views', async () => {
    const user = userEvent.setup();
    render(
      <ApprovedClientMaintenance clientId="client-1" eligibility={eligible} />
    );

    await user.click(screen.getByRole('button', { name: /Jane R Doe/ }));

    const profileHeading = screen.getByRole('heading', {
      name: 'Profile details',
    });
    expect(profileHeading.closest('section')).toHaveClass(
      'eb-grid',
      'eb-bg-muted/20',
      'sm:eb-grid-cols-[minmax(8rem,1fr)_2.5fr]'
    );
    expect(profileHeading.parentElement?.nextElementSibling).toHaveClass(
      'eb-rounded-md',
      'eb-border',
      'eb-bg-background'
    );
    expect(screen.getByText('Approved values on file')).toBeInTheDocument();
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
    expect(screen.getByText('Sub-product')).toBeInTheDocument();
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
        'Your updates are saved here but have not been submitted for review.'
      )
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Review and submit' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Marketplace Vendor LLC/ })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Request another product' })
    ).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Add person' })).toBeDisabled();
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
      screen.getByRole('heading', { name: 'Review your updates' })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Edit changes' })
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'More actions' }));
    expect(
      screen.getByRole('menuitem', { name: 'Edit changes' })
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
      screen.queryByRole('heading', { name: 'Ready to submit' })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Submit for review' })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Before submission' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Business profile' })
    ).toBeInTheDocument();
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
    await user.click(screen.getByRole('menuitem', { name: 'Edit changes' }));

    expect(
      screen.getByRole('heading', { name: 'Edit details' })
    ).toBeInTheDocument();
    const reviewBreadcrumb = screen.getByRole('button', {
      name: 'Review your updates',
    });
    expect(reviewBreadcrumb).not.toHaveClass('eb-button');
    const profileBreadcrumb = screen.getByRole('button', {
      name: 'Business profile',
    });
    expect(profileBreadcrumb.querySelector('.lucide-arrow-left')).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Cancel editing' }));

    expect(
      screen.getByRole('heading', { name: 'Review your updates' })
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
    await user.click(
      screen.getByLabelText(
        'I confirm that I reviewed all updates and they are complete and accurate.'
      )
    );
    await user.click(screen.getByRole('button', { name: 'Submit for review' }));

    expect(submitForReview).toHaveBeenCalledWith(expect.any(String));
    expect(await screen.findByText('Submitted for review')).toBeInTheDocument();
    await user.click(
      screen.getByRole('button', { name: 'Return to business profile' })
    );
    expect(screen.getByText('Profile updates submitted')).toBeInTheDocument();
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

    expect(screen.getByText('Profile updates submitted')).toBeInTheDocument();
    expect(screen.queryByText('Submitted update')).not.toBeInTheDocument();
    await user.click(
      screen.getByRole('button', { name: 'View maintenance request details' })
    );

    expect(
      screen.getByRole('heading', { name: 'Maintenance request details' })
    ).toBeInTheDocument();
    expect(screen.getByText(/Submitted .*Aug.*26.*2026/)).toBeInTheDocument();
    expect(screen.getByText('Jane R Doe')).toBeInTheDocument();
    expect(screen.getByText('Alex Smith')).toBeInTheDocument();
    const profileUpdatesHeading = screen.getByRole('heading', {
      name: 'Profile updates',
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
    expect(screen.getAllByText('Current profile').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Submitted update').length).toBeGreaterThan(0);
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
    ).toBeDisabled();
    expect(screen.getByText('Limited liability company')).toBeInTheDocument();
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
      screen.getByRole('button', { name: 'View maintenance request details' })
    ).toHaveClass('eb-border-warning/50', 'eb-text-warning');
    await user.click(
      screen.getByRole('button', { name: 'View maintenance request details' })
    );

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

  test('keeps a document-only party visible in request profile updates', async () => {
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
      screen.getByRole('button', { name: 'View maintenance request details' })
    );

    const partyWorkUnit = screen.getByText('Alex Smith').closest('li');
    expect(partyWorkUnit).not.toBeNull();
    expect(
      within(partyWorkUnit!).getByRole('button', {
        name: /Required documents/,
      })
    ).toBeInTheDocument();
    expect(
      within(partyWorkUnit!).queryByText('Current profile')
    ).not.toBeInTheDocument();
  });

  test('keeps profile details visible beside a labeled submitted update section', async () => {
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
    await user.click(screen.getByRole('button', { name: /Jane R Doe/ }));

    expect(screen.getByText('Profile details')).toBeInTheDocument();
    expect(screen.getByText('Date of birth')).toBeInTheDocument();
    expect(screen.getByText('1990-01-01')).toBeInTheDocument();
    expect(screen.getByText('Updates under review')).toBeInTheDocument();
    expect(screen.getAllByText('Current profile').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Submitted update').length).toBeGreaterThan(0);
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
    expect(missingValues).toHaveLength(2);
    missingValues.forEach((value) =>
      expect(value).toHaveClass('eb-text-muted-foreground')
    );
  });
});
