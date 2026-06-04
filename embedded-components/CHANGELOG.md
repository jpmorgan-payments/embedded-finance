# Changelog

All notable changes to the `embedded-components` package are documented in this file.

## [0.14.6] - 2026-06-03

### Changes

#### Features

- **i18n:** update descriptions for owners section and info alert for clarity

#### Refactors

- simplify Owners section text in integration tests for clarity

#### Tests

- **OnboardingFlow:** update Owners section test to use role-based query for improved accessibility

## [0.14.5] - 2026-06-03

### Changes

#### Features

- **disclosure:** enhance footer and FDIC information across multiple languages

#### Bug Fixes

- **disclosure:** correct punctuation in footer text
- **disclosure:** correct placeholder in FDIC information text

## [0.14.4] - 2026-06-02

Adds PTC (Publicly Traded Companies) gateway redirect logic so existing clients must answer the PTC question before proceeding, with sidebar sections locked until answered. Also includes various accessibility and React strict-mode fixes across components.

### Changes

#### Features

- **onboarding:** when ptc flag is enabled, redirect user to gateway screen to ensure they answer ptc question
- **storybook:** refine PTC stories to have better scenarios and mocks
- **onboarding:** hide Owners section by default

#### Bug Fixes

- **storybook:** update incorrect naics code in ptc mock
- **onboarding:** remove uncontrolled prop defaultValue from PatternInput
- **onboarding:** assign keys for each item in OnboardingArrayField
- **dropzone:** convert dropzone component to use forwardRef so Radix Slot can properly forward a ref to it
- **transactions:** add missing description property for transaction dialog
- **onboarding:** remove redundant h2 tag

#### Chores

- update test configuration to suppress act warnings

## [0.14.3] - 2026-06-01

### Changes

#### Bug Fixes

- **onboarding:** fix display of ptc text in review section

## [0.14.2] - 2026-06-01

### Changes

#### Bug Fixes

- **onboarding:** fix scenarios where skipped steps will still be displayed

#### Chores

- update release script
- update lockfile
- updating tagging with credentials

#### Tests

- **onboarding:** update e2e test to check for correct EIN
- **onboarding:** update e2e test to use valid EIN

## [0.14.1] - 2026-05-29

### Changes

#### Refactors

- **onboarding:** remove prefix validation for EIN

#### Chores

- update tagging script to be more accurate

## [0.14.0] - 2026-05-29

### Summary

Publicly Traded Companies (PTC) feature: full end-to-end support for capturing ticker symbol and stock exchange during onboarding, with gateway-screen integration, overview hints, review display, and comprehensive e2e tests. Also includes EIN validation hardening (updated IRS prefix list + blocklist of obviously invalid values), step counter fix for the review section, and several onboarding data-handling improvements.

### Changes

#### Features

- **onboarding (PTC):** add Publicly Traded Companies feature with gateway-screen integration, stock exchange priority grouping, overview hints, and review display
- **onboarding (PTC):** filter PTC step from sections when feature flag is off or org type is sole prop
- **onboarding (PTC):** clear stale PTC selection when option is no longer available
- **onboarding (PTC):** add temporary restrictions for removing PTC status (API limitation)
- **onboarding:** improve visibility configurability for sections/steps (dynamic requirement summaries based on step visibility)
- **onboarding:** include dbaName when same as organization name
- **onboarding:** disable autoComplete for obfuscated fields
- **client-details:** add questions grouping and conditional visibility
- **account-card:** add balance error state

#### Bug Fixes

- **onboarding:** fix step counter showing "Step X of 0" in review section
- **onboarding:** fix incorrect party reference for countryOfResidence
- **onboarding:** fix bug with missing argument in flow navigation
- **onboarding:** remove unnecessary error throwing
- **onboarding:** skip review cards where all fields are hidden
- **onboarding:** add disableFieldRuleMapping to PubliclyTradedForm fields

#### Refactors

- replace global Axios singleton with per-provider scoped instances

#### Documentation

- update feature plan and onboarding recipe with latest PTC implementation details

#### Chores

- **onboarding:** update EIN invalid prefix list per latest IRS data (April 2026)
- **onboarding:** add blocklist rejecting obviously invalid EINs (all-same-digit, sequential patterns)
- show a review card for business type at top of review section
- remove release-please workflow and add tag release workflow
- remove redundant story names
- update tagging script

