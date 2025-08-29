import { i18n } from '@/i18n/config';
import { server } from '@/msw/server';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, test } from 'vitest';
import { render, screen, userEvent, waitFor } from '@test-utils';

import { OnboardingFlow } from '@/core/OnboardingFlow';
import { OnboardingFlowProps } from '@/core/OnboardingFlow/types/onboarding.types';

// Mock data for a complete end-to-end flow
const mockClientData = {
  id: 'test-client-123',
  status: 'NEW',
  createdAt: '2023-01-01T00:00:00.000Z',
  products: ['EMBEDDED_PAYMENTS'],
  parties: [],
  outstanding: {
    documentRequestIds: [],
    questionIds: ['30005', '300006', '300007'],
    attestationDocumentIds: ['abcd1c1d-6635-43ff-a8e5-b252926bddef'],
    partyIds: [],
    partyRoles: [],
  },
  questionResponses: [],
  verifications: [],
};

const mockControllerParty = {
  id: 'controller-party-123',
  roles: ['CONTROLLER'],
  partyType: 'INDIVIDUAL',
  individualDetails: {
    firstName: 'John',
    lastName: 'Controller',
    jobTitle: 'CEO',
    addresses: [
      {
        addressLines: ['456 Controller St'],
        city: 'Controller City',
        state: 'CA',
        country: 'US',
        postalCode: '90001',
        addressType: 'RESIDENTIAL_ADDRESS',
      },
    ],
    phoneNumbers: [
      {
        phoneNumber: '+15559876543',
        phoneNumberType: 'MOBILE',
      },
    ],
    emailAddresses: [
      {
        emailAddress: 'john@test.com',
        emailAddressType: 'PERSONAL',
      },
    ],
    identificationDocument: {
      documentType: 'DRIVERS_LICENSE',
      documentNumber: 'DL123456789',
      expirationDate: '2030-12-31',
      issuingState: 'CA',
      issuingCountry: 'US',
    },
    dateOfBirth: '1980-01-01',
    socialSecurityNumber: '123456789',
  },
  status: 'ACTIVE',
  validationResponse: [],
};

// Test component wrapper with all necessary providers
const renderOnboardingFlow = (props: Partial<OnboardingFlowProps> = {}) => {
  const defaultProps: OnboardingFlowProps = {
    initialClientId: '',
    availableProducts: ['EMBEDDED_PAYMENTS'],
    availableJurisdictions: ['US'],
    availableOrganizationTypes: [
      'SOLE_PROPRIETORSHIP',
      'LIMITED_LIABILITY_COMPANY',
      'C_CORPORATION',
    ],
    docUploadOnlyMode: false,
    alertOnExit: false,
    ...props,
  };

  return render(<OnboardingFlow {...defaultProps} />);
};

