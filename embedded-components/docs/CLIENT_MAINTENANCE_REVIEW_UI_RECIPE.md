# Client maintenance review UI recipe

> **Draft - under review.** Parts of the API contract referenced here are still being finalized and are subject to change. The layout, colour, and accessibility guidance is stable on its own terms; the field names, statuses, and read behavior it depends on may still move. Treat the published guides and the Digital Onboarding OpenAPI specification as authoritative at the time you build. Open items are tracked in the [approved client maintenance recipe](./APPROVED_CLIENT_MAINTENANCE_RECIPE.md#open-questions).

How to render the review step of an approved-client maintenance journey: the screen where a
representative checks every proposed change before attesting and submitting.

This is a focused subset of the [approved client maintenance recipe](./APPROVED_CLIENT_MAINTENANCE_RECIPE.md).
That document covers the full journey, the API contract, and the projection rules. This one covers only
presentation, and assumes you already hold a change set built the way that recipe describes.

## What the review step is for

The representative has already declared what they want: a new sub-product, and a set of party updates,
additions, and removals. Nothing on this screen is a new decision about the profile. The only decisions
are **is this correct** and **do I submit it**.

That framing sets the boundaries:

- Show every proposed value, and the approved value it replaces.
- Do not offer editing here. Send the representative back to the disclosure step to change something.
- Do not surface request identifiers. They are correlation keys for your systems and support teams, not
  information a representative can act on. Showing them invites the reader to think a number is
  something they must track.
- Never present the proposed state as if it were already in effect.

## The change set the UI reads

Every layout below renders the same structure. None of them re-read the API, and none of them apply
their own merge rules.

```ts
type FieldChange = {
  path: EditablePartyPath;
  label: string;
  approvedValue: unknown;
  proposedValue: unknown;
  sensitivity: 'public' | 'masked';
};

type PartyChange = {
  partyId: string;
  partyName: string;
  action: 'ADD' | 'MODIFY' | 'DELETE';
  removesParty: boolean;
  approvedParty?: PartyResponse;
  proposedParty?: PartyResponse;
  fieldChanges: FieldChange[];
};

type ProductChange = {
  product: string;
  subProduct?: string;
  action: 'ADD';
  onboardingStatus: 'NEW' | 'REVIEW_IN_PROGRESS' | 'INFORMATION_REQUESTED';
};

type ChangeSet = {
  approvedClient: ClientResponse;
  proposedClient: ClientResponse; // display only
  productChanges: ProductChange[];
  partyChanges: PartyChange[];
};
```

A product addition carries no maintenance request, so its state comes from `onboardingStatus`. Party
proposals carry request metadata, but the review step does not display it.

## Where the change set comes from

The review step issues no writes and no reads of its own. It renders a change set assembled before it
opens, from two calls:

| Call                                                    | Contributes                                                                      |
| ------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `GET /onboarding/v1/clients/{id}`                       | The approved baseline, and product state via `productDetails[].onboardingStatus` |
| `GET /onboarding/v1/maintenance-requests?clientId={id}` | The sparse party proposals to overlay on that baseline                           |

Two consequences matter more here than anywhere else in the journey:

- **An incomplete read must block review.** The maintenance list is paged, with a maximum page size of
  25, and `metadata` has been observed without `limit` — so page using the limit you requested and keep
  going until the collected count reaches `total`. A dropped page does not produce a visibly broken
  screen. It produces a plausible one that is missing a change, and the representative attests to it.
  Treat malformed metadata, a missing page, or a shifting total as a failed read and say so, rather
  than rendering a partial change set.
- **Refetch both calls immediately before attestation and rebuild the change set.** If the status is no
  longer the one the representative reviewed under, show the new state instead of submitting.

The [approved client maintenance recipe](./APPROVED_CLIENT_MAINTENANCE_RECIPE.md) covers the request
contract, the merge semantics, and the projection algorithm that turns these two responses into the
structure above.

## The worked example

Every mockup below shows the same draft, so the layouts can be compared directly:

- Embedded Payments · Limited DDA is approved. Limited DDA Payments is proposed as an addition.
- Jane Doe is modified: **two** attributes change, her last name and her email address.
- Alex Smith is proposed for removal.
- Greene Holdings LLC is added as an intermediary owner, and Sam Lee is added beneath it as an
  indirect beneficial owner.

## Option 1 — Changed fields only

Lists nothing but what differs, grouped by party.

```text
Proposed changes                                          4 items

▾ Limited DDA Payments                    ADD    Product
    Limited DDA Payments is proposed as an additional
    Embedded Payments sub-product.

    Approved                     Proposed
    Embedded Payments ·          Embedded Payments ·
    Limited DDA                  Limited DDA Payments

▾ Jane Doe                                MODIFY  2 fields
   ┌────────────┬─────────────────────┬────────────────────────┐
   │ Field      │ Approved            │ Proposed               │
   ├────────────┼─────────────────────┼────────────────────────┤
   │ Last name  │ Doe                 │ Diaz                   │
   │ Email      │ jane.doe@vendor.exa │ jane.diaz@vendor.exam  │
   └────────────┴─────────────────────┴────────────────────────┘

▸ Alex Smith                              REMOVE  1 field
▸ Greene Holdings LLC                     ADD     4 fields
▸ Sam Lee                                 ADD     5 fields
```

**Best for:** fast, precise validation of every changed value.
**Trade-off:** unchanged profile context stays out of view, so a reviewer cannot tell whether an
attribute was deliberately left alone or simply forgotten.

## Option 2 — Highlighted profile

One profile, rendered as it will read after approval, with changed attributes marked in place.

```text
Proposed profile                                    2 highlighted

Products
[Embedded Payments · Limited DDA]
[Embedded Payments · Limited DDA Payments · Added]
────────────────────────────────────────────────────────────────

Marketplace Vendor LLC                             Organization
  Legal business name    Doing business as
  Marketplace Vendor     Marketplace Vendor
  LLC

  Business address       Email
  85 Mercer Street       ops@vendor.example
────────────────────────────────────────────────────────────────

Jane Diaz                                        2 changed
  Name · CHANGED                     Date of birth
  ┃ Jane Diaz                        ••/••/1984
  ┃ Approved value: Jane Doe

  Job title                          Roles
  Chief executive officer            Controller, beneficial owner

  Email · CHANGED
  ┃ jane.diaz@vendor.example
  ┃ Approved value: jane.doe@vendor.example
────────────────────────────────────────────────────────────────

Alex Smith                                Proposed removal
  ...

Sam Lee                                        New party
  ...
```

**Best for:** seeing changes in the context that surrounds them, without reading two profiles.
**Trade-off:** only one state is shown, so removals need a distinct treatment of their own — a removed
party has no proposed state to render.

### Colour rules

Colour is the fastest way to find a change, and the least reliable way to communicate one. Treat it as
an accelerator layered on top of a signal that already works without it.

- Pair every highlight with a text marker, such as a `CHANGED` label on the attribute.
- Keep the approved value visible under the proposed one. "Approved value: Jane Doe" tells the reader
  what changed even in monochrome, and it removes the need to switch layouts to confirm a value.
- Use a left border or an underline in addition to a background tint, so the boundary survives high
  contrast and forced colour modes.
- Give additions, modifications, and removals different colours _and_ different words. Do not rely on
  green and red alone.
- Check contrast on the tinted background, not the white one. Highlighted text is still body text.
- Do not tint a masked value. A partially hidden date of birth reads as an error when it is coloured.
  Mark the label instead.

## Option 3 — Complete profile comparison

Approved and proposed profiles rendered side by side, in full.

```text
┌ Approved profile ──────────────┐  ┌ Proposed profile ──────────────┐
│ Products                       │  │ Products                       │
│ [Embedded Payments ·           │  │ [Embedded Payments ·           │
│  Limited DDA]                  │  │  Limited DDA]                  │
│                                │  │ [Embedded Payments ·           │
│                                │  │  Limited DDA Payments ·        │
│                                │  │  Proposed]                     │
│                                │  │                                │
│ Marketplace Vendor LLC         │  │ Marketplace Vendor LLC         │
│ 85 Mercer Street               │  │ 85 Mercer Street               │
│                                │  │                                │
│ Jane Doe          [Approved]   │  │ Jane Diaz         [2 changes]  │
│ jane.doe@vendor.example        │  │ jane.diaz@vendor.example       │
│                                │  │                                │
│ Alex Smith  [Proposed removal] │  │ (removed)                      │
│                                │  │                                │
│ (not present)                  │  │ Sam Lee          [New party]   │
└────────────────────────────────┘  └────────────────────────────────┘
```

**Best for:** holistic or legal review of the complete client profile, and for reviewers who need to
confirm that something did **not** change.
**Trade-off:** repeats unchanged data, becomes long on mobile, and makes the reader do the diffing.

## Option 4 — Request task view

The draft presented as a checklist of tasks.

```text
Changes grouped by task                              NEW

This request groups all 10 draft changes into 4 tasks.

▸ Limited DDA Payments      ADD      Product task
▸ Jane Doe                  MODIFY   2 changes
▸ Alex Smith                REMOVE   1 change
▸ Greene Holdings LLC       ADD      4 changes
▸ Sam Lee                   ADD      5 changes
```

Expanding a task shows the same comparison the other layouts use:

```text
▾ Jane Doe                  MODIFY   2 changes
    Last name    Doe                    → Diaz
    Email        jane.doe@vendor.exa    → jane.diaz@vendor.exa
```

**Best for:** task-oriented and mobile workflows, and for reviewers working through changes in
sequence rather than scanning them.
**Trade-off:** a reviewer must expand a party before seeing any value, so nothing is verifiable at a
glance.

## Choosing a layout

| Layout                      | Choose it when                                                                   |
| --------------------------- | -------------------------------------------------------------------------------- |
| Changed fields only         | The reviewer is verifying data entry, and volume is low                          |
| Highlighted profile         | The reviewer needs surrounding context to judge whether a change is correct      |
| Complete profile comparison | A second party reviews the profile, or the reviewer must confirm what stayed put |
| Request task view           | The reviewer works on a small screen, or the draft is large                      |

A host does not have to choose once. Offering two layouts behind a control is reasonable, provided
both read the same change set. What is not reasonable is letting the layouts disagree: if one shows a
value the other omits, the reviewer has no way to know which to trust.

## Terminology

Use one vocabulary across every layout.

| Concept                          | Use              | Avoid                   |
| -------------------------------- | ---------------- | ----------------------- |
| The value in effect today        | Approved         | Current, existing, live |
| The value awaiting review        | Proposed         | New, updated, pending   |
| The act of asking for the change | Requested        | Submitted, applied      |
| A party being taken off          | Proposed removal | Deleted, deactivated    |

"Approved" and "proposed" describe the two states the reader is comparing, and they carry no
implication that the change has taken effect. Reserve "requested" for the action, not the value.

## Responsive rules

- Render each comparison as an `Approved` / `Proposed` definition stack below the table breakpoint.
  Two-column tables truncate values, and truncated values cannot be verified.
- Stack the two profiles in the comparison layout rather than shrinking them.
- Keep the ownership chain together. An indirect owner and the intermediary it sits beneath must not
  be separated across a scroll boundary.
- Keep the primary action reachable without scrolling past the full change list on long drafts.

## State-specific interactions

The review step is reachable in more than one state. The layouts do not change; the affordances do.

| State                  | What the review step shows                   | Actions                                      |
| ---------------------- | -------------------------------------------- | -------------------------------------------- |
| Draft not yet sent     | The full change set                          | Continue to attestation, or cancel the draft |
| Submitted for review   | The same change set, read-only               | View only; hide edit and cancel controls     |
| More information asked | The change set plus the outstanding tasks    | Complete each task; the change set is fixed  |
| Approved, not live     | Approval confirmed, values not yet published | None; explain the publication delay          |

Once a proposal reaches a terminal state, drop it from the overlay and return the reader to the
approved profile. Do not leave an approved change highlighted while waiting for it to be published —
the highlight says "not yet in effect", which is no longer what the reader needs to know.

## Reference implementation

The showcase application renders all four layouts over one shared change set, at the
`/approved-client-maintenance` route.
