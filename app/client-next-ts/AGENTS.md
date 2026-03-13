# app/client-next-ts — Agent Instructions

Showcase application for JPMorgan Embedded Finance. Demonstrates the `@jpmorgan-payments/embedded-finance-components` library through the SellSense marketplace demo.

## Package Setup

All commands run from this directory (`app/client-next-ts/`):

- Install: `yarn install`
- Dev server: `yarn dev` (http://localhost:3000)
- Build: `yarn build`
- Type check: `npx tsc --noEmit`
- Format: `yarn format`
- Tests: `yarn test`
- Health checks: `yarn health-check:all`

## Technology Stack

- **React 18** + TypeScript
- **TanStack Router** (file-based routing in `src/routes/`)
- **Vite** build tool
- **Tailwind CSS** — plain utility classes, **no `eb-` prefix** (see below)
- **shadcn/ui** for base UI components (`src/components/ui/`)
- **MSW** (Mock Service Worker) for client-side API mocking
- **Vitest** + **Playwright** for tests

## Project Structure

```
src/
├── components/
│   ├── ui/           # shadcn/ui reusable components
│   ├── landing/      # Landing page components
│   └── sellsense/    # SellSense demo components (main focus)
├── routes/           # TanStack Router file-based routes
├── msw/              # Mock Service Worker setup (handlers.ts, db.ts)
├── lib/              # Utility functions and mock-overrides-storage.ts
└── styles/           # Global CSS styles
public/               # Static assets — reference with absolute paths: /sellSense.svg
```

Key files in `src/components/sellsense/`:
- `dashboard-layout.tsx` — main orchestrator with URL state sync
- `use-sellsense-themes.ts` — theme mapping hook
- `sellsense-scenarios.ts` — scenario-to-client-ID mapping
- `sidebar.tsx` — context-aware navigation
- `kyc-onboarding.tsx` — `OnboardingFlow` wrapper

## Code Organization

**File naming**: kebab-case files (`dashboard-layout.tsx`), PascalCase exports (`DashboardLayout`), camelCase hooks (`useSellsenseThemes`).

**Import order**:
```typescript
// 1. React and external libraries
import { Link } from '@tanstack/react-router';
// 2. Internal components and hooks
import { DashboardLayout } from '@/components/sellsense/dashboard-layout';
// 3. Types and utilities
import { cn } from '@/lib/utils';
```

Use the `@/` alias for all `src/` imports (configured in `vite.config.ts`).

## ⚠️ Critical: Tailwind CSS Prefix Rule

**This app uses plain Tailwind classes. Never use the `eb-` prefix here.**

The `eb-` prefix exists only in the `embedded-components` library. Using it in this app produces classes that do not exist, causing styles to silently fail — layout collapses, overflow is not clipped, fonts are wrong, etc.

```tsx
// ✅ Correct — plain Tailwind in this app
<div className="flex flex-col min-h-0 flex-1 overflow-hidden p-4 text-sm text-gray-900">

// ❌ Wrong — eb- prefix only belongs in embedded-components
<div className="eb-flex eb-flex-col eb-min-h-0 eb-flex-1 eb-overflow-hidden">
```

## Side Drawer Pattern

All side drawers must follow the pattern established in `src/components/sellsense/theme-customization-drawer.tsx`:

```tsx
if (!isOpen) return null;

return (
  <>
    {/* Backdrop */}
    <div
      className="fixed inset-0 z-40 bg-black bg-opacity-50"
      onClick={onClose}
      aria-hidden="true"
    />

    {/* Drawer */}
    <div className="fixed inset-y-0 right-0 z-50 flex w-[32rem] transform flex-col
                    border-l border-gray-200 bg-white shadow-xl
                    transition-transform duration-300 ease-in-out translate-x-0">
      {/* Header */}
      <div className="flex flex-shrink-0 items-center justify-between border-b border-gray-200 p-4">
        ...
      </div>

      {/* Scrollable content */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        ...
      </div>
    </div>
  </>
);
```

Key rules:
- Render **inline** (no `createPortal`) — portals break width computation
- Use `fixed inset-y-0 right-0` for full-height drawers; do **not** use `topOffset` inline styles
- **No `eb-` prefix** on any class
- Colors: `gray-*` palette, `p-4` section padding, `border-gray-200` dividers
- Header title: `text-base font-semibold text-gray-900`
- Close button: `Button variant="ghost" size="icon"` with `h-7 w-7`
- Escape key + body scroll lock via `useEffect` (see theme drawer for canonical implementation)

## TanStack Router — Zod Schema Validation

All search parameters are validated with Zod at the route level:

```typescript
const sellsenseDemoSearchSchema = z.object({
  scenario: z.enum(['New Seller - Onboarding', 'Active Seller - Fresh Start', ...]).optional(),
  theme: z.enum(['Empty', 'Default Blue', 'SellSense', 'Salt Theme', 'Create Commerce', 'PayFicient']).optional(),
  contentTone: z.enum(['Standard', 'Friendly']).optional(),
  fullscreen: z.boolean().optional(),
});

export const Route = createFileRoute('/sellsense-demo')({
  component: SellsenseDemo,
  validateSearch: sellsenseDemoSearchSchema,
});
```

- Always use `Route.useSearch()` — never manual `URLSearchParams`
- Sync all user-configurable state back to the URL with `navigate({ search: newSearch, replace: true })`
- **When adding new theme options or enum values**, delete the cached route tree and rebuild:
  ```powershell
  Remove-Item src\routeTree.gen.ts
  npm run build
  ```

## Theme System

`use-sellsense-themes.ts` maps a `ThemeOption` string to CSS custom property objects consumed by `EBComponentsProvider`.

### Available themes

| Value | Description |
|---|---|
| `Empty` | No design tokens — shows component defaults |
| `Default Blue` | Modern purple/indigo |
| `SellSense` | Brand orange with teal accents |
| `Salt Theme` | Professional teal (S&P design system) |
| `Create Commerce` | Dark slate theme |
| `PayFicient` | Brand green |

### Adding a new theme

1. Add the value to `ThemeOption` in `use-sellsense-themes.ts`
2. Define all design tokens (colors, typography, button states, alert colors)
3. Update the Zod schema in `src/routes/sellsense-demo.tsx`
4. Add a `<SelectItem>` in `header.tsx`
5. Delete `src/routeTree.gen.ts` and run `npm run build`

### Fullscreen / demo mode pattern

Components that wrap embedded finance components support both a demo shell and a bare fullscreen mode:

```typescript
const { fullscreen } = Route.useSearch();

if (fullscreen) {
  return <OnboardingFlow {...componentProps} />;
}

return (
  <div className="relative rounded-lg border" style={themeVariables}>
    <OnboardingFlow {...componentProps} />
    <div className="absolute top-2 right-2 flex gap-1">
      <ControlIcons />
    </div>
  </div>
);
```

- Hide **all** SellSense chrome (navigation, controls) in fullscreen mode
- Control icons: `Maximize2` (opens in new window) + `Info` (tech dialog), positioned `absolute top-2 right-2`

## MSW DB Override Architecture (SellSense)

The SellSense demo lets users edit mock JSON per-endpoint; overrides persist in `localStorage` and are applied to the MSW in-memory DB.

### Key files

| File | Role |
|---|---|
| `src/msw/handlers.ts` | Unified `POST /ef/do/v1/_reset` handler — accepts `{ scenario?, overrides? }`, applies atomically |
| `src/msw/db.ts` | `applyOverridesToDb()` — applies overrides from storage to the DB |
| `src/lib/mock-overrides-storage.ts` | `getOverrides / setOverride / removeOverride / clearOverrides` (localStorage); `reinitWithOverrides(scenario?)` calls `_reset` |
| `src/lib/database-reset-utils.ts` | `resetDatabaseForScenario()` — always includes `getOverrides()` so scenario switches reapply user overrides |
| `src/components/sellsense/mock-api-editor-drawer.tsx` | UI drawer for editing mock JSON |
| `src/components/sellsense/mock-api-editor-config.ts` | Endpoint definitions for the editor |

### Critical patterns

**Always use a single atomic reset call.** Never make separate "sync overrides" and "reset DB" requests — this creates a race condition in the service worker.

```ts
// ✅ Correct — one atomic call
await fetch('/ef/do/v1/_reset', {
  method: 'POST',
  body: JSON.stringify({ scenario, overrides: getOverrides() }),
});

// ❌ Wrong — race condition between two requests
await fetch('/ef/do/v1/_mock-overrides', { ... });
await fetch('/ef/do/v1/_reset', { ... });
```

**MSW service workers cannot access `localStorage`.** Overrides must be read client-side and sent in the POST body.

**When removing an endpoint from the editor config, also add its key to `DEPRECATED_OVERRIDE_KEYS` in `mock-overrides-storage.ts`.** `getOverrides()` silently purges deprecated keys on every read so stale `localStorage` entries can never corrupt the DB (e.g. an old `GET /ef/do/v1/payment-recipients: []` override would otherwise call `db.recipient.deleteMany({})` on every page load). Also remove the corresponding block from `applyOverridesToDb` in `db.ts`.

**Never apply a collection override that is an empty array.** `applyOverridesToDb` guards every collection replacement with `array.length > 0`. An empty array almost always means the override was saved when the DB was already empty (e.g. after another bug wiped it) — applying it would silently wipe all seeded data on every subsequent reset. If a user genuinely wants zero items they should use the scenario's empty seed instead.

**`@mswjs/data` shallow-merges `Object` fields.** To replace deeply nested objects, `delete` then `create` the entity — never `update`:

```ts
// ✅ Correct — full replacement
db.party.delete({ where: { id: { equals: id } } });
db.party.create({ ...newData });

// ❌ Wrong — shallow merge leaves stale nested fields
db.party.update({ where: { id: { equals: id } }, data: newData });
```

**Trigger refetch with `emulateTabSwitch()`** after any override save/reset. This causes React Query to refetch without a full page reload.

## Mock API Editor Drawer — State Management

`src/components/sellsense/mock-api-editor-drawer.tsx`

### Editor value: use ref + state together

Use a `useRef` alongside `useState` for the JSON editor value. The ref is always current (no stale closure risk) and is safe to read inside async save callbacks before React flushes state:

```ts
const latestEditorValue = useRef<JsonValue | null>(null);
const [editorValue, setEditorValue] = useState<JsonValue | null>(null);

// On load:
latestEditorValue.current = data;
setEditorValue(data);

// In handleSave (always fresh):
const currentValue = latestEditorValue.current;
```

### Force-remount the editor when new data loads

Use an incrementing `key` to remount the uncontrolled `JsonEditor` with fresh `defaultValue`. Never drive `visual-json`'s `JsonEditor` as a controlled component (`value` prop) — it resets mid-edit on every parent re-render:

```tsx
const [editorVersion, setEditorVersion] = useState(0);

// After loading new data:
setEditorVersion((v) => v + 1);

// In JSX:
<JsonEditorContainer key={editorVersion} initialValue={editorValue} ... />
```

### Track `overrideKeys` as explicit state

Derive and store `overrideKeys` as `useState` (not a computed variable) so chips and badge counts update synchronously immediately after save/reset, without waiting for a re-render cycle.

## `@visual-json/react` Integration

### Height: always use absolute positioning

`JsonEditor` renders a root `<div>` with `height: "100%"` and `overflow: hidden` in its inline styles. `height: 100%` does **not** resolve against a flex item — it resolves against the nearest **positioned** ancestor. Without this, the editor collapses to 0px and `overflow: hidden` hides all content.

Always wrap the editor body in a `relative` container with an absolutely positioned inner div:

```tsx
{/* ✅ Correct */}
<div className="relative min-h-0 flex-1">
  <div className="absolute inset-0 overflow-hidden">
    <JsonEditorContainer key={editorVersion} ... />
  </div>
</div>

{/* ❌ Wrong — height: 100% collapses to 0 against flex-1 */}
<div className="min-h-0 flex-1 overflow-hidden">
  <JsonEditorContainer key={editorVersion} ... />
</div>
```

Apply the same pattern to all states in `JsonEditorContainer` (loading spinner, fallback textarea):

```tsx
// Loading / fallback states also need absolute positioning:
<div className="absolute inset-0 flex items-center justify-center">...</div>
<div className="absolute inset-0 flex flex-col">...</div>
```

### Light theme CSS variables

`@visual-json/react` defaults to a VS Code dark theme. **All variables must be overridden** for a light theme. Pass them via the `style` prop on `JsonEditor`:

```tsx
<JsonEditor
  defaultValue={initialValue}
  onChange={onValueChange}
  height="100%"
  className="absolute inset-0"
  style={{
    '--vj-bg': '#ffffff',
    '--vj-bg-panel': '#f9fafb',
    '--vj-bg-hover': '#f3f4f6',        // default #2a2d2e — very dark
    '--vj-bg-selected': '#dbeafe',     // default #2a5a1e — dark green
    '--vj-bg-selected-muted': '#eff6ff',
    '--vj-bg-match': '#fef9c3',
    '--vj-bg-match-active': '#fde68a',
    '--vj-border': '#e5e7eb',
    '--vj-border-subtle': '#f3f4f6',
    '--vj-text': '#111827',
    '--vj-text-muted': '#6b7280',
    '--vj-text-dim': '#9ca3af',
    '--vj-text-dimmer': '#d1d5db',
    '--vj-string': '#0369a1',
    '--vj-number': '#047857',
    '--vj-boolean': '#7c3aed',
    '--vj-accent': '#2563eb',
    '--vj-accent-muted': '#dbeafe',    // default #094771 — dark navy
    '--vj-input-bg': '#ffffff',
    '--vj-input-border': '#d1d5db',
    '--vj-error': '#dc2626',
    '--vj-font': "'ui-monospace', 'Cascadia Code', monospace",
  } as React.CSSProperties}
/>
```

### Uncontrolled vs controlled

Always use `defaultValue` (uncontrolled). The `value` prop causes the editor to reset its internal tree on every React render that changes `value` — including renders triggered by the `onChange` call itself.
