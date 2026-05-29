# Setup & Development Commands

## Installation

From repository root:
```powershell
yarn install
```

### Cursor IDE (optional)

So Cursor uses the same agent skills and prompts as GitHub Copilot, create a local junction (or symlink) pointing `.cursor` to `.github` (e.g. from repo root):

**Windows (PowerShell, run as needed after clone):**
```powershell
cmd /c mklink /J ".cursor" ".github"
```

**macOS/Linux:**
```bash
ln -s .github .cursor
```

`.cursor` is in `.gitignore`, so this is local only and not committed.

For embedded-components package:
```powershell
cd embedded-components
yarn install
```

## Development Commands

### embedded-components Package

All commands run from `embedded-components/` directory:

- **Development server**: `yarn dev`
- **Storybook**: `yarn storybook` (runs on port 6006)
- **Build Storybook**: `yarn storybook:build`
- **Run tests**: `yarn test` (runs: typecheck → format:check → lint → test:unit)
- **Watch tests**: `yarn test:watch`
- **Test coverage**: `yarn test:coverage`
- **Type checking**: `yarn typecheck`
- **Linting**: `yarn lint`
- **Auto-fix linting**: `yarn lint:fix`
- **Format code**: `yarn format` (auto-fixes Prettier issues)
- **Check formatting**: `yarn format:check`
- **Build**: `yarn build`

## Technology Stack

- **React** 18.x with TypeScript (strict mode)
- **Radix UI** primitives for base components
- **Tailwind CSS** with `eb-` prefix for custom classes
- **Tanstack React Query** v5 for data fetching
- **Zod** for validation schemas
- **MSW** for API mocking in tests and development
- **Storybook** 10.x for component development
- **Vite** for build tooling
- **Vitest** for testing
