# TransactionsDisplay Component

## Overview

The TransactionsDisplay component provides a comprehensive interface for viewing and managing transactions. It supports filtering, sorting, pagination, and detailed transaction views.

## User Journey Tracking

When `userEventsHandler` is provided, the TransactionsDisplay component automatically tracks the following user journeys:

- **transactions_list_viewed**: User views the transactions list (automatically tracked when transactions load)
- **transaction_details_viewed**: User views transaction details by clicking on a transaction
- **transactions_filter_changed**: User changes filters (status, type, counterpart, etc.)
- **transactions_refresh**: User refreshes the transactions list

### Basic Usage

```tsx
<TransactionsDisplay
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
<TransactionsDisplay
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

<TransactionsDisplay
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
<TransactionsDisplay
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
- `metadata`: Additional context (transactionId, count, filter values, etc.)
