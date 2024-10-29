# Embedded UI Components

## 🚧 Pre-release Version Notice

Embedded UI Components and this guide is currently in draft form and under active development. Components are not ready for production use and may change significantly until version 1.x.x is released. Please consider this document as a work in progress.

### ADA Compliance Disclaimer

While we strive to incorporate ADA (Americans with Disabilities Act) best practices, please note that developers are responsible for conducting their own comprehensive ADA testing to ensure full compliance with all applicable standards and regulations.

## Overview

Embedded UI Components offer a seamless way to integrate sophisticated UI components into your existing applications, providing a plug-and-play solution for Embedded Finance features. These components implement complex API capabilities for client onboarding and account linking, simplifying the integration process for developers.

## Important Usage Notes

**All Embedded UI Components must be wrapped within the `EBComponentsProvider`.** The `EBComponentsProvider` is specifically designed for these components and is not applicable to any other client components in your application.

## Setup and Configuration

### EBComponentsProvider

The `EBComponentsProvider` is a crucial wrapper component that must be placed at the top level of your Embedded UI Components implementation. It handles authentication, applies theming, and provides necessary context to all child Embedded UI Components.
It is usign @tanstack/react-query for handling API calls and authentication as well as Orval generated types for the API requests and responses.

#### Key Props:

- `apiBaseUrl`: The base URL for API calls (required)
- `theme`: Customization options for the components' appearance (optional)
- `headers`: Custom headers for API requests (optional)

#### Usage:

```jsx@

import { EBComponentsProvider } from '@jpmorgan-payments/embedded-finance-components';

const EmbeddedFinanceSection = () => {
  return (
    <EBComponentsProvider
      apiBaseUrl="https://your-api-base-url.com"
      theme={{
        colorScheme: 'light',
        variables: {
          primaryColor: '#007bff',
          fontFamily: 'Arial, sans-serif',
        },
      }}
      headers={{
        'Custom-Header': 'value',
      }}
    >
      {/* Your Embedded UI Components go here */}
    </EBComponentsProvider>
  );
};
```

## Main Components

### 1. OnboardingWizard

