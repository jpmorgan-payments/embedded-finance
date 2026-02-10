# Partially Hosted UI Component

⚠️ **WORK IN PROGRESS - REFERENCE IMPLEMENTATION ONLY** ⚠️

> This is a reference implementation provided as-is for integration guidance purposes. Not recommended for production use without thorough testing and validation. Platforms should adapt this code to meet their specific requirements and security standards.

## Overview

A lightweight, framework-agnostic JavaScript utility library for embedding JPMorgan Chase hosted onboarding experiences into your web application. This library simplifies iframe management, URL construction with encoded parameters, and event communication.

## Features

- ✅ **Zero Dependencies** - Pure JavaScript, no external dependencies
- ✅ **Framework Agnostic** - Works with React, Vue, Angular, or vanilla JS
- ✅ **Secure by Default** - Proper iframe sandbox attributes and origin validation
- ✅ **Theme Support** - Pass custom themes via encoded URL parameters
- ✅ **Localization** - Support for content tokens and multi-language
- ✅ **Event System** - Pub/sub pattern for iframe communication
- ✅ **TypeScript Ready** - JSDoc comments for IDE autocomplete
- ✅ **Multiple Formats** - ES Module (.mjs) and UMD (.js) builds

## Installation

### Option 1: ES Module (Recommended)

```html
<script type="module">
  import PartiallyHostedUIComponent from './partially-hosted-ui-component.mjs';
  
  const ui = new PartiallyHostedUIComponent({ /* config */ });
</script>
```

### Option 2: UMD (Browser Global)

```html
<script src="./partially-hosted-ui-component.js"></script>
<script>
  const ui = new PartiallyHostedUIComponent({ /* config */ });
</script>
```

### Option 3: CommonJS (Node.js)

```javascript
const PartiallyHostedUIComponent = require('./partially-hosted-ui-component.js');

const ui = new PartiallyHostedUIComponent({ /* config */ });
```

## Quick Start

```html
<!DOCTYPE html>
<html>
<head>
  <title>Onboarding Integration</title>
</head>
<body>
  <!-- Container for the hosted UI -->
  <div id="onboarding-container"></div>

  <script type="module">
    import PartiallyHostedUIComponent from './partially-hosted-ui-component.mjs';

    // Initialize
    const ui = new PartiallyHostedUIComponent({
      sessionToken: 'your-jwt-token-from-backend',
      experienceType: 'HOSTED_DOC_UPLOAD_ONBOARDING_UI',
      themeTokens: {
        colorScheme: 'light',
        variables: {
          primaryColor: '#0070f3',
          fontFamily: 'system-ui, sans-serif'
        }
      },
      contentTokens: {
        locale: 'en-US',
        brandName: 'Your Platform'
      }
    });

    // Subscribe to events
    ui.subscribe((event) => {
      console.log('Event:', event.message, event.payload);
      
      if (event.message === 'OnboardingComplete') {
        // Handle completion
      }
    });

    // Mount to DOM
    ui.mount('onboarding-container');
  </script>
</body>
</html>
```

## API Reference

### Constructor

```javascript
new PartiallyHostedUIComponent(config)
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `config.sessionToken` | `string` | ✅ Yes | JWT session token from your backend |
| `config.experienceType` | `string` | ❌ No | Type of experience (default: `'HOSTED_DOC_UPLOAD_ONBOARDING_UI'`) |
| `config.baseUrl` | `string` | ❌ No | Base URL for hosted UI (default: production URL) |
| `config.theme` | `object` | ❌ No | Theme configuration object |
| `config.contentTokens` | `object` | ❌ No | Content localization tokens |
| `config.iframeAttributes` | `object` | ❌ No | Additional iframe HTML attributes |
| `config.debug` | `boolean` | ❌ No | Enable debug logging (default: `false`) |

**Throws:**
- `Error` if `sessionToken` is not provided

### Methods

#### `mount(targetElementId)`

Mounts the iframe to a target DOM element.

```javascript
ui.mount('container-id');
```

**Parameters:**
- `targetElementId` (string) - ID of the DOM element to mount into

**Throws:**
- `Error` if element not found
- `Error` if already mounted

---

#### `unmount()`

Removes the iframe and cleans up event listeners.

```javascript
ui.unmount();
```

---

#### `subscribe(callback)`

Subscribe to events from the component. Returns an unsubscribe function.

```javascript
const unsubscribe = ui.subscribe((event) => {
  console.log('Event:', event);
});

