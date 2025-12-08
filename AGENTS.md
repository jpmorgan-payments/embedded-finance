# Embedded Finance Components - Agent Instructions

## Repository Overview

This is a monorepo containing multiple packages:

```
/
├── app/                    # Showcase web application (not active)
│   ├── client/            # Frontend React application
│   └── server/            # Backend server
├── embedded-components/    # Main UI component library (active)
│   ├── src/               # Source code
│   ├── .storybook/        # Storybook configuration
│   ├── dist/              # Built files (not in repo)
│   └── public/            # Static assets and MSW worker
└── embedded-finance-sdk/   # TypeScript SDK utilities (not active)
```

> **Note**: Currently, active development is focused on the `embedded-components` package. Other packages are planned for future development.

## Setup Commands

- Install dependencies: `yarn install` (from root) or `cd embedded-components && yarn install`
- Start development server: `cd embedded-components && yarn dev`
- Run Storybook: `cd embedded-components && yarn storybook`
- Run tests: `cd embedded-components && yarn test`
- Type checking: `cd embedded-components && yarn typecheck`
- Linting: `cd embedded-components && yarn lint`

## ⚠️ CRITICAL: Follow ARCHITECTURE.md

**All code generation MUST follow the patterns defined in `embedded-components/ARCHITECTURE.md`.**

**Before generating any component code, review `embedded-components/ARCHITECTURE.md` for the complete pattern.**

Key architecture principles:

- ✅ Individual hook/util files with colocated tests
- ✅ Direct imports for components (no aggregation barrels)
- ✅ Type colocation - only public API in `.types.ts`
- ✅ Minimal public API - export only what consumers need
- ✅ Start specific - move to shared only when used by 2+ components
- ✅ Forms = schemas - no schema? It's a component, not a form

## Technology Stack

- React 18.x with TypeScript (strict mode)
- Radix UI primitives for base components
- Tailwind CSS with `eb-` prefix for custom classes
- Tanstack React Query v5 for data fetching
- Zod for validation
- MSW for API mocking
- Storybook 8.x for component development

## Code Style

- TypeScript strict mode enabled
- Functional components with hooks only
- Use explicit prop interfaces with JSDoc comments
- No 'any' types
- Single quotes preferred
- Tailwind CSS for styling with `eb-` prefix for custom classes

## Component Structure (2025 Pattern)

Follow the architecture pattern from `embedded-components/ARCHITECTURE.md`:

```
ComponentName/
├── index.ts                          # Public API exports only
├── ComponentName.tsx                 # Main component
├── ComponentName.test.tsx            # Colocated test
├── ComponentName.types.ts            # Public types ONLY
├── ComponentName.constants.ts        # Constants
│
├── hooks/                            # Individual files (flat)
│   ├── useData.ts
│   ├── useData.test.tsx
│   └── index.ts                      # Barrel export
│
├── utils/                            # Individual files (flat)
│   ├── helper.ts
│   ├── helper.test.ts
│   └── index.ts                      # Barrel export
│
├── components/                       # NO index files
│   ├── SubCard/
│   │   ├── SubCard.tsx
│   │   └── SubCard.test.tsx
│
├── forms/                            # Only if .schema.ts exists
│   └── CreateForm/
│       ├── CreateForm.tsx
│       ├── CreateForm.test.tsx
│       └── CreateForm.schema.ts      # Zod schema
│
└── stories/
    └── ComponentName.story.tsx
```

## Import Patterns

```typescript
// ✅ CORRECT - Direct imports (tree-shakeable)
import { ComponentCard } from "./components/ComponentCard";
import { ComponentSkeleton } from "./components/ComponentSkeleton";
import { useComponentData } from "./hooks"; // Can use barrel for convenience

// ❌ WRONG - Aggregation barrel (prevents tree-shaking)
import { ComponentCard, ComponentSkeleton } from "./components"; // No index.ts!
```

## Code Organization Decision Tree

```
New Code?
  ├─→ Hook?
  │   ├─→ Used by 2+ components? → src/lib/hooks/useHookName.ts
  │   └─→ Used by 1 component? → ComponentName/hooks/useHookName.ts
  │
  ├─→ Utility?
  │   ├─→ Used by 2+ components? → src/lib/utils/utilName.ts
  │   └─→ Used by 1 component? → ComponentName/utils/utilName.ts
  │
  ├─→ Component?
  │   ├─→ Used by 2+ features? → src/components/ComponentName/
  │   └─→ Used by 1 feature? → ComponentName/components/SubComponent/
  │
  ├─→ Form?
  │   ├─→ Has .schema.ts? → ComponentName/forms/FormName/
  │   └─→ No schema? → ComponentName/components/DialogName/
```

## ⚠️ CRITICAL: Code Quality Workflow

**After making ANY code changes, you MUST:**

1. **Run tests**: `cd embedded-components && yarn test`

   - This runs: typecheck → format:check → lint → test:unit
   - **DO NOT skip this step** - tests must pass before proceeding

2. **Fix any errors that appear**:

   - **TypeScript errors**: Fix type issues in the code
   - **Prettier/formatting errors**: Run `yarn format` to auto-fix
   - **Linting errors**: Run `yarn lint:fix` to auto-fix, or fix manually
   - **Test failures**: Update tests or fix implementation

3. **Re-run tests** until all pass:
   ```powershell
   cd embedded-components
   yarn test
   ```

**Never commit code with:**

- ❌ TypeScript errors
- ❌ Formatting errors (Prettier)
- ❌ Linting errors
- ❌ Failing tests

## Testing Instructions

- Tests must be colocated with implementation (not in separate `__tests__/` directories)
- One test file per implementation file
- Minimum 80% line coverage required
- Use MSW for API mocking
- **Always run `yarn test` after making changes**
- Run type checking: `yarn typecheck`
- Run linting: `yarn lint`
- Auto-fix formatting: `yarn format`
- Auto-fix linting: `yarn lint:fix`

## Package-Specific Instructions

- **embedded-components**: See `embedded-components/AGENTS.md` for package-specific instructions
- **app/client-next-ts**: See `app/client-next-ts/.cursorrules` for app-specific rules

## Additional Resources

- **Architecture patterns**: `embedded-components/ARCHITECTURE.md` - **Source of truth for architecture**
- **Component creation**: `.cursor/rules/component-creation-workflow.mdc`
- **Testing patterns**: `.cursor/rules/component-testing-patterns.mdc`
- **Styling guidelines**: `.cursor/rules/styling-guidelines.mdc`

## Git Commit Conventions

Use conventional commit format with lowercase prefixes:

- `fix:` for bug fixes
- `feat:` for new features
- `perf:` for performance improvements
- `docs:` for documentation changes
- `style:` for formatting changes
- `refactor:` for code refactoring
- `test:` for adding missing tests
- `chore:` for maintenance tasks

Keep the summary line concise. Include description for non-obvious changes.
