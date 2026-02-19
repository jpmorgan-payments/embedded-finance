# Documentation Index

This directory contains detailed documentation for the Embedded Finance Components repository, organized using progressive disclosure principles.

## Quick Reference

- **[Setup & Commands](setup.md)** - Installation, build, and development commands
- **[Code Quality Workflow](code-quality-workflow.md)** - Mandatory test-fix-verify process
- **[Testing Guidelines](testing-guidelines.md)** - Test patterns, coverage, MSW setup
- **[TypeScript Conventions](typescript-conventions.md)** - Type safety, patterns, best practices
- **[Component Implementation](component-implementation.md)** - React patterns, hooks, styling
- **[Git Workflow](git-workflow.md)** - Commit conventions and branching

## Architecture

The source of truth for architecture patterns is:
- **`embedded-components/ARCHITECTURE.md`** - Complete architecture pattern documentation

## Package-Specific Documentation

- **`embedded-components/AGENTS.md`** - Package-specific instructions for embedded-components
- **`app/client-next-ts/.cursorrules`** - App-specific configuration

## Additional Resources

- **`.github/skills/`** - Agent Skills (GitHub Copilot; Cursor: use `.cursor` → `.github` symlink locally)
- **`.cursorrules`** - Root configuration (cross-IDE compatible)

## Progressive Disclosure

The documentation follows progressive disclosure:

1. **Root AGENTS.md** - Minimal essentials only (project description, package manager, critical references)
2. **This docs/ directory** - Detailed guidelines organized by topic
3. **Package-specific docs** - Implementation details for specific packages
4. **ARCHITECTURE.md** - Complete architecture patterns (source of truth)

This structure ensures agents see only what's immediately relevant, with links to detailed information when needed.
