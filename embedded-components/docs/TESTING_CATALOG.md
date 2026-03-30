# Embedded Payments Test Catalog

This document describes test cases created to guide Sandbox testing of Embedded Payments. Each test case is aligned to an associated Embedded Payments API Guide. Please complete each of the following cases to ensure production readiness.

> [!NOTE]
> All data is mock data and should not be used in production.

> [!NOTE]
> **Integration types covered:** This test catalog covers both **API-only integration** and **Partially Hosted UI integration**. For details on the Partially Hosted UI integration pattern (iframe-based onboarding, document upload, payments, and more), see the [Hosted Onboarding UI Integration Guide](https://github.com/jpmorgan-payments/embedded-finance/blob/main/embedded-components/docs/partially-hosted/PARTIALLY_HOSTED_UI_INTERGRATION_GUIDE.md).

> [!NOTE]
> **Pre-created resources for exploration:** J.P. Morgan will share pre-created Client IDs in `APPROVED` state along with other pre-created resources (accounts, linked accounts, etc.) for your team to explore and test against without needing to complete the full onboarding flow first. Contact your J.P. Morgan implementation representative for these details.

## Prerequisites

Before testing, ensure the following prerequisites are met:

- Access to the Sandbox environment (see [Base URLs](#base-urls) below).
- TLS and Digital certificates have been uploaded and are active for the Embedded Payments and Digital Onboarding APIs in the Payments Developer Portal - Client Testing environment.
- Magic values, such as `"externalId"` mentioned in the scenarios below, must be preliminarily set up by the corresponding J.P. Morgan implementation team.

### Sandbox Base URLs

| Service | Base URL |
|---------|----------|
| Onboarding | `https://api-sandbox.payments.jpmorgan.com/onboarding/v1` |
| Transactions | `https://api-sandbox.payments.jpmorgan.com/embedded/v2` |
| Accounts | `https://api-sandbox.payments.jpmorgan.com/embedded/v1` |
| Recipients | `https://api-sandbox.payments.jpmorgan.com/embedded/v1` |
| Webhooks | `https://api-sandbox.payments.jpmorgan.com/embedded/v1` |
| Error Codes | [Embedded Finance Error Code Catalog](https://developer.payments.jpmorgan.com/api/embedded-finance-solutions/embedded-payments/error-codes#embedded-finance-error-code-catalog) |

### Client Creation – Minimum Payload

For both API-only and Partially Hosted integrations, you can create a client using a minimal payload. When using the **Partially Hosted UI** integration, the client is created with this minimal payload first, and onboarding is then completed through the hosted iframe experience.

To simulate specific KYC outcomes in Sandbox, include the `"externalId"` magic value in the client party payload (see [Magic Values for Sandbox Testing](#magic-values-for-sandbox-testing) below).

```json
{
  "parties": [
    {
      "partyType": "ORGANIZATION",
      "roles": ["CLIENT"],
      "externalId": "<magic_value_or_omit>",
      "organizationDetails": {
        "organizationType": "LIMITED_LIABILITY_COMPANY",
        "organizationName": "Test Client",
        "countryOfFormation": "US"
      }
    }
  ],
  "products": ["EMBEDDED_PAYMENTS"]
}
```

### Magic Values for Sandbox Testing

Use the following `"externalId"` values on a party in the `POST /clients` request payload to trigger specific Sandbox behaviors:

| `externalId` Value | Behavior |
|--------------------|----------|
| `"kycApproved"` | Client is approved after verification is triggered |
| `"kycDocRequest"` | Triggers a document request during the KYC process (`INFORMATION_REQUESTED` state) |
| _(omit or use any other value)_ | Standard flow — see [Scenario 6: Simulate KYC Decline](#scenario-6-simulate-kyc-decline) for details |

> [!TIP]
> If you are using a hosted or partially hosted solution, ensure you run through test cases across **multiple browsers, devices, and version types** to verify that functionality meets responsiveness and rendering expectations.

---

## Guide 1: Onboard Clients

> **API Reference:** [Embedded Payments – Onboard a Client](https://developer.payments.jpmorgan.com/docs/embedded-finance-solutions/embedded-payments/capabilities/onboard-a-client)

### Scenario 1: Full Onboarding Flow – KYC Approved

**Objective:**
Verify the end-to-end onboarding flow from client creation through KYC approval.

**Steps:**

1. **Create a client profile** using `POST /clients` with `"externalId"` set to `"kycApproved"` on the CLIENT party (see [Minimum Payload](#client-creation--minimum-payload) above).

2. **Get the questions to ask your client** by retrieving the client details:

   `GET /clients/{clientId}`

   Review the `outstanding.questionIds` section.

3. **Send the question responses** using:

   `PATCH /clients/{clientId}`

   Include all required `questionResponses` in the request body.

4. **Get the attestation document** from the client details (the attestation document ID will be in the `outstanding.attestationDocumentIds` section).

5. **Send attestations to J.P. Morgan** using:

   `PATCH /clients/{clientId}`

   Include the attestation in the request body.

6. **Complete the onboarding process** by triggering verification:

   `POST /clients/{clientId}/verifications`

7. **Check client status** — verify the client state transitions to `APPROVED`:

   `GET /clients/{clientId}`

### Scenario 2: Emulate Document Request for a Client (Organization)

**Objective:**
Verify the API flow when additional documents are requested for a party during the client KYC process.

**Steps:**

1. Use `POST /clients`, where the party with role `CLIENT` has `"externalId"` set to `"kycDocRequest"`.

   **Request Payload Example:**

   ```json
   {
     "parties": [
       {
         "partyType": "ORGANIZATION",
         "roles": ["CLIENT"],
         "externalId": "kycDocRequest",
         "organizationDetails": {
           "organizationType": "LIMITED_LIABILITY_COMPANY",
           "organizationName": "Test Client",
           "countryOfFormation": "US"
         }
       }
     ],
     "products": ["EMBEDDED_PAYMENTS"]
   }
   ```

2. Once the client is created, verify that the client state is `NEW`. Then, answer the outstanding questions and submit an attestation using `PATCH /clients/{clientId}`.

3. Verify that the `outstanding` section is now empty, indicating all questions have been answered and attestation submitted.

4. Trigger the KYC process using `POST /clients/{clientId}/verifications`.

5. Verify that the client state changes to `INFORMATION_REQUESTED`:

   `GET /clients/{clientId}`

   Obtain the list of document requests from the `outstanding.documentRequestIds` section.

   Alternatively, retrieve all document requests for the client:

   `GET /document-requests?clientId={clientId}`

6. Get the document request details:

   `GET /document-requests/{documentRequestId}`

7. Upload the document:

   `POST /documents`

8. Submit the completed document request for review:

   `POST /document-requests/{documentRequestId}/submit`

9. Verify that `outstanding.documentRequestIds` is now empty and that the client state transitions to `APPROVED`.

   > [!NOTE]
   > In Production, the client `status` will move to `REVIEW_IN_PROGRESS` as the J.P. Morgan Ops team reviews uploaded documents, then the client state will move to `APPROVED`.

### Scenario 3: Emulate Document Request for a Related Party

**Objective:**
Verify the API flow when additional documents are requested for a related party during the client's KYC process.

**Steps:**

1. Use `POST /clients`, where a party with role `CONTROLLER` or `BENEFICIAL_OWNER` has `"externalId"` set to `"kycDocRequest"`.

   **Request Payload Example:**

   ```json
   {
     "parties": [
       {
         "partyType": "ORGANIZATION",
         "roles": ["CLIENT"],
         "organizationDetails": {
           "organizationType": "LIMITED_LIABILITY_COMPANY",
           "organizationName": "Test Client",
           "countryOfFormation": "US"
         }
       },
       {
         "partyType": "INDIVIDUAL",
         "roles": ["CONTROLLER"],
         "externalId": "kycDocRequest",
         "individualDetails": { ... }
       }
     ],
     "products": ["EMBEDDED_PAYMENTS"]
   }
   ```

2. Complete the outstanding questions and submit attestation using `PATCH /clients/{clientId}`. Then start KYC using `POST /clients/{clientId}/verifications`.

3. Verify the client state changes to `INFORMATION_REQUESTED`:

   `GET /clients/{clientId}`

4. Get the document request ID for the related party:

   `GET /parties/{partyId}`

   In the `validationResponse` section, locate the `documentRequestIds` that need to be satisfied.

   Alternatively: `GET /document-requests?partyId={partyId}`

5. Get the document request details:

   `GET /document-requests/{documentRequestId}`

6. Upload a document:

   `POST /documents`

7. Submit the document request:

   `POST /document-requests/{documentRequestId}/submit`

8. Verify that the `documentRequestIds` array is empty in the party's `validationResponse` section. Confirm the client state transitions to `APPROVED`.

   > [!NOTE]
   > In Production, the client `status` will move to `REVIEW_IN_PROGRESS` as the J.P. Morgan Ops team reviews uploaded documents before transitioning to `APPROVED`.

### Scenario 4: Emulate Document Request for Client and Multiple Related Parties

**Objective:**
Verify the API flow when additional documents are requested for multiple related parties during the client's KYC process.

**Steps:**

1. Use `POST /clients`, where parties with roles `CLIENT`, `CONTROLLER`, and `BENEFICIAL_OWNER` all have `"externalId"` set to `"kycDocRequest"`.

   **Request Payload Example:**

   ```json
   {
     "parties": [
       {
         "partyType": "ORGANIZATION",
         "roles": ["CLIENT"],
         "externalId": "kycDocRequest",
         "organizationDetails": {
           "organizationType": "LIMITED_LIABILITY_COMPANY",
           "organizationName": "Test Client",
           "countryOfFormation": "US"
         }
       },
       {
         "partyType": "INDIVIDUAL",
         "roles": ["CONTROLLER"],
         "externalId": "kycDocRequest",
         "individualDetails": { ... }
       },
       {
         "partyType": "INDIVIDUAL",
         "roles": ["BENEFICIAL_OWNER"],
         "externalId": "kycDocRequest",
         "individualDetails": { ... }
       }
     ],
     "products": ["EMBEDDED_PAYMENTS"]
   }
   ```

2. Complete the outstanding questions and submit attestation using `PATCH /clients/{clientId}`. Then start KYC using `POST /clients/{clientId}/verifications`.

3. Verify the client state changes to `INFORMATION_REQUESTED`:

   `GET /clients/{clientId}`

   Note that multiple related parties appear in the `outstanding.partyIds` block.

4. For each related party, get the document request ID:

   `GET /parties/{partyId}`

   Alternatively, retrieve all document requests for a client and all related parties:

   `GET /document-requests?clientId={clientId}&includeRelatedParty=true`

5. For each related party, fetch the document request details:

   `GET /document-requests/{documentRequestId}`

6. Upload a document for each request:

   `POST /documents`

7. Submit each document request:

   `POST /document-requests/{documentRequestId}/submit`

8. Verify that `outstanding.documentRequestIds` is empty for the client and the client state transitions to `APPROVED`.

   > [!NOTE]
   > In Production, the client `status` will initially change to `REVIEW_IN_PROGRESS` as the J.P. Morgan Ops team reviews the uploaded documents before final approval.
   >
   > Completing a document request for any party may resolve the document request for other related parties if they have the same `externalId` attribute value.

### Scenario 5: Simulate KYC Approval

**Objective:**
Verify the flow when KYC is approved.

**Steps:**

1. Use `POST /clients` to create a client with the CLIENT party `"externalId"` set to `"kycApproved"` (see [Minimum Payload](#client-creation--minimum-payload)).

2. Complete questions and attestation, then trigger verification:

   `POST /clients/{clientId}/verifications`

3. Verify the client state transitions to `APPROVED`:

   `GET /clients/{clientId}`

### Scenario 6: Simulate KYC Decline

**Objective:**
Verify the flow when KYC is declined.

**Steps:**

1. Use `POST /clients` to create a client where one of the parties has an address with `"country": "IR"`. This triggers a KYC decline after verification. Do **not** set a special `externalId` magic value.

2. Once the client is created, verify the state is `NEW`. Complete the outstanding questions and submit attestation.

3. Trigger the verification process:

   `POST /clients/{clientId}/verifications`

4. Verify the client state transitions to `DECLINED`:

   `GET /clients/{clientId}`

---

## Guide 2: Add an Account to Manage Funds

> **Portal Guide:** [Embedded Payments – Add an Account](https://developer.payments.jpmorgan.com/docs/embedded-finance-solutions/embedded-payments/capabilities/embedded-payments/how-to/add-account)

**Prerequisite:** Client must be in `APPROVED` state.

### Scenario 7: Create and Manage a Client Account

**Objective:**
Verify creating a Limited DDA Payments account and retrieving account details.

**Steps:**

1. Create a client account of type `LIMITED_DDA_PAYMENTS`.
2. Retrieve all accounts for the client and verify the new account appears in the list.
3. Get the balance of the client account.
4. Check the status of the client account.

---

## Guide 3: Close an Account

> **Portal Guide:** [Embedded Payments – Close an Account](https://developer.payments.jpmorgan.com/docs/embedded-finance-solutions/embedded-payments/capabilities/embedded-payments/how-to/close-account)

**Prerequisite:** Client must be in `APPROVED` state with an active account that has a zero balance.

### Scenario 8: Close a Client Account

**Objective:**
Verify closing a client account and confirming the account status is updated.

**Steps:**

1. Ensure the client account balance is zero (transfer or withdraw any remaining funds).
2. Request to close the client account.
3. Verify the account status transitions to `CLOSED`.
4. Confirm that no further transactions can be initiated on the closed account.

---

## Guide 4: Link an External Bank Account

> **Portal Guide:** [Embedded Payments – Link a Bank Account](https://developer.payments.jpmorgan.com/docs/embedded-finance-solutions/embedded-payments/capabilities/embedded-payments/how-to/add-linked-account)

**Prerequisite:** Client must be in `APPROVED` state with an active account.

> [!IMPORTANT]
> The client name / controller name **must match** the owner name in the linked account details for successful account linkage. Ensure the client is onboarded using the owner names listed in the tables below.

### Mock Linked Account Data — With Microdeposit Verification

| Account Number | Routing Number | Clearing ID Type | Type | Owner Name | Deposit 1 | Deposit 2 |
|---------------|---------------|-----------------|------|-----------|-----------|-----------|
| 111291262181 | 021000021 | ABA | Individual | Monica Gellar | $0.03 | $0.09 |

### Mock Linked Account Data — Microdeposit Not Required

| Account Number | Routing Number | Type | Owner Name |
|---------------|---------------|------|-----------|
| 3990388854 | 122199983 | Individual | Jamie Cooper |

### Scenario 9: Link, Verify, and Remove an External Bank Account

**Objective:**
Verify the full lifecycle of linking an external bank account via ACH.

**Steps:**

1. Add the client's linked account for ACH.
2. Verify the linked account with microdeposits (using the mock data above).
3. Check the status of the linked account.
4. Remove the linked account.

---

## Guide 5: Receive Funds & Payout Funds

> **Portal Guide:** [Embedded Payments – Transfer & Payout](https://developer.payments.jpmorgan.com/docs/embedded-finance-solutions/embedded-payments/capabilities/embedded-payments/how-to/transfer-payout)

**Prerequisite:** Client must be in `APPROVED` state with an active account and linked account.

### Scenario 10: Receive and Payout Funds

**Objective:**
Verify receiving funds and making payouts through multiple payment rails.

**Steps:**

1. **Receive funds** to the client's account — contact J.P. Morgan to initiate mock inbound transactions in Sandbox.
2. **Make payouts** to the client's linked account. Test with the following payment methods:
   - **ACH**
   - **RTP** (Real-Time Payments)
   - **Wire**
3. **Make payouts** to your platform's linked account (Treasury). Identify the account ID using the list accounts operation.
4. **Add a recipient** (client's account) and make payouts to it.
5. **Strip fees/commissions** to your platform's management account. This may involve moving a percentage of funds from a bulk settlement into the Processing Account or from a client's account via transfer.

---

## Guide 6: Manage and Display Transactions

> **Portal Guide:** [Embedded Payments – Display Transactions](https://developer.payments.jpmorgan.com/docs/embedded-finance-solutions/embedded-payments/capabilities/embedded-payments/how-to/manage-display-transactions-v2)

**Prerequisite:** Client must have an active account with transaction history.

### Scenario 11: Query and Filter Transactions

**Objective:**
Verify transaction querying, filtering, and balance display capabilities.

**Steps:**

1. Get the balance of the client's account.
2. Show transactions for the client's account.
3. Filter transactions for a specific date range.
4. Filter transactions by transaction type (e.g., ACH).
5. Filter transactions for linked account payouts.
6. Show a running balance for the client account.
7. Show payments into and out of the client account.
8. Show the status of a specific transaction.

---

## Guide 7: Manage Notifications (Webhooks)

> **Portal Guide:** [Embedded Payments – Manage Notifications](https://developer.payments.jpmorgan.com/docs/embedded-finance-solutions/embedded-payments/capabilities/notification-subscriptions/how-to/notifications)

### Scenario 12: Webhook Subscription Lifecycle

**Objective:**
Verify creating, updating, retrieving, and confirming webhook subscriptions.

**Steps:**

1. Create a new webhook subscription.
2. Update the status of an existing webhook.
3. Get a list of your webhook subscriptions.
4. See a specific webhook subscription.
5. Confirm receipt of a webhook by responding with a `200 OK` status to the webhook delivery.

---

## Guide 8: Initiate Direct Debits

> **Portal Guide:** [Embedded Payments – Transfer & Payout (Direct Debits)](https://developer.payments.jpmorgan.com/docs/embedded-finance-solutions/embedded-payments/capabilities/embedded-payments/how-to/transfer-payout)

**Prerequisite:** Client must have an active account and a verified linked account.

### Scenario 13: Initiate a Direct Debit

**Objective:**
Verify initiating a direct debit to pull funds from a linked account.

**Steps:**

1. Initiate a direct debit to pull funds from the client's linked external account.

---

## Guide 9: Managing Negative Balances & Alerts

> **Portal Guide:** [Embedded Payments – Manage Negative Balances](https://developer.payments.jpmorgan.com/docs/embedded-finance-solutions/embedded-payments/capabilities/embedded-payments/how-to/managing-negative-balances)

### Scenario 14: Negative Balances

**Objective:**
Verify automated money movement handling for negative balances.

**Steps:**

1. Search automated money movements that address negative balances for the client account.

### Scenario 15: Alerts for Negative Balances and Program Limits

**Objective:**
Verify that the platform receives the correct alert notifications.

**Steps:**

1. Receive notification when account remains in negative balance for 30, 59, or 60 days — expect webhook event type `ACCOUNT_OVERDRAWN`.
2. Receive notification when approaching or exceeding program-level limits — expect webhook event type `THRESHOLD_LIMIT`.
