# Custom agents (VS Code / GitHub Copilot)

These custom agents are **chat personas** for VS Code and GitHub Copilot. They are derived from the fuller **skills** in `.github/skills/` and give the AI a focused role and tool set when you pick them in the agents dropdown.

| Agent | Purpose | Full skill |
|-------|---------|------------|
| **Architecture** | Where to put code, component structure, file layout | `.github/skills/embedded-banking-architecture/` |
| **React Patterns** | Hooks, state, forms, performance | `.github/skills/react-patterns/` |
| **Component Testing** | Tests with MSW, Vitest, 80% coverage | `.github/skills/component-testing/` |
| **Code Quality** | Format, typecheck, lint, test before commit | `.github/skills/code-quality-workflow/` |
| **Styling** | Tailwind with `eb-` prefix | `.github/skills/styling-guidelines/` |
| **i18n** | Translations, dates, currency, locales | `.github/skills/i18n-l10n/` |

- **VS Code**: [Custom agents in VS Code](https://code.visualstudio.com/docs/copilot/customization/custom-agents) — agents appear in the chat agents dropdown when this folder is under `.github/agents`.
- **Cursor**: With a local `.cursor` → `.github` symlink, Cursor can use the same layout; skills in `.github/skills/` remain the main reference for detailed rules.

Files use the `.agent.md` format (name, description, tools, body instructions). Edit the body to refine behavior; for full rules and examples, use the linked skills.
