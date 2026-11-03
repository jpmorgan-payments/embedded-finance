---
name: i18n-l10n
description: Translation and locale-formatting conventions for embedded-components - useTranslationWithTokens namespaces, t vs tString, adding keys across the en-US, fr-CA, and es-US JSON files, typed keys, content-token overrides, and locale-aware date, number, and currency formatting. Use when adding or changing user-visible text, translation keys or namespaces, validation messages, or code that formats dates, amounts, or currencies.
license: Apache-2.0
metadata:
  author: jpmorgan-payments
---

# i18n and l10n

Supported locales are `en-US` (default and fallback), `fr-CA`, and `es-US`. Partners choose one with `contentTokens={{ name: 'enUS' | 'frCA' | 'esUS' }}` on `EBComponentsProvider`.

## Translating text

Use `useTranslationWithTokens` from `@/i18n`, not `useTranslation` from `react-i18next`. It wraps i18next so partners can override copy and reveal token IDs.

```tsx
import { useTranslationWithTokens } from '@/i18n';

const { t, tString } = useTranslationWithTokens(['accounts', 'common']);

<h2>{t('title')}</h2>                                   // first namespace is the default
<Button>{t('common:tryAgain', { defaultValue: 'Try again' })}</Button>
<Input placeholder={tString('search.placeholder')} />  // attributes need strings
<p>{t('balance.updated', { date: formattedDate })}</p>  // interpolation
```

- `t` can return a React node (a token-ID `<span>` or rich text), so use it only as JSX children.
- `tString` always returns a string. Use it for attributes (`aria-label`, `placeholder`, `title`), template literals, Zod messages, and toasts.
- Reach other namespaces with the `namespace:key` prefix.
- Keys are type-checked against the en-US resources (`src/@types/i18next.d.ts`), so a key missing from en-US fails `npm run typecheck`.
- `defaultValue` is optional, because missing keys fall back to en-US. Some existing code passes one; follow the surrounding file.

## Adding keys and namespaces

- Translations live in `src/i18n/<en-US|fr-CA|es-US>/<namespace>.json`, one namespace per feature (`accounts`, `recipients`, `make-payment`, `onboarding-overview`, `client-details`, ...) plus shared `common` and `validation`.
- Add every new key to all three locales in the same change, nested by screen or area (`columns.date`, `errors.loadFailed`). If you can't produce a reliable fr-CA or es-US translation, say so in the pull request rather than copying English silently.
- A new namespace needs a JSON file per locale plus imports and registration in `defaultResources` in `src/i18n/config.ts`.
- Generic Zod messages are localized through `zod-i18n-map`; field-specific messages come from your schema hook (see `react-patterns`).

Partners override copy with `contentTokens.tokens` (a deep-partial object per namespace). `showTokenIds: true` adds `data-content-token="namespace:key"` to rendered text. Design notes: [`embedded-components/docs/CONTENT_TOKENS_ARCHITECTURE.md`](../../../embedded-components/docs/CONTENT_TOKENS_ARCHITECTURE.md).

## Formatting

Get the active locale with `useLocale()` from `@/lib/hooks` (returns `en-US`, `fr-CA`, or `es-US`). Never hardcode `'en-US'`.

```ts
const locale = useLocale();
new Intl.NumberFormat(locale, { style: 'currency', currency: 'USD' }).format(amount);
new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeZone: 'UTC' }).format(date);
```

- Pass `timeZone: 'UTC'` when displaying API date-only values (`YYYY-MM-DD`), or the date can shift a day in negative-offset time zones. Pitfalls and parsing rules are in [`embedded-components/docs/DATE_PARSING_GUIDE.md`](../../../embedded-components/docs/DATE_PARSING_GUIDE.md).
- Shared formatters are component-local today (for example `core/TransactionsDisplay/utils/formatNumberToCurrency.ts`). Move one to `src/lib/utils/` when a second component needs it.

## Tests

Render with `contentTokens={{ name: 'enUS' }}` and assert on the English strings from the en-US JSON.
