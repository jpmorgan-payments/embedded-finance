# Quick Reference: New npm Scripts

## 🏗️ Build

```bash
npm run build           # Standard build
npm run build:analyze   # Build + generate bundle analysis (opens browser)
```

## 🧪 Testing

```bash
npm test                # Full test suite (typecheck + format + lint + unit tests)
npm run test:unit       # Run unit tests only
npm run test:watch      # Watch mode
npm run test:coverage   # With coverage report
```

## ✨ Code Quality

```bash
npm run typecheck       # TypeScript type checking (authoritative type gate)
npm run lint            # Fast lint — syntactic rules only (no type-aware, no Tailwind)
npm run lint:fix        # Auto-fix linting issues
npm run lint:styles     # Opt-in Tailwind / eb- prefix checks (slow, non-blocking)
npm run format          # Format all code
npm run format:check    # Check formatting (CI)
```

> **Linting model (non-functional decisions):** `npm run lint` is deliberately fast
> and syntactic-only. Type safety is owned by `npm run typecheck` (ESLint is _not_
> type-aware), and the slow Tailwind / `eb-` prefix rules are opt-in via
> `npm run lint:styles` (`ESLINT_STYLES=1`). Together this cut clean lint time ~10x
> (≈429s → ≈41s). See the `eslint.config.mjs` header and BACKLOG **BL-505** for
> the full rationale, tech-debt burn-down, and next-wave backlog.

## 🔒 Security

```bash
npm run audit           # Check for vulnerabilities
npm run audit:fix       # Auto-fix vulnerabilities
```

## 📊 Analysis

```bash
npm run analyze         # Analyze bundle (generates dist/stats.html)
npm run visualize       # Visualize bundle composition
```

## 🚀 Development

```bash
npm run dev             # Start dev server
npm run storybook       # Start Storybook
npm run storybook:build # Build Storybook
```

## 🔧 API Generation

```bash
npm run generate-api    # Generate API client from OpenAPI specs
```

---

## What's New?

### Replaced

- `npm run prettier` → `npm run format:check`
- `npm run prettier:write` → `npm run format`
- `npm run vitest` → `npm run test:unit`
- `npm run vitest:watch` → `npm run test:watch`

### Added

- `npm run build:analyze` - Build with bundle visualization
- `npm run test:coverage` - Generate coverage reports
- `npm run lint:fix` - Auto-fix linting issues
- `npm run lint:styles` - Opt-in Tailwind/eb- prefix checks (kept out of the fast default lint)
- `npm run format` - Format all files (including JSON, MD)
- `npm run format:check` - Check formatting
- `npm run audit` - Security audit
- `npm run audit:fix` - Fix security issues
- `npm run analyze` - Bundle analysis
- `npm run visualize` - Interactive bundle visualization

---

## 📦 Package.json Enhancements

### Keywords Added

Now discoverable via npm search for:

- React component libraries
- Embedded finance/banking
- Radix UI components
- Tailwind libraries

### Catalog Metadata

Documents tech stack for tools:

- Framework: React
- UI Framework: Radix UI
- Styling: Tailwind (prefix: `eb-`)
- State: TanStack Query
- Validation: Zod
- Forms: React Hook Form
- i18n: react-i18next

### Bug Tracking

- Issues: <https://github.com/jpmorgan-payments/embedded-finance/issues>
