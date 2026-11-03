# Embedded Finance Components - Agent Instructions

Monorepo containing React component library for embedded banking solutions. Active development focuses on `embedded-components` package.

## Package Manager

- **npm**, per package (no root workspace). Each package has its own `package-lock.json`, and CI runs `npm ci`.

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
├── app/                    # Showcase applications and server utilities
│   ├── client-next-ts/     # Current showcase website (active)
│   │                        # - Modern stack: Vite, React 18, TypeScript, TanStack Router
│   │                        # - Features SellSense marketplace demo
│   │                        # - Uses MSW for API mocking
│   ├── client/             # Legacy/archived showcase (minimal content)
│   └── server-session-transfer/  # Session transfer demo for partially hosted onboarding
```

## Documentation

- **[Setup & Commands](docs/setup.md)** - Installation, build, and development commands
- **[Code Quality Workflow](docs/code-quality-workflow.md)** - Mandatory test-fix-verify process
- **[Testing Guidelines](docs/testing-guidelines.md)** - Test patterns, coverage, MSW setup
- **[TypeScript Conventions](docs/typescript-conventions.md)** - Type safety, patterns, best practices
- **[Component Implementation](docs/component-implementation.md)** - React patterns, hooks, styling (_Linked accounts: hiding Remove_ documents `hideLinkedAccountRemoval` vs `hideRemoveRecipient`)
- **[Git Workflow](docs/git-workflow.md)** - Commit conventions and branching

## Package-Specific Instructions

- **embedded-components**: See `embedded-components/AGENTS.md` for package-specific details
- **app/client-next-ts**: See `app/client-next-ts/AGENTS.md` for app-specific patterns (Tailwind prefix rules, drawer pattern, MSW override architecture, `@visual-json/react` integration)
  - **Current showcase website**: Modern React application demonstrating embedded finance components
  - **Technology**: Vite, React 18, TypeScript, TanStack Router, shadcn/ui, Playwright, MSW
  - **Main demo**: SellSense marketplace demo at `/sellsense-demo` route
  - **Features**: Multiple theme support (SellSense, PayFicient, etc.), content tokens for tone variants
  - **Key docs**: `app/client-next-ts/PRD.md` (product requirements), `app/client-next-ts/MSW_SETUP.md` (API mocking setup)
  - **Note**: This app **consumes** embedded-components. Component development happens in `embedded-components/`.
  - **Code quality**: `npm test` · `npm run format:check` / `npm run format` · `npm run health-check`
- **app/client**: Legacy/archived showcase (minimal content, not actively maintained)
- **app/server-session-transfer**: Demo application for partially hosted onboarding integration pattern

## Additional Resources

- **`embedded-components/ARCHITECTURE.md`** - Source of truth for architecture patterns

## Agent Skills

Project skills live in `.github/skills/` in the [Agent Skills](https://agentskills.io/) format. Agents that support the format discover them automatically; for other agents, point them at that folder. See [`.github/skills/README.md`](.github/skills/README.md) for authoring rules.

| Skill | Use when |
| --- | --- |
| [embedded-banking-architecture](.github/skills/embedded-banking-architecture/SKILL.md) | Creating components or deciding where hooks, utils, sub-components, and forms go |
| [react-patterns](.github/skills/react-patterns/SKILL.md) | Data fetching with generated hooks, mutations, forms, error and loading states |
| [component-testing](.github/skills/component-testing/SKILL.md) | Writing or fixing Vitest/MSW tests |
| [styling-guidelines](.github/skills/styling-guidelines/SKILL.md) | `className` strings, the `eb-` prefix, and theme tokens |
| [i18n-l10n](.github/skills/i18n-l10n/SKILL.md) | User-visible text, translation keys, and locale formatting |
| [code-quality-workflow](.github/skills/code-quality-workflow/SKILL.md) | Validating changes before a commit, or triaging CI failures |
| [ux-testing](.github/skills/ux-testing/SKILL.md) | UX review sessions and backlog updates |

In `embedded-components`, the pre-commit sequence is: Prettier on the files you touched, `npm run typecheck`, `npm run lint`, `npm run build` (it also type-checks tests and mocks), then `npm test`.

The showcase also publishes a public skill for integrators at `app/client-next-ts/public/.well-known/agent-skills/` (installed with `npx skills add https://embedded-finance-dev.com/ --skill efs-components-best-practices`).