#### Tests

- **onboarding:** add PTC end-to-end integration test (12 scenarios)
- **onboarding:** add PTC matrix test cases
- update GatewayScreen integration tests to resolve selector conflicts

## [0.13.14] - 2026-05-19

### Summary

Link Account flow refactored with `reviewOnly` mode and client-side validation for prefilled data. Onboarding improvements including optional phone fields, address tracking fix, IndustryTypeSelect priority codes, and question field type stories. Added document download functionality with popup blocker fallback.

### Changes

- **feat:** Enhance IndustryTypeSelect with Priority Codes Feature
- **feat:** Add document download functionality and fallback for popup blockers
- **feat:** Update maxItems condition in OperationalDetailsForm and add story for question field types
- **feat:** Add onboarding demo routes for test scenarios and update dependencies
- **refactor:** Rename 'prefillSummary' to 'reviewOnly' and implement client-side validation for prefilled data in Link Account Flow
- **refactor:** Simplify conditional checks and improve code formatting in LinkAccount components
- **refactor:** Simplify currentSectionConfig assignment in StepperRenderer
- **refactor:** Update singleton implementations
- **fix:** Onboarding flow address not being tracked properly for progression
- **fix:** Update phone fields to be optional in onboarding flow
- **fix:** Improve error display for document download and fetch failures
- **chore:** Downgrade `msw` versions in package.json and update mock service worker
- **build(deps):** Bump brace-expansion in /embedded-components
- **build(deps-dev):** Bump mermaid in /embedded-components

## [0.13.13] - 2026-05-13

### Summary

Enhanced Link Account flow with multi-account support, preset accounts, and duplicate detection. Added API Testing stories for OnboardingFlow with real backend integration. Improved RecipientCard with new props for account toggle and payment methods visibility.

### Changes

- **feat:** Enhance Link Account Flow with multi-account support, preset accounts, and duplicate detection
- **feat:** Add API Testing stories for OnboardingFlow with real backend integration
- **feat:** Enhance RecipientCard and RecipientAccountDisplayCard with new props for account toggle and payment methods visibility
- **feat:** Implement partyId resolution and form submission updates in Link Account flow
- **feat:** Enhance job title description handling and validation
- **fix:** Update IndividualSelectorProps to include 'id' in onSelect callback
- **refactor:** Modularize LinkAccountScreen components and hooks for better maintainability
- **build(deps):** Bump fast-uri from 3.1.0 to 3.1.2

## [0.13.12] - 2026-05-07

### Summary

Major testing and documentation improvements. Added prepopulated client onboarding stories, implemented event deduplication for user tracking, enhanced linked account management with removal visibility controls, and updated dependencies (vitest 4.1.5, uuid 14.0.0).

### Changes

- **feat:** Enhance linked account management with removal visibility controls
- **feat:** Enhance linked account configuration with custom overrides and routing number filtering
- **feat:** Add prepopulated client onboarding story and mock data for Operator 80
- **feat:** Enhance document request handling in MSW and integration tests
- **fix:** Implement deduplication for trackUserEvent to suppress duplicate calls
- **chore:** Update vitest and vitest coverage dependencies to version 4.1.5
- **chore:** Update build script to increase memory limit for Vite build process
- **docs:** Revise OnboardingFlow testing strategy to adopt the testing trophy model
- **build(deps):** Bump uuid from 13.0.0 to 14.0.0

## [0.13.11] - 2026-04-28

### Summary

Security and maintenance release. Removed DTRUM tracking implementation, updated axios to 1.15.2, added blob URL sanitization in Dropzone component, and bumped postcss.

### Changes

- **refactor:** Remove DTRUM tracking implementation and update axios to 1.15.2
- **fix:** Add sanitizeBlobUrl function for URL validation in Dropzone component with tests
- **build(deps-dev):** Bump postcss
- **docs:** Add `showDisclosureFooter` property to Partially Hosted UI Integration Guide

## [0.13.10] - 2026-04-24

### Summary

Bug fixes for the onboarding flow money input and question response handling.

### Changes

- **fix:** Fix money input and submit bug in onboarding flow
- **fix:** Handle new outstanding questions upon submitting question responses

## [0.13.9] - 2026-04-23

