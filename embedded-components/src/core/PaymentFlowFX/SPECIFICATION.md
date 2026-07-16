# PaymentFlowFX — Implementation Specification

> **Status**: Implemented — maintained as an **as-built** specification.
> **Date**: 2026-07-06 (rev 3 — reconciled with the shipped component)
> **Baseline**: `main` @ v0.16.4
>
> Developer quick-reference: [README.md](./README.md).
>
> This document specifies a new component, **`PaymentFlowFX`** (+ `PaymentFlowFXInline`),
> that preserves **all** existing functional behaviours of
> [`PaymentFlow`](../PaymentFlow/PaymentFlow.tsx) (see
> [REQUIREMENTS.md](../PaymentFlow/REQUIREMENTS.md) and
> [FUNCTIONAL_REQUIREMENTS.md](../PaymentFlow/FUNCTIONAL_REQUIREMENTS.md)) and adds
> cross-border / multicurrency (FX) payouts via **`createTransactionV3`** and the
> **FX Rate Sheet API**.
>
> **Primary sources (all local, verified):**
>
> - [`api-specs/embedded-finance-pub-ep-transactions-3.0.55.yaml`](../../../api-specs/embedded-finance-pub-ep-transactions-3.0.55.yaml) — `createTransactionV3`, `listTransactionsV3`, `getTransactionV3`
> - [`api-specs/fx-rate-sheet-1.0.2.yaml`](../../../api-specs/fx-rate-sheet-1.0.2.yaml) — `getCurrentRatesheet`
> - [`api-specs/embedded-finance-pub-ep-accounts-2.0.47.yaml`](../../../api-specs/embedded-finance-pub-ep-accounts-2.0.47.yaml) — `LIMITED_DDA_PAYMENTS` account category
> - Portal how-to: [Cross-border FX payout](https://developer.payments.jpmorgan.com/docs/embedded-finance-solutions/embedded-payments/capabilities/transactions/payouts/how-to/cross-border-fx-payout)
> - Portal doc: [FX Rate Sheet](https://developer.payments.jpmorgan.com/docs/treasury/fx-rate-sheet/doc)

---

## Table of Contents

1. [Decisions & Hard Constraints](#1-decisions--hard-constraints)
2. [Goals and Non-Goals](#2-goals-and-non-goals)
3. [API Foundation — Verified Schemas](#3-api-foundation--verified-schemas)
4. [Codegen Work (Non-Breaking)](#4-codegen-work-non-breaking)
5. [Component Architecture & Reuse Strategy](#5-component-architecture--reuse-strategy)
6. [Public Props API](#6-public-props-api)
7. [Type & Constant Definitions](#7-type--constant-definitions)
8. [Functional Requirements — Preserved Behaviours](#8-functional-requirements--preserved-behaviours)
9. [Functional Requirements — New FX Behaviours](#9-functional-requirements--new-fx-behaviours)
10. [Validation Rules](#10-validation-rules)
11. [Error Handling](#11-error-handling)
12. [i18n & Content Tokens](#12-i18n--content-tokens)
13. [Testing Strategy (RTL + MSW)](#13-testing-strategy-rtl--msw)
14. [Storybook Stories](#14-storybook-stories)
15. [Implementation Plan (Phased)](#15-implementation-plan-phased)
16. [Design / UX Enhancements](#16-design--ux-enhancements)
17. [Open Questions & Risks](#17-open-questions--risks)

---

## 1. Decisions & Hard Constraints

Confirmed with the product owner — **not** open for re-litigation during implementation:

| #   | Decision                 | Choice                                                                                                                                                                                                                                                                                                                               |
| --- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| D1  | Transaction API strategy | **V3 only** — all payments (USD domestic and FX) submit via `createTransactionV3`. Single submission path.                                                                                                                                                                                                                           |
| D2  | FX rate handling         | **Config-driven** — default is real-time market rate (no `rateId`, indicative display). Two opt-in rate sources: (a) **built-in Rate Sheet mode** using the generated `getCurrentRatesheet` client (spec now in repo), (b) **custom provider callback** supplied by the host.                                                        |
| D3  | Amount entry side        | **Debit (USD) side only** — user enters the USD amount; target-currency amount is an estimate. `targetAmount` does not even exist on the V3 request schema, so this is also an API constraint.                                                                                                                                       |
| D4  | Recipient scope          | **Existing recipients + FX metadata** — FX to saved recipients carrying currency/country data; inline add-recipient form extended with country/currency/international routing. One-time (unsaved) cross-border recipients out of scope for v1 (domestic one-time behaviour preserved).                                               |
| D5  | **Naming**               | Component: **`PaymentFlowFX`** / **`PaymentFlowFXInline`**, directory `src/core/PaymentFlowFX/`. All internal names use the `FX` suffix (`PaymentFlowFXProps`, `paymentflow-fx` test ids, `Beta/PaymentFlowFX` story title).                                                                                                         |
| D6  | **Non-breaking mandate** | Every change outside `src/core/PaymentFlowFX/` must be provably non-breaking: no existing export changes signature or behaviour; shared components gain only optional props with defaults reproducing today's behaviour; codegen is additive (new output files; existing generated files untouched); existing tests pass unmodified. |
| D7  | Quality bars             | Clean, well-structured code (no new 3,000-line files — see §5 module budget); RTL test coverage for all new behaviour; Storybook stories following the existing PaymentFlow patterns.                                                                                                                                                |

---

## 2. Goals and Non-Goals

### Goals

1. `PaymentFlowFX` (dialog) and `PaymentFlowFXInline` (embedded), mirroring the existing
   `PaymentFlow` / `PaymentFlowInline` pair and exported alongside them.
2. **Behaviour parity**: every rule in the PaymentFlow requirements docs applies unchanged
   unless explicitly overridden in §9.
3. FX payouts: select a recipient whose account currency ≠ USD, enter a USD amount, see an
   indicative or executable-locked conversion, submit via `createTransactionV3` with
   `targetCurrency` (+ optional `fxInformation.rateId`).
4. USD → USD payments behave exactly like today's `PaymentFlow`.

### Non-Goals (v1)

- Dual-sided amount entry (not supported by the V3 request schema).
- One-time/unsaved **cross-border** recipients (D4). The V3 inline `creditor` external
  account path is used only to preserve today's _domestic_ one-time recipient feature.
- Non-USD debit currency (API: `currency` supports `USD` only).
- Post-submission status polling/webhooks beyond a single optional `getTransactionV3`
  enrichment fetch on the success screen (FR-FX-9).
- Any behavioural change to the existing `PaymentFlow`.

---

## 3. API Foundation — Verified Schemas

> ⚠️ The earlier draft of this spec was based on portal-rendered docs. Everything below is
> now verified against the **local YAML specs** and corrects several details: V3 uses
> counterparty objects (no `debtorAccountId`/`recipientId`/`recipient` fields), **string**
> amounts, required `type`, a top-level `paymentPurpose` object (not inside
> `fxInformation`), and a **minimal 202 response**.

### 3.1 `POST /transactions` — `createTransactionV3` (`PostTransactionRequestBaseV3`)

Required: `currency`, `transactionReferenceId`, **`type`**.

| Field                    | Type                                                     | Notes                                                                                                                             |
| ------------------------ | -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `transactionReferenceId` | string, `[_0-9A-Za-z]+`, 1–35                            | Same generator as today (`PHUI_` + uuid).                                                                                         |
| `type`                   | `PaymentType`: `RTP`\|`WIRE`\|`ACH`\|`TRANSFER`\|`CARD`  | **Required in V3** (optional in V2) — validation must guarantee it before submit (already does, P-8).                             |
| `amount`                 | **string**, pattern `^\d+(\.\d+)?$`, max 40              | ⚠️ V2 used `number`. Submit the sanitised form string directly (`'1250.00'`) — do **not** `parseFloat`, avoiding float artefacts. |
| `currency`               | string(3)                                                | Always `'USD'` (debit currency; only documented supported value).                                                                 |
| `targetCurrency`         | `TargetCurrencyV3`                                       | 33-currency enum (§3.4). Omit entirely for domestic.                                                                              |
| `memo`                   | string 1–140                                             | Enforce max length in UI (V-5). Omit when empty (min length 1).                                                                   |
| `localInstrumentCode`    | `CCD`/`PPD`/`TEL`/`WEB`                                  | Not sent (parity with today).                                                                                                     |
| `fxInformation`          | `TransactionFxInformation`: `{ rateId?, clientSpread? }` | `rateId` sent only when a locked EXECUTABLE rate is held. `clientSpread` never sent by the component (platform concern).          |
| `paymentPurpose`         | `{ code? (1–4 chars), customCode? (1–35) }`              | **Top-level object** (not under fxInformation). Prop-driven passthrough (§6).                                                     |
| `debtor`                 | `TransactionCounterParty`                                | See below.                                                                                                                        |
| `creditor`               | `TransactionCounterParty`                                | See below.                                                                                                                        |

**Counterparty mapping** (replaces V2's flat `debtorAccountId` / `recipientId` /
`recipient` fields) — verified against the spec's request examples:

```jsonc
// Debtor = selected account (always):
"debtor": {
  "account": {
    "type": "REGISTERED_ACCOUNT",
    "registeredAccount": { "id": "<formData.fromAccountId>" }
  }
}

// Creditor, saved recipient (payeeId):
"creditor": { "id": "<formData.payeeId>" }

// Creditor, one-time recipient (domestic only, D4):
"creditor": {
  "partyDetails": {
    "type": "INDIVIDUAL" | "ORGANIZATION",
    "firstName"/"lastName" | "businessName",
    "address": { "type", "streetName", "buildingNumber", "city",
                 "countrySubDivision", "postalCode", "country" },
    "contacts": { ... }
  },
  "account": {
    "type": "CHECKING" | "SAVINGS" | "IBAN",
    "externalAccount": {
      "number", "bankName", "branchCode",
      "routingInformation": [{ "routingCodeType", "routingNumber", "transactionType" }],
      "currency", "country"
    }
  }
}
```

A pure mapping function `mapUnsavedRecipientToCounterParty(unsaved: UnsavedRecipient):
TransactionCounterParty` converts the existing `TransactionRecipientDetailsV2` payload
(kept on `UnsavedRecipient.transactionRecipient` today) to the V3 creditor shape. Unit
tested field-by-field (§13).

### 3.2 Response — `TransactionResponseV3`, HTTP **202 Accepted**

⚠️ **Minimal**: `{ id, transactionReferenceId, requestedExecutionDate }`. Unlike V2 there
is **no** `status`, `amount`, or `fxInformation` echo on create. Consequences:

- The success view builds its summary from **form data** + the returned `id`/reference.
- Status and FX details come from an optional follow-up **`getTransactionV3`**
  (`GET /transactions/{id}` → `TransactionGetResponseV3`), which returns `status`
  (enum incl. `PENDING`, `COMPLETED`, `COMPLETED_WITH_EXCEPTIONS`,
  `COMPLETED_NOT_IN_TARGET_WALLET`, `PARTIALLY_COMPLETED`, `REJECTED`, `RETURNED`,
  `CANCELED`, `UNDEFINED`), string `amount`/`targetAmount`, `targetCurrency`,
  `fxInformation` (`rateId`, `clientSpread` + `exchangeRate`, `contractId` once
  processed), `paymentPurpose`, `valueDate`, and rich `debtor`/`creditor` objects.
  For FX, `targetAmount`/`exchangeRate` are typically absent until processing completes —
  the success view must not promise a final converted amount (FR-FX-9).
- `onTransactionComplete` receives `TransactionResponseV3` (+ the enrichment result when
  fetched — see §6).

Error envelope is unchanged (`ApiErrorV2`: `title`, `httpStatus`, `context[]` of
`ApiErrorReasonV2`) — today's error parsing carries over.

### 3.3 FX Rate Sheet API — `getCurrentRatesheet` (fx-rate-sheet-1.0.2.yaml)

`GET /accounts/{accountId}/ratesheets/current?customerDepartment=…`

Response `RateSheetDetails`:

```
_metadata: { sendingTime, clientRequestId, disclaimer }   ← disclaimer is legally required display text
data:
  accountId, ratesheetId, publicationId, publicationTime
  expiry                       ← ISO date-time; ALL rates invalid after this
  thresholdAmount/thresholdCcy ← rates invalid for transactions above this
  customerDepartment[]:
    name
    currencyPairs[]:
      clientBuyCcy / clientSellCcy   ← payout: client SELLS USD, BUYS target ccy
      onshoreOffshore (Onshore|Offshore)
      baseCcy                        ← first ccy of the quote
      fromBuyCcyToSellCcy (Divide|Multiply)
      rates[]:
        rateId                       ← passes into fxInformation.rateId
        clientRate
        rateType: EXECUTABLE | INDICATIVE   ← only EXECUTABLE may be locked/submitted
        paymentMethod: WIRE_DRAFT_BOOK | ACH | WALLET | CARD
        beneficiaryType: INDIVIDUAL | BUSINESS | BUSINESS (eCom) | INDIVIDUAL (eCom)
        minTransactionSize / maxTransactionSize / minMaxTransactionSizeCcy
```

Errors arrive as HTTP 200 with an `errors[]` body (`GCA-001/003/010/099`, `ERR_1201`,
`ERR_1203` "All rates expired", `ERR_1204`) — the rate hook must treat a 200-with-errors
body as a failure (§9 FR-FX-6, §11).

**Rate selection algorithm** (`selectRateFromSheet`, pure function, unit tested):

1. Flatten `customerDepartment[].currencyPairs` (optionally filtered by
   `fxConfig.customerDepartment`).
2. Match pair: `clientSellCcy === 'USD' && clientBuyCcy === targetCurrency`.
3. Within `rates[]`, filter by `paymentMethod` (map UI method → sheet enum: `ACH → ACH`,
   `WIRE → WIRE_DRAFT_BOOK`) and `beneficiaryType` (payee `recipientType`:
   `INDIVIDUAL → INDIVIDUAL`, `BUSINESS → BUSINESS`).
4. Respect `minTransactionSize`/`maxTransactionSize` (in `minMaxTransactionSizeCcy`) and
   sheet-level `thresholdAmount` against the entered USD amount.
5. Prefer `EXECUTABLE` (lockable ⇒ `rateId` submitted); fall back to `INDICATIVE`
   (display-only, no `rateId` submitted).
6. Convert display amount using `fromBuyCcyToSellCcy` + `baseCcy` semantics: compute
   _target = USD × rate_ or _USD ÷ rate_ accordingly. Never assume multiply.
7. Discard the whole sheet at `data.expiry`.

**Base-URL note**: the rate sheet API is a Treasury Services API served from
`…/tsapi/v1` (not the EP `…/tsapi/v1/ef` base). The generated client will use the same
`useEbInstance` mutator (relative path `/accounts/{id}/ratesheets/current`), which means
**the host's `apiBaseUrl`/proxy must route this path**. This is documented in the story +
component JSDoc; hosts that cannot proxy it use `fxConfig.getRate` instead (D2). See OQ-1.

### 3.4 Target currencies

`TargetCurrencyV3` (33): `AED AUD BGN BRL CAD CHF CNY CZK DKK EUR GBP HKD HUF ILS INR ISK
JPY KES KRW MXN MYR NOK NZD PEN PHP PLN RON SEK SGD TWD USD VND ZAR`. `USD` in the enum
is not useful for payouts — the component never sends `targetCurrency: 'USD'`.

Corridor/rail guidance from the how-to (drives default metadata only; the recipient's
routing information remains the source of truth for method availability):
FX rails are **ACH and WIRE only** (never RTP); FX-ACH settles 2–5 business days; FX-WIRE
same/next business day.

### 3.5 Account eligibility

FX debits: USD from the NY branch. Eligible debtor categories per the how-to:
`TRANSACTION_ACCOUNT`, `LIMITED_DDA_PAYMENTS` (FX capability required). Not supported:
`LIMITED_DDA`, `PROCESSING`, `MANAGEMENT`, `DEFAULT`, `OFFSET`.
`LIMITED_DDA_PAYMENTS` is confirmed present in the local accounts 2.0.47 spec.

### 3.6 Recipient requirements for FX (registered recipients)

FX-capable payees need `account.currencyCode` (target currency), `account.countryCode`,
international `routingInformation`, and `partyDetails.address.countryCode`.

**Recipients spec status (updated — 1.0.55-latest adopted).** The generated client now
targets recipients **1.0.55-latest**, which widens `RoutingCodeType` to 13 clearing
systems (AUBSB, BIC, BRSTN, CACPA, CLABE, CNAPS, GBDSC, HKNCC, INFSC, JPZGN, NZNCC,
SGIBG, USABA) and `CurrencyCode` to 42 values. This unblocks typed international
recipient persistence: the FX config map assigns each currency its canonical
`routingCodeType`, and recipient creation writes it end-to-end (see FR-FX-10). Currency
metadata is still tagged client-side on create (the `CurrencyCode` enum does not need to
gate the tolerant `string` accessor used at §4 step 3). `account.countryCode` remains a
follow-up (the config's region hints include non-ISO values such as `EU`).

---

## 4. Codegen Work (Non-Breaking)

Rules: **only add orval targets with new output files; never regenerate existing outputs**
(D6). Changes to [orval.config.mjs](../../../orval.config.mjs):

1. **`ep-transactions-v3`** (new target)
   - input: `./api-specs/embedded-finance-pub-ep-transactions-3.0.55.yaml`
   - output: `./src/api/generated/ep-transactions-v3.ts` (split mode, react-query, axios,
     `useEbInstance` mutator — same options as existing targets)
   - Produces: `useCreateTransactionV3`, `useGetTransactionV3`, `useListTransactionsV3`,
     `PostTransactionRequestBaseV3`, `TransactionResponseV3`, `TransactionGetResponseV3`,
     `TargetCurrencyV3`, `TransactionFxInformation`, `TransactionCounterParty*`.
   - The existing `ep-transactions` target (2.0.47 → `ep-transactions.ts`) is untouched;
     `PaymentFlow` keeps importing V2 artifacts.
2. **`fx-rate-sheet`** (new target)
   - input: `./api-specs/fx-rate-sheet-1.0.2.yaml`
   - output: `./src/api/generated/fx-rate-sheet.ts`, same mutator (base-URL caveat §3.3).
   - Produces: `useGetCurrentRatesheet`, `RateSheetDetails`, `CurrencyPair`, `Rate`, …
3. **Recipients spec — intentionally kept at 1.0.47** (see §3.6). Recipients 1.0.55 was
   reviewed: its `account.currencyCode` addition is USD-enum-only, so it does not unlock
   non-USD FX recipients and is **not** adopted (the shared `ep-recipients` target is left
   at 1.0.47 to avoid destabilizing other recipient consumers for no FX gain). FX payee
   metadata instead reads `recipient.account.currencyCode` via a tolerant accessor
   (`(account as { currencyCode?: string }).currencyCode`), and `internationalMode`
   recipient creation tags the currency client-side. Revisit adopting a recipients spec
   once `CurrencyCode` is widened beyond USD and non-`USABA` routing is available.
4. **Accounts**: do _not_ retarget `ep-accounts` in v1. The only need is the
   `LIMITED_DDA_PAYMENTS` category string; `account.category` is compared through the
   `FX_ELIGIBLE_ACCOUNT_CATEGORIES: string[]` constant, avoiding enum-union friction.
   (Optional follow-up outside this scope: upgrade to 2.0.47 with diff verification.)

Run the repo's codegen script (see `SCRIPTS_REFERENCE.md`) and commit generated files per
existing convention.

---

## 5. Component Architecture & Reuse Strategy

### 5.1 Problem

`PaymentFlow.tsx` is a 3,561-line file containing private components (`StepSection`,
`MainTransferView`, `LoadingStateView`, `EmptyAccountsView`, `FatalErrorView`,
`SuccessView`, `PaymentFlowContent`), error-parsing helpers, and near-duplicate data
plumbing between `PaymentFlow` and `PaymentFlowInline` (~400 duplicated lines).

### 5.2 Phase A — extraction refactor inside `PaymentFlow/` (zero behaviour change)

Move private pieces into importable modules; `PaymentFlow.tsx` re-imports them.
**Public exports and behaviour unchanged; the existing test suite and stories must pass
unmodified** — that is the non-breaking proof for this phase.

```
PaymentFlow/
  components/
    StepSection.tsx        LoadingStateView.tsx
    EmptyAccountsView.tsx  FatalErrorView.tsx
  utils/
    transactionErrors.ts   ← parseTransactionError, getErrorMessageFromContext
    formatCurrency.ts      ← Intl.NumberFormat helper (locale + currency aware)
    referenceId.ts         ← generateTransactionReferenceId
  hooks/
    usePaymentFlowData.ts  ← accounts + ITAV balances + recipients/linked-accounts
                             infinite queries + payee transformation
```

### 5.3 Phase B — the new component

```
PaymentFlowFX/
  SPECIFICATION.md                 ← this file
  PaymentFlowFX.tsx                ← thin orchestrators only (dialog + inline), target <400 lines
  PaymentFlowFX.types.ts           ← §7
  PaymentFlowFX.constants.ts       ← §7.3
  components/
    FXTransferView.tsx             ← main stepper view (composes shared StepSection etc.)
    CurrencyAmountInput.tsx        ← amount input + currency affix + estimate line
    FxQuotePreview.tsx             ← conversion card (rate, lock state, expiry, disclaimer)
    FXSuccessView.tsx              ← success view incl. optional enrichment fetch
  hooks/
    useFxQuote.ts                  ← rate acquisition state machine (§9 FR-FX-6)
    useFxEligibility.ts            ← account/method/payee eligibility (FR-FX-3/4)
    useSubmitTransactionV3.ts      ← request assembly + mutation + error state
  utils/
    counterparty.ts                ← mapUnsavedRecipientToCounterParty, buildV3Request
    rateSheet.ts                   ← selectRateFromSheet + conversion math (§3.3)
  index.ts
  stories/                         ← §14
  PaymentFlowFX.test.tsx (+ per-module test files)
```

**Module budget** (D7 "clean and well structured"): no file over ~500 lines; pure logic
(request assembly, rate selection, eligibility) lives in hooks/utils with direct unit
tests, so `PaymentFlowFX.tsx` stays a wiring layer.

Reused as-is from `PaymentFlow/`: `FlowContainer` (+`FlowContext`, `FlowView`),
`PayeeSelector`, `PaymentMethodSelector`, `ReviewPanel` (+`ReviewTotals`,
`ReviewPanelMobile`), `forms/*`, `RadioIndicator`, and the Phase-A extractions.

Shared components gain **optional props defaulting to current behaviour** (D6):

| Component                         | New optional props                                                                                                                                  |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PayeeSelector` / `PayeeListItem` | `showCurrencyBadge?: boolean`; `getPayeeDisabledReason?: (payee) => string \| undefined`                                                            |
| `PaymentMethodSelector`           | `methodAvailability?: (method, payee) => { available: boolean; reason?: string }`; `deliveryOverrides?: Partial<Record<PaymentMethodType, string>>` |
| `ReviewPanel`                     | `fxSummary?: FxReviewSummary \| null` (§9 FR-FX-7); `renderExtraContent?: () => ReactNode` for the disclaimer                                       |
| `BankAccountFormWrapper`          | `internationalMode?: boolean`; `supportedCurrencies?: string[]` (FR-FX-10)                                                                          |

Each defaults to `undefined` ⇒ rendered output is byte-identical to today (assert via the
existing snapshot/behaviour tests).

### 5.4 Exports

`src/core/PaymentFlowFX/index.ts` exports `PaymentFlowFX`, `PaymentFlowFXInline`, public
types (`PaymentFlowFXProps`, `PaymentFlowFXInlineProps`, `FxConfig`, `FxQuote`). Register
in `src/core/index.ts` / `src/index.ts` following how `PaymentFlow` is exported —
additions only.

---

## 6. Public Props API

```ts
export interface FxQuote {
  /** Units of target currency per 1 USD (already normalised via §3.3 step 6) */
  rate: number;
  /** Present only for EXECUTABLE rate-sheet rates or provider-locked rates */
  rateId?: string;
  /** Quote validity end (rate sheet: data.expiry) */
  expiresAt?: Date;
  /** True when the rate cannot be locked (INDICATIVE / getIndicativeRate) */
  isIndicative: boolean;
  /** Rate sheet legal disclaimer, when sourced from getCurrentRatesheet */
  disclaimer?: string;
}

export interface FxConfig {
  /**
   * 'realtime'  (default) — no rate call; submit without rateId; conversion shown
   *             as "determined at processing" unless getIndicativeRate is provided.
   * 'ratesheet' — built-in getCurrentRatesheet integration (§3.3); EXECUTABLE rates
   *             are locked (rateId submitted), INDICATIVE rates display-only.
   * 'provider'  — host-supplied getRate; its rateId (if any) is submitted.
   */
  mode?: 'realtime' | 'ratesheet' | 'provider';
  /** 'provider' mode */
  getRate?: (params: {
    baseCurrency: 'USD';
    targetCurrency: string;
    amount?: string;
    paymentMethod?: 'ACH' | 'WIRE';
  }) => Promise<Omit<FxQuote, 'isIndicative'> & { isIndicative?: boolean }>;
  /** 'realtime' mode, optional display-only estimate */
  getIndicativeRate?: (params: {
    baseCurrency: 'USD';
    targetCurrency: string;
  }) => Promise<Pick<FxQuote, 'rate' | 'expiresAt'>>;
  /** 'ratesheet' mode: customerDepartment filter passthrough */
  customerDepartment?: string[];
  /** Re-quote interval (ms). Default: none (quote refreshes on expiry only). */
  refreshIntervalMs?: number;
  /** paymentPurpose passthrough on the V3 request (top-level object, §3.1) */
  paymentPurpose?: { code?: string; customCode?: string };
}

export interface PaymentFlowFXProps
  extends Omit<PaymentFlowProps, 'onTransactionComplete'> {
  /** Restrict selectable target currencies. Default: SUPPORTED_TARGET_CURRENCIES. */
  supportedTargetCurrencies?: string[];
  fxConfig?: FxConfig;
  /**
   * Fetch getTransactionV3 once after the 202 to enrich the success view with
   * status/FX details. Default: true. Failure degrades gracefully (FR-FX-9).
   */
  enrichTransactionAfterSubmit?: boolean;
  onTransactionComplete?: (
    response?: TransactionResponseV3,
    error?: ApiErrorV2,
    /** Present when enrichment succeeded */
    details?: TransactionGetResponseV3
  ) => void;
}
// PaymentFlowFXInlineProps mirrors PaymentFlowInlineProps identically.
```

All inherited props (`trigger`, `paymentMethods`, `initialAccountId`, `initialPayeeId`,
`initialPaymentMethod`, `initialAmount`, `showFees`, `open`/`onOpenChange`, `resetKey`,
`hideHeader`, `showContainer`, `className`, user-tracking) keep their exact semantics.

---

## 7. Type & Constant Definitions

### 7.1 Payee extension

```ts
export interface FXPayee extends Payee {
  /** From recipient.account.currencyCode; undefined ⇒ domestic/USD */
  currencyCode?: string;
  /** From recipient.account.countryCode */
  countryCode?: string;
}
```

Populated in the payee transformation via a tolerant `string` accessor. This stays
decoupled from the recipients 1.0.55 `CurrencyCode` enum (USD-only), which cannot type
non-USD FX currencies (§3.6, §4 step 3).

### 7.2 Form data extension

```ts
interface PaymentFlowFXFormData extends PaymentFlowFormData {
  /** undefined or 'USD' ⇒ pure parity mode */
  targetCurrency?: string;
  /** Current quote incl. source metadata */
  fxQuote?: FxQuote & { fetchedAt: Date };
}
```

Reset rules (close/reopen, "Make another payment", `resetKey`) clear both fields.

### 7.3 Constants (`PaymentFlowFX.constants.ts`)

```ts
export const SUPPORTED_TARGET_CURRENCIES: string[] = [
  /* §3.4 minus USD */
];
export const FX_ALLOWED_METHODS: PaymentMethodType[] = ['ACH', 'WIRE'];
export const FX_METHOD_DELIVERY: Record<'ACH' | 'WIRE', string> = {
  ACH: '2-5 business days',
  WIRE: 'Same or next business day',
};
export const FX_ELIGIBLE_ACCOUNT_CATEGORIES: string[] = [
  'TRANSACTION_ACCOUNT',
  'LIMITED_DDA_PAYMENTS',
];
/** UI method → rate sheet paymentMethod enum (§3.3 step 3) */
export const RATESHEET_METHOD_MAP = {
  ACH: 'ACH',
  WIRE: 'WIRE_DRAFT_BOOK',
} as const;
```

Currency formatting always via `Intl.NumberFormat(locale, { style: 'currency', currency })`
(correct minor units for JPY/KRW/VND); no hand-rolled symbol tables.

---

## 8. Functional Requirements — Preserved Behaviours

Inherited verbatim from the PaymentFlow requirement docs; each must pass the same RTL
tests against `PaymentFlowFX`:

- **P-1** Stepper layout (`StepSection` auto-advance/collapse/inert/error indicators,
  scroll+focus on first validation error), amount+memo always visible, right review panel,
  mobile bottom-sheet review.
- **P-2** Accounts: OPEN/PENDING_CLOSE only; ITAV balances per account with per-account
  loading/error; single-account auto-select (incl. `validAccountCount === 1`);
  `initialAccountId` mismatch → clear + warning.
- **P-3** LIMITED_DDA ⇒ LINKED_ACCOUNT-only, bidirectional conflict clearing with amber
  warning banners, disabled rows with reasons.
- **P-4** Payees: two infinite-scroll lists (25/page), ACTIVE only, INDIVIDUAL/ORGANIZATION
  naming, per-type fetch errors with retry, `initialPayeeId` mismatch handling, newly
  created payees merged and immediately selectable.
- **P-5** Inline payee creation: payee-type chooser, link-account, add-recipient
  (saved + **one-time/unsaved** with edit/save/clear card, 400-error redirect to form),
  enable-payment-method (PATCH routing, WIRE fields per `PAYMENT_METHOD_REQUIREMENTS`),
  form switching.
- **P-6** Method availability strictly from routing information; persistence across payee
  change when supported, else cleared; "Enable method" entry point.
- **P-7** Amount sanitisation (2dp, single decimal, no leading zeros, numeric keyboard);
  non-blocking exceeds-balance error only when balance loaded cleanly; optional memo.
- **P-8** Review & submit: validation before submit with panel-ID mapping and
  first-error expand+scroll; submit disabled in flight; `showFees` totals.
- **P-9** Success: copyable reference, summary rows, "Make Another Payment" (full reset,
  stays open), "Done".
- **P-10** Errors: fatal accounts error view + retry; empty accounts view; partial
  recipient degradation; transaction error parsing (10104 variants, HTTP fallbacks),
  dismissible, cleared on retry/close.
- **P-11** Full state reset on reopen / `resetKey` / make-another-payment; stale success
  prevention via resetKey-scoped transaction state.
- **P-12** i18n (`make-payment` namespace), a11y (keyboard, focus, `role="alert"`, inert).

**Parity acceptance test**: with no FX-capable payee selected and no `fxConfig`, the UI
and submitted V3 request express exactly today's semantics (same amount/memo/method/
counterparties; endpoint and request shape per §3.1; no `targetCurrency`, no
`fxInformation`).

---

## 9. Functional Requirements — New FX Behaviours

### FR-FX-1 — Target currency determination

- Selecting a payee with `currencyCode` ∉ {undefined, `'USD'`} sets
  `formData.targetCurrency` to it. Displayed, not editable (recipient's account currency
  is authoritative). Cleared when the payee is cleared/changed to domestic.
- Domestic payees ⇒ `targetCurrency` unset ⇒ pure parity mode. No free currency picker
  for domestic payees in v1.
- Payee `currencyCode` outside `supportedTargetCurrencies` ⇒ payee disabled with reason
  "Currency {code} not enabled" (`getPayeeDisabledReason`).

### FR-FX-2 — Payee currency badges

`showCurrencyBadge` renders a currency badge on **every** payee row. FX payees show the
target currency code + country flag (derived from `countryCode`); domestic/USD payees show
the US flag (`currencyCode ?? 'USD'`). Badging all rows keeps the column visually consistent
and makes destinations scannable before selection.

### FR-FX-3 — FX-eligible debtor accounts

With `targetCurrency` set: accounts with `category` ∉ `FX_ELIGIBLE_ACCOUNT_CATEGORIES`
disabled with reason "Not available for international payments"; existing bidirectional
conflict-clearing mechanism reused (amber banner + navigate to account step);
`validAccountCount` extended so step-skipping stays correct.

### FR-FX-4 — Payment method restrictions

FX ⇒ only `FX_ALLOWED_METHODS`; RTP rendered disabled with the reason
`fx.rails.rtpUnavailable` ("Not available for cross-currency payments") via
`methodAvailability` (not hidden — discoverability). Per-recipient routing check still
applies on top. Method persistence rule (P-6) still governs clearing.

### FR-FX-5 — FX delivery estimates

With FX active, the method cards adopt the recipient form's value-tier language: ACH/WIRE
are relabeled "FX Low-value" / "FX High-value" (`fx.rails.label.*`) with descriptions
from `fx.rails.desc.*` surfaced via `deliveryOverrides`. Domestic (USD) payouts keep the
host `paymentMethods` names/fees.

### FR-FX-6 — Rate acquisition & conversion preview (`useFxQuote` + `FxQuotePreview`)

State machine per `fxConfig.mode`:

| Mode                 | Trigger                                                                                            | Behaviour                                                                                                                                                                                                                                                                                                                                                                                                  |
| -------------------- | -------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `realtime` (default) | —                                                                                                  | No fetch. With `getIndicativeRate`: fetch on `targetCurrency` change, show estimate labelled _indicative_. Without: show "Converted to {CUR} at the market rate when processed". Never submits `rateId`.                                                                                                                                                                                                   |
| `ratesheet`          | `targetCurrency` or selected account changes; refresh at `refreshIntervalMs` and at sheet `expiry` | `getCurrentRatesheet(fromAccountId)` → `selectRateFromSheet` (§3.3). EXECUTABLE ⇒ locked quote (`rateId`), countdown to `expiry`. INDICATIVE ⇒ display-only. No matching pair/rate, out-of-bounds amount, HTTP error, or 200-with-`errors[]` ⇒ **non-blocking fallback**: notice "Rate unavailable — payment will use the market rate", submit without `rateId`. `_metadata.disclaimer` shown per FR-FX-7. |
| `provider`           | `targetCurrency` change + debounced (500 ms) amount change                                         | `getRate(...)`; returned `rateId` submitted; errors ⇒ same non-blocking fallback.                                                                                                                                                                                                                                                                                                                          |

Preview card content: "Recipient gets (approx.) {Intl-formatted target amount}", "1 USD =
{rate} {CUR}", lock/indicative label, expiry countdown, `aria-live="polite"` on updates,
skeleton while fetching. The **"(approx.)"** qualifier is used consistently for every
estimated target-amount label (preview, review, success).

### FR-FX-7 — Review panel FX block (`fxSummary` prop, `FxReviewBlock`)

Between amount row and totals: _You send $X USD_ / _Recipient gets (approx.) Y CUR (or
"determined at processing")_ / _Exchange rate … (indicative | locked)_. For locked quotes a
live **"Expires in mm:ss"** chip (`Clock` icon) ticks down every second and clears when the
quote lapses. Fees/totals remain USD (debit side). Rate-sheet `disclaimer` text rendered via
`renderExtraContent` (collapsed "FX rate terms" disclosure); host legal copy still goes
through `mobileReviewConfig.legalDisclosure`.

### FR-FX-8 — Submission (`useSubmitTransactionV3` / `buildV3Request`)

Per §3.1: string amount passed through from sanitised input; `debtor` from
`fromAccountId`; `creditor` from `payeeId` **or** mapped unsaved recipient; `memo`
omitted when empty; FX ⇒ `targetCurrency` (+ `fxInformation.rateId` only for locked
quotes); `paymentPurpose` from `fxConfig` when provided. Extras:

- Expired locked quote at submit time ⇒ one automatic re-quote; on failure submit
  without `rateId` and mark the success copy as market-rate.
- Never send `targetCurrency: 'USD'`; never send `fxInformation` without content.
- Success/error state, resetKey scoping, `onTransactionComplete` semantics as today.

### FR-FX-9 — Success view (minimal 202 + optional enrichment)

- Immediately: "Payment submitted" state from form data + `response.id`/reference
  (copyable). For FX: "Being converted to {CUR} — final amount confirmed after
  processing".
- When `enrichTransactionAfterSubmit` (default true): single `getTransactionV3(id)`
  fetch; on success show `status` chip and, if present, `targetAmount` +
  `fxInformation.exchangeRate` rows. On failure: keep the submitted state silently
  (no error surfaced — the payment succeeded).
- "Make Another Payment" / "Done" unchanged (P-9).

### FR-FX-10 — International recipient creation (inline form, `internationalMode`)

- A "Recipient's account currency" select is shown (USD default + `supportedCurrencies`).
  Selecting a non-USD currency tags the created recipient with `account.currencyCode`
  **client-side**, so the new payee activates FR-FX-1 on return to the list.
- Methods constrained to `FX_ALLOWED_METHODS`; **one-time "pay without saving" hidden**
  while a non-USD currency is selected (D4).
- **As-built scope note:** currency capture and international routing are implemented.
  The recipients spec that types non-`USABA` routing has landed (ep-recipients
  1.0.55-latest widens `RoutingCodeType` to 13 clearing systems and `CurrencyCode` to
  42), so international recipients are now persisted with the currency's canonical
  routing code. The FX config map (`fxRecipientRequirements.ts`) carries a typed
  `routingCode.routingCodeType` per currency (e.g. `AUBSB`, `INFSC`, `SGIBG`, `BIC`),
  and `getFxRoutingCodeType(currency)` resolves it. `BankAccountFormWrapper` passes this
  to `useRecipientForm`, which forwards it to
  `transformBankAccountFormToRecipientPayload` (default `USABA` keeps domestic recipients
  unchanged). MXN stays self-routing (CLABE embeds bank + branch, no routing code).
- On success payee enters merged list with `currencyCode`/`countryCode` ⇒ FR-FX-1 fires.

### FR-FX-11 — One-time recipients stay domestic

Unsaved-recipient path preserved fully but never FX: no `targetCurrency`, no
international option on that path (D4). Mapping to V3 creditor per §3.1.

---

## 10. Validation Rules

All P-8 rules plus:

| #   | Rule                                                                                                                         |
| --- | ---------------------------------------------------------------------------------------------------------------------------- |
| V-1 | `targetCurrency` (when set) ∈ `supportedTargetCurrencies`; violation blocks submit with payee-panel error (defensive).       |
| V-2 | FX ⇒ method ∈ `FX_ALLOWED_METHODS` (defensive; UI already disables RTP).                                                     |
| V-3 | FX ⇒ account category ∈ `FX_ELIGIBLE_ACCOUNT_CATEGORIES` (defensive).                                                        |
| V-4 | Balance validation stays USD-side (amount vs ITAV), non-blocking — unchanged.                                                |
| V-5 | `memo` ≤ 140 chars (`maxLength` + visible counter from 120); omit from request when empty.                                   |
| V-6 | `paymentPurpose.code` ≤ 4 chars, `customCode` ≤ 35 (dev-time console warning on violation, field dropped).                   |
| V-7 | `type` present before submit (API-required in V3; covered by existing paymentMethod validation).                             |
| V-8 | Amount serialised as string matching `^\d+(\.\d+)?$` (input sanitiser already guarantees; assert in `buildV3Request` tests). |

---

## 11. Error Handling

Extend the extracted `transactionErrors.ts` helpers **additively** (existing mappings and
their tests untouched):

| Signal                                                                                                      | Handling                                                                                                                     |
| ----------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| context `field === 'targetcurrency'` (and `targetCurrency` was sent)                                        | "Currency Not Supported" — "This currency is not enabled for your account. Choose a different recipient or contact support." |
| context field `fxinformation.rateid` / message indicates expired rate                                       | "Exchange Rate Expired" — clears `formData.fxQuote`, triggers re-quote, invites retry.                                       |
| context mentions `paymentpurpose`                                                                           | "Payment Purpose Required" — "This destination requires a payment purpose code."                                             |
| 422 with `targetCurrency` sent                                                                              | Prefer "International payment could not be validated. Check the recipient's bank details." over generic 422 copy.            |
| Rate sheet: HTTP error or 200 body with `errors[]` (`ERR_1203` all-expired, `GCA-010` account not found, …) | Never fatal: log, show the market-rate fallback notice (FR-FX-6), continue.                                                  |
| `getTransactionV3` enrichment failure                                                                       | Silent degradation (FR-FX-9).                                                                                                |

---

## 12. i18n & Content Tokens

Every user-facing string the component renders is registered under the **`fx`** section of
the `make-payment` namespace in the locale resources
([`src/i18n/en-US/make-payment.json`](../../i18n/en-US/make-payment.json),
[`src/i18n/es-US/make-payment.json`](../../i18n/es-US/make-payment.json)). Registration in
`en-US` is what makes each key host-overridable through the provider's `contentTokens` prop
(the content-tokens contract is `DeepPartial<enUS>` with `fallbackLng: 'enUS'`). `fr-CA` is
left `{}` and falls back to `en-US`.

As-built `fx.*` key groups:

- **Amount / conversion**: `youSendLabel`, `recipientGets`, `recipientGetsLabel`,
  `recipientGetsApprox`, `recipientReceives`, `conversionTitle`, `conversionCaption`,
  `convertedAtProcessing`, `rate`, `rateLine`, `rateLoading`, `rateUnavailable`,
  `rateDisclaimer`, `exchangeRate`, `indicative`, `indicativeSuffix`, `locked`, `expiresIn`,
  `marketRateFallback`.
- **Success**: `paymentSent`, `paymentInitiated`, `beingConverted`, `loadingSettlement`,
  `makeAnotherPayment`, `done`.
- **Account / eligibility surface**: `accountNotForExternal`, `accountUnavailable`,
  `accountClearedReason`, `accountEndingIn`, `accountFallback`, `pendingClose`, `linkedOnly`,
  `loading`, `unavailable`, `available`.
- **Flow chrome / states**: `flowTitle`, `errorTitle`, `errorMessage`, `emptyTitle`,
  `emptyMessage`, `close`, `tryAgain`, `retrying`, plus `paymentMethod.loadingRecipientDetails`.

The "(approx.)" qualifier is applied consistently to every estimated target-amount label.

**Intentionally left as code defaults** (not tokenized): a small set of util/hook-produced
pass-through reason strings — eligibility disabled reasons (`eligibility.ts`
`getAccountDisabledReasonFX` / `getMethodAvailabilityFX` / `getPayeeDisabledReasonFX`), rate
hook status text (`useFxQuote` "Rate unavailable" / "No rate available"), the submission
error title (`useSubmitTransactionV3`), and reference/currency labels. Rationale: these
mirror the base `PaymentFlow` contract (which leaves the equivalents hardcoded), are asserted
verbatim by unit tests as a display contract, and in the eligibility case flow through a
stable-callback `useMemo` that an unstable translator would de-memoize. A reason→code
refactor remains a possible follow-up if full tokenization is later required.

---

## 13. Testing Strategy (RTL + MSW)

Follow the exact conventions of
[PaymentFlow.test.tsx](../PaymentFlow/PaymentFlow.test.tsx): `vitest` +
`render/screen/userEvent/waitFor` from `@test-utils`, MSW `server.use(http.get/post(...))`
overrides per test, plain mock data objects at file top.

### 13.1 Parity suite (`PaymentFlowFX.test.tsx`)

Port the full `PaymentFlow.test.tsx` case list against `PaymentFlowFX` with
domestic-only fixtures; the only permitted deltas are the mocked endpoint (V3
`POST /transactions` returning the minimal 202 body) and request-shape assertions
(counterparty objects, string amount). Every P-1…P-12 behaviour must be covered.

### 13.2 FX behaviour tests

- FR-FX-1: auto-set/lock/clear of `targetCurrency` on payee select/clear; unsupported
  currency ⇒ disabled payee with reason.
- FR-FX-3/4: eligibility matrices incl. bidirectional clears and RTP-disabled-with-reason.
- FR-FX-6: per-mode quote lifecycle — ratesheet EXECUTABLE lock + countdown, INDICATIVE
  display-only, 200-with-errors fallback, expiry re-quote, provider debounce, realtime
  no-op; `aria-live` announcement present.
- FR-FX-8 (`buildV3Request` unit tests, no rendering): domestic request byte-exact
  parity; FX realtime (targetCurrency only); FX locked (rateId); paymentPurpose
  passthrough; memo omission; V-8 amount string; expired-quote re-quote-then-fallback.
- `mapUnsavedRecipientToCounterParty`: field-by-field mapping incl. INDIVIDUAL vs
  ORGANIZATION, address, routing.
- `selectRateFromSheet`: pair matching, method/beneficiary filters, min/max/threshold
  bounds, EXECUTABLE preference, Divide vs Multiply conversion, expiry discard.
- FR-FX-9: success view with enrichment success (status + targetAmount rows), enrichment
  failure (silent), enrichment disabled.
- V-5 memo counter/limit; §11 error mappings (targetcurrency, expired rateId).

### 13.3 Non-breaking proof

- Existing `PaymentFlow.test.tsx` passes **unmodified** after Phase A and after every
  shared-component prop addition.
- New optional props: for each shared component, a test asserting default-prop rendering
  matches pre-change output (behavioural assertions, not brittle full snapshots).

### 13.4 Coverage

New modules meet or exceed the repo's configured vitest coverage thresholds (see
`plans/006-enforce-coverage-thresholds.md` / vitest config); pure utils/hooks target ~100%
branch coverage since they carry the money logic.

---

## 14. Storybook Stories

Mirror the PaymentFlow story organisation and utilities
([stories/](../PaymentFlow/stories/)): `Beta/PaymentFlowFX` title, tags
`['@core', '@payments', 'autodocs']`, MSW handlers from a `story-utils.tsx` factory.

| File                                          | Stories                                                                                                                                                                                                                                                                                                                                                                                                                   |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `stories/story-utils.tsx`                     | `createPaymentFlowFXHandlers()` — extends `createPaymentFlowHandlers()` with V3 `POST /transactions` (minimal 202), `GET /transactions/{id}` (enriched, incl. FX fields), `GET /accounts/{id}/ratesheets/current` (EXECUTABLE + INDICATIVE fixtures, expiry, disclaimer), FX recipients (EUR/GBP/INR/BRL; wire-only and ACH-only corridors), `TRANSACTION_ACCOUNT`/`LIMITED_DDA_PAYMENTS` accounts. Common args/argTypes. |
| `stories/PaymentFlowFX.story.tsx`             | Default (mixed domestic + FX payees), RateSheetMode, ProviderMode (mocked `getRate`), RealtimeNoRate, WithFees, InitialFXPayee.                                                                                                                                                                                                                                                                                           |
| `stories/PaymentFlowFX.Workflows.story.tsx`   | Play-function walkthroughs: complete FX payment (select FX payee → method restriction visible → USD amount → quote appears → review shows conversion → submit → success with enrichment); rate-expiry re-quote; add international recipient (after B4).                                                                                                                                                                   |
| `stories/PaymentFlowFX.States.story.tsx`      | Rate unavailable fallback, all-rates-expired (ERR_1203), FX-ineligible account conflict, currency-not-enabled payee, enrichment failure, plus the inherited error/empty states.                                                                                                                                                                                                                                           |
| `stories/PaymentFlowFX.Interactive.story.tsx` | End-to-end play-driven journeys run as CI tests: `CreateInternationalRecipientEndToEnd` (add a EUR recipient via the currency → method → account form, verify auto-select) and `CompleteFxPaymentEndToEnd` (submit a GBP payment in `ratesheet` mode through to the success screen).                                                                                                                                      |
| `stories/PaymentFlowFXInline.story.tsx`       | Inline variant defaults, `hideHeader`, `showContainer`.                                                                                                                                                                                                                                                                                                                                                                   |

Autodocs `description.component` block documents: FX capability matrix, `fxConfig` modes,
the rate-sheet base-URL/proxy note (§3.3), and the enrichment behaviour.

---

## 15. Implementation Plan (Phased)

| Phase | Work                                                                                                                                                    | Gate / proof                                                           |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| 0     | §4 codegen: `ep-transactions-v3` + `fx-rate-sheet` orval targets (new output files only)                                                                | Build green; no diff in existing generated files                       |
| A     | §5.2 extraction refactor in `PaymentFlow/`                                                                                                              | `PaymentFlow.test.tsx` + stories pass unmodified                       |
| B1    | Scaffold `PaymentFlowFX/` — types, constants, `buildV3Request`/`counterparty.ts`, orchestrators in parity mode, parity test suite (§13.1), exports      | Domestic payments E2E via V3 against MSW                               |
| B2    | FX payee metadata, badges, eligibility, delivery copy (FR-FX-1…5) + shared-component optional props with default-behaviour tests (§13.3)                | FX selection UX complete                                               |
| B3    | `useFxQuote` + `rateSheet.ts`, `CurrencyAmountInput`, `FxQuotePreview`, review FX block, submission deltas, `FXSuccessView` with enrichment (FR-FX-6…9) | End-to-end FX payment; all three fxConfig modes storybook-demonstrable |
| B4    | International recipient form (FR-FX-10/11) — client-side currency capture (recipients spec upgrade deferred, see §3.6)                                  | FX recipient creation E2E                                              |
| B5    | §11 error mappings, §12 i18n, full §14 stories, docs (README/COMPONENTS_DIAGRAM touch-ups), coverage check                                              | Release-ready; CHANGELOG entry                                         |

Each phase merges independently; B1 is the first usable milestone, B3 the first
FX-capable one.

**Status: all phases (0–B5) are implemented.** Post-plan refinements folded into the
as-built component:

- Currency badges now render on **every** payee row (USD → US flag), not FX payees only
  (FR-FX-2).
- The review-panel FX block (`FxReviewBlock`) shows a **live "Expires in mm:ss" countdown**
  for locked quotes (FR-FX-7).
- Estimated target-amount labels use a consistent **"(approx.)"** qualifier (FR-FX-6/7/9).
- All rendered strings are **registered content tokens** in `make-payment` `fx.*`
  (en-US + es-US) and host-overridable via `contentTokens` (§12).
- Two **end-to-end interactive stories** (`PaymentFlowFX.Interactive.story.tsx`) run as CI
  tests (§14).
- A developer-facing [README.md](./README.md) accompanies this specification.

---

## 16. Design / UX Enhancements

### 16.1 In scope for PaymentFlowFX

1. **Unified currency-amount control** (`CurrencyAmountInput`): USD amount field with a
   trailing currency affix and, when FX, a live "≈ 1,148.63 EUR" secondary line —
   the Wise-style pattern. Degrades to the plain `$` input for domestic.
2. **Conversion card** (`FxQuotePreview`) + **review-block countdown** (`FxReviewBlock`):
   rate, lock state, expiry countdown chip turning amber under 1 h, a live "Expires in
   mm:ss" chip in the review panel, auto re-quote at expiry, animated (fade) rate changes,
   collapsible rate-sheet disclaimer.
3. **Currency/country badges** on every payee row (flag + ISO code; USD → US flag) —
   destinations scannable before selection and a consistent badge column.
4. **Corridor-aware method cards**: "International" tag + FX settlement window on
   ACH/WIRE; RTP greyed out with the reason inline instead of hidden.
5. **Async-settlement success state**: two-step hint ("Sent ✓ → Converting to EUR…"),
   upgraded in place when the enrichment fetch returns final status/amounts — sets
   expectations and prevents "where is my rate?" tickets.

### 16.2 Proposed for the existing PaymentFlow (optional follow-ups, not in scope)

1. **Extraction dividend**: Phase A alone removes ~400 duplicated lines between
   `PaymentFlow` and `PaymentFlowInline`.
2. **Mobile sticky summary chip** ("$500 · ACH · to Alice") while the review sheet is
   collapsed.
3. **Balance retry affordance**: inline retry icon on per-account balance error rows
   (currently a dead end).
4. **Memo counter + 140-char max** (the API limit exists today; V2 submits would fail
   late).
5. **Completed-step summaries with avatars** and live balance in the "From" summary.
6. **Focus management on auto-advance**: move focus into the newly expanded section for
   keyboard/screen-reader users.
7. **Amount quick-fill chips** ("25% / 50% / Max" of available balance) — especially
   useful for LIMITED_DDA self-transfers.

---

## 17. Open Questions & Risks

| #    | Question / risk                                                                                                                                                                           | Working assumption                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| OQ-1 | Rate sheet base URL: `getCurrentRatesheet` is served from `…/tsapi/v1` while EP components target the EP base URL. Can the showcase/host proxy route `/accounts/{id}/ratesheets/current`? | Generated client uses the shared `useEbInstance`; hosts that can't proxy use `fxConfig.getRate`. Document prominently (§3.3, story docs). If proxying proves impossible even for the showcase, add a dedicated mutator with a `ratesheetBaseUrl` provider option — still non-breaking.                                                                                                                                                                 |
| OQ-2 | Recipients spec `account.currencyCode` + international `routingCodeType` values.                                                                                                          | **Resolved (adopted 1.0.55-latest):** the widened spec types `RoutingCodeType` (13 clearing systems) and `CurrencyCode` (42). International routing is now implemented — the FX config map assigns each currency its canonical `routingCodeType` and recipient creation persists it end-to-end (default `USABA` for domestic). Currency is still tagged client-side via the tolerant `string` accessor. Follow-up: `account.countryCode` per currency. |
| OQ-3 | Which corridors require `paymentPurpose` (e.g. INR)? Not in public docs.                                                                                                                  | Passthrough only (V-6); §11 surfaces API rejections meaningfully.                                                                                                                                                                                                                                                                                                                                                                                      |
| OQ-4 | Does `createTransactionV3` accept LINKED_ACCOUNT recipients via `creditor.id` identically to V2's `recipientId` (LIMITED_DDA self-transfers)? Spec examples only show recipient payouts.  | Assumed yes (same id semantics); verified in B1 against sandbox; MSW mocks encode the assumption.                                                                                                                                                                                                                                                                                                                                                      |
| OQ-5 | Rate sheet `accountId` — confirm it is the EP account id (`fromAccountId`) vs a bank account number. Spec example shows a bare number (`'123456789'`).                                    | Use `fromAccountId`; verify in sandbox during B3; make the id source overridable through `fxConfig` if needed (additive).                                                                                                                                                                                                                                                                                                                              |
| OQ-6 | Legal display requirements for indicative rates per jurisdiction.                                                                                                                         | Rate-sheet `disclaimer` rendered when present; host `legalDisclosure` slot for the rest; default copy clearly non-binding.                                                                                                                                                                                                                                                                                                                             |
