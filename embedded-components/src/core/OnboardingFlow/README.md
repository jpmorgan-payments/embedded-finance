# OnboardingFlow Component

## Overview

The OnboardingFlow component provides a comprehensive multi-step onboarding experience for embedded finance applications. It guides users through business type selection, organization details, party information, document uploads, and verification steps.

## User Journey Tracking

When `userEventsHandler` is provided, the OnboardingFlow component automatically tracks the following user journeys:

- **onboarding_screen_navigation**: User navigates to a different screen/section in the onboarding flow
- **onboarding_form_submit**: User submits a form within the onboarding flow
- **onboarding_document_upload**: User uploads a document
- **onboarding_step_completed**: User completes a step within a section
- **onboarding_section_completed**: User completes an entire section

### Basic Usage

```tsx
<OnboardingFlow
  userEventsHandler={(context) => {
    console.log('User journey:', context.actionName);
    console.log('Event type:', context.eventType);
    console.log('Timestamp:', context.timestamp);
    console.log('Metadata:', context.metadata);
  }}
/>
```

### Integration with Dynatrace

```tsx
<OnboardingFlow
  userEventsHandler={(context) => {
    if (window.dtrum) {
      const actionId = window.dtrum.enterAction(context.actionName);
      // Store actionId if you need to close it later
      setTimeout(() => {
        window.dtrum.leaveAction(actionId);
      }, 100);
    }
  }}
  userEventsLifecycle={{
    onEnter: (context) => {
      if (window.dtrum) {
        return window.dtrum.enterAction(context.actionName);
      }
    },
    onLeave: (context) => {
      if (window.dtrum && context.actionId) {
        window.dtrum.leaveAction(context.actionId);
      }
    },
  }}
/>
```

### Integration with Datadog RUM

```tsx
import { datadogRum } from '@datadog/browser-rum';

<OnboardingFlow
  userEventsHandler={(context) => {
    datadogRum.addAction(context.actionName, {
      eventType: context.eventType,
      timestamp: context.timestamp,
      ...context.metadata,
    });
  }}
/>;
```

### Integration with Generic Analytics

```tsx
<OnboardingFlow
  userEventsHandler={(context) => {
    // Send to your analytics service
    analytics.track(context.actionName, {
      eventType: context.eventType,
      timestamp: context.timestamp,
      ...context.metadata,
    });
  }}
/>
```

Each journey is tracked with:

- `actionName`: The journey identifier
- `eventType`: DOM event type (click, blur, etc.) or 'programmatic'
- `timestamp`: Event timestamp (milliseconds since epoch)
- `element`: The DOM element that triggered the event (if available)
- `metadata`: Additional context (screenId, stepId, sectionId, etc.)

## Hiding Remove / unlink on Overview

Pass **`hideLinkedAccountRemoval`** on `OnboardingFlow` to hide the **Remove** control on the **Overview**
linked-bank-account summary card (next to View details). When `allowMultipleAccounts` is enabled,
the same flag hides Remove on existing-account cards rendered on the **Link bank account** step.

This prop does **not** apply to **`LinkedAccountWidget`**. For the standalone widget — card menus and table
row actions — pass **`hideRemoveRecipient`** on `LinkedAccountWidget` instead. The two flags address different
surfaces; they do **not** contradict each other. Use **both** when your host mounts onboarding and the widget
and you want unlink hidden everywhere.

See also: **`RecipientWidgets/LinkedAccountWidget/README.md`**, repository **`docs/component-implementation.md`**
(section _Linked accounts: hiding Remove_), and **Storybook** → Core → LinkedAccountWidget → Host configuration.

## Link account step options (`linkAccountStepOptions`)

Pre-populate and configure the **Link bank account** step via `linkAccountStepOptions` on `OnboardingFlow`.

| Prop | Type | Default | Description |
| ---- | ---- | ------- | ----------- |
| `initialValues` | `Partial<BankAccountFormData>` | — | Default form values (partial for `editable`, full for `prefillSummary`). |
| `completionMode` | `'editable' \| 'prefillSummary'` | — | `editable` = full two-step form; `prefillSummary` = read-only summary + confirm. |
| `partyId` | `string` | — | Link to an existing party instead of creating one from form fields. |
| `presetAccounts` | `LinkAccountPresetEntry[]` | — | Multiple preset accounts; renders a dropdown selector. Each entry may have its own `partyId` and `initialValues`. Preset `partyId` takes precedence over top-level `partyId`. |
| `allowMultipleAccounts` | `boolean` | `false` | After linking, show "Link another account" instead of redirecting to Overview. Existing accounts display as cards above the form on the **link-account** step only. **Overview** shows a short summary (account count + **Manage linked accounts**) so the full list is not duplicated; open the link-account step to add or manage accounts. |
| `existingAccountsDisplay` | `'compact' \| 'detailed'` | `'detailed'` | Card style for existing accounts when `allowMultipleAccounts` is true. `detailed` shows status alerts, Verify action, and full action menus (same as LinkedAccountWidget). |
| `reviewAcknowledgements` | `LinkAccountReviewAcknowledgement[]` | — | Agreement checkboxes required before submit (both modes). |
| `showAcknowledgementsIntro` | `boolean` | `false` | Show lead-in text above acknowledgement checkboxes. |
| `bankFormConfigOverride` | `BankAccountFormConfigOverride` | — | Override linked-account form config (payment methods, field visibility). Deep-partial: `paymentMethods` sub-fields are individually optional. |
| `summaryDisplayedPaymentTypes` | `RoutingInformationTransactionType[]` | `initialValues.paymentTypes` or `['ACH']` | Payment types shown in prefill summary strip. |

## Duplicate account detection

When `allowMultipleAccounts` is enabled and the host supplies `initialValues` whose `accountNumber` already exists among the linked accounts fetched from the API, the link-account step automatically:

1. **Clears** the prefilled values so the user enters fresh data.
2. **Forces** `completionMode` to `'editable'` regardless of the host-supplied value (overrides `prefillSummary`).
3. **Validates at schema level** — the form rejects an account-number + routing-number combination that already exists among linked accounts (error key: `fields.accountNumber.validation.duplicate`).

This prevents accidental re-linking of the same account via a stale host-supplied prefill.

## PartyId resolution

When the form sends `partyId` (either from `linkAccountStepOptions.partyId`, a preset account's `partyId`, or the form's account-holder dropdown), `partyDetails` is omitted from the `POST /recipients` request. The API links the account to the existing party. In MSW mocking, `partyDetails` is resolved from `db.party` so the response populates correctly.

The form tracks the selected party via `selectedPartyId` in the form data, auto-resolved from:
- The organisation party (when `prefillFromClient` is enabled and party type is `ORGANIZATION`)
- The individual selector dropdown selection (when party type is `INDIVIDUAL`)

## Testing

See **[TESTING.md](./TESTING.md)** for the full pyramid (schema tests, Vitest integration, Storybook parity, SellSense Playwright scenarios) and where to add new coverage.
