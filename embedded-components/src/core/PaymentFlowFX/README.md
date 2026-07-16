# PaymentFlowFX

> **Status: Beta** — exported and usable, but API / behaviour may still change before GA. Prefer `PaymentFlow` for domestic USD-only hosts until FX is required.

`PaymentFlowFX` (dialog) and `PaymentFlowFXInline` (embedded) are the cross-border /
multicurrency payout counterparts to [`PaymentFlow`](../PaymentFlow/PaymentFlow.tsx). They
preserve **all** existing `PaymentFlow` behaviour (USD → USD payments are byte-for-byte the
same) and add FX payouts via `createTransactionV3` and the FX Rate Sheet API.

- **USD → USD** payments behave exactly like `PaymentFlow`.
- **USD → non-USD** payments add currency badges, FX-eligible account/method filtering,
  a live conversion preview, an expiry countdown, and an async-settlement success view.

> **Requirements / design source of truth:** [SPECIFICATION.md](./SPECIFICATION.md).
> This README is the developer-facing quick reference; the specification carries the full
> functional requirements (FR-FX-1…11), API mapping, and validation rules.

## Structure

```
PaymentFlowFX/
├── PaymentFlowFX.tsx              # Thin orchestrators: PaymentFlowFX (dialog) + PaymentFlowFXInline
├── PaymentFlowFX.types.ts         # Public + internal types (FxConfig, FxQuote, props, FXPayee…)
├── PaymentFlowFX.constants.ts     # SUPPORTED_TARGET_CURRENCIES, FX_ALLOWED_METHODS, delivery, eligibility
├── components/
│   ├── FXTransferView.tsx         # Main stepper view (composes shared PaymentFlow StepSection etc.)
│   ├── CurrencyAmountInput.tsx    # USD amount input + currency affix + "≈ target" secondary line
│   ├── FxQuotePreview.tsx         # Conversion card (rate, lock/indicative, expiry, disclaimer)
│   ├── FxReviewBlock.tsx          # Review-panel FX block with live expiry countdown
│   ├── FXSuccessView.tsx          # Success view incl. optional getTransactionV3 enrichment
│   └── StateViews.tsx             # Loading / empty / fatal-error states
├── hooks/
│   ├── useFxEligibility.ts        # Account / method / payee eligibility (FR-FX-3/4)
│   ├── useFxQuote.ts              # Rate acquisition state machine per fxConfig.mode (FR-FX-6)
│   ├── useSubmitTransactionV3.ts  # V3 request assembly + mutation + error state (FR-FX-8)
│   └── usePaymentFlowFXData.ts    # Accounts + balances + recipients/payee transformation
├── utils/
│   ├── counterparty.ts            # mapUnsavedRecipientToCounterParty, buildV3Request
│   ├── rateSheet.ts               # selectRateFromSheet + conversion math
│   ├── eligibility.ts             # Pure eligibility predicates + disabled-reason strings
│   ├── format.ts                  # Intl currency / countdown formatting helpers
│   ├── referenceId.ts             # generateTransactionReferenceId
│   └── transactionErrors.ts       # V3 + rate-sheet error parsing (additive over PaymentFlow)
├── stories/                       # Beta/PaymentFlowFX Storybook stories (see below)
├── index.ts                       # Public exports
├── README.md                      # This file
└── SPECIFICATION.md               # Full requirements & design
```

## Usage

Always wrap the component in `EBComponentsProvider`.

```tsx
import { EBComponentsProvider } from '@/core/EBComponentsProvider';
import { PaymentFlowFX, PaymentFlowFXInline } from '@/core/PaymentFlowFX';

// Dialog variant (trigger opens a modal)
<EBComponentsProvider apiBaseUrl="https://api-url" theme={{ colorScheme: 'light' }}>
  <PaymentFlowFX
    trigger={<Button>Send money</Button>}
    fxConfig={{ mode: 'ratesheet' }}
    onTransactionComplete={(response, error, details) => {
      // response: TransactionResponseV3 (minimal 202 body)
      // details: TransactionGetResponseV3 when enrichment succeeded
    }}
  />
</EBComponentsProvider>

// Inline variant (embedded, no dialog)
<EBComponentsProvider apiBaseUrl="https://api-url" theme={{ colorScheme: 'light' }}>
  <PaymentFlowFXInline fxConfig={{ mode: 'realtime' }} />
</EBComponentsProvider>
```

