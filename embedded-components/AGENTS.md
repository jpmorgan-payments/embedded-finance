# Embedded Components - Package-Specific Instructions

## ⚠️ CRITICAL: Follow ARCHITECTURE.md

**All code generation MUST follow the patterns defined in `ARCHITECTURE.md`.**

**Before generating any component code, review `ARCHITECTURE.md` for the complete pattern.**

## Component Location

New components must be placed in `src/core/` following the architecture pattern.

## Package-Specific Setup

All commands run from this directory (`embedded-components/`):

- Install dependencies: `npm install`
- Start development server: `npm run dev`
- Run Storybook: `npm run storybook`
- Run tests: `npm test`
- Run tests in watch mode: `npm run test:watch`
- Type checking: `npm run typecheck`
- Build: `npm run build` (**run after substantive `.ts`/`.tsx` edits—including tests/mocks**; not only large refactors)
- Linting: `npm run lint`
- Format code: `npm run format` (rewrites every `.ts`/`.tsx` file; prefer targeted Prettier below)

**After any `.ts` / `.tsx` edit:** format **only the files you touched** using `node_modules/.bin/prettier --write <file1> <file2> ...`. Do NOT run `npm run format` without arguments — it reformats the **entire repo** and creates hundreds of unintended changes.

**Always run `npm run build`** before you consider the task done—not only for large refactors. Test files (`*.test.tsx`, mocks, Vitest stubs) are included in compilation; **`npm run build` catches strict typing errors that Vitest alone may not surface** (for example mismatched mock return types).

**Before every push**, run this checklist in order:

1. `node_modules/.bin/prettier --write <your-changed-files>` (targeted format)
2. `npm run typecheck` (catches missing required fields in generated types)
3. `npm run lint` (catches unused imports, boolean prop values, promise patterns)
4. `npx vitest run <your-test-files>` (verify tests pass)

## Writing Tests — Key Conventions

These rules prevent CI failures caught by `npm run lint` and `npm run typecheck`:

1. **Generated schema mocks** — Use `as unknown as Type` for partial mocks of generated API schemas (e.g., `Recipient`, `AccountResponse`). Don't try to fill every required field:
   ```typescript
   const mock = { id: 'x', status: 'ACTIVE' } as unknown as Recipient;
   ```
2. **Generated schemas require all fields** — If you do use a typed annotation (`: Recipient`), you must include ALL required fields from `src/api/generated/*.schemas.ts` (e.g., `routingCodeType`, `countryCode`, `createdAt`).
3. **`PaymentMethodType[]` not `readonly`** — When creating inline arrays for mock `Payee` objects, cast as `['ACH'] as PaymentMethodType[]`, not `as const` (readonly arrays can't assign to mutable types).

Then run **`npm test`** (full pipeline) or a narrower **`npx vitest run …`** while iterating.

**For large changes:** run Prettier on the changed files, then `npm run typecheck`, `npm run build`, and `npm test` before committing.

`npm test` runs `typecheck`, `lint`, and Vitest with coverage. It does **not** check formatting (and CI doesn't either), so format the files you touched yourself.

## Storybook Stories

Only for `embedded-components`. Generate stories as:

```typescript
import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta<typeof ComponentName> = {
  component: ComponentName,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ComponentName>;

export const Default: Story = {
  args: {
    // Props
  },
};
```

## Provider Setup

Always wrap components with `EBComponentsProvider`:

```typescript
<EBComponentsProvider
  apiBaseUrl="https://api-url"
  theme={{
    colorScheme: "light",
    variables: {
      // Theme variables
    },
  }}
>
  {/* Components */}
</EBComponentsProvider>
```

### Hiding Remove: onboarding vs widget

- **`hideLinkedAccountRemoval`** on **`OnboardingFlow`** — Overview linked-account row only.
- **`hideRemoveRecipient`** on **`LinkedAccountWidget`** (and `RecipientsWidget`) — card / table Remove actions.

The flags are **not** interchangeable; use **both** when both UIs are embedded and your policy hides unlink everywhere. Details: **[Component Implementation](../docs/component-implementation.md)** (_Linked accounts: hiding Remove_).

## Documentation

For detailed guidelines, see root-level documentation:

- **[Setup & Commands](../docs/setup.md)** - Installation and development commands
- **[Code Quality Workflow](../docs/code-quality-workflow.md)** - Mandatory test-fix-verify process
- **[Testing Guidelines](../docs/testing-guidelines.md)** - Test patterns, coverage, MSW setup
- **[TypeScript Conventions](../docs/typescript-conventions.md)** - Type safety, patterns, best practices
- **[Component Implementation](../docs/component-implementation.md)** - React patterns, hooks, styling
- **[Architecture Patterns](ARCHITECTURE.md)** - Component structure and organization (source of truth)

**OnboardingFlow — linked bank accounts:** behavior spans **Overview** (`OverviewScreen` bank section) and the **Link bank account** step (`LinkAccountScreen`). Storybook: **Core → OnboardingFlow → Linked account**; maintainer notes: [`src/core/OnboardingFlow/stories/linked-account/README.md`](src/core/OnboardingFlow/stories/linked-account/README.md) and [`src/core/OnboardingFlow/stories/Docs.mdx`](src/core/OnboardingFlow/stories/Docs.mdx).

## Agent Skills

Project skills in [`../.github/skills/`](../.github/skills/README.md) cover this package. Agents that support the Agent Skills format load them automatically.

| Skill                                                                                     | Use when                                                        |
| ----------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| [embedded-banking-architecture](../.github/skills/embedded-banking-architecture/SKILL.md) | Creating components or deciding where code goes                 |
| [react-patterns](../.github/skills/react-patterns/SKILL.md)                               | Generated API hooks, mutations, forms, error and loading states |
| [component-testing](../.github/skills/component-testing/SKILL.md)                         | Writing or fixing Vitest/MSW tests                              |
| [styling-guidelines](../.github/skills/styling-guidelines/SKILL.md)                       | `className` strings, the `eb-` prefix, and theme tokens         |
| [i18n-l10n](../.github/skills/i18n-l10n/SKILL.md)                                         | User-visible text, translation keys, and locale formatting      |
| [code-quality-workflow](../.github/skills/code-quality-workflow/SKILL.md)                 | Validating changes before a commit, or triaging CI failures     |
| [ux-testing](../.github/skills/ux-testing/SKILL.md)                                       | UX review sessions and backlog updates                          |
