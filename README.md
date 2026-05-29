# Embedded Finance and Solutions UI Components and Showcase Applications

[Live Demo](https://www.embedded-finance-dev.com)

React component library and showcase application for J.P. Morgan Embedded Finance APIs.

**Note**: Uses MSW (Mock Service Worker) for API mocking. If issues occur, hard refresh (Ctrl+Shift+R) to reload the service worker.

## Packages

### [Embedded Components](./embedded-components/)

React component library for embedded banking features.

Components: OnboardingFlow, LinkedAccountWidget, RecipientsWidget, Accounts, MakePayment, TransactionsDisplay

NPM: [@jpmorgan-payments/embedded-finance-components](https://www.npmjs.com/package/@jpmorgan-payments/embedded-finance-components)

### [Showcase Application](./app/client-next-ts/)

React application demonstrating component usage. Built with Vite, React 18, TypeScript, TanStack Router, Tailwind CSS, MSW.

Main demo: `/sellsense-demo`

### [Embedded Finance SDK](./embedded-finance-sdk/) (not active)

TypeScript SDK for payment data validation and field definitions.

NPM: [@jpmorgan-payments/embedded-finance-sdk](https://www.npmjs.com/package/@jpmorgan-payments/embedded-finance-sdk)

### [API Server](./app/server/)

Express server for proxying requests to J.P. Morgan APIs.

### [Session Transfer Demo](./app/server-session-transfer/)

Demo for partially hosted (drop-in) embedded components integration using session transfer API.

## Quick Start

**Prerequisites**: Node.js 18+, Yarn

**Run showcase:**
```bash
yarn install
cd app/client-next-ts
yarn install
yarn dev
```
Open `http://localhost:3000`

**Run Storybook:**
```bash
cd embedded-components
yarn install
yarn storybook
```
Open `http://localhost:6006`

## Available Demos & Features

### SellSense Marketplace Demo

The main showcase at `/sellsense-demo` demonstrates a complete e-commerce platform with embedded finance features:

- **Wallet Overview** - Account balances and transaction history
- **KYC Onboarding** - Client onboarding flow with document upload
- **Linked Bank Accounts** - External account linking with microdeposits
- **Payment Processing** - Send and receive payments
- **Recipient Management** - Add and manage payment recipients
- **Theme Customization** - See how components adapt to different brand styles

### Component Showcase

Browse all available components on the landing page:

- Interactive component demos
- Code examples and integration guides
- Theme customization examples
- Responsive design demonstrations

All demos use **Mock Service Worker (MSW)** to simulate API responses, so everything works without any backend setup.

## Connecting to Sandbox Environment

If you want to connect to J.P. Morgan's **sandbox** environment with real API endpoints, follow the [Quick Start Guide](https://developer.payments.jpmorgan.com/docs/quick-start).

## Using the Session Transfer Demo

For partially hosted onboarding integration, see the [Session Transfer Demo README](./app/server-session-transfer/README.md) for detailed setup instructions.

## Documentation

- **[Setup Guide](./docs/setup.md)** - Installation and development commands
- **[Component Implementation](./docs/component-implementation.md)** - React patterns and best practices
- **[Testing Guidelines](./docs/testing-guidelines.md)** - Test patterns and MSW setup
- **[TypeScript Conventions](./docs/typescript-conventions.md)** - Type safety and patterns
- **[Git Workflow](./docs/git-workflow.md)** - Commit conventions and branching
