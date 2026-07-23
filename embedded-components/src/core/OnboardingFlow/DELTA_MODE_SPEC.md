# OnboardingFlow — Delta Mode Specification

Requirements and behaviour for **delta mode**: a distilled completion path for pre-created clients that already have rich `GET /clients/:id` data and only a small number of fields left to finish.

Derived from product discussion (July 2026). Implementation lives under `src/core/OnboardingFlow/`.

---

## 1. Purpose

When a host already holds a nearly complete client (parties, identity, owners, etc.) and only a few fields remain outstanding, delta mode should:

1. Open directly on the **review** experience (not overview / gateway).
2. Let the user complete **all remaining fields on one screen**.
3. Combine **acknowledgement / terms** into that same screen.
4. Submit with a **single primary action** (agree and finish).

Delta mode is intended **only** when client data from GET client is already rich. It is not a substitute for full onboarding from an empty client.

---

## 2. Configuration

### 2.1 Public prop

| Prop        | Type                                                           | Description                                               |
| ----------- | -------------------------------------------------------------- | --------------------------------------------------------- |
| `deltaMode` | `boolean` \| `{ enabled: boolean; maxPendingFields?: number }` | Host opt-in. `true` is shorthand for `{ enabled: true }`. |

### 2.2 Defaults

| Setting            | Default | Notes                                                                                     |
| ------------------ | ------- | ----------------------------------------------------------------------------------------- |
| `enabled`          | —       | Must be explicitly enabled by the host.                                                   |
| `maxPendingFields` | `5`     | Configurable. Delta mode activates only when the pending-field count is **≤** this value. |

### 2.3 Activation gate

Delta mode is **active** only when all of the following hold:

- Host set `deltaMode` to enabled (`true` or `{ enabled: true }`).
- A client ID is present and client data has loaded.
- Organization type is known (so the flow would otherwise land on overview, not gateway).
- Doc-upload-only mode is **not** enabled.
- PTC gateway is **not** required (unanswered publicly-traded status when PTC is enabled).
- Pending-field count ≤ `maxPendingFields`.

If the host enables the flag but the client has too many pending fields, the flow behaves as the normal (non-delta) path.

**Latching:** Eligibility is evaluated once when `FlowProvider` mounts (after the initial client fetch settles) and is passed into context as `deltaModeActive`. It must **not** flip mid-session if the pending-field count later crosses the threshold after saves — otherwise the Terms step would vanish and review would morph into delta while the user is already in the normal flow.

### 2.4 Pending-field counting (eligibility)

Count without running full Zod schemas (eligibility must be safe outside React form context):

- Each ID in `client.outstanding.questionIds`
- Missing US business EIN (`organizationIds` empty on US org)
- Missing US controller tax ID (`individualIds` empty on US controller)
- Missing controller `birthDate`
- For each **non-controller** active beneficial owner: missing US tax ID and/or missing `birthDate`

Owners who are also the controller are counted via the controller rules above (not double-counted as a separate owner for tax ID / birthdate).

---

## 3. Entry and navigation

| Behaviour               | Requirement                                                                                                                         |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Initial screen          | `review-attest-section`                                                                                                             |
| Initial stepper step    | `review`                                                                                                                            |
| Terms / documents step  | **Hidden** while delta mode is active (acknowledgement is merged into review)                                                       |
| Review header (delta)   | Compact: no Overview breadcrumb / “Step X of Y”. Title **Finish your application**; short description of complete → review → agree. |
| Sidebar                 | Unchanged structurally; section statuses reflect delta rules (see §4)                                                               |
| Priority vs `flowEntry` | When delta mode is eligible, it takes precedence over `flowEntry` for initial screen (same pattern as `docUploadOnlyMode`)          |

---

## 4. Section status overrides

### 4.1 Owners

While delta mode is active:

- The **owners** section is treated as **complete** for progress / review gating, regardless of whether the user previously clicked Continue on the owners hub and regardless of incomplete owner party validation for timeline purposes of “blocking review.”
- Missing owner fields that are still required for submission are collected **inline on the delta review panel** (see §5), not by forcing the user through the owners stepper first.

