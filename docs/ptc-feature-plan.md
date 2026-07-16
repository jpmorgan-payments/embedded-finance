# PTC (Publicly Traded Companies) Feature Plan

**Date:** 2026-04-21  
**Last Updated:** 2026-07-16  
**Status:** ✅ **Implemented** (shipped behind `enablePubliclyTradedCompanies` on `OnboardingFlow`; see CHANGELOG v0.14+)

This document remains the design/implementation reference. For consumer usage, see the package README (`OnboardingFlow` props) and Storybook **Core → OnboardingFlow** PTC stories.

---

## Background

A PTC is an organization publicly traded through an exchange. A **subsidiary of a PTC** is an organization where ≥50% of ownership is held by a PTC. The feature is gated behind `enablePubliclyTradedCompanies` so platforms can opt in based on their participant population.

---

## 1. Feature Flag — Prop on `<OnboardingFlow>`

**File:** `OnboardingFlow` props type + context  
**Change:** `enablePubliclyTradedCompanies?: boolean` (default `false`).  
**Propagation:** Threaded through `FlowContext` so all child components can read it.

---

## 2. PTC Entry Questions — Gateway Screen

**Where:** On the **GatewayScreen**, shown inline after organization type selection.  
**Behavior (when flag is `true`):**

**Radio: "Is your organization publicly traded, or a subsidiary of a publicly traded company?"**

- Options rendered dynamically based on org type (`PTC_ELIGIBLE_ORG_TYPES` vs `PTC_SUBSIDIARY_ELIGIBLE_ORG_TYPES`):
  - Org types that can be PTCs directly → "Yes, publicly traded" / "Yes, subsidiary of a PTC" / "No"
  - Org types that can only be subsidiaries → "Yes, subsidiary of a PTC" / "No"
- If **No** or flag is `false`, flow continues as-is (current behavior)
- **Hidden for Sole Proprietorships**

**When "Yes" (either variant) is selected**, the Trading Information fields appear inline (see §3).

Maps to:

- `organizationDetails.publiclyTraded` block in the API
- `organizationDetails.subsidiaryOfPubliclyTraded: true | false`

---

## 3. Trading Information Fields (inline on Gateway)

Shown conditionally after the PTC radio when any "Yes" option is selected:

| Field               | Type             | Required    | Notes                                                                                       |
| ------------------- | ---------------- | ----------- | ------------------------------------------------------------------------------------------- |
| `tickerSymbol`      | Text input       | Yes         | Uppercase, max 10 chars. If subsidiary, this is the **parent PTC's** ticker.                |
| `stockExchange`     | Grouped combobox | Yes         | Grouped by priority: "US Exchanges" (NYSE/NASDAQ first) → "Other Major Exchanges" → "Other" |
| `stockExchangeName` | Text input       | Conditional | Required only when `stockExchange === "OTHER"`                                              |

Labels and descriptions change dynamically based on whether "Publicly Traded" or "Subsidiary" is selected (e.g., "Parent company's ticker symbol").

**Validation:** `GatewayScreenFormSchema` with `refineGatewaySchema` superimposition for conditional requirements.

---

## 4. Field Map & Review

**File:** `config/fieldMap.ts`

### Fields in the map

- `isPTCOrSubsidiary` — virtual field for the radio (maps to `publiclyTraded` + `subsidiaryOfPubliclyTraded`)
- `tickerSymbol` — `organizationDetails.publiclyTraded.tickerSymbol`
- `stockExchange` — `organizationDetails.publiclyTraded.stockExchange`
- `stockExchangeName` — `organizationDetails.publiclyTraded.stockExchangeName`

### Review

PTC info is shown in a dedicated **GatewayReviewCard** at the top of the ReviewForm, with a "Change" button that navigates back to the Gateway screen.

---

## 5. Configurable Section/Step Visibility (`isVisible` predicates)

**Files:** `types/flow.types.ts`, `config/flowConfig.ts`, `contexts/FlowContext/FlowContext.tsx`

Sections and steps use an `isVisible?: VisibilityPredicate` function in their config. FlowContext constructs a `VisibilityContext` (containing `orgParty`) and passes it through — no hard-coded conditionals.

```ts
export interface VisibilityContext {
  orgParty: PartyResponse | undefined;
}
export type VisibilityPredicate = (ctx: VisibilityContext) => boolean;
```

### Current visibility rules (in `flowConfig.ts`):

| Target                              | `isVisible` predicate                                             |
| ----------------------------------- | ----------------------------------------------------------------- |
| `owners-section`                    | `orgType !== 'SOLE_PROPRIETORSHIP' && !isUSExchangePTC(orgParty)` |
| `identity-document` step (personal) | `!isUSExchangePTC(orgParty)`                                      |

**Effect for US-exchange PTCs (XNYS / XNAS):**

- Entire `owners-section` is excluded (beneficial owners not required)
- Entire `identity-document` step is excluded (birthday, SSN, gov IDs not required)
- Controller still collects Name, Address, Job Title via `personal-details` and `contact-details` steps

---

## 6. Gateway Submit Logic

**File:** `GatewayScreen.tsx`

The Gateway submit handler:

- Compares current selections against existing party data (`ptcUnchanged` check including `isSubsidiary`) to skip unnecessary API calls when nothing changed
- Updates org type + PTC data in a single party update request
- When "No" is selected, empty strings are sent for PTC fields (the API does not support null-clearing of `publiclyTraded`)

---

## 7. API Payload Assembly

**File:** Party creation/update utilities  
**Changes:**

