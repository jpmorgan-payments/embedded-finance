---
name: styling-guidelines
description: Tailwind CSS styling patterns with mandatory eb- prefix for embedded components. Use when applying styles, creating UI, or working with design tokens. Keywords - Tailwind, CSS, styling, eb- prefix, responsive design, design tokens.
license: MIT
metadata:
  version: "2.0.0"
  author: jpmorgan-payments
  lastUpdated: "2025-12-24"
  priority: critical
---

# Styling Guidelines

Tailwind CSS styling patterns with mandatory `eb-` prefix for embedded components. This skill ensures consistent styling and prevents style conflicts when components are embedded in other applications.

## When to Apply

Reference these patterns when:
- Applying Tailwind CSS classes to components
- Creating responsive layouts
- Working with design tokens
- Implementing loading states
- Creating accessible UI components

## ⚠️ CRITICAL: eb- Prefix Requirement

**ALL Tailwind CSS classes MUST be prefixed with `eb-`.** This is mandatory for the embedded components library to avoid style conflicts when embedded in other applications.

## Quick Reference

### Essential Rules

- ✅ **Always use eb- prefix** - No exceptions
- ✅ **Mobile-first** - Start with mobile, add breakpoints
- ✅ **Use semantic colors** - Prefer `eb-bg-primary` over `eb-bg-blue-500`
- ✅ **Skeleton components** - Never use "Loading..." text
- ✅ **Design tokens** - Use semantic color tokens from theme

### Common Patterns

```typescript
// Layout
className="eb-flex eb-items-center eb-gap-4"

// Responsive
className="eb-text-sm md:eb-text-base lg:eb-text-lg"

// Semantic colors
className="eb-bg-primary eb-text-primary-foreground"
```

## How to Use

For detailed instructions, examples, and patterns:

- **Full guide**: `AGENTS.md` - Complete styling documentation

## References

- See `embedded-components/DESIGN_TOKENS.md` for design system
- See `embedded-components/tailwind.config.js` for configuration
- See `AGENTS.md` for complete styling documentation
