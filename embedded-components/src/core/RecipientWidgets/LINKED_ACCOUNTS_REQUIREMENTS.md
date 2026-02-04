# Linked Accounts Management Embedded Component Requirements

> **Documentation References:**
>
> - [JPMorgan Chase Embedded Payments - Linked Accounts](https://developer.payments.jpmorgan.com/docs/embedded-finance-solutions/embedded-payments/capabilities/embedded-payments/how-to/linked-accounts)
>
> **API References:**
>
> - [Create Recipient API](https://developer.payments.jpmorgan.com/api/embedded-finance-solutions/embedded-payments/embedded-payments/recipients#/operations/createRecipient)
> - [Update Recipient API](https://developer.payments.jpmorgan.com/api/embedded-finance-solutions/embedded-payments/embedded-payments/recipients#/operations/amendRecipient)
> - [List Recipients API](https://developer.payments.jpmorgan.com/api/embedded-finance-solutions/embedded-payments/embedded-payments/recipients#/operations/getAllRecipients)
> - [Verify Microdeposits API](https://developer.payments.jpmorgan.com/api/embedded-finance-solutions/embedded-payments/embedded-payments/recipients#/operations/recipientsVerification)

## Technical Design Philosophy Alignment

This component follows the Embedded UI Components technical design philosophy outlined in the main README.md:

### Integration Scenarios and Use Cases

The LinkedAccountWidget component is designed for flexible integration into parent web applications, offering several customization points:

- **Runtime Customization**: Inject design tokens to match parent app's theme, override content tokens from parent app's CMS systems, connect to parent app's monitoring via `userEventsHandler`
- **Component Configuration**: Configure API endpoints via provider, customize component behavior through props
- **Client ID Management**: Requires client ID to be provided by parent application (cannot create clients)
- **Variant Support**: Supports both default (multi-account) and singleAccount variants for different use cases

### OpenAPI Specification (OAS) & Code Generation

**IMPORTANT**: This component is built using the latest available OpenAPI Specification (OAS) from the JPMC API Portal. The implementation follows the automated code generation approach:

1. **OAS as Source of Truth**: The OpenAPI Specification defines API contracts and types
2. **Automated Code Generation**: Orval generates from OAS:
   - TypeScript interfaces
   - Type-safe React Query hooks
   - API client utilities
3. **Type Consistency**: Ensures type consistency between API and UI
4. **Opinionated Layer**: Built using generated types and hooks with an opinionated layer providing:
   - Enhanced client validations based on API specifications
   - Smart payload formation
   - Error mapping & recovery
   - UX optimizations implemented based on best practices

### Key Technical Design Principles

- **OAS-Driven Development**: All API interactions are based on the latest OAS from the JPMC API Portal
- **Type Safety**: Generated TypeScript types ensure compile-time safety
- **Automated Hooks**: React Query hooks are generated automatically from OAS
- **Consistent Error Handling**: Standardized error mapping based on API specifications
- **Smart UX**: Intelligent navigation, field prepopulation, and cognitive load reduction
- **Microdeposit Verification**: Specialized workflow for account verification through microdeposits

## Implementation Plan

### Phase 1: Core Architecture & Data Models (Week 1-2)

#### 1.1 Technology Stack Selection

- **Frontend Framework**: Choose between React, Vue, Angular, or vanilla JavaScript
- **State Management**: Implement appropriate state management (Redux, Vuex, Zustand, or custom)
- **Form Management**: Select form library (React Hook Form, Formik, VeeValidate, or custom)
- **Validation**: Implement validation strategy (Zod, Yup, Joi, or custom)
- **UI Framework**: Choose UI component library or build custom components
- **HTTP Client**: Select HTTP client (Axios, Fetch API, or framework-specific)
- **Testing**: Choose testing framework (Jest, Vitest, or framework-specific)

#### 1.2 Client ID Requirements

- **Required Client ID**: Component requires client ID to be provided by parent application
- **No Client Creation**: Component cannot create clients (only onboarding flow can create clients)
- **Client ID Validation**: Validate that client ID is provided before making API calls
- **Error Handling**: Display appropriate error if client ID is missing

#### 1.3 OAS-Based Code Generation Setup

- **OpenAPI Specification**: Use the latest OAS from JPMC API Portal for recipients endpoints
- **Code Generation Tool**: Implement Orval or similar tool for automated code generation
- **Generated Types**: TypeScript interfaces for Recipient, RecipientRequest, UpdateRecipientRequest
- **Generated Hooks**: React Query hooks for CRUD operations (useCreateRecipient, useAmendRecipient, useGetAllRecipients, useRecipientsVerification)
- **API Client**: Generated HTTP client with proper authentication and error handling

#### 1.4 Data Model Implementation

**Note**: The following data models should be generated from the latest OAS specification. These are examples based on the current API structure:

```typescript
// Generated from OAS - Linked Account types
interface Recipient {
  id: string;
  type: 'LINKED_ACCOUNT';
  status:
    | 'ACTIVE'
    | 'MICRODEPOSITS_INITIATED'
    | 'REJECTED'
    | 'READY_FOR_VALIDATION'
    | 'INACTIVE';
  clientId: string;
  createdAt: string;
  updatedAt: string;
  partyDetails: PartyDetails;
  partyId: string;
  account: AccountDetails;
}

interface PartyDetails {
  type: 'INDIVIDUAL' | 'ORGANIZATION';
  firstName?: string;
  lastName?: string;
  businessName?: string;
  alternativeName?: string;
  address?: Address;
  contacts: Contact[];
}

interface AccountDetails {
  type: 'CHECKING' | 'SAVINGS';
  number: string;
  countryCode: string;
  bankName?: string;
  routingInformation: RoutingInfo[];
}

// Generated from OAS - API request/response types
interface RecipientRequest {
  // Generated from OAS specification
}

interface UpdateRecipientRequest {
  // Generated from OAS specification
}

interface ListRecipientsResponse {
  // Generated from OAS specification
}

// Generated from OAS - Microdeposit verification types
interface MicrodepositVerificationRequest {
  amounts: number[];
}

interface MicrodepositVerificationResponse {
  status: 'VERIFIED' | 'FAILED';
}
```

#### 1.5 Configuration System

- Implement flexible configuration system for account types and verification methods
- Create validation rule engine for routing numbers and account numbers
- Build field dependency management system
- Design extensible microdeposit verification workflow

#### 1.6 Generated Hooks Integration

- **useCreateRecipient**: Generated hook for creating new linked accounts
- **useAmendRecipient**: Generated hook for updating existing linked accounts
- **useGetAllRecipients**: Generated hook for fetching linked accounts with pagination
- **useRecipientsVerification**: Generated hook for microdeposit verification
- **useGetRecipient**: Generated hook for fetching individual recipient details
- **Error Handling**: Leverage generated error types and handling patterns
- **Loading States**: Use generated loading states from React Query hooks

### Phase 2: Core Components (Week 3-4)

#### 2.1 LinkedAccountWidget Component

- Implement data fetching with pagination using generated `useGetAllRecipients` hook
- Create variant support (default vs singleAccount)
- Build responsive card layout for linked accounts
- Add action buttons (Link New Account, Verify Microdeposits, Edit, Deactivate)
- Implement responsive technical design for mobile/desktop
- Use generated loading states and error handling
- Support custom payment action via `renderPaymentAction` prop (integrates with PaymentFlow)

#### 2.2 LinkAccountForm Component

- Build dynamic form with account type selection (Individual/Organization)
- Implement routing number and account number validation
- Create validation system with real-time feedback
- Add form state management using generated types
- Implement authorization checkbox requirement
- Use generated `useCreateRecipient` hook
- Support pre-population for editing existing accounts

#### 2.3 MicrodepositsForm Component

- Create microdeposit verification form
- Implement amount validation (decimal values > $0.01)
- Build verification status handling
- Add retry logic for failed verifications
- Use generated `useRecipientsVerification` hook
- Display verification progress and results

### Phase 3: Business Logic & Integration (Week 5-6)

#### 3.1 API Integration Layer

- Implement CRUD operations for linked accounts using generated hooks
- Add error handling and retry logic based on generated error types
- Create request/response transformers using generated types
- Implement caching strategy with React Query
- Leverage generated authentication patterns from OAS

#### 3.2 Microdeposit Verification Logic

- Build microdeposit initiation workflow
- Implement verification status tracking
- Create retry mechanism for failed verifications
- Add maximum attempts handling
- Design verification result handling

#### 3.3 Form Validation Engine

- Implement progressive validation
- Create routing number validation (9-digit USABA)
- Add account number validation (4-17 digits)
- Build authorization checkbox validation
- Design contextual validation system

### Phase 4: User Experience & Technical Design Polish (Week 7-8)

#### 4.1 User Interface Enhancements

- Implement loading states and skeletons
- Add error handling with user-friendly messages
- Create success notifications
- Build confirmation dialogs for account deactivation
- Design microdeposit verification progress indicators

#### 4.2 Accessibility & Internationalization

- Implement WCAG 2.1 compliance
- Add keyboard navigation support
- Create content token system for localization
- Implement screen reader support
- Design focus management for dialog components

#### 4.3 Performance Optimization

- Implement efficient account list rendering
- Add debounced search functionality
- Create efficient re-rendering strategies
- Optimize bundle size
- Implement virtual scrolling for large account lists

### Phase 5: Testing & Documentation (Week 9-10)

#### 5.1 Testing Strategy

- Unit tests for business logic
- Integration tests for API interactions using generated hooks
- Component tests for UI behavior
- Accessibility testing
- Performance testing
- Microdeposit verification flow testing

#### 5.2 Documentation

- API documentation
- Component usage guides
- Configuration documentation
- Migration guides
- Microdeposit verification process documentation

## 1. Overview

The Linked Accounts Management Embedded Component enables users to link and manage their external bank accounts for use within the embedded finance application. This component provides functionality for creating, viewing, editing, and deactivating linked accounts, as well as verifying accounts through microdeposits when necessary.

Linked accounts (type: LINKED_ACCOUNT) represent external bank accounts belonging to the user or their organization that can be used as sources for payments. These accounts must be verified before they can be used for financial transactions.

### 1.1 Account Type Compatibility

The Linked Accounts functionality has the following constraints:

- **External bank accounts:** Must be verified through microdeposits if not automatically verified
- **Account status:** Only accounts with ACTIVE status can be used for transactions
- **Account ownership:** Accounts can be owned by either INDIVIDUAL or ORGANIZATION party types

## 2. Target Users

- Small and medium business owners
- Individual users who need to link their personal bank accounts
- Finance personnel who need to manage company bank accounts
- Users who need to transfer funds between accounts or make payments

## 3. Functional Requirements

### 3.1 Linked Account Management

#### 3.1.1 View Linked Accounts List

**Core Requirements:**

- Display a list of all linked accounts using the getAllRecipients API with type=LINKED_ACCOUNT
- Show key account information: account holder name, account type, status, masked account number, supported payment methods, date added
- Support pagination with configurable page sizes
- Enable account selection for viewing details or making payments
- Provide filtering by status and search by account holder name
- Support sorting by name, date created, and date modified
- Display action buttons for View Details, Edit, Deactivate, and Verify Microdeposits
- Handle error states gracefully with appropriate messaging

**Technical Considerations:**

- Implement efficient data fetching with caching using generated hooks
- Create responsive card layout for mobile/desktop
- Build search functionality with debouncing
- Implement loading states and skeleton screens
- Use generated loading states and error handling

#### 3.1.2 Link New Accounts

**Core Requirements:**

- Allow users to add new external bank accounts with comprehensive information
- Present account type selection first (INDIVIDUAL or ORGANIZATION)
- Collect account holder information (first/last name for individuals, business name for organizations)
- Collect bank account information (routing number, account number)
- Require authorization checkbox to certify ownership
- Implement form validation with proper formatting and required fields
- Support dynamic form adjustment based on selected account type
- Display success/error states clearly
- Explain next steps after successful creation

**Technical Considerations:**

- Build dynamic form field management system
- Implement real-time validation feedback
- Create routing number validation (9-digit USABA)
- Design extensible form architecture
- Use generated `useCreateRecipient` hook

#### 3.1.3 View Linked Account Details

**Core Requirements:**

- Display detailed information about each linked account
- Organize information in logical groups (Account Holder Info, Bank Account Info)
- Provide action buttons for Edit, Deactivate, and Verify Microdeposits
- Show all supported payment methods for the account
- Indicate account's status clearly
- Mask sensitive data (account numbers)
- Display creation and last modified dates

**Technical Considerations:**

- Implement secure data masking
- Create responsive detail view layout
- Build action button system
- Design information organization structure
- Use generated recipient types for type safety

#### 3.1.4 Edit Linked Accounts

**Core Requirements:**

- Allow updates to linked account information using the amendRecipient API
- Maintain account ID while allowing changes to account holder details
- Apply same validation rules as creation
- Display success/error notifications
- Preserve account history and status
- Pre-populate form with existing data
- Allow canceling edits
- Track changes with "updatedAt" timestamp

**Technical Considerations:**

- Implement form pre-population logic
- Create change tracking system
- Build validation consistency between create/edit
- Design undo/cancel functionality
- Use generated `useAmendRecipient` hook

#### 3.1.5 Deactivate Linked Accounts

**Core Requirements:**

- Allow deactivation of linked accounts that are no longer needed
- Display confirmation dialog with clear warning about consequences
- Show success notification upon completion
- Handle API failures gracefully
- Ensure deactivated accounts are clearly marked as inactive
- Refresh list view after successful deactivation

**Technical Considerations:**

- Implement confirmation dialog system
- Create error handling for deactivation operations
- Build list refresh mechanism
- Design audit trail for deactivations

### 3.2 Microdeposit Verification

#### 3.2.1 Microdeposit Process

**Core Requirements:**

- Automatically initiate microdeposits to the account when verification is required
- Update account status to MICRODEPOSITS_INITIATED
- Display explanation of the process to the user
- Clearly indicate that microdeposits may take 1-3 business days to appear
- Provide clear instructions on how to complete verification

**Technical Considerations:**

- Implement microdeposit initiation workflow
- Create status tracking system
- Build user notification system
- Design verification process explanation

#### 3.2.2 Verify Microdeposits

**Core Requirements:**

- Allow users to verify microdeposits using the verifyMicrodeposit API
- Provide form for entering two microdeposit amounts
- Validate that amounts are valid decimal numbers (> $0.01)
- Submit both amounts to the verification API
- Handle verification results (success, failure, maximum attempts)
- Provide clear feedback for all verification states

**Technical Considerations:**

- Build microdeposit verification form
- Implement amount validation logic
- Create verification status handling
- Add retry mechanism for failed verifications
- Use generated `useRecipientsVerification` hook

### 3.3 Payment Method Support

#### 3.3.1 Payment Method Configuration

**Core Requirements:**

- Automatically determine and display supported payment methods
- Show ACH, WIRE, and RTP as available options
- Display payment methods as badges on account list and details views
- Determine payment methods based on routing number capabilities

**Technical Considerations:**

- Implement payment method detection logic
- Create payment method display system
- Build routing number capability analysis
- Design payment method badge system

### 3.4 Validation & Error Handling

#### 3.4.1 Form Validation

**Core Requirements:**

- Implement comprehensive validation for all linked account form fields
- Validate required fields based on account type
- Validate format (routing number: 9 digits, amounts: valid decimal values)
- Require authorization checkbox to be checked
- Display clear error messages for invalid inputs

**Technical Considerations:**

- Build validation rule engine
- Create error message system
- Implement real-time validation
- Design validation state management

#### 3.4.2 API Error Handling

**Core Requirements:**

- Display appropriate error messages for API failures
- Show notifications for successful operations
- Handle network/server errors gracefully with proper user feedback

**Technical Considerations:**

- Implement error boundary system
- Create notification/toast system
- Build retry logic for failed requests
- Design error message categorization

## 4. Non-Functional Requirements

### 4.1 Performance

- Linked accounts list should load within 2 seconds
- Form submissions should process within 3 seconds
- UI should remain responsive during API calls

### 4.2 Usability

- Interface should follow established UI patterns
- Consistent notification patterns for success/error states
- Mobile-responsive design with appropriate layout adjustments for smaller viewports
- Tooltips and help text for complex fields

### 4.3 Localization

- Support for content tokens to enable localization
- Currency formatting based on locale

### 4.4 Accessibility

- All form elements should be properly labeled and accessible
- Color contrast should meet WCAG standards
- Keyboard navigation should be fully supported
- ARIA attributes should be properly implemented
- Focus management for dialog components

### 4.5 Security

- All sensitive account information must be properly masked when displayed
- Field validation must prevent potentially malicious input
- All communication with API endpoints must be encrypted using TLS
- Authentication tokens must be properly managed and secured

## 5. Technical Integration Points

### 5.1 API Integration

- **OAS-Driven Integration**: All API interactions based on latest OpenAPI Specification
- **Generated Hooks**: Use `useCreateRecipient`, `useAmendRecipient`, `useGetAllRecipients`, `useRecipientsVerification` hooks
- **Type Safety**: Generated TypeScript types ensure compile-time safety
- **Pagination Support**: Generated pagination types for listing linked accounts
- **Error Handling**: Generated error types with appropriate status codes

### 5.2 Authentication Integration

- **Generated Auth Patterns**: Leverage authentication patterns from OAS
- **Token Handling**: Use generated authentication utilities
- **Integration**: Seamless integration with parent application's authentication system

### 5.3 Content Management Integration

- **Content Tokens**: Support for content tokens from parent app's CMS systems
- **Localization**: Integration with content management system for internationalization
- **Runtime Customization**: Override content tokens from parent application

## 6. User Flows

### 6.1 Viewing Linked Accounts List

1. User navigates to the Linked Accounts section
2. System fetches linked accounts data using getAllRecipients API with type=LINKED_ACCOUNT
3. System displays list with account information and action buttons
4. User can sort, filter, search, and navigate between pages
5. If API call fails, system displays appropriate error messaging with retry option

### 6.2 Linking a New Account

1. User clicks "Link A New Account" button
2. System displays dialog with form containing account type selector and relevant fields
3. User completes form and submits
4. System validates all inputs
5. Upon successful submission, system creates linked account and shows confirmation
6. If microdeposits are required, user is informed about verification process

### 6.3 Verifying Microdeposits

1. User receives microdeposits in their bank account (1-3 business days)
2. User returns to Linked Accounts section and clicks "Verify Microdeposits"
3. System displays verification dialog with two input fields for amounts
4. User enters amounts and submits
5. System validates inputs and calls verification API
6. System displays result and updates account status accordingly

### 6.4 Editing a Linked Account

1. User clicks "Edit" for a linked account
2. System displays dialog with pre-populated form
3. User modifies desired fields
4. System validates inputs on submission
5. Upon successful update, system shows confirmation and refreshes list

### 6.5 Deactivating a Linked Account

1. User clicks "Deactivate" for an active linked account
2. System displays confirmation dialog with warning
3. User confirms deactivation
4. System calls API to deactivate account
5. Upon success, system shows notification and refreshes list

## 7. Data Model

### 7.1 Generated Data Structures

**IMPORTANT**: All data structures should be generated from the latest OpenAPI Specification (OAS) from the JPMC API Portal. The following are examples based on current API structure:

```typescript
// Generated from OAS - Linked Account types
interface Recipient {
  id: string;
  type: 'LINKED_ACCOUNT';
  status:
    | 'ACTIVE'
    | 'MICRODEPOSITS_INITIATED'
    | 'REJECTED'
    | 'READY_FOR_VALIDATION'
    | 'INACTIVE';
  clientId: string;
  createdAt: string;
  updatedAt: string;
  partyDetails: PartyDetails;
  partyId: string;
  account: AccountDetails;
}

interface PartyDetails {
  type: 'INDIVIDUAL' | 'ORGANIZATION';
  firstName?: string;
  lastName?: string;
  businessName?: string;
  alternativeName?: string;
  address?: Address;
  contacts: Contact[];
}

interface AccountDetails {
  type: 'CHECKING' | 'SAVINGS';
  number: string;
  countryCode: string;
  bankName?: string;
  routingInformation: RoutingInfo[];
}

// Generated from OAS - API Request/Response types
interface RecipientRequest {
  // Generated from OAS specification
}

interface UpdateRecipientRequest {
  // Generated from OAS specification
}

interface ListRecipientsResponse {
  // Generated from OAS specification
}

// Generated from OAS - Microdeposit verification types
interface MicrodepositVerificationRequest {
  amounts: number[];
}

interface MicrodepositVerificationResponse {
  status: 'VERIFIED' | 'FAILED';
}

// Generated from OAS - Error types
interface ApiError {
  // Generated from OAS specification
}
```

### 7.2 Account Type Configuration

```typescript
interface AccountTypeConfig {
  type: 'INDIVIDUAL' | 'ORGANIZATION';
  requiredFields: string[];
  optionalFields: string[];
  validations: ValidationRules;
  displayName: string;
}
```

### 7.3 Form Validation Rules

- **Routing Number**: Required, exactly 9 digits for USABA routing numbers
- **Account Number**: Required, 4-17 digits
- **Individual Name**: First/last name required for INDIVIDUAL type, max 70 characters each
- **Business Name**: Required for ORGANIZATION type, max 100 characters
- **Authorization**: Checkbox must be checked to certify ownership
- **Microdeposit Amounts**: Valid decimal values > $0.01

## 8. Configuration System

### 8.1 Account Type Configuration

The system must support a flexible configuration system that determines field requirements based on selected account types:

```typescript
interface AccountTypeFieldConfig {
  requiredFields: string[];
  optionalFields: string[];
  hiddenFields?: string[];
  validations: ValidationRules;
  fieldDependencies?: FieldDependencyRules;
  helperText?: Record<string, string>;
}
```

### 8.2 Microdeposit Verification Configuration

- **Verification Workflow**: Configure microdeposit initiation and verification process
- **Retry Logic**: Set maximum verification attempts
- **Amount Validation**: Configure minimum/maximum amount requirements
- **Status Tracking**: Define verification status transitions

## 9. Testing Strategy

### 9.1 Test Categories

- **Unit Tests**: Business logic, validation rules, data transformations
- **Integration Tests**: API interactions using generated hooks, form submissions, data flow
- **Component Tests**: UI behavior, user interactions, accessibility
- **End-to-End Tests**: Complete user workflows, cross-browser compatibility
- **Generated Code Tests**: Test generated types and hooks for type safety
- **Microdeposit Tests**: Test verification workflow and edge cases

### 9.2 Test Coverage Requirements

- Minimum 80% line coverage
- Cover all user interaction paths
- Test all API integration points using generated hooks
- Verify error handling and edge cases with generated error types
- Test accessibility features
- Include integration tests for complex flows
- Test OAS-generated code integration
- Test microdeposit verification scenarios

## 10. Additional Resources

### 10.1 API Documentation References

- [JPMorgan Chase Embedded Payments - Linked Accounts](https://developer.payments.jpmorgan.com/docs/embedded-finance-solutions/embedded-payments/capabilities/embedded-payments/how-to/linked-accounts)
- [Create Recipient API](https://developer.payments.jpmorgan.com/api/embedded-finance-solutions/embedded-payments/embedded-payments/recipients#/operations/createRecipient)
- [Update Recipient API](https://developer.payments.jpmorgan.com/api/embedded-finance-solutions/embedded-payments/embedded-payments/recipients#/operations/amendRecipient)
- [List Recipients API](https://developer.payments.jpmorgan.com/api/embedded-finance-solutions/embedded-payments/embedded-payments/recipients#/operations/getAllRecipients)
- [Verify Microdeposits API](https://developer.payments.jpmorgan.com/api/embedded-finance-solutions/embedded-payments/embedded-payments/recipients#/operations/recipientsVerification)
