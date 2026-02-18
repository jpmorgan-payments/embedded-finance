# Git Workflow

## Commit Conventions

Use **conventional commit format** with lowercase prefixes:

- `fix:` - Bug fixes
- `feat:` - New features
- `perf:` - Performance improvements
- `docs:` - Documentation changes
- `style:` - Formatting changes (whitespace, formatting, missing semicolons, etc.)
- `refactor:` - Code refactoring (no functional changes)
- `test:` - Adding missing tests
- `chore:` - Maintenance tasks (dependencies, build config, etc.)

## Commit Message Format

```
<type>: <subject>

[optional body]

[optional footer]
```

### Examples

```
feat: add pagination to transactions widget

fix: resolve account balance display issue

docs: update architecture patterns documentation

refactor: extract payment validation logic to utils
```

## Best Practices

- **Keep summary line concise** (50-72 characters recommended)
- **Include description** for non-obvious changes
- **Use imperative mood** ("add feature" not "added feature" or "adds feature")
- **Reference issues/PRs** in footer when applicable: `Closes #123`

## Before Committing

Ensure all quality checks pass:

```powershell
cd embedded-components
yarn format
yarn test
```

Never commit code with:
- TypeScript errors
- Formatting errors
- Linting errors
- Failing tests

## Branch Protection and PR Checks

The **Build & Test EB Components** workflow runs on push and pull requests when `embedded-components/**` changes. It runs:

- `yarn install --immutable`
- `yarn build`
- `yarn run test`
- `yarn storybook:build`

If any step fails (including Storybook build), the workflow fails and the status check will not pass.

**To block merging PRs when this check fails:**

1. In GitHub: **Settings → Branches → Branch protection rules** (for your default or target branch, e.g. `main`).
2. Enable **Require status checks to pass before merging**.
3. Add the status check: **Build & Test EB Components** (or the job name **build-and-test** if that appears in the list).
4. Save the rule.

After that, PRs that touch `embedded-components/` cannot be merged until the workflow (including Storybook build) succeeds.
