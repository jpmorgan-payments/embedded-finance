# Approved Client Maintenance UI/UX Recipe

> **Draft - under review.** Open items are tracked in [Remaining End-to-End Questions](#remaining-end-to-end-questions).

## Introduction

An already approved client may need to request another product or maintain its organization and related-party information. The API exposes an approved client snapshot, client-level product proposals, and sparse party proposals, but it does not expose a complete "future client" object or field-level diff.

This recipe is an implementation companion to the official [Update party information](https://developer.payments.jpmorgan.com/docs/commerce/optimization-protection/capabilities/digital-onboarding/how-to/update-party) guide and the Digital Onboarding OpenAPI specification. Those sources define the supported API behavior. This recipe adds technical design guidance, implementation invariants, projection options, UX patterns, failure handling, and test recommendations for teams building the experience.

A typical journey allows a client representative to:

1. Retrieve the approved client and all approved parties.
2. Request another product, add a related party, update supported party information, or remove a related party.
3. Refetch the approved client, including client-level product proposal state, and sparse party maintenance proposals.
4. Derive approved and proposed presentation models without changing the approved baseline.
5. Review changed fields with request provenance.
6. Resolve questions returned before attestation.
7. Present and submit required attestations.
8. Request verification and represent `202 Accepted` as asynchronous processing.
9. Resolve later questions and post-attestation document requests.
10. Observe later status changes through refetches or webhooks, then account for the documented 24-48 hour delay before approved values may appear in client responses.

The suggested workflow can be adapted to a host platform's navigation, state management, and design system. The runnable showcase demonstrates one option, not a required page structure.

## Optional Runnable UX Illustration

> **Non-normative example.** This section illustrates one possible host UX. Implementers are not required to use this scenario, page structure, navigation, or interaction sequence.

The runnable showcase applies the generic lifecycle to a specific Limited DDA product request and related-party disclosure journey. It demonstrates the recipe's lifecycle and projection safeguards through the following example sequence:

1. Retrieve the approved client and all approved parties.
2. Confirm that at least five minutes have elapsed since the first product verification was accepted and that the original product is `APPROVED`.
3. Show the existing approval for `EMBEDDED_PAYMENTS / LIMITED_DDA_PAYMENTS` and request the additional `EMBEDDED_PAYMENTS / LIMITED_DDA` sub-product.
4. Ask whether anything changed since the previous approval.
5. If the answer is no, continue with only the sub-product addition. If the answer is yes, collect every applicable supported organization and related-party disclosure.
6. Refetch the approved client and every maintenance page.
7. Reconcile the separate client-level product proposal and sparse party proposals without changing the approved baseline.
8. Resolve two new-party due-diligence questions returned before attestation.
9. Present and submit the pre-verification attestation.
10. Refetch, rebuild, and review the complete change set with request provenance.
11. Request verification and represent `202 Accepted` as asynchronous processing for the product and party lifecycles.
12. Handle later `INFORMATION_REQUESTED` requirements by showing two legal-name-change questions and a post-attestation document request linked to the added party.
13. Observe each lifecycle through the usual onboarding event model and refetches, then refetch the client throughout the 24-48 hour publication window.

## Relationship to the Digital Onboarding Flow

This recipe follows the section-oriented model described in [`DIGITAL_ONBOARDING_FLOW_RECIPE.md`](./DIGITAL_ONBOARDING_FLOW_RECIPE.md). It extends the same client data, overview, review, attestation, and verification concepts into the approved-client lifecycle.

| Concern            | Digital onboarding flow                          | Approved client maintenance                                                                                 |
| ------------------ | ------------------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| Entry state        | New or in-progress client                        | Client whose onboarding status is `APPROVED`                                                                |
| Primary data       | `GET /clients/{id}` and outstanding requirements | `GET /clients/{id}` plus sparse maintenance proposals                                                       |
| Main navigation    | Overview of business, people, and required tasks | Profile overview with changed sections and a change-review task                                             |
| Maintenance writes | Create or update onboarding parties and products | Use the operation-specific `PATCH /clients`, `POST /parties`, or sparse `PATCH /parties/{partyId}` contract |
| Review             | Review the collected onboarding profile          | Compare the approved profile with proposed changes                                                          |
| Attestation        | Complete outstanding attestation documents       | Review and submit any maintenance attestation requirements                                                  |
| Verification       | Start initial due diligence processing           | Submit maintenance changes for asynchronous due diligence review                                            |
| Completion signal  | Observe client onboarding status                 | Refetch the approved client and observe maintenance status                                                  |

The reference implementation exposes this lifecycle through a standalone maintenance route without changing `OnboardingFlow.tsx`. A host can instead extend its existing onboarding overview, use a dedicated maintenance area, or present request-specific tasks.

## References

- [Update party information](https://developer.payments.jpmorgan.com/docs/commerce/optimization-protection/capabilities/digital-onboarding/how-to/update-party) - normative lifecycle, supported update scenarios, request grouping, cancellation, and publication timing.
- [Digital Onboarding API reference](https://developer.payments.jpmorgan.com/api/commerce/optimization-protection/digital-onboarding/digital-onboarding) - OpenAPI v1.4.1.
- [Downloaded Digital Onboarding OpenAPI v1.4.1](../api-specs/commerce-digital-onboarding-1.4.1.yaml) - exact Commerce specification used by the runnable showcase.
- [Get maintenance requests by request ID](https://developer.payments.jpmorgan.com/api/commerce/optimization-protection/digital-onboarding/digital-onboarding#/operations/smbdo-getAllMaintenanceRequestsByRequestId).
- [Complete onboarding steps](https://developer.payments.jpmorgan.com/docs/commerce/optimization-protection/capabilities/digital-onboarding/how-to/complete-onboarding-steps).
- [Present attestations](https://developer.payments.jpmorgan.com/docs/commerce/optimization-protection/capabilities/digital-onboarding/how-to/present-attestations).

Use the local v1.4.1 Commerce model subsets. Do not use the generated `embedded-components/src/api` models for these maintenance resources because those models come from different Embedded Payments specifications.

## Prerequisites and Supported Updates

Enforce these preconditions:

- The client must already have `APPROVED` status.
- Require an explicit country and legal-entity eligibility matrix. Deny maintenance when the client has no exact configured match.
- Every in-scope approved `EMBEDDED_PAYMENTS / LIMITED_DDA_PAYMENTS` client can request `EMBEDDED_PAYMENTS / LIMITED_DDA`.
- Only one open party-maintenance `requestId` is supported per client.
- Multiple party PATCH calls made while that request is `NEW` are bundled under the same `requestId`.
- Product and party maintenance have separate submission, cancellation, status, and `requestId` lifecycles. The host may coordinate their presentation but has no required cross-lifecycle orchestration contract.
- Send only fields whose values changed; do not replay a complete party object.
- Treat each maintenance party as a presence-based delta: an absent field is unchanged. A present nested object or array replaces that complete logical field.
- Repeated PATCHes for one party are coalesced into one proposal record. When the same field is updated repeatedly, the latest update wins.
- After verification changes the request to `REVIEW_IN_PROGRESS`, further edits are not allowed.
- Enforce a five-minute processing lead time after the first product verification is accepted. Do not submit a product enhancement, product update, or second verification until the lead time has elapsed and a fresh client response reports the original product as `APPROVED`.

Model these approved-client maintenance operations from the published guide:

- change the client's legal name or doing-business-as name;
- change the client's address;
- add a related party;
- remove a related party by setting `active: false`; and
- change a related party's first, middle, or last name, or birth date.

Configure the showcase with this product context:

- the approved client already has `EMBEDDED_PAYMENTS / LIMITED_DDA_PAYMENTS`;
- the client requests `EMBEDDED_PAYMENTS / LIMITED_DDA` as an additional sub-product by sending a client product update with `action: ADD`; and
- Merchant Services is not part of this scenario.

Keep the “Has anything changed since your previous approval?” answer in host state; do not send it to the API. A no answer creates no party writes. A yes answer reveals the supported disclosure controls.

Build form controls and request DTOs from this allowlist. Parse the broader OAS response model, but do not expose other OAS properties as editable maintenance fields.

## High-Level Flow

```mermaid
sequenceDiagram
    participant U as Approved client representative
    participant UX as Host maintenance UX
    participant API as Digital Onboarding API
    participant JPMC as Asynchronous review

    UX->>API: GET /clients/{clientId}
    API-->>UX: Approved ClientResponse with parties
    U->>UX: Request the additional Limited DDA sub-product
    opt Add Limited DDA
      UX->>API: PATCH /clients/{clientId} with productDetails ADD
    end
    UX->>U: Has anything changed since the previous approval?
    alt No changes to disclose
      U->>UX: Continue with the sub-product addition only
    else Changes to disclose
      opt Add a related party
        UX->>API: POST /parties with immediate parentPartyId
      end
      opt Update or remove a party
        UX->>API: PATCH /parties/{partyId} with sparse fields or active:false
      end
    end
    Note over UX,API: Party draft operations share one NEW party-maintenance requestId
    Note over UX,API: Product and party requests retain separate lifecycle and requestId envelopes
    par Refresh approved baseline
        UX->>API: GET /clients/{clientId}
        API-->>UX: Approved ClientResponse
    and Discover proposals
        UX->>API: GET /maintenance-requests?clientId={clientId}
        API-->>UX: ListKycPartyUpdateRequests
    end
    UX->>UX: Track product and party envelopes separately, then derive a ChangeSet
    U->>UX: Review approved versus proposed values
    opt Questions returned before attestation
      UX->>API: GET /questions?questionIds={ids}
      UX->>U: Show and collect returned answers
      UX->>API: PATCH /clients/{clientId} with questionResponses
    end
    loop Every outstanding attestation
      UX->>U: Present attestation document
      UX->>API: PATCH /clients/{clientId} with addAttestations
    end
    UX->>API: GET client and maintenance data, then rebuild ChangeSet
    UX->>UX: Block if supported outstanding work or reviewed values changed
    UX->>API: POST /clients/{clientId}/verifications with {}
    API-->>UX: 202 ClientVerificationResponse
    API->>JPMC: NEW becomes REVIEW_IN_PROGRESS and editing locks
    JPMC-->>UX: Later product and party-maintenance status updates
    opt INFORMATION_REQUESTED
      UX->>API: GET /clients/{clientId}
      API-->>UX: New outstanding questionIds and post-attestation documentRequestIds
      UX->>API: GET /questions?questionIds={ids}
      UX->>U: Show and collect returned answers
      UX->>API: PATCH /clients/{clientId} with questionResponses
      UX->>API: GET /document-requests/{documentRequestId}
      UX->>U: Show party-linked document request
      UX->>API: POST /documents
      UX->>API: POST /document-requests/{documentRequestId}/submit
      Note over UX,API: Questions may occur before or after attestation; document requests occur only after attestation
    end
    Note over UX,API: Approved values may take 24-48 hours to appear in GET /clients/{id}
```

`GET /maintenance-requests/{requestId}` complements the list call. The list call discovers requests for a client; the request-scoped call retrieves all party proposals associated with one `requestId`.

## Endpoint responsibilities

Shared client, party, verification, question, document, and attestation operations retain the responsibilities defined by the [Digital Onboarding Flow](./DIGITAL_ONBOARDING_FLOW_RECIPE.md). This complementary recipe defines only the maintenance-request operations introduced for approved-client maintenance.

| Operation                                                | Contract role in this recipe                              | Important response behavior                                                                            |
| -------------------------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `GET /onboarding/v1/maintenance-requests?clientId={id}`  | Discover all maintenance items for the approved client    | Exactly one of `clientId` or `partyId` is required; fetch every page before claiming a complete review |
| `GET /onboarding/v1/maintenance-requests/{requestId}`    | Retrieve all party proposals grouped under one request ID | Returns the same list wrapper, not a distinct top-level request resource                               |
| `DELETE /onboarding/v1/maintenance-requests/{requestId}` | Cancel a `NEW` request, optionally for one `partyId`      | Returns the affected items with terminal `TERMINATED` status                                           |

Generate one UUID v4 `Idempotency-Key` for each logical mutation and reuse that key only for retries of that same mutation.

## Maintenance response model

The OAS defines maintenance metadata on each returned party:

```ts
type KycUpdateRequestStatus =
  | 'NEW'
  | 'REVIEW_IN_PROGRESS'
  | 'INFORMATION_REQUESTED'
  | 'APPROVED'
  | 'DECLINED'
  | 'TERMINATED';

type KycUpdateRequestAction = 'ADD' | 'MODIFY' | 'DELETE';

type KycUpdateRequest = {
  status?: KycUpdateRequestStatus;
  action?: KycUpdateRequestAction;
  requestId?: string;
  submittedAt?: string; // date-time
};

type ListKycPartyUpdateRequests = {
  parties?: Array<PartyResponse & { updateRequest?: KycUpdateRequest }>;
  metadata?: PageMetaData;
};
```

Read product proposal metadata from `ClientResponse.productDetails` and `ClientResponse.updateRequest`. Do not synthesize a party proposal for client-owned product update metadata:

```ts
type ClientProductUpdate = {
  productDetails: Array<{
    product: 'EMBEDDED_PAYMENTS';
    subProduct: 'LIMITED_DDA';
    action: 'ADD';
  }>;
};

type ClientResponse = {
  productDetails?: ProductDetailsStatusItem[];
  updateRequest?: KycUpdateRequest;
  // other persisted client fields
};

type ProductChange = {
  product: ClientProduct;
  subProduct?: SubProductType;
  requestedAction: 'ADD' | 'REMOVE'; // retained from the submitted command
  onboardingStatus: ProductDetailsOnboardingStatus;
  source: KycUpdateRequest;
};
```

Apply these response rules:

- A response item is a sparse party proposal, not a `MaintenanceRequest` aggregate.
- Treat a maintenance party as a presence-based delta. An absent property leaves the approved value unchanged; a present property supplies the proposed value.
- Replace a present nested object or array as one complete logical field. Do not recursively merge nested members or append array entries during projection.
- Retain the raw maintenance response and overlay only allowlisted properties explicitly present in the proposal.
- Request metadata is nested under `party.updateRequest`.
- Multiple party items in the one open request share a `requestId`.
- Repeated PATCH calls for one party are coalesced into one proposal record while the request is `NEW` and continue to use that ID.
- When a field is updated more than once, apply the latest update and retain earlier update sources as superseded provenance.
- A client response and a maintenance-list response have different meanings: persisted state versus pending state.
- Validate `requestId`, `submittedAt`, `action`, and party ID before projection. Reject payloads missing required correlation data and block submission.
- The API does not return field-level `before` and `after` values.
- Product proposals come from `ClientResponse.productDetails` and the client-level `updateRequest`; party proposals come from maintenance-request responses.
- Preserve the submitted product command so the host can label the requested `ADD` or `REMOVE`; `ProductDetailsStatusItem` returns status, not action.
- Build one presentation `ChangeSet` from the product and party envelopes without joining them by `requestId`.
- After a product `onboardingStatus` or party `updateRequest.status` becomes `APPROVED`, remove that proposal from its overlay and refetch the client until its approved values are published.

## Party-maintenance lifecycle invariants

Enforce these state-machine guards:

| `updateRequest.status`  | Host may mutate draft | Host may cancel | Host action                                                                 |
| ----------------------- | --------------------- | --------------- | --------------------------------------------------------------------------- |
| No open request         | Yes                   | No              | First supported change creates a draft                                      |
| `NEW`                   | Yes                   | Yes             | Continue editing under the same `requestId`; attest and verify when ready   |
| `REVIEW_IN_PROGRESS`    | No                    | No              | Show read-only submitted changes and await an outcome                       |
| `INFORMATION_REQUESTED` | Returned tasks only   | No              | Keep ordinary draft writes disabled and show the returned tasks             |
| `APPROVED`              | No                    | No              | Exclude from proposed state and refetch until approved values are published |
| `DECLINED`/`TERMINATED` | No                    | No              | Exclude from proposed state and retain request history                      |

Fail closed if more than one open party-maintenance `requestId` is returned for one client. Preserve the payload for support diagnostics, reject the projection, and block attestation. Track each product detail's `onboardingStatus` independently.

### Resolve outstanding requirements

Resolve requirements at the lifecycle stage in which the API returns them. Resolve questions whenever `questionIds` are returned, before or after attestation. Submit required attestations before verification. Retrieve and display document requests only after attestation. Complete information requests within 30 days to prevent automatic termination.

Use `ClientResponse.outstanding` as the task-discovery surface:

1. Refetch `GET /clients/{id}` after every task write and lifecycle event.
2. Whenever `questionIds` are returned, resolve them with `GET /questions?questionIds={ids}` and submit answers through `PATCH /clients/{id}` using `questionResponses`.
3. Before verification, present every document in `attestationDocumentIds`, capture the structured attester, and submit the attestation through `PATCH /clients/{id}`.
4. Submit verification and treat `202 Accepted` as the start of asynchronous review, not approval.
5. After attestation, resolve each returned `documentRequestId` with `GET /document-requests/{id}`. For platform-uploaded requests, upload every required file with `POST /documents`, then submit the fulfilled request with `POST /document-requests/{id}/submit`.
6. Use `DocumentRequestResponse.partyId` to associate a document request with its party. Keep questions client-level because `QuestionResponse` has no `partyId`.
7. Keep the request read-only while the additional information is outstanding.

Keep every party from the approved client snapshot in its approved profile state while maintenance is open. Represent an `ADD` proposal as a new party pending approval; do not assign it an approved profile state until the maintenance proposal is approved and published in `GET /clients/{id}`.

Render each task at the stage in which it is returned. The showcase displays two new-party due-diligence questions before attestation, then two legal-name-change questions and a document request for Sam Lee afterward. The document request is linked through `DocumentRequestResponse.partyId`; the questions are labeled client-level because `QuestionResponse` has no `partyId`. These tasks are display-only in this route.

## Product and disclosure operation contracts

The showcase starts with an approved `EMBEDDED_PAYMENTS / LIMITED_DDA_PAYMENTS` seller. Read the `LIMITED_DDA` proposal from the client response and read party proposals from maintenance responses. Keep these sources distinct in the data layer and combine them only in the presentation `ChangeSet`. “Load complete story” selects the yes disclosure path and calls the same endpoint-backed functions as the individual controls; it does not inject a prepared projection.

### Request the additional Limited DDA sub-product

```http
PATCH /onboarding/v1/clients/1000010400
Idempotency-Key: 6e6d53d0-d4d4-45d3-a929-4fc735394834
Content-Type: application/json
```

```json
{
  "productDetails": [
    {
      "product": "EMBEDDED_PAYMENTS",
      "subProduct": "LIMITED_DDA",
      "action": "ADD"
    }
  ]
}
```

Keep the active `LIMITED_DDA` product detail out of the immutable approved snapshot. Add it only to the presentation-only proposed client until the request is approved and the persisted client response reflects it. Do not remove the approved `LIMITED_DDA_PAYMENTS` detail; this scenario adds a second Embedded Payments sub-product rather than replacing the first.

### Add a related party

```http
POST /onboarding/v1/parties
Idempotency-Key: 7fb4c4bb-a33f-48ec-9e9b-624c74b6b2b1
Content-Type: application/json
```

```json
{
  "parentPartyId": "2000000555",
  "partyType": "INDIVIDUAL",
  "roles": ["BENEFICIAL_OWNER"],
  "email": "sam.lee@marketplacevendor.example",
  "individualDetails": {
    "firstName": "Sam",
    "lastName": "Lee",
    "countryOfResidence": "US"
  }
}
```

Set `parentPartyId` to the approved client organization's root `partyId`, not the client ID. Preserve the returned `ADD` proposal as pending until approval. Collect the FinCEN attestation required for `BENEFICIAL_OWNER` and `CONTROLLER` additions.

### Update a party sparsely

The payload below demonstrates sparse request construction.

```http
PATCH /onboarding/v1/parties/2000000556
Idempotency-Key: f4ac3d31-c373-4280-97f4-c41fdcc8038d
Content-Type: application/json
```

```json
{
  "individualDetails": {
    "lastName": "Diaz"
  }
}
```

Send only changed fields. Do not replay names, addresses, roles, identifiers, or other approved values that the user did not edit.

### Remove a party

```http
PATCH /onboarding/v1/parties/2000000557
Idempotency-Key: 0c656e91-f74e-49e7-866e-4246b4e063f7
Content-Type: application/json
```

```json
{
  "active": false
}
```

Removal is a sparse party update. When the maintenance response contains `action: "MODIFY"` with `active: false`, retain `MODIFY` and derive `removesParty: true`. Do not rewrite the response action to `DELETE`.

## Example sparse update cycle

An organization name and address update can be sent without replaying the full approved party:

```http
PATCH /onboarding/v1/parties/2000000555
Idempotency-Key: 93a593fa-1747-454d-8677-a1da015e5c3d
Content-Type: application/json
```

```json
{
  "organizationDetails": {
    "dbaName": "Marketplace Vendor Collective",
    "addresses": [
      {
        "addressType": "BUSINESS_ADDRESS",
        "addressLines": ["120 Greene Street", "Floor 3"],
        "city": "New York",
        "state": "NY",
        "postalCode": "10012",
        "country": "US"
      }
    ]
  }
}
```

The `200` PATCH response keeps the current persisted values and adds request metadata. Do not read the submitted values back from this response or optimistically write them into the approved-client cache:

```json
{
  "id": "2000000555",
  "organizationDetails": {
    "organizationName": "Marketplace Vendor LLC",
    "dbaName": "Marketplace Vendor",
    "addresses": [
      {
        "addressType": "BUSINESS_ADDRESS",
        "addressLines": ["85 Mercer Street", "Suite 410"],
        "city": "New York",
        "state": "NY",
        "postalCode": "10012",
        "country": "US"
      }
    ]
  },
  "updateRequest": {
    "status": "NEW",
    "action": "MODIFY",
    "requestId": "4000001049",
    "submittedAt": "2026-04-11T10:00:00.000Z"
  }
}
```

Refetch the maintenance list and read the pending values from its sparse proposal:

```json
{
  "parties": [
    {
      "id": "2000000555",
      "organizationDetails": {
        "dbaName": "Marketplace Vendor Collective",
        "addresses": [
          {
            "addressType": "BUSINESS_ADDRESS",
            "addressLines": ["120 Greene Street", "Floor 3"],
            "city": "New York",
            "state": "NY",
            "postalCode": "10012",
            "country": "US"
          }
        ]
      },
      "updateRequest": {
        "status": "NEW",
        "action": "MODIFY",
        "requestId": "4000001049",
        "submittedAt": "2026-04-11T10:00:00.000Z"
      }
    }
  ],
  "metadata": { "page": 0, "limit": 25, "total": 1 }
}
```

## Handle the active request

Use this active-status set:

```ts
const ACTIVE_PREVIEW_STATUSES = new Set([
  'NEW',
  'REVIEW_IN_PROGRESS',
  'INFORMATION_REQUESTED',
]);
```

Before projection, collect the distinct party-maintenance `requestId` values in this set. Accept exactly one active party-maintenance request ID. Block review and submission when more than one is returned. Track the client-level product `updateRequest` separately and preserve its provenance in each product change.

Exclude `APPROVED`, `DECLINED`, and `TERMINATED` proposals from the proposed profile and actionable counts. Retain them in request history. Keep `GET /clients/{id}` authoritative for persisted values.

Handle approved proposals as follows:

1. Never overlay an `APPROVED` client or party update payload onto the approved baseline.
2. Trust `GET /clients/{id}` as the current approved state after server approval.

This avoids double-applying an already accepted update.

## Build the approved and proposed profiles

### 1. Keep the approved baseline immutable

```ts
const approvedClient = await getClient(clientId);
const maintenance = await getMaintenanceRequests({ clientId });

const proposedClient = structuredClone(approvedClient);
```

Never mutate query-cache data and never send `proposedClient` back to the API. It is a display projection only.

Before cloning, separate product details associated with an active client `updateRequest` from persisted approved product details. Add active details only to `proposedClient`, create a `ProductChange` with client-level request provenance, and leave the approved product collection unchanged.

### 2. Use an allowlisted field registry

Do not recursively merge arbitrary JSON. An explicit descriptor controls correlation, sparse presence, writes, labels, formatting, masking, and array semantics:

```ts
type PartyFieldDescriptor = {
  path: EditablePartyPath;
  label: string;
  sensitivity: 'public' | 'masked';
  isPresent: (proposal: PartyResponse) => boolean;
  read: (party: PartyResponse) => unknown;
  write: (party: PartyResponse, value: unknown) => void;
};

const descriptors: PartyFieldDescriptor[] = [
  organizationField('organizationName', 'Legal business name'),
  organizationField('dbaName', 'Doing business as'),
  organizationField('addresses', 'Business address'),
  individualField('firstName', 'First name'),
  individualField('middleName', 'Middle name'),
  individualField('lastName', 'Last name'),
  individualField('birthDate', 'Date of birth', 'masked'),
];
```

Keep editable request descriptors separate from broader response descriptors. Treat `addresses` and every other array as one logical field. A present array replaces the complete approved array; omission leaves it unchanged. Do not model append or item-level PATCH semantics.

### 3. Apply action-specific behavior

```text
fetch every maintenance page
collect active party-maintenance request IDs
stop with an integration error if more than one active party-maintenance request ID exists

for each active client product detail:
  remove it from approvedClient
  append it to proposedClient
  record a ProductChange with the client updateRequest provenance

for each maintenance party in the one active request:
  reject it from the projection if status is not a candidate status
  require requestId, submittedAt, action, and enough identity to correlate it

  if action is ADD:
    append a presentation-only party
    record request provenance for every present allowlisted field

  if action is MODIFY:
    find the approved/projected party by id
    for every allowlisted field explicitly present in the sparse proposal:
      replace that logical field in the projection
      append { requestId, submittedAt, status, proposedValue } to provenance

  if action is DELETE or a related-party removal is represented by active: false:
    remove the party from proposedClient
    retain the approved party in PartyChange so the UI can explain the removal

diff approvedClient and proposedClient across the same descriptors
emit PartyChange[] and FieldChange[] with winning and superseded sources
```

### 4. Preserve precedence and provenance

```ts
type ChangeSource = {
  requestId: string;
  submittedAt: string;
  status: 'NEW' | 'REVIEW_IN_PROGRESS' | 'INFORMATION_REQUESTED';
};

type FieldChange = {
  path: EditablePartyPath;
  approvedValue: unknown;
  proposedValue: unknown;
  source: ChangeSource;
  supersededSources: ChangeSource[];
  sensitivity: 'public' | 'masked';
};

type ChangeSet = {
  approvedClient: ClientResponse;
  proposedClient: ClientResponse; // display only
  productChanges: ProductChange[];
  partyChanges: PartyChange[];
  invalidProposals: PartyResponse[];
};
```

Compose party proposals that share one request ID in `submittedAt` order. Repeated PATCHes for one party are coalesced by the service; if multiple returned records contain the same field, apply the latest value and retain earlier sources in `supersededSources`.

## Review UI

Use the profile review hub as the default showcase layout. Keep the field-delta and request-task layouts available as alternate views over the same `ChangeSet`. Do not change projection rules or API behavior by view.

### Profile review hub

```text
Approved business profile                              [9 proposed changes]
Disclose changes   Review changes       Attest       Submitted
  ●                 ○                 ○              ○
────────────────────────────────────────────────────────────────────

Products
Limited DDA Payments                                   [Current]
Limited DDA                                            [Proposed addition]

Has anything changed since your previous approval?
( ) No, nothing else changed
(●) Yes, I have changes to disclose

Organization
Marketplace Vendor LLC                                 [Current] [Edit]

People
Jane Diaz · Controller, beneficial owner               [1 change] [Edit] [Remove]
Alex Smith · Beneficial owner                          [Removal requested]
Sam Lee · Authorized user                              [Proposed addition]

[Load complete story]                       [Review proposed changes]
```

Expanded review:

```text
Jane Doe                                    MODIFY · request 4000001049
┌──────────────────┬────────────────────┬───────────────────────────────┐
│ Field            │ Approved           │ Proposed                      │
├──────────────────┼────────────────────┼───────────────────────────────┤
│ Last name        │ Doe                │ Diaz                          │
└──────────────────┴────────────────────┴───────────────────────────────┘
```

On narrow viewports, render each comparison as an `Approved`/`Proposed` definition stack. Keep the disclosure answer in host state. Make “Load complete story” invoke the same API functions as the individual controls. Wrap the API sequence into a responsive grid.

### Complete-profile comparison

```text
┌ Approved profile ──────────┐  ┌ Proposed profile ─────────┐
│ Marketplace Vendor        │  │ Marketplace Vendor       │
│ 85 Mercer Street          │  │ 120 Greene Street        │
│ Jane R. Doe               │  │ Jane R. Diaz             │
└────────────────────────────┘  └────────────────────────────┘
```

Stack the approved and proposed profiles on narrow viewports.

### Request task view

```text
Product proposal · REVIEW IN PROGRESS
  Limited DDA               ADD       [Review]

Party request 4000001049 · NEW · 3 tasks
  Sam Lee                   ADD       [Review]
  Jane Doe                  MODIFY    [Review]
  Alex Smith                REMOVE    [Review]

  [Cancel draft]                       [Review and attest]
```

Open each task into the same field comparison used by the profile review hub.

### State-specific interactions

| Resource state                             | Primary message                               | Available actions                                                                               |
| ------------------------------------------ | --------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| No open request                            | Approved profile                              | Edit a supported field, add a related party, or remove a related party                          |
| Party `updateRequest.status: NEW`          | Draft changes are not yet submitted           | Continue supported party edits, review, attest, verify, or cancel the party-maintenance request |
| Product or party `REVIEW_IN_PROGRESS`      | Submitted for review; not approved            | View read-only changes and status; prevent ordinary edit controls                               |
| Product or party `INFORMATION_REQUESTED`   | More information is required                  | Show the returned tasks and keep ordinary draft edits disabled                                  |
| Product or party `APPROVED`, not published | Approved; profile update may take 24-48 hours | Remove that proposal overlay and refetch the client until its approved values are published     |
| Published                                  | Approved profile is current                   | Return to profile and retain request history                                                    |
| Product or party `DECLINED`                | Changes were not approved                     | Remove that proposal overlay and retain its request history                                     |
| Party `updateRequest.status: TERMINATED`   | Draft was canceled or auto-closed             | Remove the party proposal overlay and return to the approved profile                            |

For cancellation, distinguish “Cancel all draft changes” from party-scoped cancellation. Display the request ID, affected party names, and irreversible result. Offer cancellation only while the request is `NEW`; disable it as soon as verification starts.

## Attestation and verification

### Enforce the initial product-verification lead time

Start the five-minute lead time at the first verification response's `acceptedAt`. When `acceptedAt` is absent, persist the host receipt time for that successful `202` response and use it as the conservative start time.

Keep product enhancement controls and every subsequent verification action disabled until both conditions are true:

1. The current time is at least five minutes after the recorded first-verification acceptance time.
2. A fresh `GET /clients/{id}` response reports the original product's `onboardingStatus` as `APPROVED`.

Do not unlock on elapsed time alone. If the original product remains `NEW`, `REVIEW_IN_PROGRESS`, or `INFORMATION_REQUESTED` after five minutes, continue polling and keep the controls disabled. Do not submit or automatically retry a product update or second verification during this guard window because the request can fail while the first product verification is still processing.

For the v1.4.1 payload shown here, send `addAttestations` with structured `attester` details. Retrieve each attestation document with `GET /documents/{id}` and its content with `GET /documents/{id}/file` before collecting acceptance:

```json
{
  "addAttestations": [
    {
      "attester": {
        "firstName": "Jordan",
        "lastName": "Lee",
        "designation": "Chief executive officer"
      },
      "attestationTime": "2026-04-12T15:00:00.000Z",
      "documentId": "c4e4739f-33ed-47f6-82fa-0b1c5c992d0b",
      "ipAddress": "192.0.2.10"
    }
  ]
}
```

After required pre-verification attestations are submitted, invoke verification for each lifecycle according to its own state. Product and party maintenance have separate submission contracts; a host may coordinate their UX but is not required to orchestrate them as one transaction:

```http
POST /onboarding/v1/clients/1000010400/verifications
Idempotency-Key: 037f83cf-971d-42fe-90b0-16e712be157b
Content-Type: application/json
```

```json
{}
```

Handle the `202` response:

```json
{
  "acceptedAt": "2026-04-12T15:01:00.000Z"
}
```

The UI must say “submitted” or “accepted for review,” never “approved.” After verification returns `202`, disable ordinary party editing and draft cancellation. Obtain subsequent status from webhooks and refetches. Treat `acceptedAt` as optional when parsing the response.

Handle product `onboardingStatus` and party `updateRequest.status` independently during review. Remove each proposal overlay only when that proposal reaches a terminal state. Use the regular onboarding event model and refetch `GET /clients/{id}` as the persisted baseline throughout the 24-48 hour publication window.

## Client state and cache boundaries

Keep three distinct state objects:

```ts
type MaintenanceWorkspaceState = {
  approvedClient: ClientResponse; // GET /clients/{id}; persisted source of truth
  maintenancePages: ListKycPartyUpdateRequests[]; // sparse pending/history data
  projection: ChangeSet; // derived, presentation-only, never sent to the API
};
```

Invalidate both caches after every mutation:

```ts
const clientKey = ['digital-onboarding', 'client', clientId];
const maintenanceKey = ['digital-onboarding', 'maintenance', clientId];

async function patchParty(partyId: string, changedFields: UpdatePartyRequest) {
  await api.patchParty(partyId, changedFields, crypto.randomUUID());

  // The PATCH response contains persisted values, not the proposed field values.
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: clientKey }),
    queryClient.invalidateQueries({ queryKey: maintenanceKey }),
  ]);
}
```

- Do not optimistically patch `approvedClient` with submitted values.
- Retain form values until the maintenance refetch succeeds and label them local and unsynchronized.
- Fetch page zero, validate `metadata.page`, `metadata.limit`, and `metadata.total`, fetch every remaining page, and verify the combined item count against a final page-zero refetch before enabling review or attestation.
- Treat malformed metadata, a missing page, or a changing total as an incomplete read and block review.
- Rebuild the projection from query data; do not store a second mutable copy.
- Key request-specific caches by both client and `requestId` to avoid cross-client collisions.
- Redact birth dates and identifiers from analytics, errors, and mutation logs.

## Staleness and consistency

Use the review fingerprint for local drift detection. Immediately before attestation and verification, refetch the client and every maintenance page, rebuild the `ChangeSet`, and compare it with the reviewed fingerprint. Require two consecutive identical complete reads before submission. Invalidate the attestation and return to review when values change.

Build the review fingerprint from the proposed product and party changes:

```ts
const reviewedFingerprint = stableHash({
  products: changeSet.productChanges,
  parties: changeSet.partyChanges.map(
    ({ partyId, action, removesParty, fieldChanges }) => ({
      partyId,
      action,
      removesParty,
      fields: fieldChanges.map(({ path, proposedValue, source }) => ({
        path,
        proposedValue,
        requestId: source.requestId,
        submittedAt: source.submittedAt,
      })),
    })
  ),
});
```

Compare the fingerprint after every pre-submit refetch. Block submission while either resource is stale, incomplete, or unavailable.

Use the same event model as the regular onboarding flow. Refetch client and maintenance resources after a relevant event, track client product `onboardingStatus` and party `updateRequest.status` independently, and stop tracking each proposal when it becomes terminal. Continue lower-frequency client refetches during the 24-48 hour publication window. Do not keep an approved proposal overlay visible while waiting for publication.

## Sensitive data

Mask sensitive KYC values in every field diff using per-field sensitivity metadata:

- government identifiers show type and only a masked ending;
- dates of birth are fully masked in delta rows;
- phone numbers show only the final four digits;
- raw sensitive values are excluded from UI telemetry and request logs;
- unknown fields are not rendered merely because they appear in JSON.

Apply masking in the host before rendering or logging values.

## Projection safety rules

- Overlay only allowlisted fields explicitly present in a maintenance proposal.
- Keep the approved value when an allowlisted property is absent.
- Replace an address, nested object, or collection as one complete logical field when it is present; do not append or merge its members during projection.
- Read pending additions from maintenance responses and retain their assigned party IDs.
- Build the proposed party set from the union of approved parties and pending additions.
- Treat `TERMINATED` as a terminal request state, not as deletion of the committed party.
- Treat `active: false` with an active request status and `action: MODIFY` as a pending removal.
- Read party proposal metadata from maintenance responses; do not require `updateRequest` on approved parties returned by `GET /clients/{id}`.
- Ignore unknown response fields. Do not render or log them automatically.

## Required error and edge-state behavior

| State                                                                                         | Required host response                                                                                                           |
| --------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Client is not `APPROVED` or is out of scope                                                   | Do not offer maintenance; route to the appropriate onboarding/support state                                                      |
| Client load fails                                                                             | Keep route context, show retry, do not render stale deltas as current                                                            |
| Product, party-create, or party-update write fails                                            | Keep local input, focus the error, and do not mutate the approved cache                                                          |
| PATCH succeeds but maintenance refetch fails                                                  | Show the request as synchronizing; do not invent the proposed value from the PATCH response                                      |
| More than one open party-maintenance request ID is returned                                   | Block attestation/verification and surface an integration error                                                                  |
| Maintenance list is incomplete/unpageable                                                     | Do not claim the proposed snapshot is complete                                                                                   |
| Proposal lacks correlation fields                                                             | Exclude it from projection, show a validation warning, and block submission                                                      |
| Reviewed data changes before attestation                                                      | Invalidate attestation and return to review                                                                                      |
| Product enhancement or second verification is attempted before the initial product gate opens | Do not send the request; show that initial product verification is processing, then refetch at or after the five-minute boundary |
| Mutation returns `409`                                                                        | Treat it as a concurrent-request conflict, preserve local input, refetch client and maintenance state, and require review again  |
| Mutation returns a status-related `422`                                                       | Parse `ApiError.context`, refetch lifecycle status, and render the allowed state-specific actions                                |
| Draft cancellation returns `409`/`422`                                                        | Refetch status; do not locally mark the request terminated                                                                       |
| Attestation PATCH fails                                                                       | Do not call verification                                                                                                         |
| Verification returns `409` or `422`                                                           | Preserve review data and display actionable API context                                                                          |
| Verification returns `202`                                                                    | Show accepted for processing and refetch product and party status independently                                                  |
| Product or party status becomes `INFORMATION_REQUESTED`                                       | Surface returned outstanding questions, documents, and party requirements                                                        |
| Product or party status becomes `APPROVED`                                                    | Exclude that proposal from projection and refetch client through the 24-48 hour publication window                               |
| Product or party status becomes `DECLINED`, or party status becomes `TERMINATED`              | Remove that proposal from proposed state and retain request history and audit context                                            |

## Required test coverage

Cover:

- approved-client and US/Canada eligibility guards;
- deterministic lead-time coverage proving product enhancement and second verification remain blocked before five minutes, at five minutes without `APPROVED`, and open only after both five minutes and a fresh `APPROVED` product response;
- an approved `LIMITED_DDA_PAYMENTS` baseline with `LIMITED_DDA` added alongside it, never Merchant Services or an accidental replacement;
- the required since-approval checkpoint, including product-only continuation for no and disclosed party controls for yes;
- guide-supported request DTOs that omit unchanged fields and reject unsupported form fields;
- repeated party PATCH calls sharing one `NEW` party-maintenance request ID;
- client-level product proposal provenance kept separate from party-maintenance request provenance;
- independent product and party submission, cancellation, status, and request-ID lifecycles without required cross-lifecycle orchestration;
- `POST /parties`, sparse party modification, and `active: false` removal grouped under one party-maintenance request ID;
- immediate-parent `partyId` placement in `parentPartyId` for new parties;
- PATCH responses retaining persisted values while maintenance GET returns pending values;
- more than one active request ID blocking projection submission;
- active-status filtering and approved-request exclusion;
- sparse nested-field overlay without erasing untouched approved fields;
- `ADD`, `MODIFY`, and `DELETE` projection behavior;
- product proposal projection from the client response without manufacturing a party record;
- `MODIFY` plus `active: false` deriving `removesParty: true` without action rewriting;
- repeated party updates coalescing into one proposal and latest-field-value precedence with superseded provenance;
- missing-correlation response handling;
- identity, birth-date, and phone masking;
- approved baseline immutability after `PATCH /parties/{id}`;
- approved baseline immutability after product, party-create, update, and removal writes;
- existing parties retaining their approved profile state while proposed modifications or removals are under review;
- an added party remaining pending approval and carrying new document and question requirements during `INFORMATION_REQUESTED`;
- request-scoped maintenance lookup;
- full-request and party-scoped cancellation while `NEW`, plus lock behavior after submission;
- attestation required before verification in the demo;
- contract tests for question responses, platform-uploaded document requests, attestations, and every targeted write enabled during `INFORMATION_REQUESTED`;
- display-only showcase tests that show new-party questions before attestation, legal-name-change questions afterward, and Sam Lee's party-linked document request only after attestation without manufacturing question-to-party correlation;
- verification transitioning `NEW` to `REVIEW_IN_PROGRESS` and preventing further edits;
- `INFORMATION_REQUESTED` refetching all outstanding work and keeping ordinary draft edits disabled;
- `202 Accepted` separated from later approval and approved-data publication;
- 24-48 hour publication messaging without overlaying approved maintenance data;
- refetch both client and party maintenance resources after every write and before attestation;
- clean initial state, individual operations, endpoint-backed complete-story loading, all three review modes, attestation, submission, review-in-progress, and approved UI states.

Add contract and integration coverage for pagination, sparse nested objects, cancellation scope, information requests, status events, and publication timing.

## Reference implementation map

| Concern                       | Location                                                                                           |
| ----------------------------- | -------------------------------------------------------------------------------------------------- |
| Runnable route                | `app/client-next-ts/src/routes/approved-client-maintenance.tsx`                                    |
| Main workflow                 | `app/client-next-ts/src/components/client-maintenance/ClientMaintenanceWorkspace.tsx`              |
| Local v1.4.1 model subset     | `app/client-next-ts/src/components/client-maintenance/models/maintenance-api.ts`                   |
| Approved/proposed projection  | `app/client-next-ts/src/components/client-maintenance/utils/build-maintenance-projection.ts`       |
| Commerce-shaped mock handlers | `app/client-next-ts/src/components/client-maintenance/mocks/create-client-maintenance-handlers.ts` |
| API client calls              | `app/client-next-ts/src/components/client-maintenance/client-maintenance-api.ts`                   |
| Focused tests                 | Colocated under `app/client-next-ts/src/components/client-maintenance/`                            |

Run the showcase:

```powershell
pnpm -C app/client-next-ts run dev
```

```text
http://localhost:3000/approved-client-maintenance
```

## Remaining End-to-End Questions

Move each resolved answer into the owning API description, model, example, error contract, or implementation section above, then remove its row from this table.

| Flow area                                          | Remaining question                                                                                                                                                                                                                                                            |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Intentional field clearing                         | Which explicit values clear optional scalar, nested-object, and collection fields, and which fields cannot be cleared?                                                                                                                                                        |
| Correlation and pending additions                  | Must every maintenance proposal include stable `id`, `requestId`, `status`, `action`, and `submittedAt` values? Does a pending `ADD` always include `parentPartyId`, and can its assigned party ID be patched again while the request is `NEW`?                               |
| Writable field and entity scope                    | What is the complete approved-client maintenance allowlist by country, legal entity type, party type, and role? Is `AUTHORIZED_USER` supported for a newly added party in this flow, and what response identifies an unsupported field or role?                               |
| Outstanding party requirements                     | How must `outstanding.partyIds`, `outstanding.partyRoles`, and party `validationResponse` be completed during maintenance? Which endpoint starts or resumes validation for a newly added party?                                                                               |
| `INFORMATION_REQUESTED` writes and resume behavior | Which targeted completion writes are allowed for each product or party status of `INFORMATION_REQUESTED`? After all returned questions, documents, and party requirements are complete, does review resume automatically or must the host call verification again?            |
| Attestation migration                              | What non-deprecated request property replaces `addAttestations`, and what is the migration timeline? Until then, is `addAttestations` with structured `attester` the supported production payload?                                                                            |
| List, pagination, and empty results                | What are the guaranteed pagination, empty-result, and `404` semantics for maintenance requests queried by client ID, party ID, and request ID?                                                                                                                                |
| Concurrency and review integrity                   | Will the API expose a version, ETag, shared as-of timestamp, snapshot token, optimistic-concurrency precondition, or server-computed proposed snapshot for review and verification?                                                                                           |
| Errors, retries, and request correlation           | What error codes distinguish concurrency, lifecycle locks, invalid fields, unsupported roles, duplicate submissions, and retryable failures? How must `ApiError.context`, `traceId`, maintenance `requestId`, and `Idempotency-Key` be correlated in support and retry flows? |
