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

### 2. Run Tests

```powershell
cd embedded-components
yarn test
```

This command runs the full quality check pipeline:
- `typecheck` - TypeScript validation
- `format:check` - Prettier formatting check
- `lint` - ESLint validation
- `test:unit` - Unit tests

**DO NOT skip this step** - tests must pass before proceeding

### 3. Fix Any Errors

If errors appear, fix them in this order:

- **TypeScript errors**: Fix type issues in the code
- **Prettier/formatting errors**: Run `yarn format` to auto-fix (if not already done)
- **Linting errors**: Run `yarn lint:fix` to auto-fix, or fix manually
- **Test failures**: Update tests or fix implementation

### 4. Re-run Until All Pass

```powershell
cd embedded-components
yarn format
yarn test
```

Repeat until all checks pass.

## Never Commit Code With

- ❌ TypeScript errors
- ❌ Formatting errors (Prettier)
- ❌ Linting errors
- ❌ Failing tests

## Individual Commands

If you need to run checks individually:

```powershell
cd embedded-components
yarn typecheck    # TypeScript validation only
yarn format:check # Formatting check only
yarn lint         # Linting only
yarn test:unit    # Tests only
```