### Summary

Validation and form handling improvements for the onboarding flow, including better error messages and hidden field submission fixes.

### Changes

- **fix:** Move website validation to superRefine for better error handling
- **feat:** Update isHiddenInReviewFn to accept form values
- **fix:** Add better invalid option handling message for form fields
- **fix:** Submit natureOfOwnership even when hidden in review
- **chore:** Add more data scenarios to storybook

## [0.13.8] - 2026-04-22

### Summary

Styling fix for bank account form payment method options.

### Changes

- **fix:** Fix stylings on payment method options in bank-account-form

## [0.13.7] - 2026-04-22

### Summary

Visual bug fix for owner navigation sidebar and storybook data update.

### Changes

- **fix:** Owner navigation sidebar visual bug fix in onboarding flow
- **chore:** Update example bad EIN in storybook

## [0.13.6] - 2026-04-22

### Summary

Enhanced typeahead/autocomplete feature for combobox components.

### Changes

- **feat:** Enhance typeahead feature for comboboxes in onboarding flow

## [0.13.5] - 2026-04-22

### Summary

Version-only bump (no functional changes from 0.13.4).

## [0.13.4] - 2026-04-22

### Summary

Multiple onboarding flow improvements including typeahead for comboboxes, sidebar navigation fixes, validation fixes for PatternInput, and i18n key resolution updates.

### Changes

- **feat:** Enhance typeahead feature for comboboxes
- **feat:** Add country mismatch warning for personal address
- **fix:** Adjust header content logic in onboarding flow
- **fix:** Fix sidebar navigation visual bug when opening a section via overview screen
- **fix:** Fix validation issues with PatternInput
- **fix:** Set personal address country default based on country of residence
- **fix:** Fix phone number field retaining faulty defaults
- **refactor:** Update how key for useTranslationWithTokens is resolved (i18n)

## [0.13.3] - 2026-04-21

### Summary

Onboarding flow bug fixes for phone field validation, combobox searches, linked account card styling, and ITIN validation. Added typeahead functionality for combobox selection.

### Changes

- **feat:** Implement typeahead functionality for combobox selection
- **fix:** Fix on-mount validation for phone fields
- **fix:** Update colors for linked account card status alerts
- **fix:** Fix alert styling
- **fix:** Update validation for ITIN
- **fix:** Handle cases where API provides bad data for client
- **fix:** Fix combobox searches

## [0.13.2] - 2026-04-20

### Summary

Enhanced question fetching logic to include missing parent questions in the onboarding flow.

### Changes

- **fix:** Enhance question fetching logic to include missing parent questions

## [0.13.1] - 2026-04-20

### Summary

Onboarding flow review form layout updates, bank account success messages, and attestation improvements.

### Changes

- **fix:** Update button layout in ReviewForm
- **feat:** Update bank account success messages and add localized alerts for account verification status
- **fix:** Update attesterFullName to include controller party details
- **chore:** Add resolutions for dompurify and picomatch

## [0.13.0] - 2026-04-17

### Summary

Major version bump. Upgraded Orval to v8, added `showDisclosureFooter` prop, displayed rejected accounts in overview, added missing countries, and cleared React Query cache on story mount.

### Changes

- **feat:** Add `showDisclosureFooter` prop to onboarding flow
- **feat:** Display rejected accounts in overview screen
- **feat:** Add QueryCacheResetter to clear React Query cache on story mount
- **feat:** Add missing countries
- **refactor:** Upgrade Orval to v8
- **fix:** Disable sidebar in docUploadOnly mode

## [0.12.20] - 2026-04-16

### Summary

Linked accounts improvements for rejected account handling and display.

### Changes

- **feat:** Add compatibility for rejected accounts section in card and table view modes
- **feat:** Implement edge case handling for 25+ rejected accounts
- **feat:** Show error message and view details button for rejected accounts
- **fix:** Clean up link account section flow

## [0.12.19] - 2026-04-16

### Summary

Added `flowEntry` support for dynamic screen initialization, host-defined acknowledgements in Terms & Conditions, and review acknowledgements in LinkAccountScreen.

### Changes

