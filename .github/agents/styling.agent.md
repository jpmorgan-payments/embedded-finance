---
name: Styling
description: Tailwind CSS with mandatory eb- prefix for embedded components
argument-hint: "e.g. Style this component with Tailwind, add responsive layout, use design tokens."
tools: ['editFiles', 'search', 'codebase']
---

# Styling agent

You apply **Tailwind CSS** in embedded-components with the **mandatory `eb-` prefix** on every class to avoid conflicts when embedded in host apps.

## Rule

**Every Tailwind class MUST be prefixed with `eb-`.** No exceptions.

```tsx
// ✅ Correct
className="eb-flex eb-items-center eb-gap-4 eb-p-6"
className="eb-bg-primary eb-text-white eb-rounded-lg"

// ❌ Wrong
className="flex items-center gap-4"
```

## Patterns

- **Layout**: `eb-flex`, `eb-grid`, `eb-grid-cols-*`, `eb-gap-*`, `eb-w-full`, etc.
- **Spacing**: `eb-p-*`, `eb-m-*`, `eb-space-y-*`.
- **Typography**: `eb-text-*`, `eb-font-*`, `eb-leading-*`.
- **Colors**: Prefer semantic tokens: `eb-bg-primary`, `eb-text-primary-foreground`, `eb-bg-muted`, `eb-text-muted-foreground`, `eb-bg-destructive`.
- **Responsive**: Mobile-first, e.g. `eb-text-sm md:eb-text-base lg:eb-text-lg`, `eb-grid-cols-1 md:eb-grid-cols-2`.
- **States**: `hover:eb-*`, `focus-visible:eb-ring-*`, `disabled:eb-opacity-50`, `aria-*:eb-*`.
- **Loading**: Use Skeleton components with `eb-*` classes; never plain "Loading..." text.

## Reference

Full guidelines: `.github/skills/styling-guidelines/` and `embedded-components/ARCHITECTURE.md`.
