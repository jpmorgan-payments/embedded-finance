# Embedded Payments Test Catalog

This document describes test cases created to guide Sandbox testing of Document Upload using Payment Edge routing.

> [!NOTE]
> All data is mock data and should not be used in production.

Testing key scenarios for complex client onboarding flows is essential before going live to ensure a seamless and error-free experience.

Before testing, ensure the following prerequisites are met:

- Payment Edge Sandbox environment endpoint:  
  `https://api-sandbox.payments.jpmorgan.com/onboarding/v1`
- Configure mTLS certificate that is used for current CAT environment testing via the Open Banking Gateway.
- Magic values, such as `"externalId"` mentioned in the scenarios below, must be preliminarily set up by the corresponding J.P. Morgan implementation team.

## Scenario 1: Emulate Document Request for a Client as Organization

**Objective:**  
Verify the API flow when additional documents are requested for a party during the client KYC process.

**Steps:**

1. Use the `POST https://api-sandbox.payments.jpmorgan.com/onboarding/v1/clients` endpoint, where a party with role `CLIENT` has an `"externalId"` set to `"docRequested"`.

   **Request Payload Example:**

   ```json
   {
       "parties" : [
        {
            "partyType": "ORGANIZATION",
            "roles": ["CLIENT"],
            "externalId": "docRequested",
            "organizationDetails":{
                ...
            },
            ...
        }
        ...
       ]
   }
   ```

2. Once the client is created, verify that the client state is `NEW`. Then, answer the outstanding questions and submit an attestation. Use the `PATCH https://api-sandbox.payments.jpmorgan.com/onboarding/v1/clients/{clientId}` endpoint to submit answers.

3. Notice that the `outstanding` section is now empty, indicating that all questions have been answered and the attestation has been submitted.

4. Use the `POST https://api-sandbox.payments.jpmorgan.com/onboarding/v1/clients/{clientId}/verifications` endpoint to trigger the KYC process.

5. Verify that the client state changes to `INFORMATION_REQUESTED` using the endpoint:

   `GET https://api-sandbox.payments.jpmorgan.com/onboarding/v1/clients/{clientId}`

   and obtain a list of document requests from the `outstanding.documentRequestIds` section within the client response object.

   Alternatively, you can retrieve all document requests for a client using the following endpoint:

   `GET https://api-sandbox.payments.jpmorgan.com/onboarding/v1/document-requests?clientId={clientId}`

6. Get the document request details using:

   `GET https://api-sandbox.payments.jpmorgan.com/onboarding/v1/document-requests/{documentRequestId}`

   for the root party.

7. Send the document using:

   `POST https://api-sandbox.payments.jpmorgan.com/onboarding/v1/documents`

8. Complete the document requests and submit for review using:

   `POST https://api-sandbox.payments.jpmorgan.com/onboarding/v1/document-requests/{documentRequestId}/submit`

9. Verify that `outstanding.documentRequestIds` is now empty, indicating that the document request has been satisfied for the root party. Also, verify that the client state transitions to `APPROVED` after the document has been uploaded and the document request has been submitted.

## Scenario 2: Emulate Document Request for a Related Party

**Objective:**  
Verify the API flow when additional documents are requested for a related party during the client's KYC process.

**Steps:**

1. Use the `POST https://api-sandbox.payments.jpmorgan.com/onboarding/v1/clients` endpoint, where a party with role `CONTROLLER` or `BENEFICIAL_OWNER` has an `"externalId"` set to `"docRequested"`.

   **Request Payload Example:**

   ```json
   {
       "parties" : [
        {
            "partyType": "INDIVIDUAL",
            "roles": ["CONTROLLER"],
            "externalId": "docRequested",
            "individualDetails":{
                ...
            },
            ...
        }
        ...
       ]
   }

   ```

2. Once the client is created, verify that the client state is `NEW`. Then, answer the outstanding questions and submit an attestation.

   - Use the `PATCH https://api-sandbox.payments.jpmorgan.com/onboarding/v1/clients/{clientId}` endpoint.
   - Start the KYC process using `POST https://api-sandbox.payments.jpmorgan.com/onboarding/v1/clients/{clientId}/verifications`.

3. Verify that the client state changes to `INFORMATION_REQUESTED` using:

   `GET https://api-sandbox.payments.jpmorgan.com/onboarding/v1/clients/{clientId}`

4. Get the document request id for the related party using:

   `GET https://api-sandbox.payments.jpmorgan.com/onboarding/v1/parties/{partyId}`

   In the `validationResponse` section, locate the `documentRequestIds` that need to be satisfied for the related party.

   Alternatively, you can retrieve all document requests for a related party using the following endpoint:

   `GET https://api-sandbox.payments.jpmorgan.com/onboarding/v1/document-requests?partyId={partyId}`

   This provides a list of document requests associated with the specified party.

5. Get the document request details using:

   `GET https://api-sandbox.payments.jpmorgan.com/onboarding/v1/document-requests/{documentRequestId}`

6. Upload a document using:

   `POST https://api-sandbox.payments.jpmorgan.com/onboarding/v1/documents`

7. Submit the document request using:

   `POST https://api-sandbox.payments.jpmorgan.com/onboarding/v1/document-requests/{documentRequestId}/submit`

