# Embedded Components - Package-Specific Instructions

## ⚠️ CRITICAL: Follow ARCHITECTURE.md

**All code generation MUST follow the patterns defined in `ARCHITECTURE.md`.**

**Before generating any component code, review `ARCHITECTURE.md` for the complete pattern.**

## Component Location

New components must be placed in `src/core/` following the architecture pattern.

## Package-Specific Setup

All commands run from this directory (`embedded-components/`):

- Install dependencies: `yarn install`
- Start development server: `yarn dev`
- Run Storybook: `yarn storybook`
- Run tests: `yarn test`
- Run tests in watch mode: `yarn test:watch`
- Type checking: `yarn typecheck`
- Linting: `yarn lint`
- Format code: `yarn format`

## Documentation

For detailed guidelines, see root-level documentation:

- **[Setup & Commands](../../docs/setup.md)** - Installation and development commands
- **[Code Quality Workflow](../../docs/code-quality-workflow.md)** - Mandatory test-fix-verify process
- **[Testing Guidelines](../../docs/testing-guidelines.md)** - Test patterns, coverage, MSW setup
- **[TypeScript Conventions](../../docs/typescript-conventions.md)** - Type safety, patterns, best practices
- **[Component Implementation](../../docs/component-implementation.md)** - React patterns, hooks, styling
- **[Architecture Patterns](ARCHITECTURE.md)** - Component structure and organization (source of truth)