- **feat:** Implement host-defined acknowledgements in TermsAndConditionsForm
- **feat:** Enhance OnboardingFlow with `flowEntry` support for dynamic screen/step initialization
- **feat:** Implement review acknowledgements in LinkAccountScreen for editable mode
- **build(deps):** Bump dompurify from 3.3.2 to 3.4.0

## [0.12.18] - 2026-04-15

### Summary

Enhanced linked account linking logic with status controls.

### Changes

- **feat:** Enhance linked account linking logic with status controls

## [0.12.17] - 2026-04-15

### Summary

Major disclosure/Terms & Conditions redesign with attestation checkboxes and DisclosureFooter component. Added rejected account display, phone input improvements, and linked account timing changes.

### Changes

- **feat:** Redesign Terms & Conditions attestation layout with three-checkbox pattern
- **feat:** Add DisclosureFooter component
- **feat:** Add disclosure config types and i18n keys
- **feat:** Implement display of rejected accounts in linked-accounts
- **feat:** Allow linking bank accounts after application submission (rather than post-verification)
- **fix:** Remove unexpected autofocus behavior in PhoneInput
- **fix:** Enhance PhoneInput and CountrySelect for better default country handling
- **fix:** Update linked account fetching to use clientId from onboarding context
- **chore:** Switch to node-modules linker for Storybook compatibility

## [0.12.16] - 2026-04-14

### Summary

Document upload improvements including file extension display, loading skeletons, and role simplification. Updated dependencies (lodash, axios) and added Vitest coverage reporting.

### Changes

- **feat:** Add loading skeleton and display file extension for documents
- **feat:** Integrate Vitest coverage reporting
- **refactor:** Simplify role display in DocumentUploadForm and PartyCard
- **refactor:** Refactor document request grouping for clarity
- **fix:** Handle invalid timestamp in formatUploadTime function
- **fix:** Add document base URL replacement in Storybook decorator
- **build(deps):** Update lodash and axios versions
- **chore:** Update dependencies and Vite configuration

## [0.12.15] - 2026-04-10

### Summary

Sidebar and flow behavior improvements including snapshot freezing during mutations and party role preservation.

### Changes

- **fix:** Freeze sidebar snapshot during form mutations to prevent data flashes
- **fix:** Preserve existing party roles when recreating individual parties
- **feat:** Enhance flow logic and validation for static steps, update session data handling

## [0.12.14] - 2026-04-09

### Summary

Validation and schema improvements for dates, organization descriptions, and sub-questions. Enhanced owner stepper with badges and display updates.

### Changes

- **fix:** Update date validation logic and error messages for improved clarity
- **fix:** Remove special character restriction from organization description
- **fix:** Update schema validation to conditionally mark sub-questions as optional
- **feat:** Enhance StepperRenderer with new owner display and badges
- **fix:** Simplify key generation for StepperRenderer to resolve re-rendering issue

## [0.12.13] - 2026-04-08

### Summary

Owner stepper enhancements with sub-steps and navigation, country locking for address fields, improved error messages, and PO Box/PMB address validation.

### Changes

- **feat:** Enhance owner stepper functionality with sub-steps, validations, and sidebar updates
- **feat:** Implement country locking for address fields based on country of formation
- **feat:** Add validation for PO Box and PMB addresses
- **feat:** Add conditional rules and localization updates for owner personal details
- **fix:** Improve error message handling in ServerErrorAlert
- **fix:** Update navigation buttons to use icons and improve layout
- **fix:** Enhance AccountCard to support multiple routing number formats
- **build(deps-dev):** Bump vite from 7.3.1 to 7.3.2

## [0.12.11] - 2026-04-07

### Summary

Enhanced question handling for sub-questions, updated link account status, and added navigation consistency improvements.

### Changes

- **feat:** Enhance question handling by fetching missing sub-questions and merging data
- **feat:** Add new story variant for onboarding with existing linked account
- **fix:** Update link account status to 'completed_disabled' for better clarity
- **refactor:** Replace goBack with goTo for navigation consistency

## [0.12.10] - 2026-04-03

### Summary

Bank account form improvements with individual selection logic simplification, OverviewScreen enhancements with dynamic section titles, and improved navigation fallback handling.

### Changes

- **feat:** Enhance OverviewScreen with dynamic section titles
- **feat:** Enhance navigation with fallback handling
- **fix:** Add modal prop to Popover for improved accessibility within modals
- **fix:** Update phone number placeholder text in multiple languages
- **refactor:** Remove IndividualReadonlyField and simplify individual selection logic
- **refactor:** Update PaymentMethodSelector and improve code structure

