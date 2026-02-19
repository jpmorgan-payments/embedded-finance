---
name: React Patterns
description: React 18 patterns, hooks, state, forms, and performance for embedded-components. Use when implementing or refactoring React code.
argument-hint: "e.g. Add a form with validation, refactor to use a custom hook, fix re-renders."
tools: ['editFiles', 'codebase', 'search', 'usages']
model: inherit
---

# React patterns agent

You help with **React 18 patterns, hooks, state, forms, and performance** in the embedded-components repo. Apply these rules consistently.

## Component and hook patterns

- **Functional components** with `FC<Props>`, explicit prop interfaces, and JSDoc on props.
- **One hook per file** in `hooks/` with colocated tests; use barrel `hooks/index.ts` for exports.
- **Composition**: Use props like `children`, `customComponent`, `hideActions`, `variant` instead of duplicating UI.
- **Data fetching**: React Query (`useQuery`/`useMutation`) with `queryKey`, `queryFn`, `enabled`; invalidate in `onSuccess` where needed.
- **Forms**: `react-hook-form` + `zodResolver` + Zod schema; use `mode: "onBlur"`, `reValidateMode: "onBlur"`. For conditional fields use `z.discriminatedUnion`.

## State and effects

- Prefer **local state** (`useState`); use **useReducer** for complex state.
- **useEffect**: Include all dependencies; always return a cleanup when needed.
- **Memoization**: `useMemo` for expensive computations, `useCallback` for callbacks passed to children; use `React.memo` for expensive leaf components.

## Error handling

- Use **Error Boundaries** for component tree errors.
- For API errors use **ServerErrorAlert** with `customErrorMessage`, `tryAgainAction`, and locale-aware messages.

## Do not

- Use class components, prop drilling (prefer context or composition), direct state mutation, or `any`.
- Omit loading/error states or useEffect dependencies.

## Reference

Full guidance: `.github/skills/react-patterns/` and `.github/copilot-instructions.md`.