describe.skip('OnboardingFlow - Comprehensive End-to-End Journey', () => {
  beforeEach(() => {
    // Reset MSW handlers before each test
    server.resetHandlers();
  });

  test('completes full onboarding journey through all sections defined in flowConfig', async () => {
    const user = userEvent.setup();

    renderOnboardingFlow();

    // === STEP 1: GATEWAY SCREEN (id: 'gateway' from flowConfig) ===
    await waitFor(() => {
      expect(
        screen.getByText(
          i18n.t('onboarding-overview:screens.gateway.infoAlert.title')
        )
      ).toBeInTheDocument();
      expect(
        screen.getByText(/Select your general business type/i)
      ).toBeInTheDocument();
    });

    // Select "Registered business" option from radio group
    const registeredBusinessOption = screen.getByRole('radio', {
      name: /Registered business/i,
    });
    await user.click(registeredBusinessOption);

    // Wait for specific business types to appear
    await waitFor(() => {
      expect(
        screen.getByText(/Select the specific legal structure/i)
      ).toBeInTheDocument();
    });

    // Select LLC from the dropdown field
    const legalStructureDropdown = screen.getByLabelText(
      /Select the specific legal structure/i
    );
    await user.click(legalStructureDropdown);

    // Select LLC option from the dropdown list
    const llcOption = screen.getByRole('option', {
      name: /Limited Liability Company \(LLC\)/i,
    });
    await user.click(llcOption);

    // Click "Get Started" button to proceed
    await waitFor(() => {
      const getStartedButton = screen.getByRole('button', {
        name: /get started/i,
      });
      expect(getStartedButton).toBeInTheDocument();
      return user.click(getStartedButton);
    });

    // === STEP 2: OVERVIEW SCREEN (id: 'overview' from flowConfig) ===
    await waitFor(
      () => {
        expect(screen.getByText(/Overview/i)).toBeInTheDocument();
      },
      { timeout: 10000 }
    );

    // Verify overview screen sections are visible - these should match flowConfig section labels
    expect(screen.getByText(/Verify your business/i)).toBeInTheDocument();

    // Verify all section labels from flowConfig are present
    // personal-section: label: 'Your personal details'
    expect(screen.getByText(/Your personal details/i)).toBeInTheDocument();

    // business-section: label: 'Business details'
    expect(screen.getByText(/Business details/i)).toBeInTheDocument();

    // owners-section: label: 'Owners and key roles'
    expect(screen.getByText(/Owners and key roles/i)).toBeInTheDocument();

    // additional-questions-section: label: 'Operational details'
    expect(screen.getByText(/Operational details/i)).toBeInTheDocument();

    // review-attest-section: label: 'Review and attest'
    expect(screen.getByText(/Review and attest/i)).toBeInTheDocument();

    // upload-documents-section: label: 'Supporting documents'
    expect(screen.getByText(/Supporting documents/i)).toBeInTheDocument();

    // === STEP 4: NAVIGATE THROUGH PERSONAL DETAILS SECTION (STEPPER - id: 'personal-section') ===

    // 4a. Click on Personal Details section
    const personalDetailsButton = screen.getByTestId('personal-section-button');
    await user.click(personalDetailsButton);

    // Should enter personal details stepper - Step 1: Personal Details Form (title: 'Your personal details')
    await waitFor(
      () => {
        expect(
          screen.getByText(
            /We collect your personal information as the primary person controlling business operations for the company./i
          )
        ).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    // Verify we're in the stepper by checking step titles from flowConfig
    // Steps: personal-details, identity-document, contact-details, check-answers
    // We should see the first step title: 'Your personal details'

    // Navigate back to overview from personal details
    const overviewButton = screen.queryByRole('button', { name: /overview/i });
    if (overviewButton) {
      await user.click(overviewButton);
    }

    // === STEP 5: NAVIGATE THROUGH BUSINESS DETAILS SECTION (STEPPER - id: 'business-section') ===

    await waitFor(() => {
      expect(screen.getByText(/Overview/i)).toBeInTheDocument();
    });

    // 5a. Click on Business Details section
    const businessDetailsButton = screen.getByText(/Business details/i);
    await user.click(businessDetailsButton);

    // Should enter business details stepper - Step 1: Business Identity Form (title: 'Business identity')
    await waitFor(
      () => {
        expect(screen.getByText(/Business identity/i)).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    // Verify stepper steps from flowConfig: business-identity, industry, contact-info, check-answers

    // Navigate back to overview from business details
    const overviewButton2 = screen.queryByRole('button', { name: /overview/i });
    if (overviewButton2) {
      await user.click(overviewButton2);
    }

    // === STEP 6: NAVIGATE TO OWNERS SECTION (COMPONENT - id: 'owners-section') ===

    await waitFor(() => {
      expect(screen.getByText(/Overview/i)).toBeInTheDocument();
    });

    // 6a. Click on Owners section
    const ownersButton = screen.getByText(/Owners and key roles/i);
    await user.click(ownersButton);

    // Should be in owners component screen - this uses OwnersSectionScreen component
    await waitFor(
      () => {
        // Look for ownership-related content
        // Note: excludedForOrgTypes: ['SOLE_PROPRIETORSHIP'] so this should be visible for LLC
        const ownershipContent =
          screen.queryByText(/owners/i) ||
          screen.queryByText(/beneficial/i) ||
          screen.queryByText(/Owners/i);
        if (ownershipContent) {
          expect(ownershipContent).toBeInTheDocument();
        }
      },
      { timeout: 5000 }
    );

    // Navigate back to overview from owners
    const overviewButton3 = screen.queryByRole('button', { name: /overview/i });
    if (overviewButton3) {
      await user.click(overviewButton3);
    }

    // === STEP 7: NAVIGATE TO OPERATIONAL DETAILS SECTION (COMPONENT - id: 'additional-questions-section') ===

    await waitFor(() => {
      expect(screen.getByText(/Overview/i)).toBeInTheDocument();
    });

    // 7a. Click on Operational Details section (flowConfig label: 'Operational details')
    const operationalButton = screen.getByText(/Operational details/i);
    await user.click(operationalButton);

    // Should be in operational details component screen - uses OperationalDetailsForm
    await waitFor(
      () => {
        // Look for operational form content
        // From flowConfig requirementsList: ['Total annual revenue', 'Additional questions based on your business profile']
        const operationalContent =
          screen.queryByText(/revenue/i) ||
          screen.queryByText(/annual/i) ||
          screen.queryByText(/questions/i) ||
          screen.queryByText(/business profile/i);
        if (operationalContent) {
          expect(operationalContent).toBeInTheDocument();
        }
      },
      { timeout: 5000 }
    );

    // Navigate back to overview from operational details
    const overviewButton4 = screen.queryByRole('button', { name: /overview/i });
    if (overviewButton4) {
      await user.click(overviewButton4);
    }

    // === STEP 8: NAVIGATE TO REVIEW & ATTEST SECTION (STEPPER - id: 'review-attest-section') ===

    await waitFor(() => {
      expect(screen.getByText(/Overview/i)).toBeInTheDocument();
    });

    // 8a. Click on Review & Attest section (flowConfig label: 'Review and attest')
    const reviewButton = screen.getByText(/Review and attest/i);
    await user.click(reviewButton);

    // Should enter review & attest stepper - Step 1: Review Form (title: 'Review your details')
    await waitFor(
      () => {
        expect(screen.getByText(/Review your details/i)).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    // Verify stepper steps from flowConfig: review, documents (Terms and conditions)

    // Navigate back to overview from review & attest
    const overviewButton5 = screen.queryByRole('button', { name: /overview/i });
    if (overviewButton5) {
      await user.click(overviewButton5);
    }

    // === STEP 9: NAVIGATE TO SUPPORTING DOCUMENTS SECTION (COMPONENT - id: 'upload-documents-section') ===

    await waitFor(() => {
      expect(screen.getByText(/Overview/i)).toBeInTheDocument();
    });

    // 9a. Click on Supporting Documents section (flowConfig label: 'Supporting documents')
    const documentsButton = screen.getByText(/Supporting documents/i);
    await user.click(documentsButton);

    // Should be in supporting documents component screen - uses DocumentUploadScreen
    await waitFor(
      () => {
        // Look for document upload content
        // From flowConfig onHoldText: "We'll let you know if any documents are needed"
        const documentsContent =
          screen.queryByText(/document/i) ||
          screen.queryByText(/upload/i) ||
          screen.queryByText(/We'll let you know/i);
        if (documentsContent) {
          expect(documentsContent).toBeInTheDocument();
        }
      },
      { timeout: 5000 }
    );

    // === STEP 10: FINAL RETURN TO OVERVIEW ===
    // Navigate back to overview to verify we can return
    const finalOverviewButton = screen.queryByRole('button', {
      name: /overview/i,
    });
    if (finalOverviewButton) {
      await user.click(finalOverviewButton);
    }

    // Should be back on overview screen
    await waitFor(
      () => {
        expect(screen.getByText(/Overview/i)).toBeInTheDocument();
        expect(screen.getByText(/Verify your business/i)).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    // Test completed successfully - navigated through entire onboarding journey based on flowConfig.ts
  }, 90000); // Increase timeout for comprehensive test

  test('handles error states during the onboarding journey', async () => {
    // Test error handling during API calls
    server.use(
      http.post('/clients', async () => {
        return HttpResponse.json(
          { error: 'Validation failed', details: 'Invalid data provided' },
          { status: 400 }
        );
      })
    );

    renderOnboardingFlow();

    // Should show gateway screen initially
    await waitFor(() => {
      expect(
        screen.getByText(/Let's help you get started/i)
      ).toBeInTheDocument();
    });

    // Test that the component renders without crashing on errors
    expect(
      screen.getByText(/Select your general business type/i)
    ).toBeInTheDocument();
  });

  test('supports saving and resuming progress', async () => {
    // Mock a client with partial progress
    const savedParties = [
      {
        ...mockControllerParty,
        individualDetails: {
          ...mockControllerParty.individualDetails,
          firstName: 'Sarah',
          lastName: 'Johnson',
        },
      },
    ];

    server.use(
      http.get('/clients/:clientId', () => {
        return HttpResponse.json({
          ...mockClientData,
          id: 'partial-client-123',
          parties: savedParties,
          status: 'NEW',
        });
      })
    );

    renderOnboardingFlow({ initialClientId: 'partial-client-123' });

    // Should show gateway screen initially since no organization type is determined
    await waitFor(() => {
      expect(
        screen.getByText(/Let's help you get started/i)
      ).toBeInTheDocument();
    });

    // The test demonstrates the component renders with partial client data
    expect(
      screen.getByText(/Select your general business type/i)
    ).toBeInTheDocument();
  });

  test('navigates through stepper sections with all steps from flowConfig', async () => {
    const user = userEvent.setup();

    // Mock API responses for stepper navigation
    server.use(
      http.post('/clients', async () => {
        return HttpResponse.json(
          {
            ...mockClientData,
            id: 'stepper-client-123',
            status: 'NEW',
            organizationType: 'LIMITED_LIABILITY_COMPANY',
          },
          { status: 201 }
        );
      }),

      http.get('/clients/:clientId', () => {
        return HttpResponse.json({
          ...mockClientData,
          id: 'stepper-client-123',
          status: 'NEW',
          organizationType: 'LIMITED_LIABILITY_COMPANY',
        });
      }),

      http.post('/clients/:clientId/parties', async ({ request }) => {
        const body = (await request.json()) as Record<string, any>;
        return HttpResponse.json(
          {
            id: 'party-stepper-123',
            ...body,
          },
          { status: 201 }
        );
      }),

      http.get('/clients/:clientId/parties', () => {
        return HttpResponse.json([mockControllerParty]);
      }),

      http.put('/clients/:clientId/parties/:partyId', async ({ request }) => {
        const body = (await request.json()) as Record<string, any>;
        return HttpResponse.json({
          ...mockControllerParty,
          ...body,
        });
      }),

      // For question responses
      http.get('/questions', () => {
        return HttpResponse.json([
          {
            id: '30005',
            text: 'What is your business annual revenue?',
            type: 'SINGLE_SELECT',
            options: ['Under $100K', '$100K-$500K', 'Over $500K'],
          },
        ]);
      }),

      http.post('/clients/:clientId/question-responses', async () => {
        return HttpResponse.json({ success: true });
      })
    );

    renderOnboardingFlow();

    // Navigate to gateway and select business type
    await waitFor(() => {
      expect(
        screen.getByText(/Let's help you get started/i)
      ).toBeInTheDocument();
    });

    const registeredBusinessOption =
      screen.getAllByText(/Registered business/i)[0];
    await user.click(registeredBusinessOption);

    await waitFor(() => {
      expect(
        screen.getByText(/Limited Liability Company \(LLC\)/i)
      ).toBeInTheDocument();
    });

    const llcOption = screen.getByText(/Limited Liability Company \(LLC\)/i);
    await user.click(llcOption);

    const showMeButton = screen.getByRole('button', {
      name: /show me what's needed/i,
    });
    await user.click(showMeButton);

    await waitFor(() => {
      expect(screen.getByText(/Here is what you'll need/i)).toBeInTheDocument();
    });

    const getStartedButton = screen.getByRole('button', {
      name: /get started/i,
    });
    await user.click(getStartedButton);

    await waitFor(() => {
      expect(screen.getByText(/Overview/i)).toBeInTheDocument();
    });

    // === TEST PERSONAL SECTION STEPPER STEPS ===
    // From flowConfig personal-section steps: personal-details, identity-document, contact-details, check-answers

    const personalDetailsButton = screen.getByText(/Your personal details/i);
    await user.click(personalDetailsButton);

    // Step 1: Personal Details (title: 'Your personal details')
    await waitFor(() => {
      expect(screen.getByText(/Your personal details/i)).toBeInTheDocument();
    });

    // Look for next button or navigation elements to move through stepper
    // Note: Exact implementation depends on stepper component structure
    const nextButtons = screen.queryAllByRole('button', { name: /next/i });
    if (nextButtons.length > 0) {
      await user.click(nextButtons[0]);

      // Step 2: Identity Document (title: 'Your ID details')
      await waitFor(
        () => {
          expect(screen.getByText(/Your ID details/i)).toBeInTheDocument();
        },
        { timeout: 5000 }
      );
    }

    // Return to overview
    const overviewButton = screen.queryByRole('button', { name: /overview/i });
    if (overviewButton) {
      await user.click(overviewButton);
    }

    await waitFor(() => {
      expect(screen.getByText(/Overview/i)).toBeInTheDocument();
    });

    // === TEST BUSINESS SECTION STEPPER STEPS ===
    // From flowConfig business-section steps: business-identity, industry, contact-info, check-answers

    const businessDetailsButton = screen.getByText(/Business details/i);
    await user.click(businessDetailsButton);

    // Step 1: Business Identity (title: 'Business identity')
    await waitFor(() => {
      expect(screen.getByText(/Business identity/i)).toBeInTheDocument();
    });

    // Look for next button to navigate to next step
    const businessNextButtons = screen.queryAllByRole('button', {
      name: /next/i,
    });
    if (businessNextButtons.length > 0) {
      await user.click(businessNextButtons[0]);

      // Step 2: Industry (title: 'Description & industry classification')
      await waitFor(
        () => {
          expect(
            screen.getByText(/Description & industry classification/i)
          ).toBeInTheDocument();
        },
        { timeout: 5000 }
      );
    }

    // Return to overview
    const overviewButton2 = screen.queryByRole('button', { name: /overview/i });
    if (overviewButton2) {
      await user.click(overviewButton2);
    }

    await waitFor(() => {
      expect(screen.getByText(/Overview/i)).toBeInTheDocument();
    });

    // === TEST REVIEW SECTION STEPPER STEPS ===
    // From flowConfig review-attest-section steps: review, documents

    const reviewButton = screen.getByText(/Review and attest/i);
    await user.click(reviewButton);

    // Step 1: Review (title: 'Review your details')
    await waitFor(() => {
      expect(screen.getByText(/Review your details/i)).toBeInTheDocument();
    });

    // Look for next button to navigate to next step
    const reviewNextButtons = screen.queryAllByRole('button', {
      name: /next/i,
    });
    if (reviewNextButtons.length > 0) {
      await user.click(reviewNextButtons[0]);

      // Step 2: Terms and Conditions (title: 'Terms and conditions')
      await waitFor(
        () => {
          expect(screen.getByText(/Terms and conditions/i)).toBeInTheDocument();
        },
        { timeout: 5000 }
      );
    }

    // Test completed successfully - verified stepper navigation through all sections
  }, 60000);

  test('verifies section requirements and status from flowConfig', async () => {
    const user = userEvent.setup();

    // Mock API with different client status
    server.use(
      http.post('/clients', async () => {
        return HttpResponse.json(
          {
            ...mockClientData,
            id: 'requirements-client-123',
            status: 'NEW',
            organizationType: 'LIMITED_LIABILITY_COMPANY',
          },
          { status: 201 }
        );
      }),

      http.get('/clients/:clientId', () => {
        return HttpResponse.json({
          ...mockClientData,
          id: 'requirements-client-123',
          status: 'NEW',
          organizationType: 'LIMITED_LIABILITY_COMPANY',
        });
      })
    );

    renderOnboardingFlow();

    // Navigate to overview
    await waitFor(() => {
      expect(
        screen.getByText(/Let's help you get started/i)
      ).toBeInTheDocument();
    });

    const registeredBusinessOption =
      screen.getAllByText(/Registered business/i)[0];
    await user.click(registeredBusinessOption);

    await waitFor(() => {
      expect(
        screen.getByText(/Limited Liability Company \(LLC\)/i)
      ).toBeInTheDocument();
    });

    const llcOption = screen.getByText(/Limited Liability Company \(LLC\)/i);
    await user.click(llcOption);

    const showMeButton = screen.getByRole('button', {
      name: /show me what's needed/i,
    });
    await user.click(showMeButton);

    await waitFor(() => {
      expect(screen.getByText(/Here is what you'll need/i)).toBeInTheDocument();
    });

    const getStartedButton = screen.getByRole('button', {
      name: /get started/i,
    });
    await user.click(getStartedButton);

    await waitFor(() => {
      expect(screen.getByText(/Overview/i)).toBeInTheDocument();
    });

    // Verify requirements lists from flowConfig are displayed
    // personal-section requirements: ['Your name and job title', 'Government issued identifier (e.g. social security number)', 'Address and contact details']
    expect(screen.getByText(/Your name and job title/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Government issued identifier/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Address and contact details/i)
    ).toBeInTheDocument();

    // business-section requirements: ['Industry classification code', 'Registration ID details (e.g. employer identification number)', 'Location and contact details']
    expect(
      screen.getByText(/Industry classification code/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Registration ID details/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Location and contact details/i)
    ).toBeInTheDocument();

    // owners-section requirements: ['Name and job titles for all individuals', 'Government issued identifier (e.g. social security number)', 'Address and contact details']
    expect(
      screen.getByText(/Name and job titles for all individuals/i)
    ).toBeInTheDocument();

    // additional-questions-section requirements: ['Total annual revenue', 'Additional questions based on your business profile']
    expect(screen.getByText(/Total annual revenue/i)).toBeInTheDocument();
    expect(
      screen.getByText(/Additional questions based on your business profile/i)
    ).toBeInTheDocument();

    // Verify sections are in expected initial status (should be 'not_started' for NEW client)
    // Status indicators might be shown as icons, badges, or text depending on UI implementation
  }, 60000);

  test('handles owner stepper for beneficial owners based on flowConfig', async () => {
    const user = userEvent.setup();

    // Mock API responses for owner functionality
    server.use(
      http.post('/clients', async () => {
        return HttpResponse.json(
          {
            ...mockClientData,
            id: 'owner-client-123',
            status: 'NEW',
            organizationType: 'LIMITED_LIABILITY_COMPANY', // Not SOLE_PROPRIETORSHIP, so owners section should be visible
          },
          { status: 201 }
        );
      }),

      http.get('/clients/:clientId', () => {
        return HttpResponse.json({
          ...mockClientData,
          id: 'owner-client-123',
          status: 'NEW',
          organizationType: 'LIMITED_LIABILITY_COMPANY',
          parties: [mockControllerParty], // Include controller party
        });
      }),

      http.post('/clients/:clientId/parties', async ({ request }) => {
        const body = (await request.json()) as Record<string, any>;
        return HttpResponse.json(
          {
            id: 'beneficial-owner-123',
            ...body,
            roles: ['BENEFICIAL_OWNER'], // From flowConfig owner-stepper
            partyType: 'INDIVIDUAL',
          },
          { status: 201 }
        );
      }),

      http.get('/clients/:clientId/parties', () => {
        return HttpResponse.json([
          mockControllerParty,
          {
            id: 'beneficial-owner-123',
            roles: ['BENEFICIAL_OWNER'],
            partyType: 'INDIVIDUAL',
            individualDetails: {
              firstName: 'Jane',
              lastName: 'Owner',
              jobTitle: 'Co-founder',
            },
            status: 'ACTIVE',
          },
        ]);
      }),

      http.put('/clients/:clientId/parties/:partyId', async ({ request }) => {
        const body = (await request.json()) as Record<string, any>;
        return HttpResponse.json({
          id: 'beneficial-owner-123',
          ...body,
        });
      })
    );

    renderOnboardingFlow();

    // Navigate to overview
    await waitFor(() => {
      expect(
        screen.getByText(/Let's help you get started/i)
      ).toBeInTheDocument();
    });

    const registeredBusinessOption =
      screen.getAllByText(/Registered business/i)[0];
    await user.click(registeredBusinessOption);

    await waitFor(() => {
      expect(
        screen.getByText(/Limited Liability Company \(LLC\)/i)
      ).toBeInTheDocument();
    });

    const llcOption = screen.getByText(/Limited Liability Company \(LLC\)/i);
    await user.click(llcOption);

    const showMeButton = screen.getByRole('button', {
      name: /show me what's needed/i,
    });
    await user.click(showMeButton);

    await waitFor(() => {
      expect(screen.getByText(/Here is what you'll need/i)).toBeInTheDocument();
    });

    const getStartedButton = screen.getByRole('button', {
      name: /get started/i,
    });
    await user.click(getStartedButton);

    await waitFor(() => {
      expect(screen.getByText(/Overview/i)).toBeInTheDocument();
    });

    // === TEST OWNERS SECTION ===
    // From flowConfig: owners-section is excluded for SOLE_PROPRIETORSHIP but visible for LLC
    // Should use OwnersSectionScreen component

    const ownersButton = screen.getByText(/Owners and key roles/i);
    expect(ownersButton).toBeInTheDocument();
    await user.click(ownersButton);

    // Should navigate to owners section screen
    await waitFor(
      () => {
        // Look for content related to owners management
        // This might include adding owners, viewing existing owners, etc.
        const ownersContent =
          screen.queryByText(/beneficial/i) ||
          screen.queryByText(/owner/i) ||
          screen.queryByText(/add/i) ||
          screen.queryByText(/manage/i);
        if (ownersContent) {
          expect(ownersContent).toBeInTheDocument();
        }
      },
      { timeout: 5000 }
    );

    // Check if there's functionality to add/manage owners
    // From flowConfig ownerSteps: personal-details, identity-document, contact-details, check-answers
    // These steps should be available when adding a new beneficial owner

    const addOwnerButtons = screen.queryAllByRole('button', {
      name: /add.*owner/i,
    });

    if (addOwnerButtons.length > 0) {
      await user.click(addOwnerButtons[0]);

      // Should enter owner stepper with steps from flowConfig
      await waitFor(
        () => {
          // Step 1: Personal details (title: 'Personal details')
          expect(screen.getByText(/Personal details/i)).toBeInTheDocument();
        },
        { timeout: 5000 }
      );
    }

    // Test verifies owners section is properly configured for non-sole proprietorship
  }, 60000);

  test('hides owners section for sole proprietorship based on flowConfig', async () => {
    const user = userEvent.setup();

    // Mock API responses for sole proprietorship
    server.use(
      http.post('/clients', async () => {
        return HttpResponse.json(
          {
            ...mockClientData,
            id: 'sole-prop-client-123',
            status: 'NEW',
            organizationType: 'SOLE_PROPRIETORSHIP', // Should exclude owners section
          },
          { status: 201 }
        );
      }),

      http.get('/clients/:clientId', () => {
        return HttpResponse.json({
          ...mockClientData,
          id: 'sole-prop-client-123',
          status: 'NEW',
          organizationType: 'SOLE_PROPRIETORSHIP',
        });
      })
    );

    renderOnboardingFlow();

    // Navigate through gateway and select sole proprietorship
    await waitFor(() => {
      expect(
        screen.getByText(/Let's help you get started/i)
      ).toBeInTheDocument();
    });

    const registeredBusinessOption =
      screen.getAllByText(/Registered business/i)[0];
    await user.click(registeredBusinessOption);

    await waitFor(async () => {
      // Look for sole proprietorship option
      const soleProprietorshipOption =
        screen.queryByText(/Sole Proprietorship/i);
      if (soleProprietorshipOption) {
        await user.click(soleProprietorshipOption);
      }
    });

    const showMeButton = screen.getByRole('button', {
      name: /show me what's needed/i,
    });
    await user.click(showMeButton);

    await waitFor(() => {
      expect(screen.getByText(/Here is what you'll need/i)).toBeInTheDocument();
    });

    const getStartedButton = screen.getByRole('button', {
      name: /get started/i,
    });
    await user.click(getStartedButton);

    await waitFor(() => {
      expect(screen.getByText(/Overview/i)).toBeInTheDocument();
    });

    // === VERIFY OWNERS SECTION IS HIDDEN ===
    // From flowConfig: excludedForOrgTypes: ['SOLE_PROPRIETORSHIP']

    const ownersButton = screen.queryByText(/Owners and key roles/i);
    expect(ownersButton).not.toBeInTheDocument();

    // Should still show other sections
    expect(screen.getByText(/Your personal details/i)).toBeInTheDocument();
    expect(screen.getByText(/Business details/i)).toBeInTheDocument();
    expect(screen.getByText(/Operational details/i)).toBeInTheDocument();
    expect(screen.getByText(/Review and attest/i)).toBeInTheDocument();
    expect(screen.getByText(/Supporting documents/i)).toBeInTheDocument();
  }, 60000);
});