### FX rate modes (`fxConfig.mode`)

| Mode                 | Rate source                            | Locking            | Notes                                                                                             |
| -------------------- | -------------------------------------- | ------------------ | ------------------------------------------------------------------------------------------------- |
| `realtime` (default) | None (or optional `getIndicativeRate`) | Never              | No rate call; conversion shown as "determined at processing" unless an indicative is given.       |
| `ratesheet`          | Built-in `getCurrentRatesheet`         | `EXECUTABLE` rates | `EXECUTABLE` → locked quote (`rateId` submitted) + expiry countdown; `INDICATIVE` → display only. |
| `provider`           | Host-supplied `getRate` callback       | Provider `rateId`  | Debounced on amount change; the returned `rateId` is submitted when present.                      |

Any rate failure (HTTP error, `200`-with-`errors[]`, no matching pair, out-of-bounds amount)
is **non-blocking**: the UI shows a market-rate fallback notice and the payment submits
without a `rateId`.

### Key FX props

| Prop                           | Type                                    | Default                       | Purpose                                                        |
| ------------------------------ | --------------------------------------- | ----------------------------- | -------------------------------------------------------------- |
| `fxConfig`                     | `FxConfig`                              | `{ mode: 'realtime' }`        | Rate mode, provider callbacks, `paymentPurpose` passthrough.   |
| `supportedTargetCurrencies`    | `string[]`                              | `SUPPORTED_TARGET_CURRENCIES` | Restrict selectable / eligible target currencies.              |
| `enrichTransactionAfterSubmit` | `boolean`                               | `true`                        | Fetch `getTransactionV3` once after the 202 to enrich success. |
| `onTransactionComplete`        | `(response?, error?, details?) => void` | —                             | `details` is the enrichment result when it succeeds.           |

All inherited `PaymentFlow` props (`trigger`, `paymentMethods`, `initialAccountId`,
`initialPayeeId`, `initialPaymentMethod`, `initialAmount`, `showFees`, `open`/`onOpenChange`,
`resetKey`, `hideHeader`, `showContainer`, `className`, user tracking) keep their exact
semantics.

## Architecture

- **Self-contained sibling of `PaymentFlow`** — added alongside it with **zero behavioural
  change** to the existing component. Everything outside `src/core/PaymentFlowFX/` is
  additive: shared `PaymentFlow` components gained only optional props whose defaults
  reproduce today's behaviour.
- **Reuses `PaymentFlow` building blocks** — `FlowContainer`, `PayeeSelector`,
  `PaymentMethodSelector`, `ReviewPanel`, forms, and the extracted `StepSection` /
  state-view / error / formatting helpers are imported as-is.
- **V3 transaction API** — all payments (domestic and FX) submit via `createTransactionV3`
  using counterparty objects (`debtor`/`creditor`) and a **string** amount. The 202 response
  is minimal (`id`, `transactionReferenceId`, `requestedExecutionDate`); the success view is
  built from form data and optionally enriched with a single `getTransactionV3` fetch.
- **Money logic lives in pure hooks/utils** — `buildV3Request`, `selectRateFromSheet`,
  `mapUnsavedRecipientToCounterParty`, and the eligibility predicates are unit-tested
  directly, so `PaymentFlowFX.tsx` stays a thin wiring layer.

## Key differences vs `PaymentFlow`

| Feature              | PaymentFlow              | PaymentFlowFX                                                            |
| -------------------- | ------------------------ | ------------------------------------------------------------------------ |
| Transaction API      | `createTransaction` (V2) | `createTransactionV3` (counterparties, string amount, minimal 202)       |
| Currencies           | USD only                 | USD debit → 33-currency target enum (`TargetCurrencyV3`)                 |
| Payee currency badge | None                     | Every payee badged (USD → US flag; FX payees show currency + country)    |
| Payment methods      | Per-routing availability | FX restricts to ACH / WIRE; RTP disabled-with-reason (not hidden)        |
| Account eligibility  | OPEN/PENDING_CLOSE       | + FX-eligible categories (`TRANSACTION_ACCOUNT`, `LIMITED_DDA_PAYMENTS`) |
| Conversion preview   | N/A                      | Live rate card + review-panel FX block with expiry countdown             |
| Success view         | Reference + summary      | + "being converted" async state, optional status/FX enrichment           |
| i18n namespace       | `make-payment`           | `make-payment` (shared; adds the `fx.*` section)                         |

