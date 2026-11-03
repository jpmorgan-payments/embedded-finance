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
- **es-US**: Spanish (United States) - Complete translations

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
- `zod.json` - Built-in Zod validation messages (see below)

## Translating Outside React Components

Inside components, use `useTranslationWithTokens`. Code that runs outside
React (Zod schemas, formatters, field-map helpers) must not import the global
`i18n` from `@/i18n/config`: it is always en-US and ignores `contentTokens`.
Use `tActive` from `@/i18n/activeI18n` instead. It translates with the active
`EBComponentsProvider` instance (locale + content tokens) and falls back to the
global instance outside a provider.

Call `tActive` when the text is needed, not at module load. For Zod schemas,
use a lazy error so the message is resolved at validation time:

```typescript
import { tActive } from '@/i18n/activeI18n';

const requiredError = { error: () => tActive('common:validation.required') };

const schema = z.object({
  name: z.string().min(1, requiredError),
  code: z.string().refine(isValidCode, {
    error: () => tActive('validation:common.invalidOption'),
  }),
});
```

## Zod Validation Messages

`src/i18n/zodErrorMap.ts` translates Zod's built-in issues (e.g. "Required",
string length, enum, format) using the `zod` namespace. Messages passed
explicitly to a schema (`.min(1, 'Required')`) take precedence.

- Inside `EBComponentsProvider`, messages follow the provider's locale
  (`contentTokens.name`) and honor `contentTokens.tokens.zod` overrides. If
  several providers are mounted, the most recently mounted one applies.
- Outside a provider, the global i18n instance (en-US) is used.

The `zod.json` files are derived from the locale files of
[zod-i18n-map](https://github.com/aiji42/zod-i18n) by aiji42, used under the
MIT License, and extended with keys for Zod 4-only issues.

> Permission is hereby granted, free of charge, to any person obtaining a copy
> of this software and associated documentation files (the "Software"), to deal
> in the Software without restriction, including without limitation the rights
> to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
> copies of the Software, and to permit persons to whom the Software is
> furnished to do so, subject to the following conditions: The above copyright
> notice and this permission notice shall be included in all copies or
> substantial portions of the Software. THE SOFTWARE IS PROVIDED "AS IS",
> WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO
> THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
> NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE
> FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
> TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR
> THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## Notes

- All JSON files are published as part of the package
- The `src/i18n` directory is included in the published package
- Files can be imported directly without needing to copy them locally
- The package exports support both ESM and CommonJS imports