### 4.2 Other sections

Personal, business, and operational sections continue to use existing validation / outstanding-question rules. Incomplete fields appear as missing in the review accordion **and** as editable controls in the pending panel.

---

## 5. Review screen — pending fields

### 5.1 Placement

At the **top** of the review content (above the full-data accordion), show pending-field group cards directly (no extra panel heading — the page header already explains the task). The gateway **Business type** card is hidden in delta mode (org type is already known).

### 5.2 Detection (GET client → Zod)

Pending **party** fields are **not** a hardcoded whitelist. They are derived from the live `GET /clients/:id` payload:

1. Convert each relevant party (`convertPartyResponseToFormValues`) from client parties.
2. Run the same step schemas used elsewhere via `getStepperValidation` (personal / business / owner steppers).
3. Collect every Zod issue path on invalid form steps and map it to an editable control (`issuePathToFormPath`).

> **Implementation — hook-safe schemas.** `step.Component.schema()` is hook-based
> (it calls `useGetValidationMessage`), so it must run a **constant** number of
> times per render. The panel builds every step schema **once** via
> **`useStableStepSchemas()`** — from the **unfiltered** step set
> (`FlowContext.allSections`), keyed by the step object — and passes that
> `StepSchemaMap` into `getStepperValidation`, which then runs pure `safeParse`
> (no schema hooks). This keeps the schema-hook count fixed even when a step's
> `isVisible` toggles (e.g. `identity-document` for a US-exchange PTC) or the
> owner count changes, avoiding a Rules-of-Hooks ("change in the order of Hooks")
> violation. The same map is shared with `getFlowProgress` for section-status
> validation, so both surfaces stay consistent.

So **any** field that the normal onboarding step schemas treat as missing/invalid for that client can appear in the panel — EIN, SSN, birthdate, email, phone leaf, address leaf, name fields, industry, etc.

Outstanding **operational questions** still come from `client.outstanding.questionIds` (plus the question tree), not from party Zod.

**Eligibility counting** (`countPendingOnboardingFields`) remains a lighter heuristic (questions + EIN + controller/owner tax ID + birthDate) used only to decide whether delta mode activates. Panel contents are the full Zod-driven set.

### 5.3 Grouping

Group each pending party field under its **section + step**, so the user can map the control to the normal flow:

| Example                          | Grouping                                                    |
| -------------------------------- | ----------------------------------------------------------- |
| Controller SSN / ID value        | Personal details → Your ID details (identity document step) |
| Controller birthdate             | Personal details → Your personal details                    |
| Business EIN                     | Business details → corresponding identity step              |
| Owner SSN (non-controller)       | Owners · {Owner name} → Identity document                   |
| Outstanding questions            | Operational details                                         |
| Any other Zod-invalid party leaf | The step whose schema reported the issue                    |

Each group card shows a single-line group label (section, plus owner name when applicable) followed by the editable field(s). Panel chrome stays compact (see §5.5) — no stacked section + step titles.

**Field rendering is descriptor-driven.** Each pending field renders from its `partyFieldMap` **presentation** descriptor (`FieldPresentation` in `types/form.types.ts`), reusing the same controls and styling as the normal onboarding forms — not ad-hoc per-field code:

- **Simple fields** (text, date, number, phone, `industrySelect`, textarea, …) render via `OnboardingFormField`, which resolves input type / mask / content tokens from the descriptor.
- **Composite editors** render as their full shared widget, identical to the stepper:
  - Address → `AddressFields` (country + lines + city + state + postal, including the fieldset legend).
  - Identity (ID type + value + “Use a different ID type”) → `ControllerIdFields`.
  - Because one missing composite surfaces as several Zod leaf issues (e.g. `individualAddress.city`, `.state`, …), `dedupeCompositeFields` collapses them to **one** editor per composite field so the block is not stacked / duplicated. A composite therefore counts as a **single** item for progress (see §5.5).
