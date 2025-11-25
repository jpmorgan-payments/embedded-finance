# Quick Reference: New npm Scripts

## 🏗️ Build

```bash
yarn build              # Standard build
yarn build:analyze      # Build + generate bundle analysis (opens browser)
```

## 🧪 Testing

```bash
yarn test               # Full test suite (typecheck + format + lint + unit tests)
yarn test:unit          # Run unit tests only
yarn test:watch         # Watch mode
yarn test:coverage      # With coverage report
```

## ✨ Code Quality

```bash
yarn typecheck          # TypeScript type checking
yarn lint               # Check linting
yarn lint:fix           # Auto-fix linting issues
yarn format             # Format all code
yarn format:check       # Check formatting (CI)
```

## 🔒 Security

```bash
yarn audit              # Check for vulnerabilities
yarn audit:fix          # Auto-fix vulnerabilities
```

## 📊 Analysis

```bash
yarn analyze            # Analyze bundle (generates dist/stats.html)
yarn visualize          # Visualize bundle composition
```

## 🚀 Development

```bash
yarn dev                # Start dev server
yarn storybook          # Start Storybook
yarn storybook:build    # Build Storybook
```

## 🔧 API Generation

```bash
yarn generate-api       # Generate API client from OpenAPI specs
```

---

## What's New?

### Replaced

- `yarn prettier` → `yarn format:check`
- `yarn prettier:write` → `yarn format`
- `yarn vitest` → `yarn test:unit`
- `yarn vitest:watch` → `yarn test:watch`

### Added

- `yarn build:analyze` - Build with bundle visualization
- `yarn test:coverage` - Generate coverage reports
- `yarn lint:fix` - Auto-fix linting issues
- `yarn format` - Format all files (including JSON, MD)
- `yarn format:check` - Check formatting
- `yarn audit` - Security audit
- `yarn audit:fix` - Fix security issues
- `yarn analyze` - Bundle analysis
- `yarn visualize` - Interactive bundle visualization

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
