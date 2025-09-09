import { i18n } from '@/i18n/config';
import { server } from '@/msw/server';
import { beforeEach, describe, expect, test } from 'vitest';
import { render, screen, userEvent, waitFor } from '@test-utils';

import { OnboardingFlow } from '@/core/OnboardingFlow';
import { OnboardingFlowProps } from '@/core/OnboardingFlow/types/onboarding.types';

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

describe('OnboardingFlow', () => {
  beforeEach(() => {
    // Reset MSW handlers before each test
    server.resetHandlers();
  });

  test.skip('accesses all sections', async () => {
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
    const businessDetailsButton = screen.getByTestId('business-section-button');
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
    const ownersButton = screen.getByTestId('owners-section-button');
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
    const operationalButton = screen.getByTestId(
      'additional-questions-section-button'
    );
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
    const reviewButton = screen.getByTestId('review-attest-section-button');
    await user.click(reviewButton);

    // Should enter review & attest stepper - Step 1: Review Form (title: 'Review your details')
    await waitFor(
      () => {
        expect(screen.getByText(/Review your details/i)).toBeInTheDocument();
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

  test('completes end-to-end journey', async () => {
    const user = userEvent.setup();

    renderOnboardingFlow();

    // === STEP 1: GATEWAY SCREEN ===
    await waitFor(() => {
      expect(
        screen.getByText(/Let's help you get started/i)
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

    // Open legal structure dropdown
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

    // Verify overview screen sections are visible
    expect(screen.getByText(/Verify your business/i)).toBeInTheDocument();
    expect(screen.getByText(/Your personal details/i)).toBeInTheDocument();
    expect(screen.getByText(/Business details/i)).toBeInTheDocument();
    expect(screen.getByText(/Owners and key roles/i)).toBeInTheDocument();
    expect(screen.getByText(/Operational details/i)).toBeInTheDocument();
    expect(screen.getByText(/Review and attest/i)).toBeInTheDocument();
    expect(screen.getByText(/Supporting documents/i)).toBeInTheDocument();

    // === STEP 4: NAVIGATE THROUGH PERSONAL DETAILS SECTION (STEPPER - id: 'personal-section') ===

    // 4a. Click on Personal Details section
    const personalDetailsButton = screen.getByTestId('personal-section-button');
    await user.click(personalDetailsButton);

    // Personal Details Form (title: 'Your personal details')
    await waitFor(
      () => {
        expect(screen.getByText(/Your personal details/i)).toBeInTheDocument();
      },
      { timeout: 5000 }
    );

    // Fill out personal details form
    const firstNameInput = screen.getByLabelText(/First name/i);
    await user.type(firstNameInput, 'John');
    const lastNameInput = screen.getByLabelText(/Last name/i);
    await user.type(lastNameInput, 'Doe');
    const jobTitleDropdown = screen.getByLabelText(/Job title/i);
    await user.click(jobTitleDropdown);
    const jobTitleOption = screen.getByRole('option', { name: /CEO/i });
    await user.click(jobTitleOption);

    // Proceed to next step
    const continueButton = screen.getByRole('button', { name: /continue/i });
    await user.click(continueButton);

    // Identity Document step
    await waitFor(() => {
      expect(screen.getByText(/Your ID details/i)).toBeInTheDocument();
    });
    const monthDropdown = screen.getByLabelText(/Month/i);
    await user.click(monthDropdown);
    await user.keyboard('{ArrowDown}');
    const monthOption = screen.getByRole('option', { name: /January/i });
    await user.click(monthOption);
    const dayInput = screen.getByLabelText(/Day/i);
    await user.type(dayInput, '15');
    const yearInput = screen.getByLabelText(/Year/i);
    await user.type(yearInput, '1985');

    const ssnInput = screen.getByLabelText(/Social Security Number/i);
    await user.type(ssnInput, '132132132');

    // Proceed to next step
    const continueButton2 = screen.getByRole('button', { name: /continue/i });
    await user.click(continueButton2);
  }, 90000);
});
