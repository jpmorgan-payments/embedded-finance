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
