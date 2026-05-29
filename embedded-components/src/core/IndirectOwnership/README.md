# IndirectOwnership Component

## Overview

The IndirectOwnership component provides a streamlined interface for managing beneficial ownership structures. It supports adding, editing, and removing owners with real-time validation and hierarchy building.

## User Journey Tracking

When `userEventsHandler` is provided, the IndirectOwnership component automatically tracks the following user journeys:

- **ownership_structure_viewed**: User views the ownership structure
- **ownership_add_owner_started**: User opens the dialog to add a new owner
- **ownership_add_owner_completed**: Owner successfully added
- **ownership_edit_owner_started**: User opens the dialog to edit an owner
- **ownership_edit_owner_completed**: Owner successfully updated
- **ownership_remove_owner_started**: User initiates owner removal
- **ownership_remove_owner_completed**: Owner successfully removed

### Basic Usage

```tsx
<IndirectOwnership
  client={clientData}
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
<IndirectOwnership
  client={clientData}
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

<IndirectOwnership
  client={clientData}
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
<IndirectOwnership
  client={clientData}
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
- `metadata`: Additional context (ownerId, ownershipType, etc.)
