# Recipients Management Embedded Component Requirements

> **Documentation References:**
>
> - [JPMorgan Chase Embedded Payments - Third-Party Recipients](https://developer.payments.jpmorgan.com/docs/embedded-finance-solutions/embedded-payments/capabilities/embedded-payments/how-to/third-party-recipient)
>
> **API References:**
>
> - [Create Recipient API](https://developer.payments.jpmorgan.com/api/embedded-finance-solutions/embedded-payments/embedded-payments/recipients#/operations/createRecipient)
> - [Update Recipient API](https://developer.payments.jpmorgan.com/api/embedded-finance-solutions/embedded-payments/embedded-payments/recipients#/operations/amendRecipient)
> - [List Recipients API](https://developer.payments.jpmorgan.com/api/embedded-finance-solutions/embedded-payments/embedded-payments/recipients#/operations/getAllRecipients)

## Design Philosophy Alignment

This component follows the Embedded UI Components design philosophy outlined in the main README.md:

### Integration Scenarios and Use Cases

The Recipients component is designed for flexible integration into parent web applications, offering several customization points:

- **Runtime Customization**: Inject design tokens to match parent app's theme, override content tokens from parent app's CMS systems, connect to parent app's monitoring via `userEventsHandler`
- **Component Configuration**: Configure API endpoints via provider, customize component behavior through props
- **Client ID Management**: Requires client ID to be provided by parent application (cannot create clients)

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

### Key Principles

- **OAS-Driven Development**: All API interactions are based on the latest OAS from the JPMC API Portal
- **Type Safety**: Generated TypeScript types ensure compile-time safety
- **Automated Hooks**: React Query hooks are generated automatically from OAS
- **Consistent Error Handling**: Standardized error mapping based on API specifications
- **Smart UX**: Intelligent navigation, field prepopulation, and cognitive load reduction

## Implementation Plan

### Phase 1: Core Architecture & Data Models

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
- **Generated Hooks**: React Query hooks for CRUD operations (useCreateRecipient, useAmendRecipient, useGetAllRecipients)
- **API Client**: Generated HTTP client with proper authentication and error handling

#### 1.4 Data Model Implementation

**Note**: The following data models should be generated from the latest OAS specification. These are examples based on the current API structure:

```typescript
// Generated from OAS - Recipient types
interface Recipient {
  id: string;
  type: 'RECIPIENT';
  status: 'ACTIVE' | 'INACTIVE';
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
```

#### 1.5 Configuration System

- Implement flexible configuration system for payment methods
- Create validation rule engine
- Build field dependency management system
- Design extensible payment method configuration

#### 1.6 Generated Hooks Integration

- **useCreateRecipient**: Generated hook for creating new recipients
- **useAmendRecipient**: Generated hook for updating existing recipients
- **useGetAllRecipients**: Generated hook for fetching recipients with pagination
- **useDeleteRecipient**: Generated hook for deleting recipients (if available in OAS)
- **Error Handling**: Leverage generated error types and handling patterns
- **Loading States**: Use generated loading states from React Query hooks

### Phase 2: Core Components

#### 2.1 Recipients List Component

- Implement data fetching with pagination using generated `useGetAllRecipients` hook
- Create filtering and search functionality
- Build sorting capabilities
- Add action buttons (View, Edit, Delete, Make Payment)
- Implement responsive design for mobile/desktop
- Use generated loading states and error handling

#### 2.2 Recipient Form Component

- Build dynamic form with field visibility control
- Implement payment method selection logic
- Create validation system with real-time feedback
- Add form state management using generated types
- Implement multi-step form progression
- Use generated `useCreateRecipient` and `useAmendRecipient` hooks

#### 2.3 Recipient Details Component

- Create detailed view with organized sections
- Implement action buttons
- Add security masking for sensitive data
- Build responsive layout
- Use generated recipient types for type safety

### Phase 3: Business Logic & Integration

#### 3.1 API Integration Layer

- Implement CRUD operations for recipients using generated hooks
- Add error handling and retry logic based on generated error types
- Create request/response transformers using generated types
- Implement caching strategy with React Query
- Leverage generated authentication patterns from OAS

#### 3.2 Payment Method Logic

- Build payment method configuration system
- Implement field requirement logic
- Create validation rule engine
- Add country-specific overrides

#### 3.3 Form Validation Engine

- Implement progressive validation
- Create transaction type-specific validation
- Add composite validation rules
- Build contextual validation system

### Phase 4: User Experience & Polish

#### 4.1 User Interface Enhancements

- Implement loading states and skeletons
- Add error handling with user-friendly messages
- Create success notifications
- Build confirmation dialogs

#### 4.2 Accessibility & Internationalization

- Implement WCAG 2.1 compliance
- Add keyboard navigation support
- Create content token system for localization
- Implement screen reader support

#### 4.3 Performance Optimization

- Implement virtual scrolling for large lists
- Add debounced search functionality
- Create efficient re-rendering strategies
- Optimize bundle size

### Phase 5: Testing & Documentation

#### 5.1 Testing Strategy

- Unit tests for business logic
- Integration tests for API interactions
- Component tests for UI behavior
- Accessibility testing
- Performance testing

#### 5.2 Documentation

- API documentation
- Component usage guides
- Configuration documentation
- Migration guides

## 1. Overview

The Recipients Management Embedded Component enables users to manage payment recipients within an embedded finance application. This component provides functionality for creating, viewing, editing, and deleting recipient information, as well as facilitating payments to these recipients.

Recipients are external parties (type: RECIPIENT) that can receive payments from a LIMITED_DDA_PAYMENTS account. They represent third-party entities such as vendors, suppliers, or service providers that the user needs to pay.

### 1.1 Account Type Compatibility

The Recipients functionality has the following account type constraints:

- **LIMITED_DDA_PAYMENTS accounts:** Can make payments to third-party recipients (type: RECIPIENT)
- **LIMITED_DDA accounts:** Cannot make payments to third-party recipients

## 2. Target Users

- Small and medium business owners
- Accounting/finance personnel who need to manage payment recipients
- Users who need to make recurring payments to vendors, suppliers, or other business contacts

## 3. Functional Requirements

### 3.1 Recipient Management

#### 3.1.1 View Recipients List

**Core Requirements:**

- Display a list of all saved recipients using the getAllRecipients API
- Show key recipient information: name, masked account number, available transaction methods, status
- Support pagination with configurable page sizes (10, 25, 50, 100 items per page)
- Enable recipient selection for viewing details or making payments
- Provide filtering by status and search by recipient name
- Support sorting by name, date created, and date modified
- Display action buttons for View, Edit, and Make Payment functions
- Handle error states gracefully with appropriate messaging

**Technical Considerations:**

- Implement efficient data fetching with caching
- Create responsive table/card layout for mobile/desktop
- Build search functionality with debouncing
- Implement loading states and skeleton screens

#### 3.1.2 Create New Recipients

**Core Requirements:**

- Allow users to add new payment recipients with comprehensive information
- Present payment method selection first ("How do you want to pay this recipient?")
- Support multiple transaction methods per recipient (ACH, WIRE, RTP)
- Dynamically adapt form fields based on selected payment methods
- Collect recipient type, party details, bank account details, routing information, address, and contact information
- Implement form validation with proper formatting and required fields
- Provide duplicate detection alerts
- Support multi-step form progression
- Display success/error states clearly
- Offer follow-up actions after successful creation

**Technical Considerations:**

- Build dynamic form field management system
- Implement real-time validation feedback
- Create payment method configuration system
- Design extensible form architecture

#### 3.1.3 View Recipient Details

**Core Requirements:**

- Display detailed information about each recipient
- Organize information in logical groups (General Info, Bank Account, Contacts)
- Provide action buttons for Edit, Delete, and Make Payment
- Show all supported payment methods for the recipient
- Indicate recipient's active/inactive status
- Mask sensitive data (account numbers, routing numbers)
- Display creation and last modified dates

**Technical Considerations:**

- Implement secure data masking
- Create responsive detail view layout
- Build action button system
- Design information organization structure

#### 3.1.4 Edit Recipients

**Core Requirements:**

- Allow updates to all recipient information using the amendRecipient API
- Maintain recipient ID while allowing changes to party details, contact information, and account details
- Apply same validation rules as creation
- Display success/error notifications
- Preserve recipient history and status
- Pre-populate form with existing data
- Support adding/removing transaction methods
- Allow canceling edits
- Support multi-step progression
- Track changes with "updatedAt" timestamp

**Technical Considerations:**

- Implement form pre-population logic
- Create change tracking system
- Build validation consistency between create/edit
- Design undo/cancel functionality

#### 3.1.5 Delete Recipients

**Core Requirements:**

- Allow deletion of recipients from the system
- Display confirmation dialog with clear warning about irreversible action
- Show success notification upon completion
- Handle API failures gracefully
- Ensure deleted data is not recoverable through UI
- Refresh list view after successful deletion

**Technical Considerations:**

- Implement confirmation dialog system
- Create error handling for delete operations
- Build list refresh mechanism
- Design audit trail for deletions

### 3.2 Payment Integration

#### 3.2.1 Initiate Payments

**Core Requirements:**

- Enable payment initiation from recipients list and details page
- Pass recipient information to payment flow (ID, name, account details, available methods)
- Show only transaction methods available for selected recipient and supported by sender's account
- Pre-populate payment form with recipient information
- Allow saving new recipients directly from payment flow

**Technical Considerations:**

- Build payment method filtering logic
- Create data passing mechanism between components
- Implement form pre-population system
- Design payment flow integration

#### 3.2.2 Payment Method Selection Logic

**Core Requirements:**

- Display all available options when multiple transaction methods are available
- Provide informational tooltips explaining characteristics of each method
- Default to most cost-effective option for payment amount
- Indicate when certain options are unavailable
- Show estimated settlement times for each payment method

**Technical Considerations:**

- Implement payment method comparison logic
- Create tooltip/information display system
- Build cost calculation engine
- Design availability checking system

### 3.3 Validation & Error Handling

#### 3.3.1 Form Validation

**Core Requirements:**

- Implement comprehensive validation for all recipient form fields
- Validate required fields, character limitations, format validation, special character validation
- Handle whitespace appropriately
- Display clear error messages for invalid inputs

**Technical Considerations:**

- Build validation rule engine
- Create error message system
- Implement real-time validation
- Design validation state management

#### 3.3.2 API Error Handling

**Core Requirements:**

- Display appropriate error messages for API failures
- Show notifications for successful operations
- Handle network/server errors gracefully

**Technical Considerations:**

- Implement error boundary system
- Create notification/toast system
- Build retry logic for failed requests
- Design error message categorization

## 4. Non-Functional Requirements

### 4.1 Performance

- Recipients list should load within 2 seconds
- Form submissions should process within 3 seconds
- Pagination should support efficient loading of large recipient lists

### 4.2 Usability

- Interface should follow established UI patterns
- Consistent notification patterns for success/error states
- Mobile-responsive design with appropriate layouts for different viewports
- Tooltips and help text for complex fields

### 4.3 Localization

- Support for content tokens to enable localization
- Content overrides for different platforms/implementations

### 4.4 Accessibility

- All form elements should be properly labeled and accessible
- Color contrast should meet WCAG standards
- Keyboard navigation should be supported

### 4.5 Security

- All sensitive recipient information must be properly masked when displayed
- Access to recipient data should be restricted based on user permissions
- API calls must use secure authentication methods
- All communication must be encrypted using TLS
- Audit logs should track all CRUD operations on recipients
- Field validation must prevent potentially malicious input

## 5. Technical Integration Points

### 5.1 API Integration

- **OAS-Driven Integration**: All API interactions based on latest OpenAPI Specification
- **Generated Hooks**: Use `useCreateRecipient`, `useAmendRecipient`, `useGetAllRecipients` hooks
- **Type Safety**: Generated TypeScript types ensure compile-time safety
- **Pagination Support**: Generated pagination types for listing recipients
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

### 6.1 Viewing Recipients List

1. User navigates to the Recipients section
2. System fetches recipients data using getAllRecipients API
3. System displays paginated list with recipient information and action buttons
4. User can sort, filter, search, and navigate between pages
5. If API call fails, system displays appropriate error messaging with retry option

### 6.2 Creating a New Recipient

1. User navigates to Recipients page and clicks "Create Recipient"
2. System displays form in order: Payment Method Selection → Personal/Organization Details → Account Details → Routing Numbers → Address Information → Contact Information → Review & Submit
3. User submits form
4. System validates inputs based on selected payment methods
5. Upon success, system shows confirmation and offers follow-up actions

### 6.3 Viewing Recipient Details

1. User clicks "View Details" for a specific recipient
2. System retrieves detailed recipient information
3. System displays information in organized sections
4. From this view, user can Edit, Make Payment, Delete, or return to list

### 6.4 Editing a Recipient

1. User selects "Edit" for a recipient
2. System loads form pre-populated with existing data
3. User can modify information and change payment methods
4. User reviews changes and submits
5. System applies validation and saves via Amend Recipient API
6. Success notification is shown and details view reflects update

### 6.5 Deleting a Recipient

1. User clicks "Delete" action for a recipient
2. System displays confirmation dialog with warning
3. If user confirms deletion, system submits delete request
4. System displays success notification and returns to refreshed list
5. If deletion fails, system displays specific error message

### 6.6 Making a Payment to a Recipient

1. User clicks "Make Payment" for a specific recipient
2. System retrieves recipient details
3. System navigates to payment form with pre-populated recipient information
4. User selects desired transaction method
5. System adjusts form to show required fields
6. User enters payment details and submits
7. System processes payment request
8. User receives confirmation with payment details

## 7. Data Model

### 7.1 Generated Data Structures

**IMPORTANT**: All data structures should be generated from the latest OpenAPI Specification (OAS) from the JPMC API Portal. The following are examples based on current API structure:

```typescript
// Generated from OAS - Core Recipient types
interface Recipient {
  id: string;
  type: 'RECIPIENT';
  status: 'ACTIVE' | 'INACTIVE';
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

// Generated from OAS - Error types
interface ApiError {
  // Generated from OAS specification
}
```

### 7.2 Payment Method Configuration

```typescript
interface PaymentMethodConfig {
  type: 'ACH' | 'WIRE' | 'RTP';
  requiredFields: string[];
  optionalFields: string[];
  validations: ValidationRules;
  characteristics: {
    settlementTime: string;
    feeStructure: 'low' | 'medium' | 'high';
    maxAmount?: number;
    minAmount?: number;
  };
}
```

### 7.3 Form Validation Rules

- **Business Name**: Required for ORGANIZATION, max 100 characters
- **Individual Name**: First/last name required for INDIVIDUAL, max 70 characters each
- **Account Number**: Required, 4-17 digits
- **Routing Number**: Required for ACH/WIRE/RTP, exactly 9 digits for USABA
- **Email Address**: Valid email format, max 254 characters
- **Phone Number**: Optional, valid format with country code
- **Address Fields**: Required for WIRE, specific format requirements by country

## 8. Configuration System

### 8.1 Payment Method Configuration

The system must support a flexible configuration system that determines field requirements based on selected payment methods:

```typescript
interface PaymentTypeFieldConfig {
  requiredFields: string[];
  optionalFields: string[];
  hiddenFields?: string[];
  validations: ValidationRules;
  countryOverrides?: CountrySpecificRules;
  fieldDependencies?: FieldDependencyRules;
  helperText?: Record<string, string>;
}
```

### 8.2 Dynamic Form Management

- **Field Visibility Control**: Show/hide fields based on payment type selection
- **Field Requirement Logic**: Required if any selected payment type requires it
- **Validation Strategy**: Progressive validation with real-time feedback
- **Configuration Architecture**: Central, versioned configuration management

## 9. Testing Strategy

### 9.1 Test Categories

- **Unit Tests**: Business logic, validation rules, data transformations
- **Integration Tests**: API interactions using generated hooks, form submissions, data flow
- **Component Tests**: UI behavior, user interactions, accessibility
- **End-to-End Tests**: Complete user workflows, cross-browser compatibility
- **Generated Code Tests**: Test generated types and hooks for type safety

### 9.2 Test Coverage Requirements

- Minimum 80% line coverage
- Cover all user interaction paths
- Test all API integration points using generated hooks
- Verify error handling and edge cases with generated error types
- Test accessibility features
- Include integration tests for complex flows
- Test OAS-generated code integration

## 10. Additional Resources

### 10.1 API Documentation References

- [JPMorgan Chase Embedded Payments - Third-Party Recipient](https://developer.payments.jpmorgan.com/docs/embedded-finance-solutions/embedded-payments/capabilities/embedded-payments/how-to/third-party-recipient)
- [Create Recipient API](https://developer.payments.jpmorgan.com/api/embedded-finance-solutions/embedded-payments/embedded-payments/recipients#/operations/createRecipient)
- [Update Recipient API](https://developer.payments.jpmorgan.com/api/embedded-finance-solutions/embedded-payments/embedded-payments/recipients#/operations/amendRecipient)
- [List Recipients API](https://developer.payments.jpmorgan.com/api/embedded-finance-solutions/embedded-payments/embedded-payments/recipients#/operations/getAllRecipients)
