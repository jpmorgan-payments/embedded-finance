# Accounts Component

## Overview

The Accounts component displays a list of accounts for a client, showing account details, balances, and status information.

## User Journey Tracking

When `userEventsHandler` is provided, the Accounts component automatically tracks the following user journeys:

- **accounts_viewed**: User views the accounts list (automatically tracked when accounts load)
- **account_details_viewed**: User views account details (when details are expanded)
- **accounts_refresh**: User refreshes the accounts list

### Basic Usage

```tsx
<Accounts
  allowedCategories={['LIMITED_DDA', 'LIMITED_DDA_PAYMENTS']}
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
<Accounts
  allowedCategories={['LIMITED_DDA', 'LIMITED_DDA_PAYMENTS']}
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

<Accounts
  allowedCategories={['LIMITED_DDA', 'LIMITED_DDA_PAYMENTS']}
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
<Accounts
  allowedCategories={['LIMITED_DDA', 'LIMITED_DDA_PAYMENTS']}
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
- `metadata`: Additional context (account count, account ID, etc.)
