# MakePayment Component

## Overview

The MakePayment component provides a comprehensive payment form for creating transactions. It supports multiple payment methods (ACH, RTP, WIRE), account selection, recipient management, and real-time validation.

## Props

### paymentMethods

Configure available payment methods with optional fees. When `fee` is `undefined` or `0`, the fee UI is hidden.

```tsx
// Default: No fees (fee UI hidden)
<MakePayment />

// With fees displayed
<MakePayment
  paymentMethods={[
    { id: 'ACH', name: 'ACH', fee: 2.5, description: 'Standard processing' },
    { id: 'RTP', name: 'RTP', fee: 1.0, description: 'Real-time payment' },
    { id: 'WIRE', name: 'WIRE', fee: 25.0, description: 'Wire transfer' },
  ]}
/>

// Mixed: Some methods free, others with fees
<MakePayment
  paymentMethods={[
    { id: 'ACH', name: 'ACH' }, // Free - no fee shown
    { id: 'RTP', name: 'RTP', fee: 5.0 }, // Fee shown
    { id: 'WIRE', name: 'WIRE', fee: 25.0 }, // Fee shown
  ]}
/>
```

## User Journey Tracking

When `userEventsHandler` is provided, the MakePayment component automatically tracks the following user journeys:

- **payment_form_started**: User opens the payment form dialog
- **payment_submitted**: User submits the payment form
- **payment_completed**: Payment transaction successfully completed
- **payment_failed**: Payment transaction failed
- **payment_account_selected**: User selects an account to pay from
- **payment_recipient_selected**: User selects a recipient
- **payment_method_selected**: User selects a payment method (ACH, RTP, WIRE)

### Basic Usage

```tsx
<MakePayment
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
<MakePayment
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

<MakePayment
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
<MakePayment
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
- `metadata`: Additional context (transactionId, amount, method, recipientId, etc.)