## [0.12.9] - 2026-04-02

### Summary

Canadian phone number support and IP address hook improvements.

### Changes

- **feat:** Update PhoneInput component to support Canadian phone numbers
- **refactor:** Standardize IP address variable naming and enhance error handling in useIPAddress hook

## [0.12.8] - 2026-04-02

### Summary

Added missing countries to i18n translations and updated document upload data.

### Changes

- **i18n:** Add missing countries to country list in English and Spanish translations
- **fix:** Update document upload data handling

## [0.12.7] - 2026-04-01

### Summary

Unsaved changes handling and data loss prevention in the onboarding flow.

### Changes

- **feat:** Enhance unsaved changes handling and prompts
- **feat:** Add alert for data loss on previous step navigation
- **build(deps):** Bump picomatch from 2.3.1 to 2.3.2

## [0.12.6] - 2026-04-01

### Summary

EIN validation improvements and address field translations refactoring.

### Changes

- **fix:** Enhance EIN validation logic and update error messages
- **refactor:** Refactor address field translations and validation schemas

## [0.12.5] - 2026-03-31

### Summary

Validation improvements for ITIN/SSN, business identity forms, website URLs, and postal codes.

### Changes

- **fix:** Refactor ITIN and SSN validation logic for improved accuracy
- **fix:** Enhance error handling in mapPartyApiErrorsToFormErrors
- **fix:** Update validation patterns for business identity forms
- **fix:** Update website URL validation to require HTTPS
- **feat:** Revalidate postal code format on country change

## [0.12.2] - 2026-03-30

### Summary

Enhanced onboarding forms with address placeholders, country-specific postal code validation, and form state handling improvements.

### Changes

- **feat:** Enhance onboarding forms with address placeholders and descriptions
- **feat:** Add country-specific postal code validation formats
- **fix:** Enhance form state handling
- **fix:** Update StepperFormStep key to include existing party ID for improved uniqueness

## [0.12.1] - 2026-03-26

### Summary

Link Account screen enhancements with prefill summary mode, verification flow, review acknowledgements, and loading states. Improved party creation logic for country changes.

### Changes

- **feat:** Enhance LinkAccountScreen with prefill summary mode and linked account verification flow
- **feat:** Add review acknowledgements feature with support for single and multiple checkboxes
- **feat:** Implement link account functionality with editable and readonly modes
- **feat:** Enhance LinkAccountScreen and OverviewScreen with loading states and skeleton loaders
- **fix:** Refactor party creation logic to merge existing and new data
- **fix:** Enhance party handling for country changes and controller IDs normalization

## [0.12.0] - 2026-03-25

### Summary

Major release with non-US country support for individual parties, multi-country ID type handling, MSW/Axios initialization optimization for Vite HMR, and numerous onboarding flow improvements.

### Changes

- **feat:** Support different countries for controllers and beneficial owners
- **feat:** Implement ID type defaults for US and non-US residents
- **feat:** Implement sanitizeServerErrorMessage function for user-friendly error handling
- **feat:** Add validation messages for postal code length and format
- **feat:** Optimize MSW and Axios initialization for Vite HMR cycles
- **fix:** Improve country resolution logic in StepperFormStep and IndividualIdentityForm
- **fix:** Update ID type handling for non-US residents
- **fix:** Fix validation on sole-prop radio field
- **fix:** Remove OTHER as a default general org type in gateway screen
- **refactor:** Refactor interceptor management with useRef for stability

## [0.11.28] - 2026-03-16

### Summary

Linked account integration in onboarding flow, prop naming updates, document upload interceptor fix, and client-details component improvements.

### Changes

- **feat:** Linked account integration in onboarding flow
- **feat:** Update prop names and functionality
- **fix:** Fix data interceptor for FormData in document upload
- **fix:** Fix role content tokens in client-details
- **fix:** Add interceptorReady check and headingLevel prop to client-details
- **refactor:** Remove initialClientId as a deprecated prop
- **build(deps):** Bump dompurify from 3.3.0 to 3.3.2

## [0.11.27] - 2026-03-12

### Summary