## FX behaviour highlights

- **Currency badges (FR-FX-2).** Every recipient row carries a currency badge. USD/domestic
  recipients render the US flag; FX recipients show the target currency code and country flag,
  making destinations scannable before selection.
- **Eligibility (FR-FX-3/4).** When a target currency is set, ineligible debtor accounts and
  RTP are shown disabled with an inline reason, reusing `PaymentFlow`'s bidirectional
  conflict-clearing mechanism (amber banner + navigate back to the offending step).
- **Conversion preview (FR-FX-6).** `FxQuotePreview` shows "Recipient gets (approx.) …",
  "1 USD = {rate} {CUR}", the lock/indicative label, and (when locked) an expiry countdown.
  Updates are announced via `aria-live`.
- **Review countdown (FR-FX-7).** `FxReviewBlock` renders the FX summary in the review panel
  with a live "Expires in mm:ss" chip (ticks every second, `Clock` icon) for locked quotes.
- **Success enrichment (FR-FX-9).** After the 202, an optional single `getTransactionV3` fetch
  upgrades the "being converted to {CUR}" state in place with final status / amount when
  available; enrichment failure degrades silently (the payment already succeeded).

## Content tokens & i18n

All user-facing strings rendered by the component live in the **`make-payment`** namespace
under the `fx.*` section and are registered in the locale resources
([`src/i18n/en-US/make-payment.json`](../../i18n/en-US/make-payment.json),
[`src/i18n/es-US/make-payment.json`](../../i18n/es-US/make-payment.json)). Because every key
exists in the `en-US` resource, hosts can override any of them through the provider's
`contentTokens` prop (the standard content-tokens contract used across components):

```tsx
<EBComponentsProvider
  apiBaseUrl="https://api-url"
  contentTokens={{
    tokens: {
      'make-payment': {
        fx: {
          flowTitle: 'Send an international payment',
          recipientGets: 'They receive (approx.)',
        },
      },
    },
  }}
>
  <PaymentFlowFX />
</EBComponentsProvider>
```

Notes:

- `fr-CA` is intentionally left empty (`{}`) and falls back to `en-US`.
- A small set of util/hook-produced pass-through reason strings (eligibility disabled
  reasons, rate-hook status text, reference/currency labels) are intentionally left as code
  defaults — they mirror the base `PaymentFlow` contract and are covered by tests that assert
  the caller-supplied string. See SPECIFICATION.md §12 for the full rationale.

## Testing

Tests follow the same conventions as [PaymentFlow.test.tsx](../PaymentFlow/PaymentFlow.test.tsx)
(Vitest + `@test-utils` render/screen/userEvent + MSW handler overrides per test):

- **Parity suite** — `PaymentFlowFX.test.tsx` ports the full `PaymentFlow` case list against
  domestic-only fixtures; the only deltas are the V3 endpoint and request-shape assertions.
- **FX behaviour** — eligibility matrices, per-mode quote lifecycle, `buildV3Request` /
  `selectRateFromSheet` / `mapUnsavedRecipientToCounterParty` unit tests, success enrichment,
  and error mappings.

Pure utils/hooks carry the money logic and target ~100% branch coverage. Run the local
component tests with `yarn vitest run src/core/PaymentFlowFX`.

## Storybook

Stories are titled `Beta/PaymentFlowFX` with tags `['@core', '@payments', 'autodocs']`:

| File                                  | Focus                                                                                                          |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| `PaymentFlowFX.story.tsx`             | Default and per-mode variants (rate sheet, provider, realtime, with fees, initial FX payee).                   |
| `PaymentFlowFX.Workflows.story.tsx`   | Play-function walkthroughs of complete FX payments and rate-expiry re-quote.                                   |
| `PaymentFlowFX.States.story.tsx`      | Rate-unavailable fallback, all-rates-expired, ineligible account, currency-not-enabled, enrichment fail.       |
| `PaymentFlowFX.Interactive.story.tsx` | End-to-end journeys: `CreateInternationalRecipientEndToEnd` and `CompleteFxPaymentEndToEnd` (run as CI tests). |
| `PaymentFlowFXInline.story.tsx`       | Inline variant defaults, `hideHeader`, `showContainer`.                                                        |

```

```
