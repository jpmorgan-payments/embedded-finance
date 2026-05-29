# GitHub Copilot Agent Skills

This directory contains Agent Skills for GitHub Copilot following the [agentskills.io](https://agentskills.io/) specification.

## What are Agent Skills?

Agent Skills are folders of instructions, scripts, and resources that AI agents can discover and use to perform tasks more accurately and efficiently. They follow an open format that works across multiple AI development tools including VS Code, Cursor, Claude, and others.

## Available Skills

### Tier 1 - Critical Core Skills

These skills are essential for all development work:

1. **[embedded-banking-architecture](./embedded-banking-architecture/)** - Core architecture patterns, component structure, and organization principles
2. **[component-testing](./component-testing/)** - Comprehensive testing patterns with MSW, React Query, and Vitest
3. **[code-quality-workflow](./code-quality-workflow/)** - Mandatory workflow for running tests and fixing errors
4. **[styling-guidelines](./styling-guidelines/)** - Tailwind CSS patterns with mandatory `eb-` prefix
5. **[react-patterns](./react-patterns/)** - React 18 patterns, hooks, and composition techniques

### Tier 2 - Important Skills

These skills are important for specific functionality:

6. **[i18n-l10n](./i18n-l10n/)** - Internationalization and localization patterns
7. **[windows-powershell](./windows-powershell/)** - Windows PowerShell command patterns (NEVER use `&&`)
8. **[test-and-fix-workflow](./test-and-fix-workflow/)** - Automated testing and debugging workflow

## How Skills Work

Each skill is a directory containing a `SKILL.md` file with:

- **Frontmatter** - Metadata about the skill (name, description, compatibility)
- **Body Content** - Detailed instructions and examples

VS Code Copilot automatically:
1. Loads skill metadata at startup
2. Activates relevant skills based on your task
3. Uses skill instructions to provide better assistance

## Using Skills in VS Code

Skills are automatically available when using GitHub Copilot in VS Code. No additional setup required!

Copilot will:
- Reference skills when you ask questions
- Apply skill patterns in code suggestions
- Use skill instructions for complex tasks

Example interactions:
- "Create a new component" → Uses `embedded-banking-architecture` skill
- "Add tests" → Uses `component-testing` skill
- "Fix linting errors" → Uses `code-quality-workflow` skill
- "Format a date" → Uses `i18n-l10n` skill

## Skill Naming Convention

Skill names must follow these rules:
- 1-64 characters
- Lowercase letters, numbers, and hyphens only
- Cannot start or end with hyphen
- No consecutive hyphens (`--`)
- Must match parent directory name

✅ Valid: `embedded-banking-architecture`, `i18n-l10n`, `code-quality-workflow`  
❌ Invalid: `Embedded-Banking`, `i18n--l10n`, `-skill`, `skill-`

## Creating New Skills

To create a new skill:

1. Create a directory: `.github/skills/skill-name/`
2. Create `SKILL.md` with frontmatter:

```markdown
---
name: skill-name
description: What the skill does and when to use it. Include keywords for discovery.
compatibility: Optional - specific requirements
metadata:
  version: "1.0.0"
  author: your-org
---

# Skill Title

## Overview

Description of what the skill provides...

## Usage

Instructions and examples...
```

3. Validate (optional):

```powershell
skills-ref validate .github/skills/skill-name
```

## Best Practices

1. **Keep SKILL.md under 500 lines** - Move detailed content to reference files
2. **Use clear descriptions** - Include keywords for skill discovery
3. **Provide examples** - Show correct and incorrect patterns
4. **Reference other skills** - Build on existing skills when appropriate
5. **Update regularly** - Keep skills in sync with codebase changes

## Skill Organization

Skills are organized by concern:

- **Architecture** - Code organization and structure
- **Testing** - Testing patterns and workflows
- **Quality** - Code quality and validation
- **Styling** - UI and CSS patterns
- **React** - React-specific patterns
- **i18n** - Internationalization
- **Tooling** - Command-line and workflow automation

## Source of Truth

For architectural decisions, always refer to:

1. **`embedded-components/ARCHITECTURE.md`** - Primary architecture reference
2. **`AGENTS.md`** - Repository-wide guidelines
3. **Skills in `.github/skills/`** - Specific patterns and workflows
4. **Package `.cursorrules`** - Package-specific quick reference

## Validation

To validate all skills:

```powershell
# Install skills-ref tool
npm install -g @agentskills/skills-ref

# Validate all skills
skills-ref validate .github/skills
```

## Contributing

When adding or updating skills:

1. Follow the agentskills.io specification
2. Test the skill with actual usage
3. Validate using `skills-ref` tool
4. Update this README if adding new skills
5. Commit with descriptive message

## References

- **Specification**: https://agentskills.io/specification
- **Examples**: https://github.com/anthropics/skills
- **Validation Tool**: https://github.com/agentskills/agentskills/tree/main/skills-ref

## Support

For issues or questions:

1. Check skill documentation first
2. Review `ARCHITECTURE.md` for architecture questions
3. Consult `AGENTS.md` for repository guidelines
4. Open an issue if problem persists

---

**Last Updated**: December 24, 2025  
**Version**: 2.0.0  
**Format**: Agent Skills (agentskills.io)