Support for deeply nested additional questions, storybook interaction fixes, and prop categorization improvements.

### Changes

- **feat:** Allow for deeply nested additional questions in onboarding flow
- **fix:** Fix storybook interactions issues failing due to faulty aria-labels
- **fix:** Fix paddings with certain dialogs
- **refactor:** Categorize props in storybook and combine duplicate stories
- **refactor:** Remove initialClientId prop from stories

## [0.11.26] - 2026-03-11

### Summary

Bug fixes for content tokens rendering in tooltips and potential TypeScript error in client-details.

### Changes

- **fix:** Fix issue with empty content tokens still rendering in tooltips
- **fix:** Fix potential TypeScript error in client-details

## [0.11.24] - 2026-03-09

### Summary

Updated document upload request structure for onboarding flow.

### Changes

- **fix:** Update document upload request structure

## [0.11.23] - 2026-03-09

### Summary

Fixed document upload content tokens in onboarding flow.

### Changes

- **fix:** Fix document upload content tokens

## [0.11.22] - 2026-03-06

### Summary

Overview screen render logic adjustment for REVIEW_IN_PROGRESS state.

### Changes

- **fix:** Adjust overview screen render logic with REVIEW_IN_PROGRESS state

## [0.11.21] - 2026-03-06

### Summary

Onboarding flow improvements for document request detection, checklist visibility, and content token coverage.

### Changes

- **fix:** Fix gaps in document request detection
- **feat:** Add prop to hide checklist button
- **feat:** More content token coverage

## [0.11.20] - 2026-03-05

### Summary

Error and loading state improvements, i18n file reorganization, and server error handling for additional questions.

### Changes

- **feat:** Add server error handling for additional questions
- **fix:** Improve error and loading states
- **fix:** Prevent text wrapping issues in linked-accounts form
- **fix:** Fix default storybook mocks for recipients
- **refactor:** Reorganize i18n files

## [0.11.18] - 2026-03-03

### Summary

Fixed circular dependency in i18n configuration, recipients payment method display issues, and removed email as required for RTP.

### Changes

- **fix:** Remove circular dependency from i18n configuration
- **fix:** Fix display issue with payment method content tokens in recipients
- **fix:** Remove email as a required field for RTP
- **build(deps):** Bump rollup from 4.57.1 to 4.59.0

## [0.11.17] - 2026-02-27

### Summary

Updated content token structure to use EBContentTokens type and added @tanstack/react-query as a dependency.

### Changes

- **refactor:** Update content token structure to use EBContentTokens type
- **chore:** Add @tanstack/react-query as a dependency

## [0.11.15] - 2026-02-27

### Summary

Fixed i18n config to use relative imports and accounts name display bug.

### Changes

- **fix:** Update i18n config file to use relative import
- **fix:** Fix name display bug in accounts

## [0.11.13] - 2026-02-27

### Summary

Client-details component improvements with updated styling, content tokens, and translation function updates across all components.

### Changes

- **feat:** Update all components to use new translation function
- **feat:** Restructure content tokens and add IDs to some content tokens
- **fix:** Improve client-details styling and skeleton
- **fix:** Add missing content tokens for client-details

## [0.11.12] - 2026-02-24

### Summary

Removed legacy Recipients component, updated OAS files, upgraded Vite, and updated path imports.

### Changes

- **refactor:** Remove legacy Recipients component from component registry
- **refactor:** Update path imports and improve environment variable handling in Vite config
- **feat:** Update Vite to the latest version
- **feat:** Update OAS (OpenAPI Specification) files
- **fix:** Add missing content tokens

## [0.11.11] - 2026-02-19

### Summary

Visual enhancements for client-details component.

### Changes

- **fix:** Client-details visual enhancements and test fixes

## [0.11.10] - 2026-02-18

### Summary

Client-details component moved to beta with improved loading skeletons, i18n integration, and dialog-based details view.

### Changes

- **feat:** Move client-details and indirect-ownership to beta status
- **feat:** Add loading skeletons for questions in client-details
- **feat:** Integrate i18n and other improvements for client-details
- **feat:** Convert details drawer to dialog in client-details
- **fix:** Change summary to be the default view
- **fix:** Update apiBaseUrlTransforms to include questions
- **chore:** Update Storybook to v10.2.10, Vitest to v4.0.18

