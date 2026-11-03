# Setup & Development Commands

## Installation

There is no root workspace; each package is installed with npm in its own folder (CI uses `npm ci`). Node.js 20.19+ is required.

```powershell
cd embedded-components
npm install
```

The showcase depends on the library through `file:../../embedded-components`, so build the library before installing and running the app:

```powershell
cd embedded-components; npm run build
cd ../app/client-next-ts; npm install; npm run dev
```

### Agent skills

Agent instructions live in `AGENTS.md` files (root and per package), and skills live in `.github/skills/`. Agents that support these conventions pick them up automatically. If your agent looks elsewhere, link or copy `.github/skills/` into its skills folder locally rather than committing tool-specific configuration.

## Development Commands

### embedded-components Package

All commands run from `embedded-components/` directory:

- **Development server**: `npm run dev`
- **Storybook**: `npm run storybook` (runs on port 6006)
- **Build Storybook**: `npm run storybook:build`
- **Run tests**: `npm test` (runs: typecheck → lint → Vitest with coverage; does not check formatting)
- **Run some tests**: `npx vitest run <path-or-pattern>`
- **Watch tests**: `npm run test:watch`
- **Test coverage**: `npm run test:coverage`
- **Type checking**: `npm run typecheck`
- **Linting**: `npm run lint` (Tailwind/`eb-` prefix rules: `npm run lint:styles`)
- **Auto-fix linting**: `npm run lint:fix`
- **Format changed files**: `npx prettier --write <files>` (`npm run format` rewrites every `.ts`/`.tsx` file)
- **Check formatting**: `npm run format:check`
- **Build**: `npm run build` (also type-checks tests and mocks)
- **Regenerate API client**: `npm run generate-api` (Orval, from `api-specs/`)

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
