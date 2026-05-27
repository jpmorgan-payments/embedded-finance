# Indirect Ownership — UI Feature Spec vs Implementation Gap Analysis

> Generated from [Confluence: Handling Indirect Ownership](https://confluence.prod.aws.jpmchase.net/confluence/spaces/SMBDO/pages/4320669271/Handling+Indirect+Ownership) (page + 3 children) compared against the `IndirectOwnership` component in `embedded-components`.
>
> **Scope**: This spec covers the **UI component behaviour** and the **API payload it must produce**. Backend processing (CORE transformation, CIP/KYC status lifecycle, Evidence of Ownership PDF generation) is out of scope.

---

## 1. UI Feature Spec (derived from Confluence + PDP)

### 1.1 Definitions

| Term                    | Definition                                                                                         |
| ----------------------- | -------------------------------------------------------------------------------------------------- |
| **Indirect Owner**      | An individual holding ≥25% ownership in the business being onboarded, through another organization |
| **Intermediary Owner**  | A business entity through which a Beneficial Owner holds ownership of the entity being onboarded   |
| **Nature of Ownership** | `"Direct"` (default) or `"Indirect"` — set on each Beneficial Owner party                          |
| **Parent Party**        | `parentPartyId` links a party to its immediate parent in the ownership chain                       |

### 1.2 UI Flow — Two-Page Architecture

The indirect ownership flow spans two wizard pages. The first page lets the user declare the **ownership structure** (who owns what, through whom). The second page collects **detailed information** for each party identified in the structure.

#### Page 1 — Ownership Structure Builder (reuses `IndirectOwnership` component)

This page is the existing `IndirectOwnership` component, enhanced with a gating question.

1. **Gating question** (embedded within the component): _"Do you have any business entities (e.g., corporations, trusts, or partnerships) that own 25% or more of your business?"_
   - If **No** → component operates in direct-ownership-only mode (no intermediary chain building needed)
   - If **Yes** → full indirect ownership flow is enabled
2. **Add Beneficial Owners** — user adds individuals (first name + last name) with Direct/Indirect toggle
3. **Build intermediary chains** — for Indirect BOs, user builds the ownership chain via the HierarchyBuilder, naming each intermediary entity in the chain
4. **Output** — a complete, structured list of all parties that need detailed information collected:
   - Direct Beneficial Owners (individuals)
   - Indirect Beneficial Owners (individuals)
   - Intermediary Owners (organizations from the hierarchy chains)

Each party in the output list has: name, party type (individual/organization), role (BENEFICIAL_OWNER/INTERMEDIARY_OWNER), ownership type (Direct/Indirect), and position in the ownership chain (`parentPartyId` references).

**What the component already handles well:**

- BO list with Direct/Indirect toggle
- Hierarchy chain builder with entity combobox
- Circular ownership prevention, duplicate prevention
- 25% threshold calculation tooltip
- Validation summary (complete/pending/error)
- User journey tracking events

**What needs to be added to the component:**

- The gating question ("Do you have business entities ≥25%?")
- `AddOwnerDialog` must support business entity BOs (not just individuals)
- Hierarchy steps must be promoted to first-class intermediary owner records in the output
- Output must include `natureOfOwnership`, `roles`, and `parentPartyId` per party

#### Page 2 — Detail Collection (new wizard step)

This page shows the party list produced by Page 1 as clickable cards. Users click into each to provide the detailed information required for submission.

**For Individual Beneficial Owners** (Direct or Indirect):

Standard individual fields already collected by `BeneficialOwnerStepForm`:

- Date of birth, residential address, country of residence
- SSN / individual IDs
- `natureOfOwnership`: `"Direct"` or `"Indirect"` (pre-populated from Page 1)

**For Intermediary Owners** (organizations):

| Field                | Required | Notes                                |
| -------------------- | -------- | ------------------------------------ |
| Organization Name    | Yes      | Pre-populated from Page 1 chain step |
| Organization Type    | Yes      | Legal classification (e.g., C Corp)  |
| Organization IDs     | Yes      | EIN or org ID (type, value, issuer)  |
| Address              | Yes      | Legal business address               |
| Country of Formation | Yes      | Country where the entity was formed  |
| Ownership Percentage | Yes      | % ownership of root client (1–100)   |

**Card status indicators:**

- ⬜ Not started — no details collected yet
- 🔶 Incomplete — partial details
- ✅ Complete — all required fields filled

The user can only proceed to the next wizard step when all cards are complete.

#### UI Layout Rules

- Page 1: Each BO is a card/expandable section with nested intermediaries visible as chain steps
- Page 2: Flat list of all parties as clickable cards, grouped by type (BOs first, then intermediaries)
- Edit/Delete on each party from either page
- **Max 10** Intermediary Owners per Beneficial Owner (enforced on Page 1)

### 1.3 Ownership Rules (UI-enforced)

| Rule               | Detail                                                                                                |
| ------------------ | ----------------------------------------------------------------------------------------------------- |
| Default ownership  | If user doesn't select, default to `"Direct"`                                                         |
| Indirect trigger   | Selecting `"Indirect"` for a BO must prompt for ≥1 Intermediary Owner                                 |
| Intermediary type  | Only Organizations can be Intermediary Owners (no individuals)                                        |
| Max intermediaries | 10 per Beneficial Owner                                                                               |
| Ownership % range  | 1–100 (integer); reject values outside this range                                                     |
| 25% threshold      | UI should indicate whether the indirect ownership chain meets the ≥25% beneficial ownership threshold |

### 1.4 Payload the UI Must Produce

When the user submits, the UI must produce party payloads suitable for `POST /clients` and `POST /parties`:

#### Direct Beneficial Owner payload

```jsonc
// Included in POST /clients alongside root business + controller
{
  "partyType": "INDIVIDUAL",
  "roles": ["BENEFICIAL_OWNER"],
  "individualDetails": {
    "firstName": "Monica",
    "lastName": "Geller",
    "natureOfOwnership": "Direct"
    // ... standard individual fields (DOB, address, SSN, etc.)
  }
}
```

#### Intermediary Owner payload

```jsonc
// POST /parties — parentPartyId = root client party ID
{
  "partyType": "ORGANIZATION",
  "parentPartyId": "<root-client-party-id>",
  "roles": ["INTERMEDIARY_OWNER"],
  "organizationDetails": {
    "organizationName": "Central Park Cookie",
    "organizationType": "C_CORPORATION",
    "organizationIds": [
      { "idType": "EIN", "value": "050110294", "issuer": "US" }
    ],
    "addresses": [{ "addressType": "LEGAL_ADDRESS" /* ... */ }],
    "countryOfFormation": "US",
    "natureOfOwnership": "Direct" // relative to its own parent
  }
}
```

#### Indirect Beneficial Owner payload

```jsonc
// POST /parties — parentPartyId = the intermediary owner's party ID
{
  "partyType": "INDIVIDUAL",
  "parentPartyId": "<intermediary-owner-party-id>",
  "roles": ["BENEFICIAL_OWNER"],
  "individualDetails": {
    "firstName": "Rachel",
    "lastName": "Green",
    "natureOfOwnership": "Indirect"
    // ... standard individual fields
  }
}
```

#### Key payload rules

- Indirect parties are created via separate `POST /parties` calls (not in the initial `POST /clients`)
- `parentPartyId` must be set to the **immediate parent** in the ownership chain
- Multiple intermediaries for one BO are created **in order** from closest-to-root outward
- `ownershipPercentage` (1–100) is set on each Intermediary Owner party

### 1.5 UI Test Scenarios (from Confluence)

| #   | Scenario                                                                      |
| --- | ----------------------------------------------------------------------------- |
| 1   | 1 Direct BO + 1 Indirect BO with intermediary chain                           |
| 2   | Indirect BO with >10 intermediary owners → validation error                   |
| 3   | Edit intermediary owner details before submission                             |
| 4   | Intermediary owner without a linked Beneficial Owner → validation error       |
| 5   | 1 BO + 1 intermediary with partial info (Name, Address, Country of Formation) |
| 6   | Intermediary owner with `natureOfOwnership = "Direct"` → accepted             |
| 7   | `ownershipPercentage > 100` → validation error                                |

---

## 2. Current Implementation Summary

### 2.1 Component Architecture

The `IndirectOwnership` component exists as a **standalone component** at `src/core/IndirectOwnership/` with:

| Layer          | Files                                                                                                                                                                                         |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Main component | `IndirectOwnership.tsx` (~1,765 lines)                                                                                                                                                        |
| Types          | `IndirectOwnership.types.ts`, `IndirectOwnership.internal.types.ts`, `types/types.ts`                                                                                                         |
| Sub-components | `AddOwnerDialog`, `HierarchyBuilder`, `EntityCombobox`, `OwnershipChainRenderer`, `OwnershipCalculationsTooltip`, `OwnershipTypeSelector`, `ValidationSummary`, `OwnershipTree`, `EntityForm` |
| Hooks          | `useIndirectOwnership()`, `useOwnershipValidation()`, `useExistingEntities()`                                                                                                                 |
| Utils          | `openapi-transforms.ts`, `hierarchyIntegrity.ts` (+ 2 alternate implementations), `utils.ts`                                                                                                  |
| Tests          | Component tests, transform tests, hierarchy integrity tests, circular prevention tests, duplicate prevention tests                                                                            |
| Docs           | `README.md`, `FUNCTIONAL_REQUIREMENTS.md`                                                                                                                                                     |

### 2.2 What IS Implemented

| Feature                                               | Status     | Notes                                                         |
| ----------------------------------------------------- | ---------- | ------------------------------------------------------------- |
| Direct/Indirect ownership type selection              | ✅ Done    | Radio selector in AddOwnerDialog                              |
| Add individual beneficial owner                       | ✅ Done    | First name, last name, ownership type                         |
| Add business entity beneficial owner                  | ✅ Done    | Business name, ownership type                                 |
| Ownership hierarchy chain builder                     | ✅ Done    | Multi-step chain from owner → root business                   |
| Entity combobox with existing entity search           | ✅ Done    | Suggests existing parties                                     |
| Circular ownership prevention                         | ✅ Done    | Prevents entity from appearing twice in chain                 |
| Intermediary prevention                               | ✅ Done    | Prevents entity from being both intermediary and direct owner |
| Duplicate entity prevention                           | ✅ Done    | Duplicate name detection                                      |
| 25% threshold calculation display                     | ✅ Done    | Tooltip explaining multiplication along chain                 |
| Validation summary (total, complete, pending, errors) | ✅ Done    | Real-time validation with `canComplete` flag                  |
| Remove owner with confirmation                        | ✅ Done    | Dialog confirmation + analytics event                         |
| Read-only mode                                        | ✅ Done    | Disables all mutations                                        |
| User journey tracking events                          | ✅ Done    | 7 tracked events (view, add, edit, remove)                    |
| i18n support                                          | ✅ Partial | `en-US`, `es-US`, `fr-CA` — limited keys                      |
| `parentPartyId`-based hierarchy derivation            | ✅ Done    | Reads from API party data                                     |
| Ownership percentage in hierarchy steps               | ✅ Done    | `metadata.ownershipPercentage` on `HierarchyStep`             |
| Storybook stories                                     | ✅ Done    | Multiple variants                                             |

### 2.3 What is NOT Implemented / Gaps

#### Page 1 gaps (Ownership Structure Builder — enhancements to existing component)

| Feature                                      | Status          | Gap Details                                                                          |
| -------------------------------------------- | --------------- | ------------------------------------------------------------------------------------ |
| **Gating question**                          | ❌ Missing      | No "Do you have business entities that own 25% or more?" prompt within the component |
| **AddOwnerDialog supports individuals only** | ⚠️ Schema gap   | Zod schema validates `firstName`/`lastName` only — no business entity fields         |
| **Max 10 intermediaries enforcement**        | ⚠️ Configurable | `OwnershipConfig` max depth ≠ max intermediaries per BO                              |
| **Hardcoded demo data**                      | ⚠️ Tech debt    | `openapi-transforms.ts` has hardcoded "Ross"/"Rachel" percentages                    |

#### Page 1 output gaps (structured party list the component must produce)

| Feature                                    | Status     | Gap Details                                                                                   |
| ------------------------------------------ | ---------- | --------------------------------------------------------------------------------------------- |
| **`natureOfOwnership` in output**          | ❌ Missing | Internal `ownershipType` not mapped to `"Direct"` / `"Indirect"` in output                    |
| **`INTERMEDIARY_OWNER` role in output**    | ❌ Missing | Hierarchy steps not promoted to party records with `roles: ["INTERMEDIARY_OWNER"]`            |
| **`parentPartyId` chaining in output**     | ❌ Missing | Component doesn't produce parent-child references for submission                              |
| **Hierarchy steps as first-class parties** | ❌ Missing | Steps are lightweight (name + type only) — need to become full party stubs in the output list |

#### Page 2 gaps (Detail Collection — entirely new)

| Feature                                     | Status     | Gap Details                                                                      |
| ------------------------------------------- | ---------- | -------------------------------------------------------------------------------- |
| **Detail collection page**                  | ❌ Missing | No wizard step that shows the party list as clickable cards for detail entry     |
| **Intermediary owner form**                 | ❌ Missing | No form collecting Org Type, Org IDs, Address, Country of Formation, Ownership % |
| **Ownership percentage validation (1–100)** | ❌ Missing | No validation for the percentage field                                           |
| **Card completion status**                  | ❌ Missing | No per-party completion tracking on the detail collection page                   |

#### Integration gaps

| Feature                                    | Status     | Gap Details                                                                                                                                |
| ------------------------------------------ | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **OnboardingFlow integration**             | ❌ Missing | `IndirectOwnership` component not wired into the `owners-section` of `OnboardingFlow`                                                      |
| **`natureOfOwnership` fieldMap unlock**    | ❌ Missing | `fieldMap.ts` hardcodes `natureOfOwnership` to `"Direct"` with `submitWhenHidden: true` — must become conditional when indirect is enabled |
| **`ownershipPercentage` in final payload** | ❌ Missing | Detail form must include percentage in the final party payload                                                                             |

---

## 3. Gap Summary Matrix

| #   | Area          | Requirement                                                     | Priority | Notes                                                                                            |
| --- | ------------- | --------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------ |
| 1   | Integration   | Wire `IndirectOwnership` into `OnboardingFlow` `owners-section` | P0       | Component exists in isolation; `OwnersSectionScreen` is the fork point                           |
| 2   | Integration   | Make `natureOfOwnership` fieldMap rule conditional              | P0       | Currently hardcoded `"Direct"` + `submitWhenHidden`; must allow `"Indirect"` when feature active |
| 3   | Page 1        | Gating question for business entities ≥25%                      | P1       | Embedded within the component                                                                    |
| 4   | Page 1        | `AddOwnerDialog` business entity support                        | P1       | Schema only handles individuals                                                                  |
| 5   | Page 1 output | `natureOfOwnership` in structured output                        | P1       | Map internal type to `"Direct"` / `"Indirect"`                                                   |
| 6   | Page 1 output | `INTERMEDIARY_OWNER` role in structured output                  | P1       | Promote hierarchy steps to party stubs                                                           |
| 7   | Page 1 output | `parentPartyId` chaining in structured output                   | P1       | Parent-child references for submission                                                           |
| 8   | Page 2        | Detail collection page (new wizard step)                        | P1       | Clickable cards for each party                                                                   |
| 9   | Page 2        | Intermediary owner form (full required fields)                  | P1       | Org Type, Org IDs, Address, Country, Pct                                                         |
| 10  | Page 2        | `ownershipPercentage` validation (1–100)                        | P2       | Simple range validation                                                                          |
| 11  | Page 1        | Max 10 intermediaries per BO                                    | P2       | Chain depth ≠ intermediary count                                                                 |
| 12  | Page 1        | Remove hardcoded demo data from transforms                      | P2       | Ross/Rachel hardcoded percentages                                                                |

---

## 4. What the OnboardingFlow Currently Does

The active `OnboardingFlow` (config-driven, section-based architecture) handles beneficial owners via:

- **`owners-section`** — A standalone section with `excludedForOrgTypes: ['SOLE_PROPRIETORSHIP']`; rendered by `OwnersSectionScreen`
- **`OwnersSectionScreen`** — Displays owner cards (controller + BOs) with add/edit/remove; navigates to `owner-stepper` for detail collection
- **`owner-stepper`** — Multi-step form for individual owner details (personal info, identity, contact, address)
- **`natureOfOwnership` in `fieldMap.ts`** — Hardcoded to `"Direct"` with `display: 'hidden'` and `submitWhenHidden: true` on the `owner-stepper` screen. Comment states: _"The API rejects 'Indirect' when the parent party role is CLIENT, which is always the case in this onboarding flow."_
- **No intermediary owner form** — No organization party collection; no `IndirectOwnership` component reference
- **No feature-flag-gated steps** — The `enablePubliclyTradedCompanies` pattern was removed; `FlowContext` no longer conditionally filters sections/steps based on feature flags

The flow config (`flowConfig.ts`) is now a flat section list with only `excludedForOrgTypes` for conditional visibility. Any new conditional behaviour must either:

1. Re-introduce feature-flag filtering in `FlowContext` (new pattern)
2. Be handled **inside** the section's component (e.g., `OwnersSectionScreen` checks a prop and forks its rendering)

The `IndirectOwnership` component and the `OnboardingFlow` are **two completely separate implementations** that don't share code or state.

> **Note:** `OnboardingWizardBasic` (legacy stepper) still exists but is not the target for new feature work.

---

## 5. Recommended Integration Path

### Phase 1: Enhance the IndirectOwnership Component (Page 1)

- Add the gating question ("Do you have business entities ≥25%?") within the component
- Extend `AddOwnerDialog` to support business entity BOs (org name, entity type selector)
- Promote hierarchy steps to first-class party stubs in the component's output
- Output must include `natureOfOwnership`, `roles`, and `parentPartyId` per party
- Fix max 10 enforcement (intermediary count, not chain depth)
- Remove hardcoded demo data from transforms

### Phase 2: Build Detail Collection Page (Page 2)

- New wizard step rendering the party list from Page 1 as clickable cards
- Individual BO cards → reuse existing owner-stepper form fields
- Intermediary Owner cards → new organization form (Org Type, Org IDs, Address, Country of Formation, Ownership %)
- Per-card completion status tracking (not started / incomplete / complete)
- `ownershipPercentage` validation (1–100)
- Block wizard progression until all cards are complete

### Phase 3: Wire into OnboardingFlow

Integration target: `OwnersSectionScreen` within the `owners-section` of `OnboardingFlow`.

**Approach A — Component-internal fork (preferred, matches current main patterns):**

- Add `enableIndirectOwnership?: boolean` to `OnboardingConfigUsedInContext`
- `OwnersSectionScreen` reads the flag and, when enabled, renders the `IndirectOwnership` component as the ownership structure builder before/instead of the current flat owner-card list
- The gating question ("Do you have business entities ≥25%?") lives inside the component — if user answers No, fall back to the existing direct-only flow
- No changes to `FlowContext` section filtering required (section stays unconditionally visible for non-sole-prop orgs)

**Approach B — FlowContext filtering (re-introduces removed pattern):**

- Add `enableIndirectOwnership` flag + conditional step injection in `FlowContext`
- Add a new `indirect-ownership-structure` step to the `owners-section` `stepperConfig`
- Filter it out when the flag is off
- **Downside**: Re-introduces complexity that was intentionally removed from main

**`natureOfOwnership` fieldMap change (required for both approaches):**

```typescript
// fieldMap.ts — natureOfOwnership conditionalRules for owner-stepper
{
  condition: { screenId: ['owner-stepper'] },
  rule: {
    // When indirect ownership is active, this value comes from the
    // IndirectOwnership component output (Direct or Indirect per party).
    // When inactive, default to 'Direct' as before.
    display: 'hidden',
    submitWhenHidden: true,
    required: false,
    defaultValue: 'Direct', // overridden per-party when indirect flow is active
  },
}
```

**Party creation flow:**

- Direct BOs → created via existing `POST /parties` from owner-stepper (unchanged)
- Intermediary Owners → new `POST /parties` calls with `partyType: "ORGANIZATION"`, `roles: ["INTERMEDIARY_OWNER"]`, `parentPartyId` = root client party
- Indirect BOs → `POST /parties` with `parentPartyId` = intermediary party ID, `natureOfOwnership: "Indirect"`
- Intermediary + Indirect BO parties created **in order** from closest-to-root outward

### Phase 4: Polish

- Full i18n coverage for gating question, new form fields, card labels
- Test scenario coverage per Confluence test cases (section 1.5)
- Storybook stories for both pages
- Move `IndirectOwnership` stories from `Beta/` back to `Core/` once integrated

---

## Sources

- [Confluence: Handling Indirect Ownership](https://confluence.prod.aws.jpmchase.net/confluence/spaces/SMBDO/pages/4320669271/Handling+Indirect+Ownership) (v46)
- [Confluence: Indirect Ownership Documentation](https://confluence.prod.aws.jpmchase.net/confluence/pages/viewpage.action?pageId=4449792392) (v9)
- [Confluence: UI Design spec for Indirect ownership](https://confluence.prod.aws.jpmchase.net/confluence/pages/viewpage.action?pageId=5411426305) (v1)
- [Confluence: Test Case for Indirect Ownership](https://confluence.prod.aws.jpmchase.net/confluence/pages/viewpage.action?pageId=5417443903) (v1)
- [PDP: Collect indirect ownership information](https://developer.payments.jpmorgan.com/docs/embedded-finance-solutions/embedded-payments/capabilities/onboard-a-client/how-to/indirect-ownership)
- Codebase: `embedded-components/src/core/IndirectOwnership/`
- Codebase: `embedded-components/src/core/OnboardingWizardBasic/BeneficialOwnerStepForm/`
