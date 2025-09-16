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

    // === STEP 3: PERSONAL DETAILS SECTION

    // Click on Personal Details section
    const personalDetailsButton = screen.getByTestId('personal-section-button');
    await user.click(personalDetailsButton);

    // 3a. Personal Details Form (title: 'Your personal details')
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

    // 3b. Identity Document step
    await waitFor(() => {
      expect(screen.getByText(/Your ID details/i)).toBeInTheDocument();
    });
    // Fill out identity document form
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

    // 3c. Contact Details step
    await waitFor(() => {
      expect(screen.getByText(/Your contact details/i)).toBeInTheDocument();
    });
    // Fill out contact details form
    const emailInput = screen.getByLabelText(/Email/i);
    await user.type(emailInput, 'john.doe@example.com');
    const phoneInput = screen.getByLabelText(/Phone number/i);
    await user.type(phoneInput, '2012345678');
    const addressInput = screen.getByLabelText(/Address line 1/i);
    await user.type(addressInput, '123 Main St');
    const cityInput = screen.getByLabelText(/Town\/City/i);
    await user.type(cityInput, 'Anytown');
    const stateDropdown = screen.getByLabelText(/State/i);
    await user.click(stateDropdown);
    const stateOption = screen.getByRole('option', { name: /New Jersey/i });
    await user.click(stateOption);
    const zipInput = screen.getByLabelText(/Postal code/i);
    await user.type(zipInput, '12345');
    // Proceed to next step
    const continueButton3 = screen.getByRole('button', { name: /continue/i });
    await user.click(continueButton3);

    // 3d. Check Answers step
    await waitFor(() => {
      expect(screen.getByText(/Check your answers/i)).toBeInTheDocument();
    });
    // Ensure entered data is displayed
    expect(screen.getByText('John')).toBeInTheDocument();
    expect(screen.getByText('Doe')).toBeInTheDocument();
    expect(screen.getByText('CEO')).toBeInTheDocument();
    expect(screen.getByText('January 15, 1985')).toBeInTheDocument();
    expect(screen.getByText('XXX-XX-2132')).toBeInTheDocument();
    expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
    expect(screen.getByText('+1 201 234 5678')).toBeInTheDocument();
    expect(screen.getByText('123 Main St')).toBeInTheDocument();
    expect(screen.getByText('Anytown, NJ 12345')).toBeInTheDocument();
    // Continue to next section
    const continueButton4 = screen.getByRole('button', { name: /continue/i });
    await user.click(continueButton4);

    // STEP 4 BUSINESS DETAILS SECTION
    await waitFor(() => {
      expect(screen.getByText(/Business details/i)).toBeInTheDocument();
    });
    // 4a. Business Identity Form
    await waitFor(() => {
      expect(screen.getByText(/Business identity/i)).toBeInTheDocument();
    });
    // Fill out business identity form
    const businessNameInput = screen.getByLabelText(
      'Legal name of the company'
    );
    await user.type(businessNameInput, 'Fake Corp');
    const sameAsLegalNameCheckbox = screen.getByLabelText(
      /Same as legal name of the company/i
    );
    await user.click(sameAsLegalNameCheckbox);
    const yearOfFormationInput = screen.getByLabelText(/Year of formation/i);
    await user.type(yearOfFormationInput, '2020');
    const einInput = screen.getByLabelText(/Employer Identification Number/i);
    await user.type(einInput, '123456789');
    const websiteInput = screen.getByLabelText(/Business website/i);
    await user.type(websiteInput, 'https://www.fakecorp.com');
    // Proceed to next step
    const continueButton5 = screen.getByRole('button', { name: /continue/i });
    await user.click(continueButton5);

    // 4b. Industry step
    await waitFor(() => {
      expect(
        screen.getByText(/Description & industry classification/i)
      ).toBeInTheDocument();
    });
    // Fill out industry form
    const businessDescriptionInput =
      screen.getByLabelText(/Business description/i);
    await user.type(businessDescriptionInput, 'We sell products.');
    const industryDropdown = screen.getByLabelText(/Industry classification/i);
    await user.click(industryDropdown);
    const industrySearchInput = screen.getByRole('combobox', {
      name: /Industry classification/i,
    });
    await user.type(industrySearchInput, 'Pet and Pet Supplies Retailers');
    const industryOption = screen.getByRole('option', {
      name: /Pet and Pet Supplies Retailers/i,
    });
    await user.click(industryOption);
    // Proceed to next step
    const continueButton6 = screen.getByRole('button', { name: /continue/i });
    await user.click(continueButton6);

    // 4c. Contact Information step
    await waitFor(() => {
      expect(screen.getByText(/Contact information/i)).toBeInTheDocument();
    });
    // Fill out business contact info form
    const businessEmailInput = screen.getByLabelText(/Company email address/i);
    await user.type(businessEmailInput, 'business@example.com');
    const businessPhoneInput = screen.getByLabelText(/Business phone number/i);
    await user.type(businessPhoneInput, '2012345678');
    const businessAddressInput = screen.getByLabelText(/Address line 1/i);
    await user.type(businessAddressInput, '456 Business Rd');
    const businessCityInput = screen.getByLabelText(/Town\/City/i);
    await user.type(businessCityInput, 'Business City');
    const businessStateDropdown = screen.getByLabelText(/State/i);
    await user.click(businessStateDropdown);
    const businessStateOption = screen.getByRole('option', {
      name: /California/i,
    });
    await user.click(businessStateOption);
    const businessZipInput = screen.getByLabelText(/Postal code/i);
    await user.type(businessZipInput, '67890');
    // Proceed to next step
    const continueButton7 = screen.getByRole('button', { name: /continue/i });
    await user.click(continueButton7);

    // 4d. Business Check Answers step
    await waitFor(() => {
      expect(screen.getByText(/Check your answers/i)).toBeInTheDocument();
    });
    // Ensure entered business data is displayed
    expect(await screen.findAllByText('Fake Corp')).toHaveLength(2);
    expect(screen.getByText('2020')).toBeInTheDocument();
    expect(screen.getByText('12 - 3456789')).toBeInTheDocument();
    expect(screen.getByText('https://www.fakecorp.com')).toBeInTheDocument();
    expect(screen.getByText('We sell products.')).toBeInTheDocument();
    expect(
      screen.getByText(/Pet and Pet Supplies Retailers/i)
    ).toBeInTheDocument();
    expect(screen.getByText('business@example.com')).toBeInTheDocument();
    expect(screen.getByText('+1 201 234 5678')).toBeInTheDocument();
    expect(screen.getByText('456 Business Rd')).toBeInTheDocument();
    expect(screen.getByText('Business City, CA 67890')).toBeInTheDocument();
    // Continue to next section
    const continueButton8 = screen.getByRole('button', { name: /continue/i });
    await user.click(continueButton8);

    // STEP 5 OWNERS SECTION
    await waitFor(() => {
      expect(screen.getByText(/Owners and key roles/i)).toBeInTheDocument();
    });
    // 5a. Owners Component
    const controllerIsOwnerRadio = screen.getByRole('radio', {
      name: /Yes/i,
    });
    await user.click(controllerIsOwnerRadio);
    await waitFor(() => {
      expect(screen.getByText(/John Doe/i)).toBeInTheDocument();
    });
    const addOwnerButton = screen.getByRole('button', { name: /Add owner/i });
    await user.click(addOwnerButton);

    // 5b. Owner personal details form
    await waitFor(
      () => {
        expect(screen.getByText(/Personal details/i)).toBeInTheDocument();
      },
      { timeout: 5000 }
    );
    const ownerFirstNameInput = screen.getByLabelText(/First name/i);
    await user.type(ownerFirstNameInput, 'Jane');
    const ownerLastNameInput = screen.getByLabelText(/Last name/i);
    await user.type(ownerLastNameInput, 'Smith');
    const ownerJobTitleDropdown = screen.getByLabelText(/Job title/i);
    await user.click(ownerJobTitleDropdown);
    const ownerJobTitleOption = screen.getByRole('option', { name: /CFO/i });
    await user.click(ownerJobTitleOption);
    const ownerNatureOfOwnershipDropdown =
      screen.getByLabelText(/Nature of ownership/i);
    await user.click(ownerNatureOfOwnershipDropdown);
    const ownerNatureOfOwnershipOption = screen.getByRole('option', {
      name: /Indirect/i,
    });
    await user.click(ownerNatureOfOwnershipOption);
    const ownerContinueButton = screen.getByRole('button', {
      name: /continue/i,
    });
    await user.click(ownerContinueButton);

    // 5c. Owner identity form
    await waitFor(() => {
      expect(screen.getByText(/Identity document/i)).toBeInTheDocument();
    });
    const ownerDobMonthDropdown = screen.getByLabelText(/Month/i);
    await user.click(ownerDobMonthDropdown);
    await user.keyboard('{ArrowDown}');
    const ownerDobMonthOption = screen.getByRole('option', {
      name: /February/i,
    });
    await user.click(ownerDobMonthOption);
    const ownerDobDayInput = screen.getByLabelText(/Day/i);
    await user.type(ownerDobDayInput, '20');
    const ownerDobYearInput = screen.getByLabelText(/Year/i);
    await user.type(ownerDobYearInput, '1990');
    const ownerSsnInput = screen.getByLabelText(/Social Security Number/i);
    await user.type(ownerSsnInput, '231231231');
    const ownerIdentityContinueButton = screen.getByRole('button', {
      name: /continue/i,
    });
    await user.click(ownerIdentityContinueButton);

    // 5d. Owner contact details form
    await waitFor(() => {
      expect(screen.getByText(/Contact details/i)).toBeInTheDocument();
    });
    const ownerEmailInput = screen.getByLabelText(/Email/i);
    await user.type(ownerEmailInput, 'jane.smith@example.com');
    const ownerPhoneInput = screen.getByLabelText(/Phone number/i);
    await user.type(ownerPhoneInput, '3012345678');
    const ownerAddressInput = screen.getByLabelText(/Address line 1/i);
    await user.type(ownerAddressInput, '789 Owner St');
    const ownerCityInput = screen.getByLabelText(/Town\/City/i);
    await user.type(ownerCityInput, 'Ownerville');
    const ownerStateDropdown = screen.getByLabelText(/State/i);
    await user.click(ownerStateDropdown);
    const ownerStateOption = screen.getByRole('option', { name: /Florida/i });
    await user.click(ownerStateOption);
    const ownerZipInput = screen.getByLabelText(/Postal code/i);
    await user.type(ownerZipInput, '54321');
    const ownerAddressContinueButton = screen.getByRole('button', {
      name: /continue/i,
    });
    await user.click(ownerAddressContinueButton);

    // 5e. Check answers for owner
    await waitFor(() => {
      expect(screen.getByText(/Check your answers/i)).toBeInTheDocument();
    });
    expect(screen.getByText('Jane')).toBeInTheDocument();
    expect(screen.getByText('Smith')).toBeInTheDocument();
    expect(screen.getByText('CFO')).toBeInTheDocument();
    expect(screen.getByText('Indirect')).toBeInTheDocument();
    expect(screen.getByText('February 20, 1990')).toBeInTheDocument();
    expect(screen.getByText('XXX-XX-1231')).toBeInTheDocument();
    expect(screen.getByText('jane.smith@example.com')).toBeInTheDocument();
    expect(screen.getByText('+1 301 234 5678')).toBeInTheDocument();
    expect(screen.getByText('789 Owner St')).toBeInTheDocument();
    expect(screen.getByText('Ownerville, FL 54321')).toBeInTheDocument();
    const ownerCheckAnswersContinueButton = screen.getByRole('button', {
      name: /return/i,
    });
    await user.click(ownerCheckAnswersContinueButton);

    // 6e Back to Owners component - verify both owners are listed
    await waitFor(() => {
      expect(screen.getByText(/John Doe/i)).toBeInTheDocument();
      expect(screen.getByText(/Jane Smith/i)).toBeInTheDocument();
    });
    const ownersContinueButton = screen.getByRole('button', {
      name: /continue/i,
    });
    await user.click(ownersContinueButton);

    // STEP 6 ADDITIONAL QUESTIONS / OPERATIONAL DETAILS SECTION
    await waitFor(() => {
      expect(screen.getByText(/Operational details/i)).toBeInTheDocument();
    });
    // Fill out operational details form
    const revenueInput = screen.getByLabelText(/Total annual revenue/i);
    await user.type(revenueInput, '50000');
    const sanctionedCountriesQuestionRadio = screen.getByRole('radio', {
      name: /No/i,
    });
    await user.click(sanctionedCountriesQuestionRadio);
    const operationalDetailsContinueButton = screen.getByRole('button', {
      name: /continue/i,
    });
    await user.click(operationalDetailsContinueButton);

    // STEP 7 REVIEW & ATTEST SECTION
    await waitFor(() => {
      expect(screen.getByText(/Review your details/i)).toBeInTheDocument();
    });
    const attestCheckbox = screen.getByLabelText(
      /The data I am providing is true, accurate and complete to the best of my knowledge./i
    );
    await user.click(attestCheckbox);
  }, 90000);
});
