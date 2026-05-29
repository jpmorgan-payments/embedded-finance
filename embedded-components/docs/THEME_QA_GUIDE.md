# Theme QA and Design Token Alignment

Use this checklist when validating component theming and when adding or refining design tokens.

> **📘 Complete Token Documentation**: See [DESIGN_TOKENS.md](../DESIGN_TOKENS.md) for comprehensive token reference, CSS variables, and customization examples.

## Quick QA Checklist (per component)

- **Color schemes**: Wrap in `EBComponentsProvider` and toggle `theme.colorScheme` (`light`, `dark`, `system`); verify surfaces, text, borders, focus rings, overlays, and sentiment/status colors react correctly
- **Runtime overrides**: Override tokens at runtime (e.g., `actionableAccentedBoldBackground`, `containerPrimaryBackground`, `separableBorderColor`) and confirm the component updates without local overrides
- **DOM inspection**: Ensure classes are namespaced (`eb-...`) and colors come from CSS variables (`var(--eb-...)`), not hard-coded hex/HSL
- **Interactive states**: Hover/active/focus use semantic variants (`primary-hover`, `destructive-hover`, `ring`), not custom colors
- **Typography**: Headings/body use `--eb-font-family`/`--eb-header-font-family`, button and label fonts via tokenized utilities
- **Borders & radii**: Come from `separable`/`button`/`input` tokens (`eb-border`, `eb-rounded`, `eb-rounded-button`, `eb-rounded-input`)
- **Spacing**: Padding/margin uses tokenized spacing (`eb-p-*`, `eb-m-*`) which map to `--eb-spacing-unit`

## When Adding Tokens

1. **Add/rename in theme types**: Update `EBTheme`/`EBThemeVariables` and `defaultTheme` with sensible defaults
2. **Map to CSS variables**: Wire the token in `convert-theme-to-css-variables.ts`, ensuring legacy fallback if relevant, and emit a `--eb-*` variable
3. **Expose in Tailwind**: Extend `tailwind.config.js` so the new `--eb-*` variable is reachable via an `eb-` utility (color, spacing, radius, font, shadow, z-index, etc.)
4. **Consume via utilities**: Update components to use the `eb-` utility instead of inline styles or raw colors. Do not use hex/HSL directly
5. **QA in Storybook**: Override the token through `EBComponentsProvider` and confirm live changes in Storybook (light/dark/system)

> **🔧 Special Behaviors**: See [DESIGN_TOKENS.md - Special Behaviors](../DESIGN_TOKENS.md#special-behaviors) for automatic fallback behaviors (hover states at 90% opacity, border radius inheritance, font weight inheritance)

## Hotspots to Regress-Check

- **Borders**: Use `eb-border` and tokenized shadows (`shadow-border-primary`/`secondary`/`destructive`) instead of `border-gray-*`
- **Text**: Use `eb-text-foreground` or `eb-text-muted-foreground` for secondary content; avoid `text-gray-*`
- **Buttons/links**: Variants must use `primary`/`secondary`/`destructive` tokens; hover/active states should not introduce ad-hoc colors
- **Inputs/forms**: Backgrounds/borders/radii via `editable` tokens (`eb-bg-input`, `eb-border-input`, `eb-rounded-input`)
- **Overlays/popovers/dialogs**: Use `eb-bg-popover`, `eb-text-popover-foreground`, `eb-z-overlay`
- **Navigation**: Use `eb-bg-sidebar`, `eb-text-sidebar-foreground`, `eb-bg-sidebar-accent`
- **Status/sentiment**: Use `informative`, `warning`, `success`, `destructive` token utilities instead of arbitrary palette choices
- **Spacing**: Rely on tokenized spacing scale; avoid pixel literals unless necessary for layout math

## Minimal Storybook Token Smoke Test

- **Light mode**: Set `actionableAccentedBoldBackground`, `containerPrimaryBackground`, `contentPrimaryForeground`, `separableBorderColor`
- **Dark mode**: Repeat with darker values and ensure text/background meet contrast
- **Interaction**: Hover buttons/links, focus inputs to see `--eb-ring`, open popovers/dialogs to verify overlay tokens and z-index

## Testing Checklist

- [ ] Works in light and dark modes
- [ ] Responds to theme overrides at runtime (test via EBComponentsProvider)
- [ ] Good contrast ratios (WCAG AA minimum: 4.5:1 for text, 3:1 for UI components)
- [ ] Interactive states work (hover/active/focus/disabled)
- [ ] No hard-coded colors in className or style props
- [ ] All colors come from CSS variables (`var(--eb-*)`)
- [ ] Typography uses tokenized font families and weights
- [ ] Spacing uses tokenized scale (`eb-p-*`, `eb-m-*`, `eb-gap-*`)
- [ ] Border radius uses tokenized values (`eb-rounded-*`)
- [ ] Shadows use tokenized values (`shadow-*`)

## Pitfalls to Avoid

- **Don't use `gray-*` utilities** → Use `muted-foreground`, `foreground`, `border`
- **Don't use `border-gray-*`** → Use `eb-border` or `shadow-border-*`
- **Don't use hex/HSL directly** → Always reference tokens via CSS variables
- **Don't create ad-hoc hover colors** → Use tokenized hover variants (`primary-hover`, `destructive-hover`)

## Common Fixes

**Gray colors** → Use semantic tokens:

- `gray-500` → `eb-text-muted-foreground`
- `gray-600`/`700` → `eb-text-foreground`
- `border-gray` → `eb-border`

**Status badges** → Use Status tokens not Sentiment (Status has more states: pending, active, inactive)

**Hard-coded colors** → Extract to theme tokens:

1. Add to `EBTheme` interface
2. Map in `convert-theme-to-css-variables.ts`
3. Expose in `tailwind.config.js`
4. See [DESIGN_TOKENS.md - Customization](../DESIGN_TOKENS.md#customization-examples)

## If a Token Seems Missing

1. **Check legacy mapping first**: Many tokens auto-fallback (see [DESIGN_TOKENS.md - Special Behaviors](../DESIGN_TOKENS.md#special-behaviors))
2. **Search existing characteristics**: Often covered by different naming (e.g., `separable` for borders, `overlayable` for dialogs)
3. **Propose new token**: If truly missing, add to `EBThemeVariables`, wire through CSS conversion, expose in Tailwind
4. **Document the addition**: Update DESIGN_TOKENS.md with the new token and its usage

## Resources

### Primary Documentation

- [DESIGN_TOKENS.md](../DESIGN_TOKENS.md) - Complete token reference (12 characteristics, CSS variables, customization)
- `src/lib/theme/` - Theme implementation files
- `tailwind.config.js` - Token-to-utility mappings

### Salt Design System

- [Salt DS - Foundations](https://www.saltdesignsystem.com/salt/foundations/index) - Official design system
- [Salt DS - Color](https://www.saltdesignsystem.com/salt/foundations/color) - Color token semantics
- [Salt DS - Typography](https://www.saltdesignsystem.com/salt/foundations/typography) - Typography scales
