---
name: code-quality-workflow
description: Mandatory code quality workflow that must run after ANY code changes. Use after creating/editing files, before commits, or when fixing errors. Keywords - testing, linting, formatting, typecheck, quality gates, workflow.
license: MIT
metadata:
  version: "2.0.0"
  author: jpmorgan-payments
  lastUpdated: "2025-12-24"
  priority: critical
---

# Code Quality Workflow

Mandatory code quality workflow ensuring all code meets standards before commits. This workflow runs automated type checking, formatting, linting, and testing.

## When to Apply

Use this workflow:

- After making ANY code changes
- Before committing code
- When fixing errors or issues
- During code review preparation

## ⚠️ CRITICAL: Mandatory Steps

**After making ANY code changes, you MUST:**

1. **Format code**: `cd embedded-components; yarn format`
2. **Run tests**: `cd embedded-components; yarn test`
3. **For large changes** (new components, refactors, many files): **also run** `yarn typecheck`, `yarn build`, then `yarn test` (e.g. `yarn format; yarn typecheck; yarn build; yarn test`)
4. **Fix any errors that appear**
5. **Re-run until all pass**

## Quick Reference

### The Test Command

```powershell
cd embedded-components
yarn test
```

This runs in sequence:

1. `typecheck` - TypeScript type checking
2. `format:check` - Prettier formatting verification
3. `lint` - ESLint linting
4. `test:unit` - Vitest unit tests

### Quick Fix Commands

```powershell
cd embedded-components

# Auto-fix formatting
yarn format

# Auto-fix linting
yarn lint:fix

# Check types only
yarn typecheck

# Full build (always run for large changes)
yarn build

# Run tests only
yarn test:unit

# Full test suite
yarn test
```

**For large changes:** run `yarn format`, then `yarn typecheck`, then `yarn build`, then `yarn test`.

## Never Commit Code With

- ❌ TypeScript errors
- ❌ Build failures (for large changes: run `yarn build` first)
- ❌ Formatting errors (Prettier)
- ❌ Linting errors
- ❌ Failing tests

## Coverage Requirements

- ✅ Minimum 80% line coverage
- ✅ All new code must have tests
- ✅ Tests must be colocated with implementation
- ✅ Use MSW for API mocking

## How to Use

For detailed instructions, examples, and troubleshooting:

- **Full guide**: `AGENTS.md` - Complete workflow documentation
- **Related skills**:
  - `test-and-fix-workflow` - Systematic debugging workflow
  - `component-testing` - Testing patterns and examples

## References

- See `embedded-components/package.json` for all scripts
- See `AGENTS.md` for complete workflow documentation
- See `embedded-components/CONTRIBUTING.md` for contribution guidelines