## [0.11.8] - 2026-02-17

### Summary

Major feature release with initial ClientDetails component, IndirectOwnership enhancements, PaymentFlow improvements for unsaved recipients, and TransactionsTable action buttons.

### Changes

- **feat:** Initial ClientDetails component with client-facing data, question details fetch, and business-order sections
- **feat:** Enhance IndirectOwnership with entity autocomplete, duplicate checking, and entity type selection
- **feat:** Add TransactionsTable action buttons and i18n support
- **feat:** Allow customization of heading levels
- **feat:** Add radio indicators to PaymentFlow
- **fix:** Resolve linked accounts count issue in PaymentFlow
- **fix:** Handle edge cases with unsaved recipients
- **fix:** Automatically select account when only one valid for selected recipient
- **build(deps):** Bump axios from 1.12.2 to 1.13.5

## [0.11.7] - 2026-02-04

### Summary

PaymentFlow state management fixes and edge case handling.

### Changes

- **fix:** Handle edge case where form would not submit when account is selected while balances are still loading
- **fix:** Properly reset mutation after a transaction
- **fix:** Resolve issues with state not resetting upon close
- **chore:** Export PaymentFlowInline

## [0.11.6] - 2026-02-04

### Summary

PaymentFlow inline version, recipients widget cleanup, and form validation improvements.

### Changes

- **feat:** Add inline version of PaymentFlow
- **fix:** Reset payment flow state after success in recipients-widget
- **fix:** Adjust page sizes to comply with API restrictions
- **fix:** Prevent onBlur validation on back in recipient-form
- **refactor:** Completely remove MakePayment component

## [0.11.5] - 2026-02-03

### Summary

Removed unnecessary clientId prop from PaymentFlow and added LICENSE file.

### Changes

- **refactor:** Remove unnecessary clientId prop from PaymentFlow
- **chore:** Add LICENSE to embedded-components

## [0.11.2] - 2026-02-03

### Summary

PaymentFlow bug fixes for styles, success view, recipient handling, and validation state.

### Changes

- **fix:** Fix styles and export component
- **fix:** Resolve issues with success view
- **fix:** Handle recipient addition and refetch
- **fix:** Fix bugs related to validation state
- **fix:** Fix translation key for warning message

## [0.11.0] - 2026-02-02

### Summary

Major release integrating PaymentFlow into RecipientsWidget with improved error handling, keyboard navigation, and responsive design. Added MSW stale issue fix for Storybook.

### Changes

- **feat:** Integrate PaymentFlow into RecipientsWidget
- **feat:** Add initialAmount prop to PaymentFlow
- **feat:** Implement solution for MSW stale issue in Storybook
- **fix:** Improve error handling, keyboard navigation, and loading states
- **fix:** Add missing eb-component class to PaymentFlow
- **fix:** Add missing content token and accessible text for alert icon
- **build(deps):** Update orval to 7.21.0

## [0.10.21] - 2026-01-29

### Summary

PaymentFlow feature development continued with responsive design, error/loading states, edge case handling for initial recipient IDs, and account components updated to new API response structure.

### Changes

- **feat:** Implement error and loading states with storybook stories
- **feat:** Handle edge case states for initial recipient ID
- **feat:** Add single account scenario story
- **feat:** Enable payment method scenario and pending close badge
- **fix:** Improve responsive styling and accessibility
- **fix:** Make dialog taller and add responsive dialogs
- **fix:** Fix recipient form dialog state reset in recipients-widget
- **refactor:** Update account components to use new API response structure
- **build(deps-dev):** Bump lodash

## [0.10.20] - 2026-01-26

### Summary

Initial iteration of PaymentFlow component with auto-selection logic, linked account form fixes, and transaction post call implementation.

### Changes

- **feat:** Add initial iteration of PaymentFlow component
- **feat:** Implement transaction post call
- **feat:** Handle auto-selection of account and incompatible account types
- **feat:** Enhance auto-advance logic
- **fix:** Fix linked account form not showing individuals/businesses as default options
- **fix:** Update how initial account is selected

## [0.10.18] - 2026-01-21

### Summary

Linked account form default options fix (included in 0.10.20 range).

## [0.10.17] - 2026-01-13

### Summary

Base version at the beginning of 2026.
