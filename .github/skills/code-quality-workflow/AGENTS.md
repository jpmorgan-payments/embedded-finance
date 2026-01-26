# Code Quality Workflow

**Version 2.0.0**  
J.P. Morgan Payments  
December 2024

> **Note:**  
> This document is mainly for agents and LLMs to follow when maintaining,  
> generating, or refactoring code in the embedded-components repository. Humans  
> may also find it useful, but guidance here is optimized for automation  
> and consistency by AI-assisted workflows.

---

## Abstract

Mandatory code quality workflow that must run after ANY code changes. This workflow ensures code meets quality standards before commits through automated type checking, formatting, linting, and testing.

---

## ⚠️ CRITICAL: Mandatory Workflow

**After making ANY code changes, you MUST:**

1. **Format code**: `cd embedded-components; yarn format`
   - Auto-fixes Prettier formatting issues
   - **DO NOT skip this step** - code must be properly formatted

2. **Run tests**: `cd embedded-components; yarn test`
   - This runs: typecheck → format:check → lint → test:unit
   - **DO NOT skip this step** - tests must pass before proceeding

3. **Fix any errors that appear**
4. **Re-run tests until all pass**

## The Test Command

```powershell
cd embedded-components
yarn test
```

This runs in sequence:
1. `typecheck` - TypeScript type checking
2. `format:check` - Prettier formatting verification
3. `lint` - ESLint linting
4. `test:unit` - Vitest unit tests

## Fixing Errors

### TypeScript Errors

Fix type issues in the code:

```typescript
// ❌ Type error
const value: string = 123;

// ✅ Fixed
const value: number = 123;
// or
const value: string = "123";
```

Run to verify:
```powershell
cd embedded-components
yarn typecheck
```

### Formatting Errors (Prettier)

Auto-fix formatting issues:

```powershell
cd embedded-components
yarn format
```

This automatically fixes:
- Indentation
- Quote style
- Line breaks
- Trailing commas
- etc.

### Linting Errors

Auto-fix linting issues:

```powershell
cd embedded-components
yarn lint:fix
```

For manual fixes, address the specific errors shown:

```typescript
// ❌ Linting error: unused variable
const unused = "value";

// ✅ Fixed: remove or use it
const value = "value";
console.log(value);
```

### Test Failures

**Update tests** or **fix implementation**:

```typescript
// If test fails:
test("adds numbers", () => {
  expect(add(2, 2)).toBe(5); // ❌ Fails
});

// Option 1: Fix the test
test("adds numbers", () => {
  expect(add(2, 2)).toBe(4); // ✅ Correct
});

// Option 2: Fix the implementation
function add(a: number, b: number) {
  return a + b; // ✅ Correct
}
```

## Quick Fix Commands

```powershell
cd embedded-components

# Auto-fix formatting
yarn format

# Auto-fix linting
yarn lint:fix

# Check types only
yarn typecheck

# Run tests only
yarn test:unit

# Full test suite
yarn test

# Run specific test file
yarn test ComponentName.test.tsx

# Watch mode for development
yarn test:watch
```

## Never Commit Code With

- ❌ TypeScript errors
- ❌ Formatting errors (Prettier)
- ❌ Linting errors
- ❌ Failing tests

## Complete Workflow Example

```powershell
# 1. Make code changes
# (edit files)

# 2. Format code first
cd embedded-components
yarn format

# 3. Run full test suite
yarn test

# 4. If errors appear:

# Fix formatting (if not already done)
yarn format

# Fix linting
yarn lint:fix

# Fix TypeScript errors
# (edit code manually)

# Fix failing tests
# (update tests or implementation)

# 5. Re-run tests
yarn test

# 6. Repeat steps 4-5 until all pass

# 7. Commit code
git add .
git commit -m "feat: add new component"
```

## Coverage Requirements

- ✅ Minimum 80% line coverage
- ✅ All new code must have tests
- ✅ Tests must be colocated with implementation
- ✅ Use MSW for API mocking

## Pre-Commit Checklist

Before committing, ensure:

- [ ] `yarn format` has been run (code is formatted)
- [ ] `yarn test` passes (all checks green)
- [ ] No TypeScript errors
- [ ] No formatting errors
- [ ] No linting errors
- [ ] No failing tests
- [ ] Code coverage meets 80% minimum
- [ ] All new files have tests

## Continuous Integration

The same checks run in CI/CD pipelines. If they fail locally, they will fail in CI.

## Common Issues and Solutions

### Issue: "Module not found"

```powershell
# Solution: Install dependencies
cd embedded-components
yarn install
```

### Issue: "Port already in use"

```powershell
# Solution: Kill the process using the port
# On Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Issue: "Out of memory"

```powershell
# Solution: Increase Node memory
$env:NODE_OPTIONS="--max-old-space-size=4096"
yarn test
```

### Issue: "Cache issues"

```powershell
# Solution: Clear caches
cd embedded-components
yarn cache clean
Remove-Item -Recurse -Force node_modules
yarn install
```

## Automated Fixes

Many issues can be auto-fixed:

```powershell
# Fix all auto-fixable issues
cd embedded-components
yarn format; yarn lint:fix
```

## Manual Review Required

Some issues require manual intervention:

- Complex TypeScript errors
- Logic errors in tests
- Architecture violations
- Accessibility issues

## Best Practices

1. **Run tests frequently** - After each significant change
2. **Fix errors immediately** - Don't let them accumulate
3. **Use watch mode** - During active development
4. **Check coverage** - Ensure adequate test coverage
5. **Commit often** - Small, working commits
6. **Review diffs** - Before committing

## Integration with Other Skills

- After using `embedded-banking-architecture` skill → run tests
- After using `component-testing` skill → run tests
- After using `styling-guidelines` skill → run tests
- After using `react-patterns` skill → run tests

## Time-Saving Tips

```powershell
# Run specific test file during development
yarn test:watch ComponentName.test.tsx

# Fix formatting and linting in one command
yarn format; yarn lint:fix; yarn test

# Type checking in watch mode (separate terminal)
yarn typecheck --watch
```

## References

- See `embedded-components/package.json` for all scripts
- See `.github/skills/test-and-fix-workflow/` for detailed workflow
- See `embedded-components/CONTRIBUTING.md` for contribution guidelines
