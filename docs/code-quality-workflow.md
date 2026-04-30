# Code Quality Workflow

## ⚠️ CRITICAL: Mandatory Workflow

**After making ANY code changes, you MUST follow this workflow:**

### 1. Format Code

```powershell
cd embedded-components
yarn format
```

- Auto-fixes Prettier formatting issues
- **DO NOT skip this step** - code must be properly formatted

### 2. Run Build (production **and** test `.ts` / `.tsx`)

Run **`yarn build`** after substantive edits—not only for large features. **Include this step when you change tests, mocks, or Vitest stubs:** strict errors in test-only code often appear during **`yarn build`** / declaration emit even when **`yarn test:unit`** passes.

```powershell
cd embedded-components
yarn build
```

- `yarn build` catches compilation and export issues that may not surface the same way in **`yarn test:unit`** alone.

### 3. Run Tests

```powershell
cd embedded-components
yarn test
```

This command runs the full quality check pipeline:

- `typecheck` - TypeScript validation
- `format:check` - Prettier formatting check
- `lint` - ESLint validation
- `test:unit` - Unit tests

**DO NOT skip this step** - tests must pass before proceeding.

**Typical sequence before committing:**

```powershell
cd embedded-components
yarn format
yarn build
yarn test
```

For **large changes** (new components, refactors, many files touched, or anything affecting exports), include an explicit **`yarn typecheck`** before **`yarn build`** if you want an extra signal:

```powershell
cd embedded-components
yarn format
yarn typecheck
yarn build
yarn test
```

### 4. Fix Any Errors

If errors appear, fix them in this order:

- **TypeScript errors**: Fix type issues in the code
- **Build errors**: Fix compilation/export issues (run `yarn build` to verify)
- **Prettier/formatting errors**: Run `yarn format` to auto-fix (if not already done)
- **Linting errors**: Run `yarn lint:fix` to auto-fix, or fix manually
- **Test failures**: Update tests or fix implementation

### 5. Re-run Until All Pass

```powershell
cd embedded-components
yarn format
yarn build
yarn test
```

For large changes:

```powershell
yarn format
yarn typecheck
yarn build
yarn test
```

Repeat until all checks pass.

## Never Commit Code With

- ❌ TypeScript errors
- ❌ Build failures — run **`yarn build`** after edits (including tests) and fix before committing
- ❌ Formatting errors (Prettier)
- ❌ Linting errors
- ❌ Failing tests

## Individual Commands

If you need to run checks individually:

```powershell
cd embedded-components
yarn format       # Auto-fix formatting
yarn typecheck    # TypeScript validation only
yarn build        # Full package build — run after substantive edits (including tests)
yarn format:check # Formatting check only
yarn lint         # Linting only
yarn test:unit    # Tests only
```
