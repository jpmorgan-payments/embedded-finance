# Recipients Management Embedded Component Requirements

> **Documentation References:**
> - [JPMorgan Chase Embedded Payments - Third-Party Recipients](https://developer.payments.jpmorgan.com/docs/embedded-finance-solutions/embedded-payments/capabilities/embedded-payments/how-to/third-party-recipient)
> 
> **API References:**
> - [Create Recipient API](https://developer.payments.jpmorgan.com/api/embedded-finance-solutions/embedded-payments/embedded-payments/recipients#/operations/createRecipient)
> - [Update Recipient API](https://developer.payments.jpmorgan.com/api/embedded-finance-solutions/embedded-payments/embedded-payments/recipients#/operations/amendRecipient)
> - [List Recipients API](https://developer.payments.jpmorgan.com/api/embedded-finance-solutions/embedded-payments/embedded-payments/recipients#/operations/getAllRecipients)

## 1. Overview

The Recipients Management Embedded Component is a crucial component of the Embedded application, enabling users to manage payment recipients. This Embedded Component provides functionality for creating, viewing, editing, and deleting recipient information, as well as facilitating payments to these recipients.

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
- Users must be able to view a list of all saved recipients using the [getAllRecipients API](https://developer.payments.jpmorgan.com/api/embedded-finance-solutions/embedded-payments/embedded-payments/recipients#/operations/getAllRecipients)
- The list should display key recipient information:
  - Name (individual or business)
  - Account details (masked account number)
  - Available transaction methods (ACH, WIRE, RTP)
  - Status (ACTIVE, INACTIVE, etc.)
- The system should support pagination with configurable page sizes (10, 25, 50, 100 items per page)
- Recipients should be selectable for viewing details or making payments
- The list should be filterable by status and searchable by recipient name
- The list should support sorting by name, date created, and date modified
- Each recipient in the list should show action buttons for View, Edit, and Make Payment functions
- Error states should be handled gracefully with appropriate messaging if the API fails to retrieve recipients

#### 3.1.2 Create New Recipients
- Users must be able to add new payment recipients with the following information:
  - Recipient type (RECIPIENT for third-party recipients)
  - Party details:
    - Type (INDIVIDUAL or ORGANIZATION)
    - For individuals: First name, Last name
    - For organizations: Business name
    - Address information:
      - Address line 1 (and optional line 2)
      - City
      - State/Province
      - Postal/ZIP code
      - Country code
  - Bank account details:
    - Account type (CHECKING or SAVINGS)
    - Account number
    - Country code
    - Routing information by transaction type:
      - ACH: Routing number (ABA) and routing code type (USABA)
      - WIRE: Routing number (ABA) and routing code type (USABA)
      - RTP: Routing number (ABA) and routing code type (USABA)
  - Contact information:
    - Email address (required for notifications)
    - Phone number (optional)
- The system must support multiple transaction methods per recipient (ACH, WIRE, RTP)
- Form validation must enforce proper formatting and required fields
- Duplicate detection should alert users when creating potential duplicates
- The system must display the correct minimum required fields based on selected payment methods:
  - **Wire transfer:** Name, country code, complete address, routing and account numbers
  - **ACH:** Name, country code, routing number, account number, account type
  - **RTP:** Name, country code, routing number, account number
- The creation form should support multi-step progression (e.g., Basic Info → Account Details → Review)
- Success and error states should be clearly communicated to users
- Upon successful creation, the system should offer options to "Add Another Recipient" or "Make a Payment"

#### 3.1.3 View Recipient Details
- Users must be able to view detailed information about each recipient
- Details should be organized in logical groups (General Info, Bank Account, Contacts)
- From the details view, users should be able to:
  - Edit recipient information
  - Delete the recipient
  - Initiate a payment to the recipient
- The details view should display all supported payment methods for the recipient
- The interface should clearly indicate the recipient's active/inactive status
- For security, account numbers should be masked with only the last 4 digits visible
- The detail view should include creation date and last modified date information

#### 3.1.4 Edit Recipients
- Users must be able to update all recipient information using the [amendRecipient API](https://developer.payments.jpmorgan.com/api/embedded-finance-solutions/embedded-payments/embedded-payments/recipients#/operations/amendRecipient)
- Updates should maintain the same recipient ID but allow changes to party details, contact information, and account details
- Form validation rules apply to edits the same as to creation
- Success/error notifications must be displayed upon completion
- The system should preserve the recipient's history and status while applying the requested changes
- The edit form should be pre-populated with all existing recipient information
- Users should be able to add/remove transaction methods during the edit process
- The system should support canceling edits and returning to the previous screen
- The edit form should have the same multi-step progression as the creation form
- Changes should be tracked for audit purposes with the "updatedAt" timestamp

#### 3.1.5 Delete Recipients
- Users must be able to delete recipients from the system
- A confirmation dialog must be displayed before deletion with clear warning about the action being irreversible
- Success notification must be shown upon successful deletion
- The system should handle API failures gracefully and inform the user if deletion fails
- For security and audit purposes, deleted recipient data should not be recoverable through the UI
- The list view should refresh automatically after successful deletion

### 3.2 Payment Integration

#### 3.2.1 Initiate Payments
- Users must be able to initiate payments directly to recipients from:
  - The recipients list
  - The recipient details page
- The system should pass recipient information to the payment flow, including:
  - Recipient ID
  - Name (individual or business)
  - Account details
  - Available transaction methods
- The payment interface should only show transaction methods that are:
  - Available for the selected recipient (based on stored routing information)
  - Supported by the sender's account type (LIMITED_DDA_PAYMENTS)
- The payment form should pre-populate with recipient information to minimize user entry
- Users should be able to save new recipients directly from the payment flow when sending to a new recipient

#### 3.2.2 Payment Method Selection Logic
- When multiple transaction methods are available for a recipient, the system should:
  - Display all available options to the user (ACH, WIRE, RTP)
  - Provide informational tooltips explaining the characteristics of each method
  - Default to the most cost-effective option for the payment amount
  - Indicate when certain options are unavailable (e.g., RTP for amounts over $100,000)
  - Show estimated settlement times for each payment method

### 3.3 Validation & Error Handling

#### 3.3.1 Form Validation
- Implement comprehensive validation for all recipient form fields including:
  - Required field validation
  - Character limitations (e.g., max 70 chars for names)
  - Format validation (proper email, phone formats)
  - Special character validation
  - Whitespace handling
- Display clear error messages for invalid inputs

#### 3.3.2 API Error Handling
- Display appropriate error messages for API failures
- Show notifications for successful operations
- Handle network/server errors gracefully

## 4. Non-Functional Requirements

### 4.1 Performance
- Recipients list should load within 2 seconds
- Form submissions should process within 3 seconds
- Pagination should support efficient loading of large recipient lists

### 4.2 Usability
- The interface should follow established UI patterns from the Mantine component library
- Consistent notification patterns for success/error states
- Mobile-responsive design with appropriate column displays for smaller viewports
- Tooltips and help text for complex fields

### 4.3 Localization
- Support for content tokens to enable localization
- Content overrides for different platforms/implementations

### 4.4 Accessibility
- All form elements should be properly labeled and accessible
- Color contrast should meet WCAG standards
- Keyboard navigation should be supported

### 4.5 Security
- All sensitive recipient information must be properly masked when displayed (account numbers, routing numbers)
- Access to recipient data should be restricted based on user permissions
- API calls must use secure authentication methods as specified in the JPMC API documentation
- All communication with recipient endpoints must be encrypted using TLS
- Audit logs should track all create, read, update, and delete operations on recipients
- Field validation must prevent potentially malicious input (e.g., SQL injection, XSS)

## 5. Technical Integration Points

### 5.1 API Integration
- RESTful API endpoints for CRUD operations on recipients
- Pagination support for listing recipients
- Error handling with appropriate status codes

### 5.2 Authentication Integration
- Integration with the application's ForgeRock authentication system
- Proper token handling for API requests

### 5.3 Content Management Integration
- Content tokens for all user-facing text to support localization and customization
- Integration with AEM content management system

## 6. User Flows

### 6.1 Viewing Recipients List
1. User navigates to the Recipients section of the application
2. System fetches recipients data using the [getAllRecipients API](https://developer.payments.jpmorgan.com/api/embedded-finance-solutions/embedded-payments/embedded-payments/recipients#/operations/getAllRecipients)
3. System displays a paginated list with the following:
   - Recipient name (individual or business)
   - Masked account number (showing only last 4 digits)
   - Available transaction methods (ACH, WIRE, RTP) displayed as icons
   - Status indicator (ACTIVE/INACTIVE)
   - Action buttons (View Details, Edit, Make Payment)
4. User can:
   - Sort the list by name, date created, or date modified
   - Filter by status (All, Active, Inactive)
   - Search by recipient name
   - Select page size (10, 25, 50, 100 items)
   - Navigate between pages using pagination controls
5. If the API call fails, system displays appropriate error messaging with retry option

### 6.2 Creating a New Recipient
1. User navigates to Recipients page
2. User clicks "Create Recipient" button
3. System presents multi-step form with progress indicator:
   - Step 1: Basic Information
     - User selects recipient type (Individual/Organization)
     - For Individual: User enters first name, last name
     - For Organization: User enters business name
   - Step 2: Address Information
     - User enters address details (required for WIRE transfers)
     - User enters country code
   - Step 3: Bank Account Details
     - User selects account type (CHECKING/SAVINGS)
     - User enters account number
     - User selects transaction methods (ACH, WIRE, RTP)
     - User enters routing information for selected methods
       - Option to use same routing number for all methods
   - Step 4: Contact Information
     - User enters email address (required)
     - User enters phone number (optional)
   - Step 5: Review & Submit
     - System displays all entered information for verification
     - User can go back to any step to make corrections
4. User submits the form
5. System validates all inputs
6. If valid, system creates recipient and displays success notification
7. User is presented with options:
   - "View Recipient Details"
   - "Make a Payment"
   - "Add Another Recipient"
   - "Return to Recipients List"

### 6.3 Viewing Recipient Details
1. User clicks "View Details" action for a specific recipient in the list
2. System retrieves detailed recipient information
3. System displays information in organized sections:
   - General Information
     - Name (individual or business)
     - Status (ACTIVE/INACTIVE)
     - Creation and last modified dates
   - Bank Account Details
     - Account type
     - Masked account number
     - Bank name (if provided)
     - Supported transaction methods with their routing details
   - Address Information
     - Full address with all components
   - Contact Information
     - Email address
     - Phone number (if provided)
4. From this view, user can:
   - Click "Edit" to modify recipient details
   - Click "Make Payment" to initiate a payment to this recipient
   - Click "Delete" to remove the recipient
   - Click "Back to List" to return to the recipients list

### 6.4 Editing a Recipient
1. User clicks "Edit" action for a specific recipient (from list or details view)
2. System retrieves current recipient data
3. System pre-populates multi-step form with existing information
4. User can navigate through same steps as creation process:
   - Step 1: Basic Information
   - Step 2: Address Information
   - Step 3: Bank Account Details
   - Step 4: Contact Information
   - Step 5: Review & Submit
5. User can modify any information:
   - Update name, address, or contact details
   - Change account type or number
   - Add or remove transaction methods
   - Update routing information
6. User reviews changes and submits the updated form
7. System validates all inputs
8. If valid, system updates recipient using [amendRecipient API](https://developer.payments.jpmorgan.com/api/embedded-finance-solutions/embedded-payments/embedded-payments/recipients#/operations/amendRecipient)
9. System displays success notification
10. User is returned to the recipient details view showing updated information

### 6.5 Deleting a Recipient
1. User clicks "Delete" action for a recipient (from list or details view)
2. System displays confirmation dialog:
   - Warning that action cannot be undone
   - Recipient name to confirm correct selection
   - Options to "Cancel" or "Delete"
3. If user confirms deletion:
   - System submits delete request to API
   - System displays success notification upon completion
   - User is returned to recipients list (refreshed without deleted recipient)
4. If deletion fails:
   - System displays specific error message
   - Provides options to retry or cancel

### 6.6 Making a Payment to a Recipient
1. User clicks "Make Payment" action for a specific recipient
2. System retrieves recipient details
3. System navigates to payment form with pre-populated recipient information:
   - Recipient name and ID
   - Available transaction methods based on recipient's configuration
4. User selects desired transaction method (ACH, WIRE, or RTP)
5. System adjusts form to show required fields based on selected method
6. User enters:
   - Payment amount
   - Payment date
   - Reference number/memo (optional)
   - Additional details specific to selected payment method
7. User reviews and submits payment
8. System processes payment request
9. User receives confirmation with payment details and tracking information

### 6.7 Adding a New Recipient During Payment
1. User initiates a new payment without selecting a recipient first
2. User selects "New Recipient" option when prompted for payment destination
3. System presents the recipient creation flow (as in 6.2)
4. After successful recipient creation, system:
   - Returns to payment form
   - Pre-populates recipient information
   - Continues with payment flow (as in 6.6, steps 4-9)
5. User completes payment to newly created recipient

### 6.8 Managing Multiple Transaction Methods
1. User navigates to Recipients list
2. User selects "Edit" for a specific recipient
3. User proceeds to Bank Account Details step
4. User can:
   - View current transaction methods with their routing information
   - Enable/disable transaction methods using checkboxes
   - For each enabled method, provide required routing information
   - Toggle "Use same routing number for all methods" option
5. If same routing number option is enabled:
   - User enters routing number once
   - System applies to all selected transaction methods
6. If same routing number option is disabled:
   - User enters separate routing information for each method
7. User completes remaining steps and saves the recipient
8. System updates recipient with new transaction method configuration

## 7. Data Model

### 7.1 Recipient
- **id**: Unique identifier (UUID format)
- **type**: RECIPIENT (for third-party recipients)
- **status**: Account status (e.g., ACTIVE, INACTIVE)
- **clientId**: Client identifier
- **createdAt**: Creation timestamp
- **updatedAt**: Last updated timestamp
- **partyDetails**:
  - **type**: INDIVIDUAL or ORGANIZATION
  - **firstName**: String (required for INDIVIDUAL)
  - **lastName**: String (required for INDIVIDUAL)
  - **businessName**: String (required for ORGANIZATION)
  - **alternativeName**: Optional alternative name
  - **address**: 
    - **addressLine1**: String
    - **addressLine2**: String (optional)
    - **addressLine3**: String (optional)
    - **city**: String
    - **state**: String
    - **postalCode**: String
    - **countryCode**: String (e.g., "US")
  - **contacts**: Array of contact information
    - **contactType**: PHONE or EMAIL
    - **value**: String
    - **countryCode**: String (for PHONE)
- **partyId**: Unique identifier for the party
- **account**:
  - **type**: Account type (CHECKING, SAVINGS, etc.)
  - **number**: Account number
  - **countryCode**: Country code
  - **bankName**: Optional bank name
  - **bic**: Optional BIC code
  - **branchCode**: Optional branch code
  - **routingInformation**: Array of routing details
    - **transactionType**: ACH, WIRE, or RTP
    - **routingNumber**: String (e.g., "021000021")
    - **routingCodeType**: String (e.g., "USABA")

### 7.2 ListRecipientsResponse
- **recipients**: Array of Recipient objects
- **page**: Current page number
- **limit**: Items per page
- **total_items**: Total number of recipients

### 7.3 Recipient Form Field Validations
- **Business Name**:
  - Required when party type is ORGANIZATION
  - Maximum 100 characters
  - Alphanumeric and common special characters
  
- **Individual Name**:
  - First and last name required when party type is INDIVIDUAL
  - Each field maximum 70 characters
  - Alphanumeric and common special characters (no numbers in names)
  
- **Account Number**:
  - Required for all recipient types
  - 4-17 digits
  - No special characters
  
- **Routing Number**:
  - Required for ACH, WIRE, and RTP transaction methods
  - Exactly 9 digits for USABA routing numbers
  - Must pass checksum validation
  
- **Email Address**:
  - Valid email format
  - Maximum 254 characters
  
- **Phone Number**:
  - Optional for most transaction types
  - Valid format with country code
  
- **Address Fields**:
  - Required for WIRE transaction method
  - Address line: Maximum 100 characters
  - City: Maximum 50 characters
  - State: Valid US state code (2 characters) if country is US
  - Postal code: Valid format based on country

## 8. Metrics & Analytics

Track the following metrics to measure feature success:
- Number of recipients created
- Number of payments initiated from recipient pages
- Time spent on recipient creation form
- Error rates on form submission

## 9. Recipient Creation Form Details

### 9.1 API Request Shape & Data Model

The Recipient creation form should generate a request body that matches the following structure, based on the latest OAS specification from the JPMC API:

#### Example Request:

```json
{ 
    "partyDetails": { 
        "address": { 
            "addressLine1": "200 Central Park West", 
            "addressLine2": "Apt. 3663", 
            "city": "New York City", 
            "countryCode": "US", 
            "postalCode": "12345", 
            "state": "NY" 
        }, 
        "type": "ORGANIZATION", 
        "businessName": "Acme Corporation", 
        "contacts": [ 
            { 
                "contactType": "EMAIL", 
                "value": "contact@example.com" 
            } 
        ] 
    }, 
    "account": { 
        "number": "0259057683", 
        "type": "SAVINGS", 
        "routingInformation": [ 
            { 
                "routingCodeType": "USABA", 
                "routingNumber": "021000021", 
                "transactionType": "ACH" 
            }, 
            { 
                "routingCodeType": "USABA", 
                "routingNumber": "021000021", 
                "transactionType": "RTP" 
            }, 
            { 
                "routingCodeType": "USABA", 
                "routingNumber": "021000021", 
                "transactionType": "WIRE" 
            }
        ],
        "countryCode": "US" 
    }, 
    "type": "RECIPIENT" 
}
```

#### Example Response:

```json
{ 
    "id": "56043232-1ef2-4495-953b-1320b5b8913d", 
    "partyDetails": { 
        "address": { 
            "addressType": null, 
            "addressLine1": "200 Central Park West", 
            "addressLine2": "Apt. 3663", 
            "addressLine3": null, 
            "city": "New York City", 
            "state": "NY", 
            "postalCode": "12345", 
            "countryCode": "US" 
        }, 
        "type": "ORGANIZATION", 
        "firstName": null, 
        "lastName": null, 
        "businessName": "Acme Corporation", 
        "alternativeName": null, 
        "contacts": [ 
            { 
                "contactType": "EMAIL", 
                "countryCode": null, 
                "value": "contact@example.com" 
            } 
        ], 
        "identities": null 
    }, 
    "partyId": "33321085-23c6-4116-9e1b-b1a9a651ce7b", 
    "account": { 
        "number": "0259057683", 
        "type": "SAVINGS", 
        "bic": null, 
        "bankName": null, 
        "branchCode": null, 
        "routingInformation": [ 
            {
                "routingNumber": "021000021", 
                "transactionType": "ACH", 
                "routingCodeType": "USABA" 
            }, 
            { 
                "routingNumber": "021000021", 
                "transactionType": "RTP", 
                "routingCodeType": "USABA" 
            }, 
            { 
                "routingNumber": "021000021", 
                "transactionType": "WIRE", 
                "routingCodeType": "USABA" 
            } 
        ], 
        "countryCode": "US" 
    }, 
    "type": "RECIPIENT", 
    "status": "ACTIVE", 
    "clientId": "3002023061", 
    "createdAt": "2025-04-08T17:19:33.368472Z", 
    "updatedAt": "2025-04-08T17:19:33.366590372Z", 
    "accountValidationResponse": null, 
    "card": null 
}
```

#### 9.1.1 Data Model Details

**Recipient Type:**
- **RECIPIENT:** Third-party recipients that can receive payments from a LIMITED_DDA_PAYMENTS account

**Party Types:**
- **INDIVIDUAL:** A person receiving payments (e.g., contractor, employee)
- **ORGANIZATION:** A business entity receiving payments (e.g., vendor, supplier)

**Account Types:**
- **CHECKING:** Standard checking account
- **SAVINGS:** Interest-bearing savings account

**Transaction Methods:**
- **ACH:** Automated Clearing House electronic transfers (US)
  - **Required fields:** Name, country code, routing number, account number, account type (CHECKING or SAVINGS)
  - **Routing code type:** USABA (9-digit ABA routing number)
  - **Characteristics:** 
    - Typically settles within 1-3 business days
    - Lower transaction fees compared to wire transfers
    - Suitable for recurring payments
  
- **WIRE:** Traditional bank wire transfers
  - **Required fields:** Name, country code, complete address (city, state, postal code), routing and account numbers
  - **Routing code type:** USABA for domestic wires
  - **Characteristics:** 
    - Same-day settlement (when initiated before cutoff times)
    - Higher transaction fees
    - Suitable for time-sensitive, high-value transactions
  
- **RTP:** Real-Time Payments network transfers
  - **Required fields:** Name, country code, routing number, account number
  - **Routing code type:** USABA (9-digit ABA routing number)
  - **Characteristics:** 
    - Immediate settlement (24/7/365)
    - Lower transaction fees than wire transfers
    - Maximum transaction limit of $100,000
    - Recipient's bank must participate in the RTP network

**Routing Code Types:**
- **USABA:** American Bankers Association routing number (9 digits)

**API Response Status Values:**
- **ACTIVE:** Recipient is ready to receive payments
- **INACTIVE:** Recipient is currently disabled for payments

> **Important Notes:** 
> - Your client can make business-related payments to third parties from their LIMITED_DDA_PAYMENTS account.
> - Your client cannot pay to a third-party recipient from their LIMITED_DDA account.
> - Recipients are created with ACTIVE status and can receive payments immediately after creation.

### 9.2 UI Configuration Map for Transaction Methods

A key requirement is to implement a flexible UI configuration map that determines which fields are required or optional based on selected transaction methods. This configuration must be:

1. **Transaction Type Specific**: Each transaction type (ACH, WIRE, RTP) has its own field requirements as specified in the JPMC documentation
2. **Multi-select Capable**: Users can select multiple transaction types (0 or more)
3. **Dynamically Adjusting**: Form fields and validations change based on selected transaction types
4. **Configurable for Single Routing**: Option to use one routing number for all selected types (as shown in the API example)
5. **Extensible**: Design should accommodate future addition of:
   - New transaction types
   - Additional countries with different requirements
   - New recipient attributes

#### Configuration Map Structure

```typescript
interface PaymentTypeFieldConfig {
  // Fields required when this payment type is selected
  requiredFields: string[];
  
  // Fields that should be visible but optional when this payment type is selected
  optionalFields: string[];
  
  // Fields that should be hidden when this payment type is selected
  hiddenFields?: string[];
  
  // Validation rules specific to this payment type
  validations: {
    [fieldName: string]: {
      pattern?: RegExp;
      maxLength?: number;
      minLength?: number;
      customValidator?: (value: any, formValues?: Record<string, any>) => boolean | string;
      errorMessage?: string;
    }
  };
  
  // Country-specific overrides
  countryOverrides?: {
    [countryCode: string]: {
      requiredFields: string[];
      optionalFields: string[];
      hiddenFields?: string[];
      validations: {
        [fieldName: string]: object;
      };
    }
  };
  
  // Field dependency rules
  fieldDependencies?: {
    [fieldName: string]: {
      dependsOn: string; // The field this field depends on
      condition: (value: any) => boolean; // Condition to show/require this field
      whenTrue: 'show' | 'require' | 'hide'; // Action to take when condition is true
      whenFalse: 'show' | 'require' | 'hide'; // Action to take when condition is false
    }
  };
  
  // Helper text for fields
  helperText?: {
    [fieldName: string]: string;
  };
}

// Example comprehensive configuration map
const paymentTypeConfigMap: Record<PaymentMethodType, PaymentTypeFieldConfig> = {
  ACH: {
    requiredFields: [
      'account.type',
      'account.number', 
      'account.countryCode',
      'account.routingInformation[ACH].routingNumber',
      'account.routingInformation[ACH].routingCodeType',
      'partyDetails.firstName', // For INDIVIDUAL type
      'partyDetails.lastName',  // For INDIVIDUAL type
      'partyDetails.businessName' // For ORGANIZATION type
    ],
    optionalFields: [
      'partyDetails.contacts[PHONE].value',
      'partyDetails.contacts[EMAIL].value',
      'partyDetails.address.addressLine1',
      'partyDetails.address.city',
      'partyDetails.address.stateOrProvince',
      'partyDetails.address.postalCode',
      'account.bankName'
    ],
    hiddenFields: [
      'account.intermediaryBankDetails',
      'partyDetails.identificationDocuments'
    ],
    validations: {
      'account.routingInformation[ACH].routingNumber': {
        pattern: /^\d{9}$/,
        maxLength: 9,
        minLength: 9,
        errorMessage: 'ACH routing number must be exactly 9 digits'
      },
      'account.number': {
        pattern: /^\d{4,17}$/,
        maxLength: 17,
        errorMessage: 'Account number must be between 4 and 17 digits'
      }
    },
    fieldDependencies: {
      'partyDetails.firstName': {
        dependsOn: 'partyDetails.type',
        condition: (value) => value === 'INDIVIDUAL',
        whenTrue: 'require',
        whenFalse: 'hide'
      },
      'partyDetails.businessName': {
        dependsOn: 'partyDetails.type',
        condition: (value) => value === 'ORGANIZATION',
        whenTrue: 'require',
        whenFalse: 'hide'
      }
    },
    helperText: {
      'account.routingInformation[ACH].routingNumber': 'The 9-digit ABA routing number found at the bottom of a check',
      'account.number': 'The account number where funds will be deposited'
    },
    countryOverrides: {
      'US': {
        requiredFields: [
          'account.routingInformation[ACH].routingCodeType',
          'account.routingInformation[ACH].routingNumber'
        ],
        optionalFields: [],
        validations: {
          'account.routingInformation[ACH].routingNumber': {
            pattern: /^\d{9}$/,
            errorMessage: 'US ACH routing number must be exactly 9 digits'
          }
        }
      },
      'CA': {
        requiredFields: [
          'account.routingInformation[ACH].routingNumber',
          'account.routingInformation[ACH].routingCodeType',
          'account.bankName'
        ],
        optionalFields: [],
        validations: {
          'account.routingInformation[ACH].routingNumber': {
            pattern: /^\d{9}$/,
            errorMessage: 'Canadian routing number must be exactly 9 digits'
          }
        }
      }
    }
  },
  WIRE: {
    requiredFields: [
      'account.type',
      'account.number', 
      'account.bankName',
      'account.countryCode',
      'account.routingInformation[WIRE].routingNumber',
      'account.routingInformation[WIRE].routingCodeType',
      'partyDetails.address.addressLine1',
      'partyDetails.address.city',
      'partyDetails.address.stateOrProvince',
      'partyDetails.address.postalCode'
    ],
    optionalFields: [
      'account.bankAddress',
      'account.intermediaryBankDetails',
      'account.routingInformation[WIRE].additionalInfo'
    ],
    validations: {
      'account.routingInformation[WIRE].routingNumber': {
        pattern: /^\d{9}$/,
        maxLength: 9,
        errorMessage: 'Wire routing number must be exactly 9 digits for domestic wires'
      },
      'account.intermediaryBankDetails.bankIdentifier': {
        customValidator: (value, formValues) => {
          if (!value) return true;
          if (formValues?.account?.intermediaryBankDetails?.identifierType === 'SWIFT') {
            return /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(value) || 'Invalid SWIFT/BIC code format';
          }
          return true;
        }
      }
    },
    helperText: {
      'account.intermediaryBankDetails.bankIdentifier': 'For international wires, the intermediary bank's identifier code',
      'account.routingInformation[WIRE].additionalInfo': 'Any special instructions for the wire transfer'
    }
  },
  RTP: {
    requiredFields: [
      'account.type',
      'account.number', 
      'account.routingInformation[RTP].routingNumber',
      'partyDetails.contacts[EMAIL].value'
    ],
    optionalFields: [
      'account.name',
      'partyDetails.contacts[PHONE].value'
    ],
    validations: {
      'account.routingInformation[RTP].routingNumber': {
        pattern: /^\d{9}$/,
        maxLength: 9,
        errorMessage: 'RTP routing number must be exactly 9 digits'
      },
      'partyDetails.contacts[EMAIL].value': {
        pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        errorMessage: 'Please enter a valid email address'
      }
    }
  },
  EMAIL: {
    requiredFields: [
      'partyDetails.contacts[EMAIL].value',
      'partyDetails.firstName', 
      'partyDetails.lastName'
    ],
    optionalFields: [
      'partyDetails.contacts[PHONE].value'
    ],
    hiddenFields: [
      'account.type',
      'account.number',
      'account.routingInformation'
    ],
    validations: {
      'partyDetails.contacts[EMAIL].value': {
        pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        errorMessage: 'Please enter a valid email address'
      }
    },
    helperText: {
      'partyDetails.contacts[EMAIL].value': 'The email where payment instructions will be sent'
    }
  },
  INTERNATIONAL: {
    requiredFields: [
      'account.type',
      'account.number',
      'account.bankName',
      'account.countryCode',
      'account.currencyCode',
      'account.routingInformation[SWIFT].routingNumber',
      'account.routingInformation[SWIFT].routingCodeType'
    ],
    optionalFields: [
      'account.bankAddress',
      'account.intermediaryBankDetails',
      'account.routingInformation[SWIFT].additionalInfo',
      'partyDetails.address'
    ],
    validations: {
      'account.routingInformation[SWIFT].routingNumber': {
        pattern: /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/,
        errorMessage: 'Please enter a valid SWIFT/BIC code'
      },
      'account.number': {
        customValidator: (value, formValues) => {
          // IBAN validation for European countries
          const euroCountries = ['DE', 'FR', 'ES', 'IT', 'NL', 'BE', 'AT', 'GR', 'PT', 'IE', 'FI', 'LU', 'SI', 'CY', 'MT', 'SK', 'EE', 'LV', 'LT'];
          
          if (euroCountries.includes(formValues?.account?.countryCode)) {
            // Simple IBAN format check (complete validation would require mod-97 check)
            const ibanRegex = new RegExp(`^${formValues?.account?.countryCode}[0-9]{2}[A-Z0-9]{10,30}$`);
            return ibanRegex.test(value) || 'Please enter a valid IBAN for this country';
          }
          
          return true;
        }
      },
      'account.currencyCode': {
        pattern: /^[A-Z]{3}$/,
        errorMessage: 'Please enter a valid 3-letter currency code (e.g., EUR, GBP)'
      }
    },
    countryOverrides: {
      'GB': { // United Kingdom
        requiredFields: [
          'account.routingInformation[SORT_CODE].routingNumber',
          'account.number'
        ],
        optionalFields: [],
        validations: {
          'account.routingInformation[SORT_CODE].routingNumber': {
            pattern: /^\d{6}$/,
            errorMessage: 'UK Sort Code must be exactly 6 digits'
          }
        }
      },
      'MX': { // Mexico
        requiredFields: [
          'account.routingInformation[CLABE].routingNumber'
        ],
        optionalFields: [],
        validations: {
          'account.routingInformation[CLABE].routingNumber': {
            pattern: /^\d{18}$/,
            errorMessage: 'CLABE must be exactly 18 digits'
          }
        }
      }
    }
  },
  CHECK: {
    requiredFields: [
      'partyDetails.type',
      'partyDetails.address.addressLine1',
      'partyDetails.address.city',
      'partyDetails.address.stateOrProvince',
      'partyDetails.address.postalCode',
      'partyDetails.address.country'
    ],
    optionalFields: [
      'partyDetails.address.addressLine2',
      'partyDetails.contacts[PHONE].value',
      'partyDetails.contacts[EMAIL].value',
      'description'
    ],
    hiddenFields: [
      'account.type',
      'account.number',
      'account.routingInformation'
    ],
    fieldDependencies: {
      'partyDetails.firstName': {
        dependsOn: 'partyDetails.type',
        condition: (value) => value === 'INDIVIDUAL',
        whenTrue: 'require',
        whenFalse: 'hide'
      },
      'partyDetails.businessName': {
        dependsOn: 'partyDetails.type',
        condition: (value) => value === 'ORGANIZATION',
        whenTrue: 'require',
        whenFalse: 'hide'
      }
    },
    validations: {
      'partyDetails.address.postalCode': {
        customValidator: (value, formValues) => {
          const country = formValues?.partyDetails?.address?.country;
          if (country === 'US') {
            return /^\d{5}(-\d{4})?$/.test(value) || 'US ZIP code must be in format 12345 or 12345-6789';
          } else if (country === 'CA') {
            return /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/.test(value) || 'Canadian postal code must be in format A1A 1A1';
          }
          return true;
        }
      }
    }
  }
};
```

### 9.3 Implementation Considerations

#### 9.3.1 Single Routing Number Option

- Implement a toggle labeled "Use same routing number for all transaction types"
- When enabled:
  - Display only one routing number field with a label that reflects all selected types
  - Apply the most restrictive validation rules (9-digit USABA routing number)
  - Store the same routing number for all selected transaction types in the API request, as shown in the API example:
  ```json
  "routingInformation": [ 
      { 
          "routingCodeType": "USABA", 
          "routingNumber": "021000021", 
          "transactionType": "ACH" 
      }, 
      { 
          "routingCodeType": "USABA", 
          "routingNumber": "021000021", 
          "transactionType": "RTP" 
      }, 
      { 
          "routingCodeType": "USABA", 
          "routingNumber": "021000021", 
          "transactionType": "WIRE" 
      }
  ]
  ```
- When disabled:
  - Display separate routing number fields for each selected transaction type
  - Apply specific validation rules per transaction type
  - Allow different routing numbers for different transaction types

#### 9.3.2 Dynamic Field Management

- **Field Visibility Control**:
  - Show/hide fields dynamically based on payment type selection
  - Maintain field values in the form state even when hidden (for returning to previous selections)
  - Clear values of hidden fields when they become irrelevant to the current selection

- **Field Requirement Logic**:
  - When multiple payment types are selected, a field should be required if any selected payment type requires it
  - Fields that are optional for all selected payment types should remain optional
  - Fields that are hidden by all selected payment types should remain hidden

- **Field Dependency Chains**:
  - Support multi-level field dependencies (Field C depends on Field B which depends on Field A)
  - Handle circular dependencies gracefully with clear error messages to developers

#### 9.3.3 Validation Strategy

- **Progressive Validation**:
  - Validate fields as users progress through the form, not just on submission
  - Provide immediate feedback for format errors (e.g., invalid email, wrong routing number format)
  - Defer complex validations (e.g., routing number verification) until submission

- **Transaction Type-Specific Validation**:
  - Apply specific validation rules for each transaction type according to JPMC requirements:
    - **ACH:** Validate 9-digit USABA routing number, account number, account type (CHECKING or SAVINGS)
    - **WIRE:** Validate 9-digit USABA routing number, complete address fields (city, state, postal code), account number
    - **RTP:** Validate 9-digit USABA routing number, account number, email address for notifications

- **Composite Validation Rules**:
  - When multiple transaction types are selected, merge validation rules using these principles:
    - Apply the most restrictive pattern/format requirements
    - Take the minimum of all maxLength requirements
    - Take the maximum of all minLength requirements
    - Run all custom validators and aggregate error messages

- **Contextual Validation**:
  - Apply country-specific validation rules based on the selected country (currently focused on US)
  - Implement recipient type-specific validation (different rules for individuals vs. organizations)
  - Apply specific rules for LIMITED_DDA_PAYMENTS accounts (can pay third-party recipients) vs LIMITED_DDA accounts (cannot)

#### 9.3.4 Configuration Architecture

- **Configuration Management**:
  - Store the configuration map in a central, versioned location
  - Consider making it externally configurable via CMS or configuration service
  - Implement a fallback mechanism to default rules if configuration cannot be loaded

- **Extensibility Design**:
  - Use a plugin architecture for adding new payment types
  - Implement a registry pattern for field validators
  - Support middleware hooks for pre/post processing of form data

- **Configuration Versioning**:
  - Support versioned configurations to handle API changes
  - Maintain backward compatibility for saved recipients
  - Provide migration utilities for updating recipient data

#### 9.3.5 User Experience Enhancements

- **Smart Defaults**:
  - Pre-select country code based on user's location
  - Default currency to match the country's primary currency
  - Remember user's commonly used payment types

- **Progressive Disclosure**:
  - Initially show only the most basic fields (recipient type, name, payment method)
  - Expand to show relevant fields based on selections
  - Group related fields in collapsible sections

- **Contextual Help**:
  - Provide field-level tooltips explaining format requirements
  - Show examples of correctly formatted values for complex fields
  - Display visual indicators for required vs. optional fields

- **Real-time Feedback**:
  - Implement inline validation with clear error messages
  - Show success indicators when fields pass validation
  - Provide a form completion progress indicator

#### 9.3.6 API Integration

- **Request Transformation**:
  - Convert form values to the exact API request format
  - Handle nested objects and arrays properly
  - Filter out empty or unused fields before submission

- **Response Handling**:
  - Parse API responses to extract meaningful error messages
  - Map backend validation errors to specific form fields
  - Support partial form submission and resumption

- **Caching Strategy**:
  - Cache reference data (banks, routing number verification)
  - Implement optimistic UI updates while waiting for API confirmation
  - Store draft recipient data to prevent loss during session interruptions

#### 9.3.7 Test Strategy

- **Test Cases by Payment Type**:
  - Create test matrices covering all payment type combinations
  - Test field visibility, requirement, and validation rules for each combination
  - Verify correct API request formation for each scenario

- **Validation Testing**:
  - Test boundary conditions for all validations
  - Verify error messages are clear and actionable
  - Test internationalization of validation messages

- **Accessibility Testing**:
  - Verify keyboard navigation works with dynamic form changes
  - Ensure screen readers announce validation errors appropriately
  - Test color contrast for form elements and error states

This comprehensive configuration approach ensures the Recipients form can handle complex payment scenarios across different countries and payment types, while remaining adaptable to future business requirements and API changes.

## 10. Additional Resources

### 10.1 API Documentation References
- [JPMorgan Chase Embedded Payments - Third-Party Recipient](https://developer.payments.jpmorgan.com/docs/embedded-finance-solutions/embedded-payments/capabilities/embedded-payments/how-to/third-party-recipient)
- [Create Recipient API](https://developer.payments.jpmorgan.com/api/embedded-finance-solutions/embedded-payments/embedded-payments/recipients#/operations/createRecipient)
- [Update Recipient API](https://developer.payments.jpmorgan.com/api/embedded-finance-solutions/embedded-payments/embedded-payments/recipients#/operations/amendRecipient)
- [List Recipients API](https://developer.payments.jpmorgan.com/api/embedded-finance-solutions/embedded-payments/embedded-payments/recipients#/operations/getAllRecipients)

### 10.2 Related JPMC Documentation
- [Payment Capabilities](https://developer.payments.jpmorgan.com/docs/embedded-finance-solutions/embedded-payments/capabilities/embedded-payments/payment-capabilities)
- [Recipient Management Overview](https://developer.payments.jpmorgan.com/docs/embedded-finance-solutions/embedded-payments/capabilities/embedded-payments/how-to/manage-recipients)
- [API Reference](https://developer.payments.jpmorgan.com/api/embedded-finance-solutions/embedded-payments/embedded-payments/recipients)
