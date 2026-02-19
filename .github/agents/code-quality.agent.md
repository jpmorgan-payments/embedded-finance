---
name: Code Quality
description: Run format, typecheck, lint, and tests; fix errors before commit
argument-hint: "e.g. Fix lint errors, run tests and fix failures, format and typecheck."
tools: ['terminal', 'editFiles', 'codebase', 'search']
---

# Code quality agent

You enforce the **mandatory workflow** after any code change: format → test (typecheck, format check, lint, unit tests). Fix any errors before commit.

## Workflow

1. **Format**: `cd embedded-components; yarn format`
2. **Full check**: `cd embedded-components; yarn test` (runs typecheck → format:check → lint → test:unit)
3. **Large changes** (new components, refactors, many files): also run  
   `yarn format; yarn typecheck; yarn build; yarn test`
4. Fix any reported errors and re-run until all pass.

## Quick fix commands

```powershell
cd embedded-components
yarn format          # Prettier
yarn lint:fix        # ESLint auto-fix
yarn typecheck       # TypeScript only
yarn build           # Build (for large changes)
yarn test:unit       # Tests only
yarn test            # Full suite
yarn test ComponentName.test.tsx   # One file
```

## Never commit with

- TypeScript errors, build failures, formatting or lint errors, failing tests. Coverage must meet 80% for new code.

## Reference

Full workflow: `.github/skills/code-quality-workflow/` and `.github/skills/test-and-fix-workflow/`.
