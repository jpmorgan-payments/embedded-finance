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
- Build: `yarn build` (**always run for large changes** – new components, refactors, many files)
- Linting: `yarn lint`
- Format code: `yarn format`

**For large changes:** run `yarn format`, then `yarn typecheck`, then `yarn build`, then `yarn test` before committing.

## Documentation

For detailed guidelines, see root-level documentation:

- **[Setup & Commands](../../docs/setup.md)** - Installation and development commands
- **[Code Quality Workflow](../../docs/code-quality-workflow.md)** - Mandatory test-fix-verify process
- **[Testing Guidelines](../../docs/testing-guidelines.md)** - Test patterns, coverage, MSW setup
- **[TypeScript Conventions](../../docs/typescript-conventions.md)** - Type safety, patterns, best practices
- **[Component Implementation](../../docs/component-implementation.md)** - React patterns, hooks, styling
- **[Architecture Patterns](ARCHITECTURE.md)** - Component structure and organization (source of truth)

## Additional Resources

### Agent Skills

Agent Skills provide specialized guidance for specific tasks. **Always reference relevant skills when working on related tasks.** Skills are located in `../../.github/skills/` and are automatically loaded by GitHub Copilot and other AI agents.

1. **[embedded-banking-architecture](../../.github/skills/embedded-banking-architecture/)** - Core architecture patterns, component structure, and organization principles. **MUST review before creating any component code.**
   - Use when: Creating new components, organizing code structure, following 2025 React/TypeScript patterns
   - See: `../../.github/skills/embedded-banking-architecture/AGENTS.md` for complete documentation

2. **[component-testing](../../.github/skills/component-testing/)** - Comprehensive testing patterns with MSW, React Query, and Vitest. **Required for all components (80% coverage minimum).**
   - Use when: Writing tests, setting up mocks, testing API interactions, ensuring coverage
   - See: `../../.github/skills/component-testing/AGENTS.md` for complete documentation

3. **[code-quality-workflow](../../.github/skills/code-quality-workflow/)** - Mandatory workflow that must run after ANY code changes. **CRITICAL: Run before every commit.**
   - Use when: After creating/editing files, before commits, when fixing errors
   - See: `../../.github/skills/code-quality-workflow/AGENTS.md` for complete documentation

4. **[styling-guidelines](../../.github/skills/styling-guidelines/)** - Tailwind CSS patterns with mandatory `eb-` prefix. **ALL Tailwind classes MUST use `eb-` prefix.**
   - Use when: Applying styles, creating UI, working with design tokens
   - See: `../../.github/skills/styling-guidelines/AGENTS.md` for complete documentation

5. **[react-patterns](../../.github/skills/react-patterns/)** - React 18 patterns, hooks best practices, component composition, and optimization techniques.
   - Use when: Creating hooks, optimizing performance, following React patterns
   - See: `../../.github/skills/react-patterns/AGENTS.md` for complete documentation

6. **[i18n-l10n](../../.github/skills/i18n-l10n/)** - Internationalization and localization patterns for multi-locale support (en-US, fr-CA, es-US).
   - Use when: Implementing translations, formatting dates/numbers/currency, handling locale-specific content
   - See: `../../.github/skills/i18n-l10n/AGENTS.md` for complete documentation

7. **[windows-powershell](../../.github/skills/windows-powershell/)** - Windows PowerShell command patterns. **CRITICAL: NEVER use `&&` in PowerShell, use `;` instead.**
   - Use when: Running commands, scripts, or terminal operations on Windows
   - See: `../../.github/skills/windows-powershell/AGENTS.md` for complete documentation

8. **[test-and-fix-workflow](../../.github/skills/test-and-fix-workflow/)** - Automated workflow for running tests and fixing failures systematically.
   - Use when: Implementing the mandatory test workflow, fixing code quality issues
   - See: `../../.github/skills/test-and-fix-workflow/AGENTS.md` for complete documentation

9. **[vercel-react-best-practices](../../.github/skills/vercel-react-best-practices/)** - React and Next.js performance optimization guidelines from Vercel Engineering.
   - Use when: Writing, reviewing, or refactoring React/Next.js code for performance
   - See: `../../.github/skills/vercel-react-best-practices/AGENTS.md` for complete documentation (45 rules across 8 categories)

### How to Use Skills

Each skill contains:

- **`SKILL.md`** - Summary with frontmatter, quick reference, and links to detailed documentation
- **`AGENTS.md`** - Complete detailed documentation for agents and LLMs
- **`rules/`** directory (where applicable) - Individual rule files for specific patterns

**When working on a task:**

1. Identify which skills are relevant to your task
2. Review the `SKILL.md` for quick reference
3. Consult `AGENTS.md` for detailed instructions and examples
4. Follow the patterns and guidelines provided

**Skills are automatically loaded by GitHub Copilot**, but you should explicitly reference them in your prompts for best results.
