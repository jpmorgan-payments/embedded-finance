# Embedded Finance Components - Agent Instructions

Monorepo containing React component library for embedded banking solutions. Active development focuses on `embedded-components` package.

## Package Manager

- **Yarn** (workspaces)

## Quick Start

See [Setup Guide](docs/setup.md) for installation and development commands.

## ⚠️ CRITICAL: Architecture Patterns

**All code generation MUST follow patterns in `embedded-components/ARCHITECTURE.md`.**

Before generating component code, review the architecture document for:
- Component structure and file organization
- Import patterns (no aggregation barrels)
- Type colocation rules
- Code organization decision tree

## Package Structure

```
/
├── embedded-components/    # Main UI component library (active)
├── app/                    # Showcase web application (not active)
└── embedded-finance-sdk/   # TypeScript SDK utilities (not active)
```

## Documentation

- **[Setup & Commands](docs/setup.md)** - Installation, build, and development commands
- **[Code Quality Workflow](docs/code-quality-workflow.md)** - Mandatory test-fix-verify process
- **[Testing Guidelines](docs/testing-guidelines.md)** - Test patterns, coverage, MSW setup
- **[TypeScript Conventions](docs/typescript-conventions.md)** - Type safety, patterns, best practices
- **[Component Implementation](docs/component-implementation.md)** - React patterns, hooks, styling
- **[Git Workflow](docs/git-workflow.md)** - Commit conventions and branching

## Package-Specific Instructions

- **embedded-components**: See `embedded-components/AGENTS.md` for package-specific details
- **app/client-next-ts**: See `app/client-next-ts/.cursorrules` for app configuration

## Additional Resources

- **`embedded-components/ARCHITECTURE.md`** - Source of truth for architecture patterns
- **`.github/copilot/skills/`** - Agent Skills (cross-IDE compatible guidance)
- **`.cursorrules`** - Root configuration (cross-IDE compatible)