- When PTC data is collected, includes `publiclyTraded: { tickerSymbol, stockExchange, stockExchangeName? }` and `subsidiaryOfPubliclyTraded: true|false` in the `organizationDetails` payload
- NAICS gating still applies (PTC/Subsidiary will pass through NAICS gating)

---

## 8. i18n / Content Tokens

**Files:** `en-US/onboarding-overview.json`, `fr-CA/onboarding-overview.json`, `es-US/onboarding-overview.json`

Translation keys added for:

- `isPTCOrSubsidiary` — label, description, `labelSubsidiaryOnly` variant
- `tickerSymbol` — label, placeholder, description, `labelSubsidiary`/`descriptionSubsidiary` variants
- `stockExchange` — label, description, `labelSubsidiary`/`descriptionSubsidiary` variants
- `stockExchangeName` — label, description
- `reviewAndAttest.businessType` — for the review card

---

## 9. Constants & Helpers

**File:** `consts/stockExchanges.ts`

- `MAJOR_STOCK_EXCHANGES` — full list of exchange options (MIC codes + labels)
- `NYSE_NASDAQ_CODES = ['XNYS', 'XNAS']`
- `PTC_ELIGIBLE_ORG_TYPES` — org types that can be PTCs directly
- `PTC_SUBSIDIARY_ELIGIBLE_ORG_TYPES` — org types that can only be subsidiaries
- `isNyseNasdaq(code)` / `isMajorExchange(code)` / `getStockExchangeOptions()`

**File:** `utils/dataUtils.ts`

- `isUSExchangePTC(orgParty)` — returns true when party has publiclyTraded + NYSE/NASDAQ
- `isPTC(orgParty)` — returns true when party has any publiclyTraded data

---

## 10. Tests & Mocks

- **MSW mocks**: Mock responses for PTC organization creation/updates
- **Unit tests**: PTC sub-form rendering, conditional field visibility, payload assembly
- **Integration tests**: Full onboarding flow with PTC enabled vs disabled
- **Edge cases**: Sole Prop never sees PTC option; "Other" exchange conditional field; clearing when toggling

---

## 11. API Limitations & PTC Lock Behavior

### Known API Constraints

The SMBDO API has two limitations that affect PTC handling:

1. **`publiclyTraded` cannot be removed via PATCH** — Once a party's `organizationDetails.publiclyTraded` block is set, there is no supported way to null it out or remove it. Sending empty strings or `null` is rejected.
2. **Client parties cannot be deactivated** — Setting `active: false` on a client party is rejected by the API. This rules out a deactivate-and-recreate approach to clear PTC data.

### UI-Level Prevention (PTC Lock)

Because the API cannot undo PTC status, we prevent the transition at the UI level:

**Implementation (`GatewayScreen.tsx`):**

- `isPTCLocked` flag: Derived from `!!existingOrgParty?.organizationDetails?.publiclyTraded`. When `true`, the user has already submitted PTC data to the API and it cannot be undone.
- **"No" radio option disabled**: The "No" option for the PTC radio is disabled when locked, preventing the user from switching away from PTC/subsidiary.
- **SOLE_PROPRIETORSHIP disabled**: Since sole proprietorships cannot be PTC, the org type block is also disabled when locked (changing to sole prop would be incompatible with existing PTC data).
- **Alert banner**: An informational alert is displayed at the top of the Gateway screen when PTC is locked, explaining that the publicly traded status cannot be changed.
- **Stale-clear guards**: `useEffect` hooks that clear stale form values when selections change are guarded by `!isPTCLocked` to avoid wiping locked data.

**Disabled styling (`OnboardingFormField.tsx`):**

- `radio-group-blocks`: `has-[[disabled]]:eb-cursor-not-allowed has-[[disabled]]:eb-opacity-50 has-[[disabled]]:eb-shadow-none has-[[disabled]]:hover:eb-bg-input`
- `radio-group` labels: Conditional `eb-cursor-not-allowed eb-opacity-50` when `option.disabled` is true.

### Overview & Review Display

- **Overview screen**: Shows PTC details (label, ticker, exchange) when `publiclyTraded` exists. For eligible org types without PTC data, a hint prompt is shown: _"If your company is publicly traded or a subsidiary of one, select Edit to add that information."_
- **Review screen (`GatewayReviewCard`)**: Shows "Publicly traded status" with dot-separated details when PTC, or simply "No" when non-PTC (for eligible org types only).

---

## Summary of Touched Areas

| Area                   | Scope                                                              |
| ---------------------- | ------------------------------------------------------------------ |
| **Props / Config**     | 1 boolean prop (`enablePubliclyTradedCompanies`)                   |
| **Gateway Screen**     | PTC radio (dynamic options) + inline ticker/exchange fields + lock |
| **Visibility system**  | `isVisible` predicates on sections and steps in `flowConfig`       |
| **Field map / Review** | 4 field entries + GatewayReviewCard                                |
| **Section logic**      | `owners-section` + `identity-document` step conditionally excluded |
| **Gateway submit**     | `ptcUnchanged` skip + org type update in single request            |
| **API payload**        | `publiclyTraded` block + `subsidiaryOfPubliclyTraded`              |
| **PTC Lock**           | UI prevents PTC→non-PTC transition (API cannot undo)               |
| **i18n**               | 3 locales (en-US, fr-CA, es-US), ~20 keys                          |
| **Constants/helpers**  | Stock exchange list, PTC-eligible org types, utility predicates    |
| **Tests**              | Unit + integration coverage                                        |