// Later:
unsubscribe();
```

**Parameters:**
- `callback` (Function) - Event handler `(event: object) => void`

**Returns:**
- `Function` - Unsubscribe function

**Event Structure:**

```javascript
{
  level: 'info' | 'warning' | 'error' | 'debug',
  namespace: 'lifecycle' | 'onboarding' | 'session' | 'error' | 'debug',
  message: string,
  payload: object
}
```

---

#### `updateTheme(theme)`

Dynamically update the theme (requires iframe reload).

```javascript
ui.updateTheme({
  colorScheme: 'dark',
  variables: {
    primaryColor: '#1a73e8'
  }
});
```

**Parameters:**
- `theme` (object) - Theme configuration to merge with existing

---

#### `updateContentTokens(contentTokens)`

Dynamically update content tokens (requires iframe reload).

```javascript
ui.updateContentTokens({
  locale: 'es-ES',
  brandName: 'Su Plataforma'
});
```

**Parameters:**
- `contentTokens` (object) - Content tokens to merge with existing

---

#### `refresh()`

Refresh the iframe (unmount and remount with current configuration).

```javascript
ui.refresh();
```

---

#### `getState()`

Get current component state.

```javascript
const state = ui.getState();
console.log(state);
// {
//   isMounted: true,
//   targetElementId: 'container-id',
//   experienceType: 'HOSTED_DOC_UPLOAD_ONBOARDING_UI',
//   hasTheme: true,
//   hasContentTokens: true,
//   subscriberCount: 2
// }
```

---

#### `destroy()`

Cleanup and destroy the component instance. After calling, the instance should not be reused.

```javascript
ui.destroy();
```

## Configuration Details

### Theme Configuration

The theme object supports the following structure:

```javascript
{
  colorScheme: 'light' | 'dark',
  variables: {
    // Color tokens
    primaryColor: string,        // e.g., '#0070f3'
    backgroundColor: string,      // e.g., '#ffffff'
    textColor: string,           // e.g., '#000000'
    
    // Typography
    fontFamily: string,          // e.g., 'system-ui, sans-serif'
    fontSize: string,            // e.g., '16px'
    
    // Spacing & Layout
    borderRadius: string,        // e.g., '8px'
    spacing: string,             // e.g., '16px'
    
    // Additional custom tokens...
  }
}
```

For complete theme documentation, see [Embedded Components Theme Docs](../../../embedded-components/README.md#theming).

### Content Tokens

Content tokens allow customization of text and localization:

```javascript
{
  locale: string,              // e.g., 'en-US', 'es-ES', 'fr-FR'
  brandName: string,           // Your platform name
  customLabels: {
    submitButton: string,      // Custom label for submit button
    cancelButton: string,      // Custom label for cancel button
    // Additional custom labels...
  }
}
```

For complete content token documentation, see [Embedded Components Content Tokens](../../../embedded-components/README.md#content-tokens).

### Iframe Attributes

You can pass additional HTML attributes for the iframe:

```javascript
{
  iframeAttributes: {
    allowfullscreen: true,
    height: '800',
    style: 'border: 1px solid #ccc;',
    'data-testid': 'onboarding-iframe'
  }
}
```

## Events

### Lifecycle Events

| Event Message | Namespace | Description |
|---------------|-----------|-------------|
| `Mounted` | `lifecycle` | Component mounted successfully |
| `Unmounted` | `lifecycle` | Component unmounted |
| `IframeLoaded` | `lifecycle` | Iframe content loaded |
| `IframeLoadError` | `lifecycle` | Iframe failed to load |

### Onboarding Events

Events from the hosted UI (received via postMessage):

| Event Message | Namespace | Description |
|---------------|-----------|-------------|
| `OnboardingComplete` | `onboarding` | User completed onboarding |
| `OnboardingError` | `onboarding` | Error during onboarding |
| `SessionExpired` | `session` | Session token expired |

**Note:** Actual event messages depend on the hosted UI implementation and should be documented separately.

## Framework Examples

### React

```jsx
import { useEffect, useRef, useState } from 'react';
import PartiallyHostedUIComponent from './partially-hosted-ui-component.mjs';

function OnboardingComponent({ sessionToken }) {
  const containerRef = useRef(null);
  const uiRef = useRef(null);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    const ui = new PartiallyHostedUIComponent({
      sessionToken,
      experienceType: 'HOSTED_DOC_UPLOAD_ONBOARDING_UI',
      themeTokens: { colorScheme: 'light' },
      debug: true
    });

    ui.subscribe((event) => {
      if (event.message === 'OnboardingComplete') {
        setStatus('complete');
      }
    });

    ui.mount('onboarding-container');
    uiRef.current = ui;

    return () => {
      ui.destroy();
    };
  }, [sessionToken]);

  return (
    <div>
      {status === 'complete' && <div>✓ Onboarding Complete!</div>}
      <div id="onboarding-container" ref={containerRef} />
    </div>
  );
}
```

### Vue 3

```vue
<template>
  <div>
    <div v-if="status === 'complete'">✓ Onboarding Complete!</div>
    <div id="onboarding-container" ref="container"></div>
  </div>
