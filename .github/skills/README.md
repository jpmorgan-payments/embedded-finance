# Agent skills

Project skills for AI coding agents working in this repository, in the [Agent Skills](https://agentskills.io/specification) format. Agents that support the format discover `.github/skills/` automatically; for other agents, point them at this folder.

| Skill | Use when |
| --- | --- |
| [embedded-banking-architecture](./embedded-banking-architecture/SKILL.md) | Creating components or deciding where hooks, utils, sub-components, and forms go |
| [react-patterns](./react-patterns/SKILL.md) | Writing data fetching, mutations, forms, and error/loading states |
| [component-testing](./component-testing/SKILL.md) | Writing or fixing Vitest/MSW tests |
| [styling-guidelines](./styling-guidelines/SKILL.md) | Writing `className` strings with the `eb-` prefix and theme tokens |
| [i18n-l10n](./i18n-l10n/SKILL.md) | Adding user-visible text or formatting dates, numbers, and currency |
| [code-quality-workflow](./code-quality-workflow/SKILL.md) | Validating a change before committing, or triaging CI failures |
| [ux-testing](./ux-testing/SKILL.md) | Running a UX review of the components and updating `BACKLOG.md` |

These skills cover `embedded-components`. The showcase app has its own guide in [`app/client-next-ts/AGENTS.md`](../../app/client-next-ts/AGENTS.md).

## Public skill for integrators

The showcase publishes a separate skill for developers *integrating* Embedded Finance & Solutions:

- Source: [`app/client-next-ts/public/.well-known/agent-skills/efs-components-best-practices/SKILL.md`](../../app/client-next-ts/public/.well-known/agent-skills/efs-components-best-practices/SKILL.md)
- Index: [`app/client-next-ts/public/.well-known/agent-skills/index.json`](../../app/client-next-ts/public/.well-known/agent-skills/index.json) ([discovery RFC v0.2.0](https://github.com/cloudflare/agent-skills-discovery-rfc), plus the `files` array the `skills` CLI requires)
- Install: `npx skills add https://embedded-finance-dev.com/ --skill efs-components-best-practices`

After editing that `SKILL.md`, update `digest` (and `description`, if changed) in `index.json`. `app/client-next-ts/src/components/landing/agent-skills-index.test.ts` fails with the expected digest if you forget.

## Writing and updating skills

- Skills are the only agent customization in this repo: no custom agents, prompt files, or tool-specific rule files. Put a reusable workflow in a skill, and keep always-on context in `AGENTS.md`.
- Keep only project-specific knowledge an agent can't infer: paths, commands, generated code, pinned versions, and conventions that differ from defaults. Leave out general React, TypeScript, testing, or review advice that current models already know.
- Verify every command, path, and API in a skill against the code before committing it. A wrong skill is worse than none.
- One `SKILL.md` per skill, under about 200 lines. Link to the repo's source-of-truth docs (`embedded-components/ARCHITECTURE.md`, `DESIGN_TOKENS.md`, `docs/`) instead of copying them. If a skill needs long reference material, put it in a `references/` folder inside the skill.
- Frontmatter: `name` matching the folder, a `description` that says what the skill covers and when to use it, `license: Apache-2.0`, and `metadata.author`.
- Prefer automated checks (lint rules, tests) over prose for anything mechanical, and point the skill at the check.
- Third-party skills aren't vendored here. Install them yourself with `npx skills add <owner/repo>` if you want them.

Validate the frontmatter with [`skills-ref`](https://github.com/agentskills/agentskills/tree/main/skills-ref) (Python), and check discovery with the `skills` CLI:

```bash
uvx skills-ref validate .github/skills/<skill-name>   # or: pip install skills-ref
npx skills add . --list                              # lists the skills an agent would discover
```
