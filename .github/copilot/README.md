# GitHub Copilot Setup - Agent Skills

## Quick Reference

This workspace uses the Agent Skills format for AI assistance. Skills are automatically discovered and used by GitHub Copilot, Cursor, and other AI tools.

## 📁 Location

All skills are in: `.github/copilot/skills/`

## 🎯 Available Skills

### Core Skills (Must Know)

1. **[embedded-banking-architecture](skills/embedded-banking-architecture/)** - Component structure, file organization, decision trees
2. **[component-testing](skills/component-testing/)** - Testing patterns, MSW, React Query
3. **[code-quality-workflow](skills/code-quality-workflow/)** - Mandatory test-fix-verify workflow
4. **[styling-guidelines](skills/styling-guidelines/)** - Tailwind CSS with `eb-` prefix
5. **[react-patterns](skills/react-patterns/)** - React 18 hooks and patterns

### Important Skills

6. **[i18n-l10n](skills/i18n-l10n/)** - Internationalization and localization
7. **[windows-powershell](skills/windows-powershell/)** - PowerShell commands
8. **[test-and-fix-workflow](skills/test-and-fix-workflow/)** - Testing workflow automation

## 🚀 How to Use

### In VS Code

Just use GitHub Copilot normally! Skills are automatically activated based on your task.

**Examples:**
- "Create a new component" → Uses `embedded-banking-architecture`
- "Add tests" → Uses `component-testing`
- "Fix linting errors" → Uses `code-quality-workflow`
- "Style this button" → Uses `styling-guidelines`

### In Cursor

Works the same way! Cursor also supports Agent Skills.

### In Claude Code

Claude Code can use Agent Skills for enhanced context.

## 📚 Documentation

- **[Skills README](skills/README.md)** - Comprehensive documentation
- **[Prompts Directory](prompts/)** - Custom prompts for common tasks
- **[Architecture](../embedded-components/ARCHITECTURE.md)** - Source of truth

## ⚡ Quick Commands

```powershell
# Navigate to embedded-components
cd embedded-components

# Run all tests
yarn test

# Fix formatting and linting
yarn format; yarn lint:fix

# Type check
yarn typecheck

# Run Storybook
yarn storybook
```

## 🔑 Key Principles

**ALWAYS:**
- ✅ Follow `ARCHITECTURE.md` patterns
- ✅ Use `eb-` prefix for Tailwind classes
- ✅ Run `yarn test` after changes
- ✅ Colocate tests with implementation
- ✅ Use individual hook/util files
- ✅ Direct imports (no aggregation barrels)

**NEVER:**
- ❌ Use `&&` in PowerShell (use `;` instead)
- ❌ Hardcode text (use i18n)
- ❌ Skip running tests
- ❌ Commit code with errors
- ❌ Create aggregation barrel exports

## 🎨 Common Patterns

### Create Component

```typescript
// ComponentName/ComponentName.tsx
import { FC } from 'react';

export interface ComponentNameProps {
  title: string;
}

export const ComponentName: FC<ComponentNameProps> = ({ title }) => {
  return <div className="eb-flex eb-items-center">{title}</div>;
};
```

### Add Tests

```typescript
// ComponentName/ComponentName.test.tsx
import { render, screen } from '@testing-library/react';
import { ComponentName } from './ComponentName';

describe('ComponentName', () => {
  test('renders title', () => {
    render(<ComponentName title="Test" />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});
```

### Run Quality Workflow

```powershell
cd embedded-components
yarn test
# Fix any errors
yarn format; yarn lint:fix
# Re-run
yarn test
```

## 🔧 Troubleshooting

### Skills Not Working?

1. Ensure you're in VS Code with GitHub Copilot enabled
2. Skills should activate automatically
3. Try explicit mention: "Using the component-testing skill..."

### Tests Failing?

1. Check TypeScript errors: `yarn typecheck`
2. Fix formatting: `yarn format`
3. Fix linting: `yarn lint:fix`
4. Re-run tests: `yarn test`

### Need More Info?

- Read skill documentation in `.github/copilot/skills/`
- Check `ARCHITECTURE.md` for architecture patterns
- Review custom prompts in `.github/copilot/prompts/`

## 🌟 Benefits

- ✅ Automatic best practice enforcement
- ✅ Context-aware AI assistance
- ✅ Consistent code quality
- ✅ Works across multiple AI tools
- ✅ Version-controlled guidance
- ✅ Easy to maintain and extend

## 📦 Structure

```
.github/copilot/
├── copilot-instructions.md    # GitHub Copilot instructions
├── README.md                   # This file
├── prompts/                    # Custom prompts
│   ├── README.md
│   ├── code-review.md
│   ├── run-tests-and-fix.md
│   ├── roadmap-analysis.md
│   ├── clean-ai-code.md
│   └── ux-testing.md
└── skills/
    ├── README.md               # Skills documentation
    ├── embedded-banking-architecture/
    ├── component-testing/
    ├── code-quality-workflow/
    ├── styling-guidelines/
    ├── react-patterns/
    ├── i18n-l10n/
    ├── windows-powershell/
    └── test-and-fix-workflow/
```

## 🔄 Updates

Skills are version controlled. When the codebase changes:

1. Update relevant skill files
2. Increment version in metadata
3. Update documentation
4. Commit changes

## 📖 Learn More

- **Agent Skills Spec**: https://agentskills.io/specification
- **GitHub Examples**: https://github.com/anthropics/skills
- **Validation Tool**: https://github.com/agentskills/agentskills

---

**Last Updated**: December 24, 2025  
**Format Version**: Agent Skills 1.0  
**Total Skills**: 8  
**Status**: ✅ Active
