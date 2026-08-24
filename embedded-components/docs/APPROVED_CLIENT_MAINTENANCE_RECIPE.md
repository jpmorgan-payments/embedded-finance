# Approved Client Maintenance UI/UX Recipe

> **Draft - under review.** Information in this document may be incomplete or subject to change.

## Introduction

An already approved client may need to update its organization or related-party information. The API exposes an approved client snapshot and sparse maintenance proposals, but it does not expose a complete “future client” object or field-level diff.

This recipe is an implementation companion to the official [Update party information](https://developer.payments.jpmorgan.com/docs/commerce/optimization-protection/capabilities/digital-onboarding/how-to/update-party) guide and the Digital Onboarding OpenAPI specification. Those sources define the supported API behavior. This recipe adds technical design guidance, implementation invariants, projection options, UX patterns, failure handling, and test recommendations for teams building the experience.

A typical journey allows a client representative to:

1. Retrieve the approved client and all approved parties.
2. Let the client representative propose an edit to a party.
3. Refetch the approved client and sparse maintenance proposals.
4. Derive approved and proposed presentation models without changing the approved baseline.
5. Review changed fields with request provenance.
6. Present and submit required attestations.
7. Request verification and represent `202 Accepted` as asynchronous processing.
8. Observe later status changes through refetch or webhooks, then account for the documented 24-48 hour delay before approved values may appear in client GET responses.

The suggested workflow can be adapted to a host platform's navigation, state management, and design system. The runnable showcase demonstrates one option, not a required page structure.

## Relationship to the Digital Onboarding Flow

This recipe follows the section-oriented model described in [`DIGITAL_ONBOARDING_FLOW_RECIPE.md`](./DIGITAL_ONBOARDING_FLOW_RECIPE.md). It extends the same client data, overview, review, attestation, and verification concepts into the approved-client lifecycle.

| Concern           | Digital onboarding flow                          | Approved client maintenance                                      |
| ----------------- | ------------------------------------------------ | ---------------------------------------------------------------- |
| Entry state       | New or in-progress client                        | Client whose onboarding status is `APPROVED`                     |
| Primary data      | `GET /clients/{id}` and outstanding requirements | `GET /clients/{id}` plus sparse maintenance proposals            |
| Main navigation   | Overview of business, people, and required tasks | Profile overview with changed sections and a change-review task  |
| Party editing     | Create or update onboarding parties              | Submit sparse updates with `PATCH /parties/{partyId}`            |
| Review            | Review the collected onboarding profile          | Compare the approved profile with proposed changes               |
| Attestation       | Complete outstanding attestation documents       | Review and submit any maintenance attestation requirements       |
| Verification      | Start initial due diligence processing           | Submit maintenance changes for asynchronous due diligence review |
| Completion signal | Observe client onboarding status                 | Refetch the approved client and observe maintenance status       |

The standalone reference route mirrors this lifecycle without changing `OnboardingFlow.tsx`. Hosts can instead extend their existing overview, use a dedicated maintenance area, or present request-specific tasks.

## References

- [Update party information](https://developer.payments.jpmorgan.com/docs/commerce/optimization-protection/capabilities/digital-onboarding/how-to/update-party) - normative lifecycle, supported update scenarios, request grouping, cancellation, and publication timing.
- [Digital Onboarding API reference](https://developer.payments.jpmorgan.com/api/commerce/optimization-protection/digital-onboarding/digital-onboarding) - OpenAPI v1.4.1.
- [Get maintenance requests by request ID](https://developer.payments.jpmorgan.com/api/commerce/optimization-protection/digital-onboarding/digital-onboarding#/operations/smbdo-getAllMaintenanceRequestsByRequestId).
- [Complete onboarding steps](https://developer.payments.jpmorgan.com/docs/commerce/optimization-protection/capabilities/digital-onboarding/how-to/complete-onboarding-steps).
- [Present attestations](https://developer.payments.jpmorgan.com/docs/commerce/optimization-protection/capabilities/digital-onboarding/how-to/present-attestations).

The reference implementation defines local v1.4.1 model subsets. The generated `embedded-components/src/api` models come from different Embedded Payments specifications and do not define the Commerce maintenance resources used here.

## Source hierarchy and confidence labels

Use the narrowest confirmed behavior when the sources operate at different levels. A field appearing in the broad OAS `UpdatePartyRequest` schema does not by itself mean the field is supported in the approved-client maintenance journey.

| Label                    | Meaning for implementers                                                                                                                      |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **Guide-confirmed**      | Explicit behavior in the Update party information guide; treat it as the lifecycle contract                                                   |
| **OAS-confirmed**        | Operation, schema, enum, requiredness, response, and error details in Digital Onboarding v1.4.1                                               |
| **Host recommendation**  | Client-side state, projection, validation, accessibility, and UX guidance from this recipe                                                    |
| **Illustrative option**  | A concrete choice made by the runnable showcase; replace it when another host pattern better serves the same contract                         |
| **Integration question** | Behavior not resolved by the guide or OAS; confirm it before depending on an inferred merge, timing, authorization, or event-delivery promise |

## Confirmed prerequisites and supported updates

The official guide establishes these preconditions:

- The client must already have `APPROVED` status.
- The feature supports clients in the United States and Canada with supported legal entity types.
- Only one open maintenance `requestId` is supported per client.
- Multiple party PATCH calls made while that request is `NEW` are bundled under the same `requestId`.
- Send only fields whose values changed; do not replay a complete party object.
- After verification changes the request to `REVIEW_IN_PROGRESS`, further edits are not allowed.

The guide lists these approved-client maintenance scenarios:

- change the client's legal name or doing-business-as name;
- change the client's address;
- add a related party;
- remove a related party by setting `active: false`; and
- change a related party's first, middle, or last name, or birth date.

Build form controls and request DTOs from this list. Keep the broader OAS response model for parsing server data, but do not expose every OAS property as an editable maintenance field without additional product guidance.

## High-Level Flow

```mermaid
sequenceDiagram
    participant U as Approved client representative
    participant UX as Host maintenance UX
    participant API as Digital Onboarding API
    participant JPMC as Asynchronous review

    UX->>API: GET /clients/{clientId}
    API-->>UX: Approved ClientResponse with parties
    U->>UX: Edit an organization or individual
    UX->>API: PATCH /parties/{partyId} with sparse UpdatePartyRequest
    API-->>UX: Current persisted PartyResponse + NEW updateRequest
    Note over UX,API: Pending values are not persisted party values
    par Refresh approved baseline
        UX->>API: GET /clients/{clientId}
        API-->>UX: Approved ClientResponse
    and Discover proposals
        UX->>API: GET /maintenance-requests?clientId={clientId}
        API-->>UX: ListKycPartyUpdateRequests
    end
    UX->>UX: Confirm one open request and derive a presentation-only ChangeSet
    U->>UX: Review approved versus proposed values
    UX->>API: PATCH /clients/{clientId} with required attestation
    API-->>UX: ClientUpdatedResponse
    UX->>API: POST /clients/{clientId}/verifications with {}
    API-->>UX: 202 ClientVerificationResponse
    API->>JPMC: NEW becomes REVIEW_IN_PROGRESS; edits lock
    JPMC-->>UX: Later INFORMATION_REQUESTED, APPROVED, or DECLINED status
    Note over UX,API: Approved values may take 24-48 hours to appear in GET /clients/{id}
```

`GET /maintenance-requests/{requestId}` complements the list call. The list call discovers requests for a client; the request-scoped call retrieves all party proposals associated with one `requestId`.

## Endpoint responsibilities

| Operation                                                | Contract role in this recipe                              | Important response behavior                                                                                  |
| -------------------------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `GET /onboarding/v1/clients/{id}`                        | Approved/current client and party baseline                | Returns persisted `ClientResponse`; it is not a proposed-profile response                                    |
| `PATCH /onboarding/v1/parties/{partyId}`                 | Add changed fields to the open draft request              | Returns current persisted party values plus `updateRequest`; pending field values remain in maintenance data |
| `GET /onboarding/v1/maintenance-requests?clientId={id}`  | Discover all maintenance items for the client             | Exactly one of `clientId` or `partyId` is required; fetch every page before claiming a complete review       |
| `GET /onboarding/v1/maintenance-requests/{requestId}`    | Retrieve all party proposals grouped under one request ID | Returns the same list wrapper, not a distinct top-level request resource                                     |
| `DELETE /onboarding/v1/maintenance-requests/{requestId}` | Cancel a `NEW` request, optionally for one `partyId`      | Returns the affected items with terminal `TERMINATED` status                                                 |
| `PATCH /onboarding/v1/clients/{id}`                      | Submit outstanding attestation data                       | Accepts `UpdateClientRequestSmbdo`; returns `ClientUpdatedResponse`                                          |
| `POST /onboarding/v1/clients/{id}/verifications`         | Submit the draft for due diligence processing             | Returns `202` with `acceptedAt`; moves `NEW` to `REVIEW_IN_PROGRESS` and prevents further edits              |

All mutating calls should send a unique `Idempotency-Key`. The OAS recommends UUID v4 values.

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

Important consequences:

- A response item is a sparse party proposal, not a `MaintenanceRequest` aggregate.
- Request metadata is nested under `party.updateRequest`.
- Multiple party items in the one open request share a `requestId`.
- Repeated PATCH calls while the request is `NEW` continue to use that ID.
- A client response and a maintenance-list response have different meanings: persisted state versus pending state.
- The OAS does not require the `KycUpdateRequest` properties.
- `PartyResponse.id` is optional in the schema, and some published maintenance examples omit it.
- The API does not return field-level `before` and `after` values.

## Lifecycle invariants

Treat the following as state-machine guards rather than display copy:

| Request state           | Host may PATCH parties | Host may cancel | Host action                                                                 |
| ----------------------- | ---------------------- | --------------- | --------------------------------------------------------------------------- |
| No open request         | Yes                    | No              | First supported change creates a draft                                      |
| `NEW`                   | Yes                    | Yes             | Continue editing under the same `requestId`; attest and verify when ready   |
| `REVIEW_IN_PROGRESS`    | No                     | No              | Show read-only submitted changes and await an outcome                       |
| `INFORMATION_REQUESTED` | Follow returned tasks  | No              | Surface required information; do not assume ordinary party PATCH is allowed |
| `APPROVED`              | No                     | No              | Exclude from proposed state and refetch until approved values are published |
| `DECLINED`/`TERMINATED` | No                     | No              | Exclude from proposed state and retain optional history                     |

Fail closed if more than one open `requestId` is returned for one client. Preserve the payload for support diagnostics, but do not invent cross-request precedence or allow attestation against an ambiguous projection.

## Example sparse update cycle

An organization name and address update can be sent without replaying the full approved party:

```http
PATCH /onboarding/v1/parties/2000000555
Idempotency-Key: 6e6d53d0-d4d4-45d3-a929-4fc735394834
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

Refetch maintenance data to obtain the pending values. A list response may expose this sparse proposal:

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

## Suggested active-request handling

A reference implementation can use this candidate set for pending review data:

```ts
const ACTIVE_PREVIEW_STATUSES = new Set([
  'NEW',
  'REVIEW_IN_PROGRESS',
  'INFORMATION_REQUESTED',
]);
```

Before projection, collect the distinct `requestId` values in this set. Zero means there is no pending request; one is the expected state; more than one is a contract violation for this workflow and should block review and submission.

`APPROVED`, `DECLINED`, and `TERMINATED` proposals do not contribute to the proposed future snapshot or actionable counts. They may appear in collapsed history. This projection policy follows the guide's terminal-state behavior while keeping `GET /clients/{id}` authoritative for persisted values.

The original requirement to “ignore approved update requests” is therefore implemented in two ways:

1. Never overlay an `APPROVED` maintenance payload onto the approved baseline.
2. Trust `GET /clients/{id}` as the current approved state after server approval.

This avoids double-applying an already accepted update.

## Build approved and proposed client objects

### 1. Keep the approved baseline immutable

```ts
const approvedClient = await getClient(clientId);
const maintenance = await getMaintenanceRequests({ clientId });

const proposedClient = structuredClone(approvedClient);
```

Never mutate query-cache data and never send `proposedClient` back to the API. It is a display projection only.

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

Keep editable request descriptors separate from broader response descriptors. This prevents a newly added OAS property from automatically becoming editable. Arrays need field-specific semantics: the illustration treats the guide-supported organization `addresses` collection as one logical field and replaces it only in the display projection when it is explicitly present.

### 3. Apply action-specific behavior

```text
fetch every maintenance page
collect active request IDs
stop with an integration error if more than one active request ID exists

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

### 4. Preserve provenance and conflict evidence

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
  partyChanges: PartyChange[];
  conflicts: FieldChange[];
  unresolvedProposals: PartyResponse[];
};
```

The reference implementation can compose multiple party items that share the same request ID. If the API unexpectedly returns different proposed values for the same field in that request, retain both sources, mark the projection ambiguous, and block production submission until a refetch or product-supported resolution removes the ambiguity. The showcase displays the latest item only to make anomalous mock data inspectable; it does not claim server precedence.

## Projection strategies for one open request

The official guide defines request lifecycle behavior, not a required review layout. Choose a projection strategy according to the audience and the certainty needed before attestation.

| Option                                         | Behavior                                                                 | Best fit                                   | Trade-off                                          |
| ---------------------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------ | -------------------------------------------------- |
| **A. Field-delta review**                      | Compare each sparse proposal field directly with the approved party      | Compliance and operations review           | Unchanged context is less visible                  |
| **B. Allowlisted proposed-profile projection** | Overlay supported fields onto an immutable clone and retain provenance   | Client self-service; runnable illustration | Requires careful sparse and array semantics        |
| **C. Request summary plus drill-down**         | Show affected parties and actions first, with field comparison on demand | Mobile and task-oriented experiences       | Adds navigation before a reviewer sees every value |

The runnable workflow implements option B. Option A is the safest fallback when a proposal cannot be correlated or the response is ambiguous. None of the options should merge multiple open request IDs.

## UX options

### Option 1: profile review hub (implemented illustration)

```text
Approved business profile                              [4 proposed changes]
Profile       Review changes       Attest       Submitted
  ●                 ○                 ○              ○
────────────────────────────────────────────────────────────────────

Organization
Marketplace Vendor LLC                                [2 changes] [Edit]

People
Jane Doe · Controller, beneficial owner               [2 changes] [Edit]
Alex Smith · Beneficial owner                         [Current]   [Edit]
```

Expanded review:

```text
Marketplace Vendor LLC                       MODIFY · request 4000001049
┌──────────────────┬────────────────────┬───────────────────────────────┐
│ Field            │ Approved           │ Proposed                      │
├──────────────────┼────────────────────┼───────────────────────────────┤
│ Doing business as│ Marketplace Vendor │ Marketplace Vendor Collective │
│ Business address │ 85 Mercer St…      │ 120 Greene St…                │
└──────────────────┴────────────────────┴───────────────────────────────┘
```

This balances future-profile comprehension with field and request provenance. On mobile, each comparison becomes an `Approved`/`Proposed` definition stack.

### Option 2: side-by-side complete profiles

```text
┌ Approved profile ──────────┐  ┌ Proposed profile ─────────┐
│ Marketplace Vendor        │  │ Marketplace Vendor       │
│ 85 Mercer Street          │  │ 120 Greene Street        │
│ Jane R. Doe               │  │ Jane R. Diaz             │
└────────────────────────────┘  └────────────────────────────┘
```

This is useful for exhaustive legal review but repeats unchanged values and degrades quickly on small screens.

### Option 3: request task view

```text
Request 4000001049 · NEW · 4 proposed changes
  Organization details      2 changes  [Review]
  Jane Doe                  2 changes  [Review]

  [Cancel draft]                       [Review and attest]
```

This works well for a task inbox or mobile entry point. It makes the single-request model obvious and gives cancellation a clear scope, but adds a drill-down before all values are visible.

These wireframes are design options, not API requirements. A host can use a wizard, task inbox, request ledger, side-by-side diff, or another accessible pattern while preserving the same contract boundaries.

### State-specific interaction recommendations

| State                     | Primary message                               | Available actions                                                                                  |
| ------------------------- | --------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| No open request           | Approved profile                              | Edit a supported field, add a related party, or remove a related party                             |
| `NEW`                     | Draft changes are not yet submitted           | Continue editing, review, attest, verify, or cancel the entire request/one party where appropriate |
| `REVIEW_IN_PROGRESS`      | Submitted for review; not approved            | View read-only changes and status; prevent ordinary edit controls                                  |
| `INFORMATION_REQUESTED`   | More information is required                  | Show returned tasks and instructions; avoid reopening unrestricted editing                         |
| `APPROVED`, not published | Approved; profile update may take 24-48 hours | Show pending-publication state and keep refetching without overlaying approved maintenance data    |
| Published                 | Approved profile is current                   | Return to profile; keep request in optional history                                                |
| `DECLINED`                | Changes were not approved                     | Show supported next step without copying declined values into a new request automatically          |
| `TERMINATED`              | Draft was canceled                            | Return to the approved profile and allow a new request                                             |

For cancellation, distinguish “Cancel all draft changes” from party-scoped cancellation. Confirm the request ID, affected party names, and irreversible result. Only offer cancellation while the request is `NEW`; disable the control as soon as verification starts.

## Attestation and verification

The OAS defines structured `attester` details:

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

Contract tension to clarify:

- `UpdateClientRequestSmbdo.addAttestations` is marked deprecated in v1.4.1.
- `Attestation.attesterFullName` is also deprecated; structured `attester` is available.
- The current PDP “Present attestations” how-to still demonstrates `addAttestations` with deprecated `attesterFullName`.
- The OAS does not expose an obvious non-deprecated replacement property for adding attestations.

The reference implementation uses `addAttestations` with structured `attester` to avoid the deprecated name field while keeping the documented update operation. Confirm the intended replacement contract before production use.

After outstanding requirements are submitted:

```http
POST /onboarding/v1/clients/1000010400/verifications
Idempotency-Key: 037f83cf-971d-42fe-90b0-16e712be157b
Content-Type: application/json
```

```json
{}
```

The documented success response is `202`:

```json
{
  "acceptedAt": "2026-04-12T15:01:00.000Z"
}
```

The UI must say “submitted” or “accepted for review,” never “approved.” The guide confirms that verification moves the draft from `NEW` to `REVIEW_IN_PROGRESS`; immediately disable ordinary party editing and draft cancellation. Later status should come from a refetch or an applicable webhook event.

Outcomes are `APPROVED` or `DECLINED`, with `INFORMATION_REQUESTED` possible during review. When status becomes `APPROVED`, stop overlaying the maintenance payload. Continue rendering `GET /clients/{id}` as the persisted baseline and explain that approved values may take 24-48 hours to appear there.

## Client state and cache boundaries

Keep three distinct state objects:

```ts
type MaintenanceWorkspaceState = {
  approvedClient: ClientResponse; // GET /clients/{id}; persisted source of truth
  maintenancePages: ListKycPartyUpdateRequests[]; // sparse pending/history data
  projection: ChangeSet; // derived, presentation-only, never sent to the API
};
```

Recommended query and mutation behavior:

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
- It is reasonable to retain form values until the maintenance refetch succeeds, but label them local and unsynchronized.
- Fetch all maintenance pages before enabling attestation.
- Rebuild the projection from query data; do not store a second mutable copy.
- Key request-specific caches by both client and `requestId` to avoid cross-client collisions.
- Redact birth dates and identifiers from analytics, errors, and mutation logs.

## Staleness and consistency

Immediately before attestation, the reference implementation refetches the client and maintenance list in parallel and rebuilds the `ChangeSet`. If party changes differ from the reviewed set, it invalidates the attestation and asks the user to review again.

This reduces risk but does not create transaction-level consistency between the two GET calls. The API design should clarify whether clients can obtain:

- a version, ETag, or snapshot token;
- an “as of” timestamp shared by client and maintenance responses;
- an optimistic-concurrency precondition on attestation or verification; or
- a server-computed proposed snapshot.

Use a review fingerprint even when the API does not expose a version:

```ts
const reviewedFingerprint = stableHash(
  changeSet.partyChanges.map(({ partyId, action, fieldChanges }) => ({
    partyId,
    action,
    fields: fieldChanges.map(({ path, proposedValue, source }) => ({
      path,
      proposedValue,
      requestId: source.requestId,
      submittedAt: source.submittedAt,
    })),
  }))
);
```

Immediately before attestation or verification, refetch both resources and compare the fingerprint. If it changed, invalidate the attestation and return the user to review. This is a host safety check, not an API concurrency guarantee.

For status observation, prefer a supported webhook when available and use polling as a recovery path. Back off while status is unchanged, refetch immediately after a lifecycle event, stop draft polling at terminal status, and continue lower-frequency client refetches during the 24-48 hour publication window. Do not keep an approved maintenance overlay visible while waiting for publication.

## Sensitive data

Field diffs can accidentally expose more KYC data than the profile UI normally displays. The implementation uses per-field sensitivity metadata:

- government identifiers show type and only a masked ending;
- dates of birth are fully masked in delta rows;
- phone numbers show only the final four digits;
- raw sensitive values are excluded from UI telemetry and request logs;
- unknown fields are not rendered merely because they appear in JSON.

Masking is a host responsibility unless the API offers presentation-safe values.

## API clarifications and design considerations

Do not reopen guide-confirmed behavior such as one open request, draft bundling, persisted PATCH response values, verification transition, edit lock, or the 24-48 hour publication window as implementation guesses. Confirm only details the published sources do not resolve:

| Area                    | Confirm before production dependence                                                                                             |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Proposal correlation    | Stable correlation for `MODIFY`/removal data when optional `PartyResponse.id` is absent                                          |
| Sparse nested objects   | Property merge and array replacement semantics, especially for organization addresses                                            |
| Clearing values         | Supported representation for intentionally clearing an optional value                                                            |
| Added-party identity    | Proposed party ID assignment and parent correlation before approval                                                              |
| Removal representation  | How request `active: false` is represented by `updateRequest.action` and maintenance responses                                   |
| Partial cancellation    | Whether party-scoped termination preserves the remainder as one atomic request                                                   |
| Pagination consistency  | Whether pages share a stable snapshot while a draft is changing                                                                  |
| Attestation deprecation | Intended replacement for deprecated `addAttestations`; structured `attester` remains preferable to deprecated `attesterFullName` |
| New requirements        | Which questions, documents, attestations, parties, or roles maintenance can create and how `INFORMATION_REQUESTED` is fulfilled  |
| Conflict recovery       | Which maintenance operations can return `409`, when to retry, and when a fresh review is mandatory                               |
| Webhooks                | Availability and delivery semantics of an event containing maintenance `requestId`, party ID, action, and status                 |
| History retention       | How long terminal maintenance items remain queryable after values are published                                                  |
| Authorization           | Which host users may edit, cancel, attest, and submit changes for each party role                                                |

Document confirmed behavior in the API description, model property descriptions, examples, error contracts, or how-to guides so implementations do not need to infer it.

## Error and edge-state expectations

| State                                        | Illustrative UX response                                                                    |
| -------------------------------------------- | ------------------------------------------------------------------------------------------- |
| Client is not `APPROVED` or is out of scope  | Do not offer maintenance; route to the appropriate onboarding/support state                 |
| Client load fails                            | Keep route context, show retry, do not render stale deltas as current                       |
| Party PATCH fails                            | Keep form values, focus the error, and do not mutate the approved cache                     |
| PATCH succeeds but maintenance refetch fails | Show the request as synchronizing; do not invent the proposed value from the PATCH response |
| More than one open request ID is returned    | Block attestation/verification and surface an integration error                             |
| Maintenance list is incomplete/unpageable    | Do not claim the proposed snapshot is complete                                              |
| Proposal lacks correlation fields            | Exclude it from projection, show an unresolved warning, and block submission                |
| Reviewed data changes before attestation     | Invalidate attestation and return to review                                                 |
| Edit is attempted after verification         | Treat `409` as a locked request, refetch, and render read-only review state                 |
| Draft cancellation returns `409`/`422`       | Refetch status; do not locally mark the request terminated                                  |
| Attestation PATCH fails                      | Do not call verification                                                                    |
| Verification returns `409` or `422`          | Preserve review data and display actionable API context                                     |
| Verification returns `202`                   | Show submitted/pending and expect `REVIEW_IN_PROGRESS`; continue observing status           |
| Status becomes `INFORMATION_REQUESTED`       | Surface new outstanding questions/documents/party fields                                    |
| Request becomes `APPROVED`                   | Exclude it from projection and refetch client through the 24-48 hour publication window     |
| Request becomes `DECLINED` or `TERMINATED`   | Remove it from proposed state and retain optional history/audit context                     |

## Testing recommendations

Tests should cover:

- approved-client and US/Canada eligibility guards;
- guide-supported request DTOs that omit unchanged fields and reject unsupported form fields;
- repeated PATCH calls sharing one `NEW` request ID;
- PATCH responses retaining persisted values while maintenance GET returns pending values;
- more than one active request ID blocking projection submission;
- active-status filtering and approved-request exclusion;
- sparse nested-field overlay without erasing untouched approved fields;
- `ADD`, `MODIFY`, and `DELETE` projection behavior;
- duplicate-field ambiguity detection within one request;
- unresolved proposal handling;
- identity, birth-date, and phone masking;
- approved baseline immutability after `PATCH /parties/{id}`;
- request-scoped maintenance lookup;
- full-request and party-scoped cancellation while `NEW`, plus lock behavior after submission;
- attestation required before verification in the demo;
- verification transitioning `NEW` to `REVIEW_IN_PROGRESS` and preventing further edits;
- `202 Accepted` separated from later approval and approved-data publication;
- 24-48 hour publication messaging without overlaying approved maintenance data;
- refetch after every write and before attestation;
- edit, review, attest, submit, review-in-progress, and approved UI states.

Add contract or integration coverage for pagination, sparse nested-object semantics, cancellation scope, returned information requests, status events, and publication timing as those environment behaviors become available.

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

Run the showcase and open the illustration:

```powershell
pnpm -C app/client-next-ts run dev
```

```text
http://localhost:3000/approved-client-maintenance
```
