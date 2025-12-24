# GitHub Copilot Custom Prompts

This directory contains reusable prompts for common development tasks in the embedded-banking monorepo.

## Available Prompts

### 🔍 [code-review.md](./code-review.md)
Comprehensive code review checklist covering functionality, quality, security, and testing.

**When to use:**
- Before submitting a PR
- Reviewing someone else's code
- Self-review of changes

**Usage:**
```
@workspace review my changes following .github/copilot/prompts/code-review.md
```

---

### 🧪 [run-tests-and-fix.md](./run-tests-and-fix.md)
Run the full test suite and systematically fix any failures.

**When to use:**
- After making code changes
- Before committing
- When CI fails

**Usage:**
```
@workspace run tests and fix failures using .github/copilot/prompts/run-tests-and-fix.md
```

---

### 🗺️ [roadmap-analysis.md](./roadmap-analysis.md)
Analyze the codebase and generate a feature roadmap with Mermaid diagrams.

**When to use:**
- Planning upcoming sprints
- Quarterly planning
- Identifying technical debt

**Usage:**
```
@workspace create a roadmap analysis following .github/copilot/prompts/roadmap-analysis.md
```

---

### 🧹 [clean-ai-code.md](./clean-ai-code.md)
Remove AI-generated code patterns that are inconsistent with project style.

**When to use:**
- After AI-assisted coding sessions
- Before PR submission
- Code cleanup sprints

**Usage:**
```
@workspace clean up AI code patterns using .github/copilot/prompts/clean-ai-code.md
```

---

### 🎨 [ux-testing.md](./ux-testing.md)
Comprehensive UX testing, code inspection, and backlog updates.

**When to use:**
- Regular UX testing cycles
- Before major releases
- After significant UI changes

**Usage:**
```
@workspace conduct UX testing following .github/copilot/prompts/ux-testing.md
```

---

## How to Use

### Method 1: Direct Reference (Recommended)
```
@workspace [task description] following .github/copilot/prompts/[prompt-name].md
```

### Method 2: Copy-Paste
Open the prompt file and copy the entire prompt section into your chat.

### Method 3: Shorthand
Simply describe what you want in natural language:
```
@workspace review my code
@workspace run all tests and fix failures
@workspace create a feature roadmap
@workspace clean up AI-generated code patterns
@workspace run UX testing and update backlog
```

GitHub Copilot will use context from the prompt files automatically.

## Creating New Prompts

To add a new prompt:

1. Create a new `.md` file in this directory
2. Use this structure:

```markdown
# Prompt Title

Use this prompt with: `@workspace` or mention this file in your question.

## Purpose
Brief description of what this prompt does.

## Prompt
\```
[Your detailed prompt here]
\```

## Usage
Examples of how to invoke this prompt.

## Related Files
Links to relevant documentation.
```

3. Update this README with the new prompt

## Best Practices

### ✅ Do:
- Be specific about the task
- Reference package-specific patterns
- Include acceptance criteria
- Provide example commands
- Link to relevant documentation

### ❌ Don't:
- Create overly generic prompts
- Duplicate existing prompts
- Skip context about package differences
- Forget to update this README

## Package-Specific Considerations

### embedded-components
- Always reference `ARCHITECTURE.md`
- Use `yarn` commands
- Check `eb-` prefix for Tailwind
- Run `yarn test` after changes

### client-next-ts
- Reference `README.md` and `PRD.md`
- Use `npm` commands
- Check TanStack Router patterns
- Run `npm test` and `npm run health-check`

## Integration with Other Tools

These prompts work alongside:
- **Agent Skills** (`.github/copilot/skills/`) - Automatic task-based activation
- **Copilot Instructions** (`.github/copilot-instructions.md`) - General project context
- **Package Configs** (`*/.cursorrules`) - Package-specific quick reference

## Troubleshooting

**Prompt not working?**
1. Ensure you're using `@workspace` to give Copilot full context
2. Check that the prompt file path is correct
3. Try copying the prompt directly instead of referencing

**Need more specific behavior?**
1. Modify the prompt file for your needs
2. Add package-specific sections
3. Include concrete examples

**Want to suggest improvements?**
Open a PR with your proposed changes to the prompt files.

---

**Format**: GitHub Copilot Custom Prompts  
**Updated**: December 24, 2025  
**Compatible**: VS Code with GitHub Copilot