</template>

<script>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import PartiallyHostedUIComponent from './partially-hosted-ui-component.mjs';

export default {
  props: ['sessionToken'],
  setup(props) {
    const container = ref(null);
    const status = ref('loading');
    let ui = null;

    onMounted(() => {
      ui = new PartiallyHostedUIComponent({
        sessionToken: props.sessionToken,
        experienceType: 'HOSTED_DOC_UPLOAD_ONBOARDING_UI',
        themeTokens: { colorScheme: 'light' }
      });

      ui.subscribe((event) => {
        if (event.message === 'OnboardingComplete') {
          status.value = 'complete';
        }
      });

      ui.mount('onboarding-container');
    });

    onBeforeUnmount(() => {
      if (ui) ui.destroy();
    });

    return { container, status };
  }
};
</script>
```

### Angular

```typescript
import { Component, OnInit, OnDestroy } from '@angular/core';
import PartiallyHostedUIComponent from './partially-hosted-ui-component.mjs';

@Component({
  selector: 'app-onboarding',
  template: `
    <div>
      <div *ngIf="status === 'complete'">✓ Onboarding Complete!</div>
      <div id="onboarding-container"></div>
    </div>
  `
})
export class OnboardingComponent implements OnInit, OnDestroy {
  private ui: any;
  status = 'loading';

  constructor() {}

  ngOnInit() {
    this.ui = new PartiallyHostedUIComponent({
      sessionToken: 'your-token',
      experienceType: 'HOSTED_DOC_UPLOAD_ONBOARDING_UI',
      themeTokens: { colorScheme: 'light' }
    });

    this.ui.subscribe((event: any) => {
      if (event.message === 'OnboardingComplete') {
        this.status = 'complete';
      }
    });

    this.ui.mount('onboarding-container');
  }

  ngOnDestroy() {
    if (this.ui) {
      this.ui.destroy();
    }
  }
}
```

## Security Considerations

### Iframe Sandbox

The library automatically applies these sandbox attributes:
- `allow-scripts` - Required for hosted UI functionality
- `allow-same-origin` - Required for storage and API access
- `allow-forms` - Required for form submission
- `allow-popups` - Required for OAuth flows
- `allow-modals` - Required for dialogs

**Important:** Do NOT add `allow-top-navigation` unless absolutely necessary.

### Origin Validation

All postMessage events are validated against the configured `baseUrl`. Messages from other origins are rejected.

### Token Security

- Session tokens should be short-lived (recommended: 60 seconds)
- Tokens are passed via URL parameters (ensure HTTPS)
- Tokens are never logged in production (automatically redacted in debug logs)

### Content Security Policy

Add this CSP header to your page:

```
Content-Security-Policy: frame-src https://onboarding.jpmorgan.com;
```

## Troubleshooting

### Iframe not loading

1. Check browser console for errors
2. Verify session token is valid and not expired
3. Verify target element ID exists in DOM
4. Check network tab for failed requests

### Events not received

1. Verify origin validation is passing
2. Check that hosted UI is sending postMessage events
3. Enable debug mode: `debug: true` in config
4. Check browser console for warnings

### Theme not applying

1. Verify theme object structure matches documentation
2. Check browser console for encoding errors
3. Try refreshing: `ui.refresh()`

## Development

### Debug Mode

Enable detailed logging:

```javascript
const ui = new PartiallyHostedUIComponent({
  sessionToken: 'token',
  debug: true  // Enables console.log for all operations
});
```

### Testing

```javascript
// Check component state
console.log(ui.getState());

// Test event system
ui.subscribe((event) => {
  console.log('Test event:', event);
});

// Manual refresh
ui.refresh();
```

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

Requires:
- ES6+ support
- `URLSearchParams` API
- `postMessage` API
- `Promise` support

## License

Apache License 2.0

## Related Documentation

- [Integration Guide](./PARTIALLY_HOSTED_UI_INTERGRATION_GUIDE.md)
- [Embedded Components README](../../../embedded-components/README.md)
- [Theme Documentation](../../../embedded-components/README.md#theming)
- [Content Tokens](../../../embedded-components/README.md#content-tokens)

## Support

For questions or issues, please contact your JPMorgan Chase integration team.

---

**Version:** 1.0.0-alpha  
**Last Updated:** November 2025  
**Status:** Work in Progress - Reference Implementation