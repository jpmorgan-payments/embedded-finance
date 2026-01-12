# i18n Files

This directory contains all internationalization (i18n) translation files for the Embedded Finance Components library.

## Package Exports

The i18n files are exposed through the package exports, allowing consumers to import them directly:

### Importing JSON Translation Files

```typescript
// Import individual JSON files
import enUSAccounts from '@jpmorgan-payments/embedded-finance-components/i18n/en-US/accounts.json';
import enUSCommon from '@jpmorgan-payments/embedded-finance-components/i18n/en-US/common.json';
import enUSOnboarding from '@jpmorgan-payments/embedded-finance-components/i18n/en-US/onboarding.json';
import esUSAccounts from '@jpmorgan-payments/embedded-finance-components/i18n/es-US/accounts.json';
// Import from other locales
import frCAAccounts from '@jpmorgan-payments/embedded-finance-components/i18n/fr-CA/accounts.json';
```

### Importing the Config

```typescript
// Import the i18n configuration and default resources
import {
  createI18nInstance,
  defaultResources,
} from '@jpmorgan-payments/embedded-finance-components/i18n/config';
```

### Using with Vite's import.meta.glob

```typescript
// Load all JSON files from a locale directory
const i18nModules = import.meta.glob(
  '@jpmorgan-payments/embedded-finance-components/i18n/en-US/*.json',
  { eager: true, import: 'default' }
) as Record<string, any>;
```

### Using with Dynamic Imports

```typescript
// Dynamic import example
const loadTranslations = async () => {
  const accounts = await import(
    '@jpmorgan-payments/embedded-finance-components/i18n/en-US/accounts.json'
  );
  const common = await import(
    '@jpmorgan-payments/embedded-finance-components/i18n/en-US/common.json'
  );
  return { accounts, common };
};
```

## Available Locales

- **en-US**: English (United States) - Complete translations
- **fr-CA**: French (Canada) - Complete translations
- **es-US**: Spanish (United States) - Partial translations (accounts, recipients, transactions)

## Available Namespaces

Each locale contains the following namespaces:

- `accounts.json` - Account-related translations
- `bank-account-form.json` - Bank account form translations
- `common.json` - Common/shared translations
- `linked-accounts.json` - LinkedAccountWidget translations
- `make-payment.json` - Payment flow translations
- `onboarding.json` - Onboarding flow translations
- `onboarding-overview.json` - Onboarding overview translations
- `recipients.json` - RecipientsWidget management translations
- `transactions.json` - Transactions display translations
- `validation.json` - Form validation messages

## Notes

- All JSON files are published as part of the package
- The `src/i18n` directory is included in the published package
- Files can be imported directly without needing to copy them locally
- The package exports support both ESM and CommonJS imports