8. Once all document requests are satisfied, verify that the `documentRequestIds` array is now empty in the party's `validationResponse` section, indicating that all required documents have been provided. Also, confirm that the client state transitions to `APPROVED` after the documents have been uploaded and the requests submitted.

## Scenario 3: Emulate Document Request for Client and Multiple Related Parties

**Objective:**  
Verify the API flow when additional documents are requested for multiple related parties during the client's KYC process.

**Steps:**

1. Use the `POST https://api-sandbox.payments.jpmorgan.com/onboarding/v1/clients` endpoint, where parties with roles `CLIENT`, `CONTROLLER`, and `BENEFICIAL_OWNER` have an `"externalId"` set to `"docRequested"`.

   **Request Payload Example:**

   ```json
   {
     "parties": [
       {
         "partyType": "ORGANIZATION",
         "roles": ["CLIENT"],
         "externalId": "docRequested",
         ...
       },
       {
         "partyType": "INDIVIDUAL",
         "roles": ["CONTROLLER"],
         "externalId": "docRequested",
         ...
       },
       {
         "partyType": "INDIVIDUAL",
         "roles": ["BENEFICIAL_OWNER"],
         "externalId": "docRequested",
         ...
       }
     ],
     ...
   }
   ```

2. Once the client is created, verify that the client state is `NEW`. Then, answer the outstanding questions and submit an attestation.

   - Use the `PATCH https://api-sandbox.payments.jpmorgan.com/onboarding/v1/clients/{clientId}` endpoint.
   - Start the KYC process using `POST https://api-sandbox.payments.jpmorgan.com/onboarding/v1/clients/{clientId}/verifications`.

3. Verify that the client state changes to `INFORMATION_REQUESTED` using:

   `GET https://api-sandbox.payments.jpmorgan.com/onboarding/v1/clients/{clientId}`

   Additionally, note that multiple related parties appear in the `outstanding.partyIds` block.

4. For each related party, get the document request id using:

   `GET https://api-sandbox.payments.jpmorgan.com/onboarding/v1/parties/{partyId}`

   In the `validationResponse` section, find the `documentRequestIds` that must be satisfied.

   Alternatively, you can retrieve all document requests for a client and all related parties using the following endpoint:

   `GET https://api-sandbox.payments.jpmorgan.com/onboarding/v1/document-requests?clientId={clientId}&includeRelatedParty=true`

5. For each related party, fetch the document request details using:

   `GET https://api-sandbox.payments.jpmorgan.com/onboarding/v1/document-requests/{documentRequestId}`

6. Upload a document for each request using:

   `POST https://api-sandbox.payments.jpmorgan.com/onboarding/v1/documents`

7. Submit each document request using:

   `POST https://api-sandbox.payments.jpmorgan.com/onboarding/v1/document-requests/{documentRequestId}/submit`

8. Once all document requests are satisfied, verify that `outstanding.documentRequestIds` is empty for the client, indicating that all required documents have been provided. Also, ensure the client state transitions to `APPROVED` after the document upload and submission.

## Scenario 4: Simulate KYC Approval

**Objective:**  
Verify the flow when KYC is approved.

**Steps:**

1. Use the `POST https://api-sandbox.payments.jpmorgan.com/onboarding/v1/clients` endpoint to create a client with a party object where `externalId` is set to `kycApproved`.

   **Request Payload Example:**

   ```json
   {
       "parties" : [
        {
            "partyType": "ORGANIZATION",
            "roles": ["CLIENT"],
            "externalId": "kycApproved",
            "organizationDetails":{
                ...
            },
            ...
        }
        ...
       ]
   }
   ```

   Alternatively, use the `POST https://api-sandbox.payments.jpmorgan.com/onboarding/v1/parties/{partyId}` endpoint to update an existing party and set `externalId` to `kycApproved`.

2. Trigger the verification process using the `POST https://api-sandbox.payments.jpmorgan.com/onboarding/v1/clients/{clientId}/verifications` endpoint.

3. Verify that the client state transitions to `APPROVED` using:

   `GET https://api-sandbox.payments.jpmorgan.com/onboarding/v1/clients/{clientId}`

## Scenario 5: Simulate KYC Decline

**Objective:**  
Verify the flow when KYC is declined.

**Steps:**

1. Use the `POST https://api-sandbox.payments.jpmorgan.com/onboarding/v1/clients` endpoint to create a client with a party object where `externalId` is set to `kycDeclined`.

   **Request Payload Example:**

   ```json
   {
       "parties" : [
        {
            "partyType": "ORGANIZATION",
            "roles": ["CLIENT"],
            "externalId": "kycDeclined",
            "organizationDetails":{
                ...
            },
            ...
        }
        ...
       ]
   }
   ```

   Alternatively, use the `POST https://api-sandbox.payments.jpmorgan.com/onboarding/v1/parties/{partyId}` endpoint to update an existing party and set `externalId` to `kycDeclined`.

2. Trigger the verification process using the `POST https://api-sandbox.payments.jpmorgan.com/onboarding/v1/clients/{clientId}/verifications` endpoint.

3. Verify that the client state transitions to `DECLINED` using:

   `GET https://api-sandbox.payments.jpmorgan.com/onboarding/v1/clients/{clientId}`
