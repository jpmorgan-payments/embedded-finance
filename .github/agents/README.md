# Custom agents (VS Code, GitHub Copilot, Cursor)

These custom agents are **chat personas** for VS Code, GitHub Copilot, and **Cursor subagents**. They are derived from the fuller **skills** in `.github/skills/` and give the AI a focused role (and in VS Code/Copilot, a tool set) when you pick them.

| Agent | Purpose | Full skill |
|-------|---------|------------|
| **Architecture** | Where to put code, component structure, file layout | `.github/skills/embedded-banking-architecture/` |
| **React Patterns** | Hooks, state, forms, performance | `.github/skills/react-patterns/` |
| **Component Testing** | Tests with MSW, Vitest, 80% coverage | `.github/skills/component-testing/` |
| **Code Quality** | Format, typecheck, lint, test before commit | `.github/skills/code-quality-workflow/` |
| **Styling** | Tailwind with `eb-` prefix | `.github/skills/styling-guidelines/` |
| **i18n** | Translations, dates, currency, locales | `.github/skills/i18n-l10n/` |

## Cross-use: one folder for all

- **VS Code / GitHub Copilot** read custom agents from **`.github/agents/`** ([Custom agents in VS Code](https://code.visualstudio.com/docs/copilot/customization/custom-agents)). They use `name`, `description`, `tools`, and body; `argument-hint` and `handoffs` are optional.
- **Cursor** reads subagents from **`.cursor/agents/`** ([Subagents - File locations](https://cursor.com/docs/context/subagents#file-locations)). With a local **`.cursor` → `.github`** junction/symlink, `./.cursor/agents/` is the same as `./.github/agents/`, so **the same files** are used as Cursor subagents. Cursor uses `name`, `description`, and body; it ignores `tools` and `argument-hint`. Optional Cursor fields: `model` (e.g. `inherit` or `fast`), `readonly`, `is_background`.

Create the symlink from repo root (see [Setup](docs/setup.md)):

```powershell
# Windows
cmd /c mklink /J ".cursor" ".github"
```

```bash
# macOS/Linux
ln -s .github .cursor
```

Then both VS Code/Copilot (`.github/agents/`) and Cursor (`.cursor/agents/`) use this directory.

## File format

- **Extension**: `.agent.md` (VS Code; Cursor accepts markdown in `.cursor/agents/`).
- **Frontmatter**: `name`, `description`; VS Code adds `tools`, `argument-hint`; Cursor adds optional `model`, `readonly`, `is_background`.
- **Body**: Instructions in Markdown. For full rules and examples, use the linked skills.