- **Option-based fields** (country of residence / formation, job title, …) render as a real select / combobox via the descriptor's `optionsSource` (`'countries'` | `'jobTitles'`), not a plain text box.
- **Dependent (revealed) fields**: when a parent value reveals another field (e.g. `jobTitle: 'Other'` → `jobTitleDescription`), the descriptor's `revealsFields` drives a reactive `DeltaRevealedFields` block — the revealed field renders, validates, and counts toward completion once shown.
- **Custom tooltips** (industry classification, business / organization description) are preserved via the shared `useIndustryTooltip` / `useOrganizationDescriptionTooltip` hooks.

**Content tokens for owners.** Owner fields render on the `overview` screen but must show owner-specific copy (e.g. “Owner's personal address”). The panel resolves tokens against the `'owner-stepper'` screen — `OnboardingFormField`'s `logicalName` + `screenIdOverride`, and `AddressFields`' `contentScreenId` — so labels / legends match the owner stepper.

### 5.4 Operational questions

Outstanding questions from `client.outstanding.questionIds` render with the same question tree / input types as the operational details screen (including money inputs, booleans, etc.).

### 5.5 Full review accordion

Keep the existing review accordion (gateway / personal / business / owners / operational) so the user can still **overview all existing data**. Pending fields are highlighted there as today; the pending panel is the place to **enter** them without leaving the screen.

While the user fills pending fields, accordion section status, **sidebar timeline** section/step indicators, and field-level “missing” warnings update **live** from the delta form values (before submit / client refetch): orange → green as each section’s Zod validation becomes valid, and outstanding questions clear when answered in the panel.

Pending-panel field groups stay visible after entry; their card border flips from warning (orange) to success (green). Do **not** hide completed fields from the panel.

Panel chrome is compact: one panel heading, one single-line label per group (no stacked section + step titles / duplicate operational headings). There is **no** separate progress-bar / “step X of Y” tracker; per-group completion is shown by the card border (orange → green), and any remaining-item messaging counts **logical fields** (a composite = one item), not steps.

**Non-breaking / delta-only:** Live overlays, accordion green-as-you-type, and pending-panel border updates apply **only when delta mode is active**. The normal onboarding path continues to use `savedFormValues` + client data exactly as before; operational-questions section status remains driven solely by `client.outstanding.questionIds` outside delta mode.

### 5.6 Save on finish

On primary submit, persist **dirty** pending values before KYC (keys limited to `partyFieldMap`):

- PATCH / update organization party for any dirty org-mapped fields
- Update controller party for any dirty individual-mapped fields
- Update each affected owner party for dirty individual-mapped fields
- Update client `questionResponses` for answered outstanding questions
- Invalidate / refetch client so section status reflects the save

### 5.7 Field defaults and validation timing

- **Defaults**: the delta form is seeded with the **full** party form values from GET client (`convertPartyResponseToFormValues`), so any missing key can be edited — not only the flagged ones. A missing **address country** defaults to `US` (the same default the normal stepper applies via the field map `baseRule.defaultValue`), so the country selector is pre-filled rather than empty.
- **Validation timing**: pending fields validate **on blur** and re-validate **on change**, matching the stepper's feel — an error surfaces after the user leaves a field and clears as soon as they correct it (border flips back to success), without waiting for submit.

## 6. Combined acknowledgement (terms + accuracy)

### 6.1 Merge into review

In delta mode, do **not** show a separate Terms stepper step. Document links and attestation live on the review screen below the data review.

### 6.2 Single checkbox (default / one-document case)

Combine **data accuracy** and **terms agreement** into **one** checkbox when using the default attestation UI (not a host-defined ack list).

In delta mode, render as **one compact card**: short helper text (when docs not yet opened) → document link(s) → checkbox (no separate “Confirm and agree” heading or large info alert).

**Checkbox copy (no platform agreement URL):**

> I confirm that the information I provided is true, accurate, and complete to the best of my knowledge, and that I have read and agree to the J.P. Morgan Account Terms.

**With platform agreement label:** same sentence, appending “and the {platformAgreementLabel}.”

### 6.3 Document gate

- Document link card(s) remain above the checkbox (same open / download behaviour as the Terms step).
- Checkbox stays disabled until required document link(s) (and platform agreement link, if configured) have been opened.
- Helper text:
  - **One document:** “Open and review the document below before selecting the checkbox.” (top of compact card until opened)
  - **Multiple documents:** “Open and review all documents below before selecting the checkbox.” (same placement)

### 6.4 Exceptions (do not force a single checkbox)

- If the host supplies `reviewAttestTermsAcknowledgements`, keep that host-defined list (do not collapse into the combined accuracy+terms sentence).
- If `disclosureConfig` requires authorize-sharing, that checkbox may remain **in addition** to the combined accuracy+terms checkbox.

### 6.5 Primary action

One primary button: **Agree and finish** (same intent as the Terms step’s agree-and-finish). On success: attestations + KYC verification, then navigate to overview (or product-defined post-submit state).

Secondary: previous / back behaviour consistent with review (e.g. return to overview).

---

## 7. Non-goals / out of scope

- Replacing full onboarding for empty or sparse clients
- Changing non-delta review or Terms step UX (except shared document helper copy improvements that apply when reused)
- Auto-enabling delta mode without the host prop
- Forcing delta mode when pending fields exceed `maxPendingFields`

---

## 8. Storybook scenarios

Under **Core → OnboardingFlow → Delta mode** (pre-created LLC, rich GET client):

| Story                               | Pending fields                                                                                            |
| ----------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Operational details only            | Outstanding question `30005` (Total Annual Revenue) only                                                  |
| Operational details + tax IDs       | `30005` + business EIN + controller SSN                                                                   |
| Controller birthdate + 2 owner SSNs | `30005` + controller birthdate + SSN for each of two non-controller beneficial owners (four fields total) |

Helpers used to seed clients must **not** be named CSF exports (Storybook would treat them as stories).

---

## 9. Acceptance criteria

1. With `deltaMode: true` and ≤ `maxPendingFields` pending on a rich LLC client, the flow opens on review (not overview).
2. Owners appear complete in review / timeline gating while delta is active.
3. All pending fields are editable on review, grouped by section/step (and owner name when relevant).
4. Terms step is not shown as a separate step; document + attestation appear on review.
5. Default UI shows a **single** combined accuracy + terms checkbox (plus optional authorize-sharing when disclosure requires it).
6. User can open the document, check the box, and finish with one primary button.
7. When pending fields exceed the configured max, delta behaviour does not activate even if the flag is set.
8. The three Storybook stories above demonstrate the intended LLC cases.

---

## 10. Related docs

- [`FUNCTIONAL_REQUIREMENTS.md`](./FUNCTIONAL_REQUIREMENTS.md) — full OnboardingFlow behaviour
- [`README.md`](./README.md) — package overview
- Types: `OnboardingDeltaModeConfig` / `deltaMode` on `OnboardingConfigUsedInContext` in `types/onboarding.types.ts`
- Utils: `utils/deltaMode.ts` (`resolveDeltaModeConfig`, `countPendingOnboardingFields`, `isDeltaModeActive`)
- Validation / schemas: `utils/flowUtils.ts` (`buildStepSchemas`, `getStepperValidation`, `getStepperValidations`, `getFlowProgress`, `StepSchemaMap`) and `hooks/useStableStepSchemas.ts` (stable, hook-safe schema map built from `FlowContext.allSections`)
- Field rendering: `config/fieldMap.ts` (`partyFieldMap` **presentation** descriptors), `types/form.types.ts` (`FieldPresentation`, `optionsSource`, `revealsFields`, `customEditor`), shared editors `components/AddressFields` + `components/ControllerIdFields`, and tooltip hooks `useIndustryTooltip` / `useOrganizationDescriptionTooltip`
