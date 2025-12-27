# Run Tests and Fix Failures

Use this prompt with: `@workspace` or mention this file in your question.

## Purpose

Execute the full test suite and systematically fix any failures to ensure code quality.

## Prompt

```
Please run the complete test suite and fix any failures systematically:

## Step 1: Run Test Suite

### For embedded-components:
```powershell
cd embedded-components
yarn test
```
This runs: typecheck → format:check → lint → test:unit

### For client-next-ts:
```powershell
cd app/client-next-ts
npm test
npm run health-check
```

## Step 2: Analyze Failures

For each failure, categorize and document:
- **Type**: flaky, broken, new failure, or regression
- **Impact**: critical (blocks functionality), moderate (affects UX), low (edge case)
- **Root cause**: recent code changes, test issues, environment issues
- **Related files**: affected components, tests, and dependencies

Prioritize fixes based on:
1. Critical functionality failures
2. Test suite blockers
3. Regression issues
4. Flaky tests
5. Low-impact edge cases

## Step 3: Fix Issues Systematically

For each failure:
1. **Identify root cause** - Review error message, stack trace, and related code
2. **Fix the issue** - Update code or tests as needed
3. **Verify the fix** - Re-run affected tests
4. **Check for side effects** - Run full suite to ensure no new failures
5. **Update documentation** - If patterns changed or new patterns added

## Step 4: Verification

After all fixes:
- Run complete test suite for both packages
- Verify all tests pass
- Check code coverage hasn't decreased
- Ensure no TypeScript errors
- Verify no linting errors
- Confirm formatting is correct

## Common Failure Patterns

### TypeScript Errors
- Missing type definitions
- Incorrect type usage
- Missing imports

**Fix:** Update types, add imports, or fix type assertions

### Test Failures
- MSW handler not configured
- Component state issues
- Async timing problems

**Fix:** Add/update MSW handlers, use `waitFor`, fix component logic

### Linting/Formatting Errors
- Unused variables
- Missing semicolons
- Incorrect formatting

**Fix:** Run `yarn format && yarn lint:fix` (embedded-components) or `npm run format` (client-next-ts)

## Package-Specific Commands

### embedded-components:
```powershell
cd embedded-components
yarn format          # Auto-fix formatting
yarn lint:fix        # Auto-fix linting
yarn typecheck       # Type checking only
yarn test:watch      # Watch mode for development
yarn test            # Full test suite
```

### client-next-ts:
```powershell
cd app/client-next-ts
npm run format       # Auto-fix formatting
npm test             # Run tests
npm run health-check # Playwright checks
```

Provide a summary of all fixes made, including:
- Number of failures fixed
- Types of issues encountered
- Any patterns or improvements suggested
- Current test suite status
```

## Usage

**In VS Code with GitHub Copilot:**
```
@workspace run tests and fix failures following .github/copilot/prompts/run-tests-and-fix.md
```

**Or simply:**
```
Please run all tests and fix any failures
```

## Related Files

- `.github/copilot/skills/test-and-fix-workflow/SKILL.md` - Automated testing workflow
- `.github/copilot/skills/code-quality-workflow/SKILL.md` - Quality checks