The `OnboardingWizard` component implements the client onboarding process as described in the [Embedded Payments API documentation](https://developer.payments.jpmorgan.com/docs/embedded-banking-solutions/embedded-payments/how-to/onboard-a-client/onboard).

#### Main Features:

- Create a client profile
- Incremenrally update client's related parties
- Complete due diligence questions
- Handle client attestations
- Manage requests for additional documentation
- Check and display onboarding status

#### Usage:

@jpmorgan-payments/embedded-finance-components

```jsx
import {
  EBComponentsProvider,
  OnboardingWizard,
} from '@jpmorgan-payments/embedded-banking-components';

const OnboardingSection = () => {
  const [clientId, setClientId] = useManageClientExternalState();

  const handleClientCreation = ({ response, error }) => {
    // Handle client creation response or error
    setClientId(response.clientId);
  };

  const handleClientKYCInitiation = ({ response, error }) => {
    // Handle KYC initiation response or error
  };

  return (
    <EBComponentsProvider apiBaseUrl="https://your-api-base-url.com">
      <OnboardingWizard
        title="Client Onboarding"
        clientId={clientId}
        onClientCreation={handleClientCreation}
        onClientKYCInitiation={handleClientKYCInitiation}
      />
    </EBComponentsProvider>
  );
};
```

OnboardingWizard could also accept products and jurisdictions as optional props to customize the onboarding process. Please refer to the OnboardingWizardProps interface in the codebase for more details.

### 2. LinkedAccountWidget

The `LinkedAccountWidget` component facilitates the process of adding a client's linked account, as described in the [Add Linked Account API documentation](https://developer.payments.jpmorgan.com/docs/embedded-banking-solutions/embedded-payments/how-to/add-linked-account).

#### Main Features:@jpmorgan-payments/embedded-finance-components

- Add and manage external linked bank accounts for clients
- Handle complex micro-deposits initiation logic

#### Usage:

```jsx
import {
  EBComponentsProvider,
  LinkedAccountWidget,
} from '@jpmorgan-payments/embedded-banking-components';

const LinkedAccountSection = () => {
  return (
    <EBComponentsProvider apiBaseUrl="https://your-api-base-url.com">
      <LinkedAccountWidget variant="default" />
    </EBComponentsProvider>
  );
};
```

Please refer to the LinkedAccountProps interface in the codebase for more details.

## Theming

The `EBComponentsProvider` accepts a `theme` prop that allows for extensive customization of the components' appearance. The theme object can include the following properties:

- `colorScheme`: 'dark' | 'light' | 'system'
- `variables`: An object containing various theme variables
- `light`: Light theme-specific variables
- `dark`: Dark theme-specific variables

### Theme Design Tokens

Here's a table of available theme design tokens that can be used in the `variables`, `light`, and `dark` properties:

| Token Name                                                      | Description                            |
| --------------------------------------------------------------- | -------------------------------------- |
| fontFamily                                                      | Main font family for text              |
| backgroundColor                                                 | Background color of the main container |
| foregroundColor                                                 | Main text color                        |
| primaryColor                                                    | Primary brand color                    |
| primaryColorHover                                               | Hover state of primary color           |
| primaryForegroundColor                                          | Text color on primary background       |
| secondaryColor                                                  | Secondary brand color                  |
| secondaryForegroundColor                                        | Text color on secondary background     |
| destructiveColor                                                | Color for destructive actions          |
| destructiveForegroundColor                                      | Text color on destructive background   |
| mutedColor                                                      | Color for muted elements               |
| mutedForegroundColor                                            | Text color on muted background         |
| accentColor                                                     | Accent color for highlights            |
| accentForegroundColor                                           | Text color on accent background        |
| cardColor                                                       | Background color for card elements     |
| cardForegroundColor                                             | Text color for card elements           |
| popoverColor                                                    | Background color for popovers          |
| popoverForegroundColor                                          | Text color for popovers                |
| borderRadi@jpmorgan-payments/embedded-finance-componentslements |
| buttonBorderRadius                                              | Border radius specifically for buttons |
| borderColor                                                     | Color for borders                      |
| inputColor                                                      | Background color for input fields      |
| ringColor                                                       | Color for focus rings                  |
| zIndexOverlay                                                   | z-index for overlay elements           |

## Installation

```bash
npm install @jpmorgan-payments/embedded-banking-components
```

or

```bash
yarn add @jpmorgan-payments/embedded-banking-components
```

## Contributing

### Recommended VSCode plugins:

- Prettier
- Tailwind CSS Intellisense

### Recommended VS Code Settings

#### `files.associations`

Use the `files.associations` setting to tell VS Code to always open `.css` files in Tailwind CSS mode:

```

"files.associations": {
"\*.css": "tailwindcss"
}

```

#### `editor.quickSuggestions`

By default VS Code will not trigger completions when editing "string" content, for example within JSX attribute values. Updating the `editor.quickSuggestions` setting may improve your experience:

```"editor.quickSuggestions": {
  "strings": "on"
}
```

### Guidelines

1. Create a new component in `./src/core`
2. Export it in `./src/index.tsx`
3. Also add it to `./src/vanilla/componentRegistry.ts`

## npm scripts

## Build and dev scripts

- `dev` – start development server
- `build` – build production version of the app
- `preview` – locally preview production build

### Testing scripts

- `typecheck` – checks TypeScript types
- `lint` – runs ESLint
- `prettier:check` – checks files with Prettier
- `vitest` – runs vitest tests
- `vitest:watch` – starts vitest watch
- `test` – runs `vitest`, `prettier:check`, `lint` and `typecheck` scripts

### Other scripts

- `storybook` – starts storybook dev server
- `storybook:build` – build production storybook bundle to `storybook-static`
- `prettier:write` – formats all files with Prettier
