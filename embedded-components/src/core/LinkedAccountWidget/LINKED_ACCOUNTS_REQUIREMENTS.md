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

## 1. Overview

The Linked Accounts Management Embedded Component is a crucial component of the Embedded application, enabling users to link and manage their external bank accounts for use within the application. This component provides functionality for creating, viewing, editing, and deactivating linked accounts, as well as verifying accounts through microdeposits when necessary.

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

- Users must be able to view a list of all linked accounts using the [getAllRecipients API](https://developer.payments.jpmorgan.com/api/embedded-finance-solutions/embedded-payments/embedded-payments/recipients#/operations/getAllRecipients) with type=LINKED_ACCOUNT
- The list should display key account information:
  - Account holder name (individual or business)
  - Account type (individual or organization)
  - Status (ACTIVE, MICRODEPOSITS_INITIATED, etc.)
  - Last 4 digits of account number (masked for security)
  - Supported payment methods (ACH, WIRE, RTP)
  - Date added
- Each account in the list should show action buttons for View Details, Edit, and Deactivate (if active)
- For accounts pending verification, a "Verify Microdeposits" action should be displayed
- Error states should be handled gracefully with appropriate messaging if the API fails to retrieve accounts

#### 3.1.2 Link New Accounts

- Users must be able to add new external bank accounts with the following information:
  - **Account Type** (INDIVIDUAL or ORGANIZATION)
  - **Account Holder Information**:
    - For individuals: First name, Last name
    - For organizations: Business name
  - **Bank Account Information**:
    - Routing number (9-digit USABA)
    - Account number
  - **Authorization** checkbox to certify ownership of the account
- Form validation must enforce proper formatting and required fields:
  - Routing number must be exactly 9 digits
  - Account number must not be empty
  - Authorization checkbox must be checked
- The form should dynamically adjust based on the selected account type (individual vs. organization)
- Upon successful creation, the system should show a confirmation and explain next steps:
  - If the account is immediately verified: Account is ready to use
  - If microdeposits are required: Explanation of the verification process
- Success and error states should be clearly communicated to users

#### 3.1.3 View Linked Account Details

- Users must be able to view detailed information about each linked account
- Details should be organized in logical groups (Account Holder Info, Bank Account Info)
- From the details view, users should be able to:
  - Edit account information
  - Deactivate the account (if active)
  - Verify microdeposits (if pending verification)
- The details view should display all supported payment methods for the account
- The interface should clearly indicate the account's status
- For security, account numbers should be masked with only the last 4 digits visible
- The detail view should include creation date and last modified date information

#### 3.1.4 Edit Linked Accounts

- Users must be able to update linked account information using the [amendRecipient API](https://developer.payments.jpmorgan.com/api/embedded-finance-solutions/embedded-payments/embedded-payments/recipients#/operations/amendRecipient)
- Updates should maintain the same recipient ID but allow changes to account holder details and contact information
- Form validation rules apply to edits the same as to creation
- Success/error notifications must be displayed upon completion
- The system should preserve the account's history and status while applying the requested changes
- The edit form should be pre-populated with all existing account information
- Changes should be tracked for audit purposes with the "updatedAt" timestamp

#### 3.1.5 Deactivate Linked Accounts

- Users must be able to deactivate linked accounts that are no longer needed
- A confirmation dialog must be displayed before deactivation with clear warning about the consequences
- Success notification must be shown upon successful deactivation
- The system should handle API failures gracefully and inform the user if deactivation fails
- Deactivated accounts should be clearly marked as inactive in the UI
- The list view should refresh automatically after successful deactivation

### 3.2 Microdeposit Verification

#### 3.2.1 Microdeposit Process

- When a linked account requires verification, the system should:
  - Automatically initiate microdeposits to the account
  - Update the account status to MICRODEPOSITS_INITIATED
  - Display an explanation of the process to the user
- The UI should clearly indicate that microdeposits may take 1-3 business days to appear
- Users should receive clear instructions on how to complete verification once deposits appear

#### 3.2.2 Verify Microdeposits

- Users must be able to verify microdeposits using the [verifyMicrodeposit API](https://developer.payments.jpmorgan.com/api/embedded-finance-solutions/embedded-payments/embedded-payments/recipients#/operations/verifyMicrodeposit)
- The verification form should:
  - Allow users to enter two microdeposit amounts
  - Validate that amounts are valid decimal numbers (> $0.01)
  - Submit both amounts to the verification API
- The system should handle verification results:
  - Success: Update account status to ACTIVE and notify user
  - Failure: Show error message with remaining attempts count
  - Maximum attempts reached: Show appropriate error and guidance
- Clear feedback should be provided for all states of the verification process

### 3.3 Payment Method Support

#### 3.3.1 Payment Method Configuration

- The system should automatically determine and display supported payment methods:
  - ACH: Standard electronic fund transfers
  - WIRE: Wire transfers for larger amounts
  - RTP: Real-time payments for immediate transfers
- Payment methods should be displayed as badges on the linked account list and details views
- The payment methods should be determined based on the routing number capabilities

### 3.4 Validation & Error Handling

#### 3.4.1 Form Validation

- Implement comprehensive validation for all linked account form fields including:
  - Required field validation (based on account type)
  - Format validation (routing number: 9 digits, amounts: valid decimal values)
  - Authorization validation (certify checkbox must be checked)
- Display clear error messages for invalid inputs

#### 3.4.2 API Error Handling

- Display appropriate error messages for API failures
- Show notifications for successful operations
- Handle network/server errors gracefully with proper user feedback

## 4. Non-Functional Requirements

### 4.1 Performance

- Linked accounts list should load within 2 seconds
- Form submissions should process within 3 seconds
- UI should remain responsive during API calls

### 4.2 Usability

- The interface should follow established UI patterns using Radix UI primitives and Tailwind CSS
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

- All sensitive account information must be properly masked when displayed (account numbers)
- Field validation must prevent potentially malicious input
- All communication with API endpoints must be encrypted using TLS
- Authentication tokens must be properly managed and secured

## 5. Technical Integration Points

### 5.1 API Integration

- RESTful API endpoints for CRUD operations on linked accounts
- Error handling with appropriate status codes
- React Query for data fetching and mutation

### 5.2 React Query Integration

- Cache management for linked accounts data
- Optimistic updates for improved UX
- Query invalidation on successful mutations

### 5.3 Component Architecture

- Proper component hierarchy following project structure
- Component composition for reusability
- State management using React hooks

## 6. User Flows

### 6.1 Viewing Linked Accounts List

1. User navigates to the Linked Accounts section of the application
2. System fetches linked accounts data using the [getAllRecipients API](https://developer.payments.jpmorgan.com/api/embedded-finance-solutions/embedded-payments/embedded-payments/recipients#/operations/getAllRecipients) with type=LINKED_ACCOUNT
3. System displays a list with the following for each account:
   - Account holder name
   - Account type badge (Individual/Business)
   - Status badge
   - Last 4 digits of account number
   - Supported payment methods as badges
   - Date added
   - Action buttons (Details, Edit, Deactivate)
4. If the API call fails, system displays appropriate error messaging with retry option

### 6.2 Linking a New Account

1. User clicks "Link A New Account" button
2. System displays a dialog with a form containing:
   - Account type selector (Individual/Organization)
   - Account holder fields (dynamically adjusted based on selected type)
   - Bank account information fields (routing number, account number)
   - Authorization checkbox
3. User completes the form and submits
4. System validates all inputs
5. Upon successful submission:
   - System creates the linked account via the API
   - Dialog shows success confirmation
   - Account list is refreshed to include the new account
   - If microdeposits are required, user is informed about the verification process

### 6.3 Verifying Microdeposits

1. User receives microdeposits in their bank account (1-3 business days)
2. User returns to Linked Accounts section and clicks "Verify Microdeposits" for the pending account
3. System displays verification dialog with:
   - Explanation of the verification process
   - Two input fields for the microdeposit amounts
4. User enters the two amounts and submits
5. System validates inputs and calls the verification API
6. System displays result:
   - Success: Account status updates to ACTIVE, success message shown
   - Failure: Error message with remaining attempts information
7. Dialog closes and the account list refreshes to show updated status

### 6.4 Editing a Linked Account

1. User clicks "Edit" for a linked account
2. System displays dialog with pre-populated form containing current account information
3. User modifies the desired fields
4. System validates inputs on submission
5. Upon successful update:
   - System updates the account via the API
   - Dialog shows success confirmation
   - Account list refreshes to show updated information

### 6.5 Deactivating a Linked Account

1. User clicks "Deactivate" for an active linked account
2. System displays confirmation dialog with warning about consequences
3. User confirms deactivation
4. System calls the API to deactivate the account
5. Upon success:
   - System shows success notification
   - Account list refreshes to show updated status (INACTIVE)
   - Deactivate button is removed from the account's actions

## 7. API Integration Details

### 7.1 Create Linked Account

**Endpoint:** POST /recipients

**Request Example:**

```json
{
  "type": "LINKED_ACCOUNT",
  "partyDetails": {
    "type": "INDIVIDUAL",
    "firstName": "John",
    "lastName": "Doe"
  },
  "account": {
    "type": "CHECKING",
    "number": "123456789012",
    "routingInformation": [
      {
        "routingCodeType": "USABA",
        "routingNumber": "021000021",
        "transactionType": "ACH"
      }
    ],
    "countryCode": "US"
  }
}
```

**Response Statuses:**

- **ACTIVE:** Account is verified and ready to use
- **MICRODEPOSITS_INITIATED:** Verification needed through microdeposits
- **REJECTED:** Account could not be verified

### 7.2 Verify Microdeposits

**Endpoint:** POST /recipients/{id}/verify-microdeposit

**Request Example:**

```json
{
  "amounts": [0.25, 0.15]
}
```

**Response Example:**

```json
{
  "status": "VERIFIED"
}
```

### 7.3 Status Workflow

1. **Initial Creation**:
   - If instant verification is available: ACTIVE
   - If microdeposits required: MICRODEPOSITS_INITIATED
2. **After Microdeposits Sent**: READY_FOR_VALIDATION
3. **After Verification**:
   - Successful: ACTIVE
   - Failed (< 3 attempts): READY_FOR_VALIDATION
   - Failed (3 attempts): REJECTED
4. **After Deactivation**: INACTIVE

## 8. Implementation Guidelines

### 8.1 Component Structure

```
LinkedAccountWidget/
├── LinkedAccountWidget.tsx
├── LinkedAccountWidget.test.tsx
├── LinkedAccountWidget.story.tsx
├── LinkAccountForm/
│   ├── LinkAccountForm.tsx
│   ├── LinkAccountForm.test.tsx
│   ├── LinkAccountForm.schema.ts
│   └── index.ts
├── MicrodepositsForm/
│   ├── MicrodepositsForm.tsx
│   ├── MicrodepositsForm.test.tsx
│   ├── MicrodepositsForm.schema.ts
│   └── index.ts
└── index.ts
```

### 8.2 State Management

- Use React Query for server state management
- Use local component state for UI state
- Implement optimistic updates for improved UX

### 8.3 Form Management

- Use react-hook-form for form handling
- Use zod for schema validation
- Implement dynamic form fields based on context

### 8.4 Testing Strategy

- Unit tests for component rendering and behavior
- Integration tests for form submission
- Mock API responses for different scenarios
- Test accessibility features

## 9. Future Enhancements

### 9.1 Instant Verification

- Integration with third-party verification services for immediate account validation
- Eliminate waiting period for microdeposits when possible

### 9.2 Multi-Account Management

- Batch operations for managing multiple linked accounts
- Account categorization and tagging

### 9.3 Enhanced Security

- Multi-factor authentication for sensitive operations
- Risk scoring for linked accounts

## 10. Additional Resources

### 10.1 API Documentation References

- [JPMorgan Chase Embedded Payments - Linked Accounts](https://developer.payments.jpmorgan.com/docs/embedded-finance-solutions/embedded-payments/capabilities/embedded-payments/how-to/linked-accounts)
- [Create Recipient API](https://developer.payments.jpmorgan.com/api/embedded-finance-solutions/embedded-payments/embedded-payments/recipients#/operations/createRecipient)
- [Update Recipient API](https://developer.payments.jpmorgan.com/api/embedded-finance-solutions/embedded-payments/embedded-payments/recipients#/operations/amendRecipient)
- [List Recipients API](https://developer.payments.jpmorgan.com/api/embedded-finance-solutions/embedded-payments/embedded-payments/recipients#/operations/getAllRecipients)
- [Verify Microdeposits API](https://developer.payments.jpmorgan.com/api/embedded-finance-solutions/embedded-payments/embedded-payments/recipients#/operations/recipientsVerification)

