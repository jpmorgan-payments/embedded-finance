# Theme QA and Design Token Alignment# Theme QA and Design Token Alignment



Use this checklist when validating component theming and when adding or refining design tokens. It assumes the existing token pipeline: `EBComponentsProvider` → `convert-theme-to-css-variables.ts` → `tailwind.config.js` → `eb-` utilities.Use this checklist when validating component theming and when adding or refining design tokens. It assumes the existing token pipeline: `EBComponentsProvider` → `convert-theme-to-css-variables.ts` → `tailwind.config.js` → `eb-` utilities.



> **📖 Token Reference**: For comprehensive documentation on design tokens, architecture, and customization examples, see [DESIGN_TOKENS.md](../DESIGN_TOKENS.md).> **📖 Token Reference**: For comprehensive documentation on design tokens, architecture, and customization examples, see [DESIGN_TOKENS.md](../DESIGN_TOKENS.md).



## Quick QA Checklist (per component)## Quick QA Checklist (per component)



- Wrap in `EBComponentsProvider` and toggle `theme.colorScheme` (`light`, `dark`, `system`); verify surfaces, text, borders, focus rings, overlays, and sentiment/status colors react correctly.- Wrap in `EBComponentsProvider` and toggle `theme.colorScheme` (`light`, `dark`, `system`); verify surfaces, text, borders, focus rings, overlays, and sentiment/status colors react correctly.

- Override a few tokens at runtime (e.g., `actionableAccentedBoldBackground`, `containerPrimaryBackground`, `separableBorderColor`, `contentFontFamily`) and confirm the component updates without local overrides.- Override a few tokens at runtime (e.g., `actionableAccentedBoldBackground`, `containerPrimaryBackground`, `separableBorderColor`, `contentFontFamily`) and confirm the component updates without local overrides.

- Inspect DOM: ensure classes are namespaced (`eb-...`) and colors come from CSS variables (`var(--eb-...)`), not hard-coded hex/HSL.- Inspect DOM: ensure classes are namespaced (`eb-...`) and colors come from CSS variables (`var(--eb-...)`), not hard-coded hex/HSL.

- Check interactive states: hover/active/focus use semantic variants (`primary-hover`, `destructive-hover`, `ring`), not custom colors.- Check interactive states: hover/active/focus use semantic variants (`primary-hover`, `destructive-hover`, `ring`), not custom colors.

- Verify typography tokens: headings/body (`font-family` via `--eb-font-family`/`--eb-header-font-family`), button and label fonts via tokenized utilities (`eb-font-button`, `eb-text-label`).- Verify typography tokens: headings/body (`font-family` via `--eb-font-family`/`--eb-header-font-family`), button and label fonts via tokenized utilities (`eb-font-button`, `eb-text-label`).

- Borders and radii: should come from `separable`/`button`/`input` tokens (`eb-border`, `eb-rounded`, `eb-rounded-button`, `eb-rounded-input`).- Borders and radii: should come from `separable`/`button`/`input` tokens (`eb-border`, `eb-rounded`, `eb-rounded-button`, `eb-rounded-input`).

- Spacing: confirm padding/margin uses tokenized spacing (`eb-p-*`, `eb-m-*`) which map to `--eb-spacing-unit`.- Spacing: confirm padding/margin uses tokenized spacing (`eb-p-*`, `eb-m-*`) which map to `--eb-spacing-unit`.



## When You Add or Refine a Token## When You Add or Refine a Token



1. **Add/rename in theme types** (if new): update `EBTheme`/`EBThemeVariables` and `defaultTheme` with a sensible default.1. **Add/rename in theme types** (if new): update `EBTheme`/`EBThemeVariables` and `defaultTheme` with a sensible default.

2. **Map to CSS variables**: wire the token in `convert-theme-to-css-variables.ts`, ensuring legacy fallback if relevant, and emit a `--eb-*` variable.2. **Map to CSS variables**: wire the token in `convert-theme-to-css-variables.ts`, ensuring legacy fallback if relevant, and emit a `--eb-*` variable.

3. **Expose in Tailwind**: extend `tailwind.config.js` so the new `--eb-*` variable is reachable via an `eb-` utility (color, spacing, radius, font, shadow, z-index, etc.).3. **Expose in Tailwind**: extend `tailwind.config.js` so the new `--eb-*` variable is reachable via an `eb-` utility (color, spacing, radius, font, shadow, z-index, etc.).

4. **Consume via utilities**: update components to use the `eb-` utility instead of inline styles or raw colors. Do not use hex/HSL directly.4. **Consume via utilities**: update components to use the `eb-` utility instead of inline styles or raw colors. Do not use hex/HSL directly.

5. **QA**: override the token through `EBComponentsProvider` and confirm live changes in Storybook (light/dark/system).5. **QA**: override the token through `EBComponentsProvider` and confirm live changes in Storybook (light/dark/system).



## Hotspots to Regress-Check## Hotspots to Regress-Check



- **Borders**: use `eb-border` and tokenized shadows (`shadow-border-primary`/`secondary`/`destructive`) instead of `border-gray-*`.- **Borders**: use `eb-border` and tokenized shadows (`shadow-border-primary`/`secondary`/`destructive`) instead of `border-gray-*`.

- **Text**: use `eb-text-foreground` or `eb-text-muted-foreground` for secondary content; avoid `text-gray-*`. For labels, prefer `eb-text-label` utilities if present.- **Text**: use `eb-text-foreground` or `eb-text-muted-foreground` for secondary content; avoid `text-gray-*`. For labels, prefer `eb-text-label` utilities if present.

- **Buttons/links**: variants must use `primary`/`secondary`/`destructive` tokens; hover/active states should not introduce ad-hoc colors.- **Buttons/links**: variants must use `primary`/`secondary`/`destructive` tokens; hover/active states should not introduce ad-hoc colors.

- **Inputs/forms**: backgrounds/borders/radii via `editable` tokens (`eb-bg-input`, `eb-border-input`, `eb-rounded-input`); labels via label font/weight tokens.- **Inputs/forms**: backgrounds/borders/radii via `editable` tokens (`eb-bg-input`, `eb-border-input`, `eb-rounded-input`); labels via label font/weight tokens.

- **Overlays/popovers/dialogs**: `eb-bg-popover`, `eb-text-popover-foreground`, `eb-z-overlay`.- **Overlays/popovers/dialogs**: `eb-bg-popover`, `eb-text-popover-foreground`, `eb-z-overlay`.

- **Navigation**: `eb-bg-sidebar`, `eb-text-sidebar-foreground`, `eb-bg-sidebar-accent`.- **Navigation**: `eb-bg-sidebar`, `eb-text-sidebar-foreground`, `eb-bg-sidebar-accent`.

- **Status/sentiment**: use `informative`, `warning`, `success`, `destructive` token utilities instead of arbitrary palette choices.- **Status/sentiment**: use `informative`, `warning`, `success`, `destructive` token utilities instead of arbitrary palette choices.

- **Spacing**: rely on tokenized spacing scale; avoid pixel literals unless necessary for layout math.- **Spacing**: rely on tokenized spacing scale; avoid pixel literals unless necessary for layout math.



## Minimal Storybook Token Smoke Test## Minimal Storybook Token Smoke Test



- Light mode override: set `actionableAccentedBoldBackground`, `containerPrimaryBackground`, `contentPrimaryForeground`, `separableBorderColor`.- Light mode override: set `actionableAccentedBoldBackground`, `containerPrimaryBackground`, `contentPrimaryForeground`, `separableBorderColor`.

- Dark mode override: repeat with darker values and ensure text/background meet contrast.- Dark mode override: repeat with darker values and ensure text/background meet contrast.

- Interaction: hover buttons/links, focus inputs to see `--eb-ring`, open popovers/dialogs to verify overlay tokens and z-index.- Interaction: hover buttons/links, focus inputs to see `--eb-ring`, open popovers/dialogs to verify overlay tokens and z-index.



## Comprehensive Testing Checklist## Comprehensive Testing Checklist



After implementing or fixing tokens, verify:After implementing or fixing tokens, verify:



- [ ] Component renders correctly in light mode- [ ] Component renders correctly in light mode

- [ ] Component renders correctly in dark mode- [ ] Component renders correctly in dark mode

- [ ] Component responds to theme overrides via `EBComponentsProvider`- [ ] Component responds to theme overrides via `EBComponentsProvider`

- [ ] All text remains readable with sufficient contrast- [ ] All text remains readable with sufficient contrast

- [ ] Interactive states (hover, focus) work correctly- [ ] Interactive states (hover, focus) work correctly

- [ ] Spacing scales correctly with `spacingUnit` override- [ ] Spacing scales correctly with `spacingUnit` override

- [ ] Borders use semantic tokens and respond to theme- [ ] Borders use semantic tokens and respond to theme

- [ ] Status badges/pills use correct Status tokens (not Sentiment)- [ ] Status badges/pills use correct Status tokens (not Sentiment)

- [ ] No hard-coded `gray-*` colors remain- [ ] No hard-coded `gray-*` colors remain

- [ ] All colors come from CSS variables (`var(--eb-...)`)- [ ] All colors come from CSS variables (`var(--eb-...)`)



## Pitfalls to Avoid## Pitfalls to Avoid



- Hard-coded `gray-*` for text, borders, or icons—always swap to semantic tokens (`foreground`, `muted-foreground`, `label-foreground`, `border`).- Hard-coded `gray-*` for text, borders, or icons—always swap to semantic tokens (`foreground`, `muted-foreground`, `label-foreground`, `border`).

- Inline styles with colors or spacing—prefer `eb-` utilities so theme overrides apply globally.- Inline styles with colors or spacing—prefer `eb-` utilities so theme overrides apply globally.

- Adding a Tailwind color without first defining the backing `--eb-*` variable in the converter.- Adding a Tailwind color without first defining the backing `--eb-*` variable in the converter.

- Forgetting hover/active/focus mappings when introducing a new token; wire state variants in Tailwind if needed.- Forgetting hover/active/focus mappings when introducing a new token; wire state variants in Tailwind if needed.



## Common Token Replacements## Common Token Replacements



### Gray Color Replacements### Gray Color Replacements



| Current (Wrong)    | Should Be                  | Token                   | Purpose              || Current (Wrong)    | Should Be                  | Token                   | Purpose              |

| ------------------ | -------------------------- | ----------------------- | -------------------- || ------------------ | -------------------------- | ----------------------- | -------------------- |

| `eb-text-gray-500` | `eb-text-muted-foreground` | `--eb-muted-foreground` | Secondary/muted text || `eb-text-gray-500` | `eb-text-muted-foreground` | `--eb-muted-foreground` | Secondary/muted text |

| `eb-text-gray-400` | `eb-text-muted-foreground` | `--eb-muted-foreground` | Very muted text      || `eb-text-gray-400` | `eb-text-muted-foreground` | `--eb-muted-foreground` | Very muted text      |

| `eb-text-gray-600` | `eb-text-foreground`       | `--eb-foreground`       | Primary text         || `eb-text-gray-600` | `eb-text-foreground`       | `--eb-foreground`       | Primary text         |

| `eb-text-gray-700` | `eb-text-foreground`       | `--eb-foreground`       | Primary text         || `eb-text-gray-700` | `eb-text-foreground`       | `--eb-foreground`       | Primary text         |

| `eb-border-gray-*` | `eb-border`                | `--eb-border`           | Borders              || `eb-border-gray-*` | `eb-border`                | `--eb-border`           | Borders              |



### Status vs Sentiment Tokens### Status vs Sentiment Tokens



**Key Principle**: Status indicators (badges, pills) should use Salt's **Status** tokens, not Sentiment tokens.**Key Principle**: Status indicators (badges, pills) should use Salt's **Status** tokens, not Sentiment tokens.



| Status Value | Badge Variant | Salt Token Used               | Purpose               || Status Value | Badge Variant | Salt Token Used               | Purpose               |

| ------------ | ------------- | ----------------------------- | --------------------- || ------------ | ------------- | ----------------------------- | --------------------- |

| `COMPLETED`  | `success`     | `statusSuccessForeground`     | Transaction completed || `COMPLETED`  | `success`     | `statusSuccessForeground`     | Transaction completed |

| `PENDING`    | `warning`     | `statusWarningForeground`     | Transaction pending   || `PENDING`    | `warning`     | `statusWarningForeground`     | Transaction pending   |

| `REJECTED`   | `destructive` | `sentimentNegativeForeground` | Transaction failed    || `REJECTED`   | `destructive` | `sentimentNegativeForeground` | Transaction failed    |

| `CANCELLED`  | `informative` | `statusInfoForeground`        | Transaction cancelled || `CANCELLED`  | `informative` | `statusInfoForeground`        | Transaction cancelled |



**Implementation Pattern**:**Implementation Pattern**:



```typescript```typescript

// ✅ CORRECT: Use semantic status variants// ✅ CORRECT: Use semantic status variants

const getStatusVariant = (status: string): 'success' | 'warning' | 'informative' | 'destructive' => {const getStatusVariant = (status: string): 'success' | 'warning' | 'informative' | 'destructive' => {

  switch (status) {  switch (status) {

    case 'COMPLETED':    case 'COMPLETED':

      return 'success'; // Uses statusSuccessForeground      return 'success'; // Uses statusSuccessForeground

    case 'PENDING':    case 'PENDING':

      return 'warning'; // Uses statusWarningForeground      return 'warning'; // Uses statusWarningForeground

    case 'CANCELLED':    case 'CANCELLED':

      return 'informative'; // Uses statusInfoForeground      return 'informative'; // Uses statusInfoForeground

    case 'REJECTED':    case 'REJECTED':

      return 'destructive'; // Uses sentimentNegativeForeground      return 'destructive'; // Uses sentimentNegativeForeground

    default:    default:

      return 'informative';      return 'informative';

  }  }

};};



// Badge component automatically maps variants to correct tokens// Badge component automatically maps variants to correct tokens

<Badge variant={getStatusVariant(status)}>{status}</Badge><Badge variant={getStatusVariant(status)}>{status}</Badge>

``````



The `Badge` component maps variants to Salt tokens:The `Badge` component maps variants to Salt tokens:



- `success` → `eb-bg-success-accent eb-text-success` (uses `statusSuccessAccentBackground` + `statusSuccessForeground`)- `success` → `eb-bg-success-accent eb-text-success` (uses `statusSuccessAccentBackground` + `statusSuccessForeground`)

- `warning` → `eb-bg-warning-accent eb-text-warning` (uses `statusWarningAccentBackground` + `statusWarningForeground`)- `warning` → `eb-bg-warning-accent eb-text-warning` (uses `statusWarningAccentBackground` + `statusWarningForeground`)

- `informative` → `eb-bg-informative-accent eb-text-informative` (uses `statusInfoAccentBackground` + `statusInfoForeground`)- `informative` → `eb-bg-informative-accent eb-text-informative` (uses `statusInfoAccentBackground` + `statusInfoForeground`)

- `destructive` → Uses sentiment tokens (appropriate for errors)- `destructive` → Uses sentiment tokens (appropriate for errors)



## If a Token Seems Missing## If a Token Seems Missing



- First see if an existing semantic token fits (content/container/actionable/editable/overlayable/navigable/separable/focused/sentiment/status/accent/layout)- First see if an existing semantic token fits (content/container/actionable/editable/overlayable/navigable/separable/focused/sentiment/status/accent/layout).

- If genuinely new:- If genuinely new:

  - Define semantic name aligned to Salt nomenclature  - Define semantic name aligned to Salt nomenclature.

  - Add default in `defaultTheme` (light/dark if applicable)  - Add default in `defaultTheme` (light/dark if applicable).

  - Map in `convert-theme-to-css-variables.ts` → `--eb-*`  - Map in `convert-theme-to-css-variables.ts` → `--eb-*`.

  - Expose in `tailwind.config.js`  - Expose in `tailwind.config.js`.

  - Add a tiny Storybook knob or theme override example to validate it  - Add a tiny Storybook knob or theme override example to validate it.



> **📖 Adding New Tokens**: See [DESIGN_TOKENS.md - Special Behaviors](../DESIGN_TOKENS.md#special-behaviors) for automatic fallback behaviors (hover states, border radius, font weights)## Reference: Salt Token Structure and Taxonomy



## Reference: Salt Token Structure and Taxonomy- Salt semantic token format and characteristics: see Salt “How to read semantic tokens” ([link](https://www.saltdesignsystem.com/salt/themes/design-tokens/how-to-read-tokens)).

- Broader Salt token taxonomy and packages: Salt DS repo ([link](https://github.com/jpmorganchase/salt-ds)).

- Salt semantic token format and characteristics: see Salt "How to read semantic tokens" ([link](https://www.saltdesignsystem.com/salt/themes/design-tokens/how-to-read-tokens))- Keep new tokens aligned to Salt characteristics (actionable, container, content, editable, overlayable, navigable, separable, focused, sentiment, status, accent). Avoid ad-hoc names or “default”; prefer explicit state/variant naming per Salt guidance.

- Broader Salt token taxonomy and packages: Salt DS repo ([link](https://github.com/jpmorganchase/salt-ds))

- Keep new tokens aligned to Salt characteristics (actionable, container, content, editable, overlayable, navigable, separable, focused, sentiment, status, accent). Avoid ad-hoc names or "default"; prefer explicit state/variant naming per Salt guidance## Token Inventory (by characteristic)



> **📖 Complete Token Inventory**: See [DESIGN_TOKENS.md](../DESIGN_TOKENS.md) for:| Characteristic                        | Tokens (theme inputs)                                                                                                                                                                                                                                                                                                 |

>| ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |

> - Comprehensive token list organized by characteristic| Content                               | `contentFontFamily`, `textHeadingFontFamily`                                                                                                                                                                                                                                                                          |

> - Default values for light and dark modes| Container                             | `containerPrimaryBackground`, `contentPrimaryForeground`, `containerCardBackground`, `containerPrimaryForeground`, `containerSecondaryBackground`, `containerSecondaryForeground`                                                                                                                                     |

> - Automatic fallback behaviors| Actionable (common)                   | `actionableFontFamily`, `actionableFontWeight`, `actionableFontSize`, `actionableLineHeight`, `actionableTextTransform`, `actionableLetterSpacing`, `actionableBorderRadius`, `actionableShiftOnActive`                                                                                                               |

> - Customization examples and best practices| Actionable Accented Bold              | `actionableAccentedBoldBackground`, `actionableAccentedBoldBackgroundHover`, `actionableAccentedBoldBackgroundActive`, `actionableAccentedBoldForeground`, `actionableAccentedBoldForegroundHover`, `actionableAccentedBoldForegroundActive`, `actionableAccentedBoldBorderWidth`, `actionableAccentedBoldFontWeight` |

> - Migration guide from legacy tokens| Actionable Subtle                     | `actionableSubtleBackground`, `actionableSubtleBackgroundHover`, `actionableSubtleBackgroundActive`, `actionableSubtleForeground`, `actionableSubtleForegroundHover`, `actionableSubtleForegroundActive`, `actionableSubtleBorderWidth`, `actionableSubtleFontWeight`                                                 |

| Actionable Negative Bold              | `actionableNegativeBoldBackground`, `actionableNegativeBoldBackgroundHover`, `actionableNegativeBoldBackgroundActive`, `actionableNegativeBoldForeground`, `actionableNegativeBoldForegroundHover`, `actionableNegativeBoldForegroundActive`, `actionableNegativeBoldBorderWidth`, `actionableNegativeBoldFontWeight` |

## Design Token Utility Reference| Editable (inputs/forms)               | `editableBackground`, `editableBorderColor`, `editableBorderRadius`, `editableLabelFontSize`, `editableLabelLineHeight`, `editableLabelFontWeight`, `editableLabelForeground`                                                                                                                                         |

| Overlayable                           | `overlayableBackground`, `overlayableForeground`, `overlayableZIndex`                                                                                                                                                                                                                                                 |

Quick reference for common Tailwind utilities and their underlying CSS variables. For complete token documentation, see [DESIGN_TOKENS.md](../DESIGN_TOKENS.md).| Navigable                             | `navigableBackground`, `navigableForeground`, `navigableAccentBackground`, `navigableAccentForeground`                                                                                                                                                                                                                |

| Separable                             | `separableBorderColor`, `separableBorderRadius`                                                                                                                                                                                                                                                                       |

### Text Color Tokens| Focused                               | `focusedRingColor`                                                                                                                                                                                                                                                                                                    |

| Sentiment – Negative (non-actionable) | `sentimentNegativeAccentBackground` (for alerts, error messages)                                                                                                                                                                                                                                                      |

| Token Utility              | CSS Variable                  | Purpose                || Sentiment – Positive                  | `sentimentPositiveForeground`, `sentimentPositiveAccentBackground`                                                                                                                                                                                                                                                    |

| -------------------------- | ----------------------------- | ---------------------- || Sentiment – Caution                   | `sentimentCautionForeground`, `sentimentCautionAccentBackground`                                                                                                                                                                                                                                                      |

| `eb-text-foreground`       | `--eb-foreground`             | Primary text color     || Status (Info/Success/Warning)         | `statusInfoForeground`, `statusInfoAccentBackground`, `statusSuccessForeground`_, `statusSuccessAccentBackground`_, `statusWarningForeground`_, `statusWarningAccentBackground`_ (\*fallback to sentiment positive/caution when unset)                                                                                |

| `eb-text-muted-foreground` | `--eb-muted-foreground`       | Secondary/muted text   || Accent / Metric                       | `accentBackground`, `contentAccentForeground`, `accentMetricBackground`                                                                                                                                                                                                                                               |

| `eb-text-destructive`      | `--eb-destructive-foreground` | Error/destructive text || Layout / Spacing                      | `spacingUnit`                                                                                                                                                                                                                                                                                                         |

| `eb-text-success`          | `--eb-success`                | Success text           || Legacy/Compat                         | `alertForegroundColor` (maps to `--eb-alert-foreground`)                                                                                                                                                                                                                                                              |

| `eb-text-warning`          | `--eb-warning`                | Warning text           |

| `eb-text-informative`      | `--eb-informative`            | Info text              |Not in our taxonomy (Salt-only today): `Category`, `Selectable`, `Target`, separate `Text` characteristic. Add only when use-cases emerge.



### Background Color Tokens## Token Coverage vs Salt (per token)



| Token Utility              | CSS Variable              | Purpose                     || Token                                  | Characteristic                        | In EB?                       | Salt characteristic exists?                          | Notes                                      |

| -------------------------- | ------------------------- | --------------------------- || -------------------------------------- | ------------------------------------- | ---------------------------- | ---------------------------------------------------- | ------------------------------------------ |

| `eb-bg-background`         | `--eb-background`         | Main background             || contentFontFamily                      | Content                               | Yes                          | Yes (Content/Text)                                   |                                            |

| `eb-bg-card`               | `--eb-card`               | Card/container background   || textHeadingFontFamily                  | Content                               | Yes                          | Yes (Content/Text)                                   |                                            |

| `eb-bg-muted`              | `--eb-muted`              | Muted/accent background     || containerPrimaryBackground             | Container                             | Yes                          | Yes                                                  |                                            |

| `eb-bg-primary`            | `--eb-primary`            | Primary action background   || contentPrimaryForeground               | Container                             | Yes                          | Yes                                                  |                                            |

| `eb-bg-secondary`          | `--eb-secondary`          | Secondary action background || containerCardBackground                | Container                             | Yes                          | Extension (not in Salt)                              |                                            |

| `eb-bg-success-accent`     | `--eb-success-accent`     | Success badge background    || containerPrimaryForeground             | Container                             | Yes                          | Yes                                                  |                                            |

| `eb-bg-warning-accent`     | `--eb-warning-accent`     | Warning badge background    || containerSecondaryBackground           | Container                             | Yes                          | Yes                                                  |                                            |

| `eb-bg-informative-accent` | `--eb-informative-accent` | Info badge background       || containerSecondaryForeground           | Container                             | Yes                          | Yes                                                  |                                            |

| `eb-bg-popover`            | `--eb-popover`            | Dialog/popover background   || actionableFontFamily                   | Actionable                            | Yes                          | Yes                                                  |                                            |

| actionableFontWeight                   | Actionable                            | Yes                          | Yes                                                  |                                            |

### Border Tokens| actionableFontSize                     | Actionable                            | Yes                          | Yes                                                  |                                            |

| actionableLineHeight                   | Actionable                            | Yes                          | Yes                                                  |                                            |

| Token Utility       | CSS Variable         | Purpose                 || actionableTextTransform                | Actionable                            | Yes                          | Yes                                                  |                                            |

| ------------------- | -------------------- | ----------------------- || actionableLetterSpacing                | Actionable                            | Yes                          | Yes                                                  |                                            |

| `eb-border`         | `--eb-border`        | Default border color    || actionableBorderRadius                 | Actionable                            | Yes                          | Yes                                                  |                                            |

| `eb-border-border`  | `--eb-border`        | Border color (alias)    || actionableShiftOnActive                | Actionable                            | Yes                          | Yes                                                  |                                            |

| `eb-rounded-*`      | `--eb-radius`        | Border radius utilities || actionableAccentedBoldBackground       | Actionable (Accented Bold)            | Yes                          | Yes                                                  |                                            |

| `eb-rounded-button` | `--eb-button-radius` | Button border radius    || actionableAccentedBoldBackgroundHover  | Actionable (Accented Bold)            | Yes                          | Yes (state)                                          |                                            |

| `eb-rounded-input`  | `--eb-input-radius`  | Input border radius     || actionableAccentedBoldBackgroundActive | Actionable (Accented Bold)            | Yes                          | Yes (state)                                          |                                            |

| actionableAccentedBoldForeground       | Actionable (Accented Bold)            | Yes                          | Yes                                                  |                                            |

### Spacing Tokens| actionableAccentedBoldForegroundHover  | Actionable (Accented Bold)            | Yes                          | Yes (state)                                          |                                            |

| actionableAccentedBoldForegroundActive | Actionable (Accented Bold)            | Yes                          | Yes (state)                                          |                                            |

| Token Utility      | CSS Variable        | Purpose                           || actionableAccentedBoldBorderWidth      | Actionable (Accented Bold)            | Yes                          | Yes (border property)                                |                                            |

| ------------------ | ------------------- | --------------------------------- || actionableAccentedBoldFontWeight       | Actionable (Accented Bold)            | Yes                          | Yes                                                  |                                            |

| `eb-p-*`, `eb-m-*` | `--eb-spacing-unit` | Padding/margin (scales with unit) || actionableSubtleBackground             | Actionable (Subtle)                   | Yes                          | Yes                                                  |                                            |

| `eb-gap-*`         | `--eb-spacing-unit` | Gap spacing                       || actionableSubtleBackgroundHover        | Actionable (Subtle)                   | Yes                          | Yes (state)                                          |                                            |

| actionableSubtleBackgroundActive       | Actionable (Subtle)                   | Yes                          | Yes (state)                                          |                                            |

### Typography Tokens| actionableSubtleForeground             | Actionable (Subtle)                   | Yes                          | Yes                                                  |                                            |

| actionableSubtleForegroundHover        | Actionable (Subtle)                   | Yes                          | Yes (state)                                          |                                            |

| Token Utility                                                    | CSS Variable       | Purpose        || actionableSubtleForegroundActive       | Actionable (Subtle)                   | Yes                          | Yes (state)                                          |                                            |

| ---------------------------------------------------------------- | ------------------ | -------------- || actionableSubtleBorderWidth            | Actionable (Subtle)                   | Yes                          | Yes (border property)                                |                                            |

| `eb-font-mono`                                                   | `--eb-font-family` | Monospace font || actionableSubtleFontWeight             | Actionable (Subtle)                   | Yes                          | Yes                                                  |                                            |

| Font sizes use Tailwind scale (xs, sm, base, lg, etc.)           |                    |                || actionableNegativeBoldBackground       | Actionable (Negative Bold)            | Yes                          | Yes                                                  |                                            |

| Font weights use Tailwind scale (normal, medium, semibold, bold) |                    |                || actionableNegativeBoldBackgroundHover  | Actionable (Negative Bold)            | Yes                          | Yes (state)                                          |                                            |

| actionableNegativeBoldBackgroundActive | Actionable (Negative Bold)            | Yes                          | Yes (state)                                          |                                            |
| actionableNegativeBoldForeground       | Actionable (Negative Bold)            | Yes                          | Yes                                                  |                                            |
| actionableNegativeBoldForegroundHover  | Actionable (Negative Bold)            | Yes                          | Yes (state)                                          |                                            |
| actionableNegativeBoldForegroundActive | Actionable (Negative Bold)            | Yes                          | Yes (state)                                          |                                            |
| actionableNegativeBoldBorderWidth      | Actionable (Negative Bold)            | Yes                          | Yes (border property)                                |                                            |
| actionableNegativeBoldFontWeight       | Actionable (Negative Bold)            | Yes                          | Yes                                                  |                                            |
| editableBackground                     | Editable                              | Yes                          | Yes                                                  |                                            |
| editableBorderColor                    | Editable                              | Yes                          | Yes                                                  |                                            |
| editableBorderRadius                   | Editable                              | Yes                          | Yes                                                  |                                            |
| editableLabelFontSize                  | Editable                              | Yes                          | Yes                                                  |                                            |
| editableLabelLineHeight                | Editable                              | Yes                          | Yes                                                  |                                            |
| editableLabelFontWeight                | Editable                              | Yes                          | Yes                                                  |                                            |
| editableLabelForeground                | Editable                              | Yes                          | Yes                                                  |                                            |
| overlayableBackground                  | Overlayable                           | Yes                          | Yes                                                  |                                            |
| overlayableForeground                  | Overlayable                           | Yes                          | Yes                                                  |                                            |
| overlayableZIndex                      | Overlayable                           | Yes                          | Yes (property)                                       |                                            |
| navigableBackground                    | Navigable                             | Yes                          | Yes                                                  |                                            |
| navigableForeground                    | Navigable                             | Yes                          | Yes                                                  |                                            |
| navigableAccentBackground              | Navigable                             | Yes                          | Yes (accent variant)                                 |                                            |
| navigableAccentForeground              | Navigable                             | Yes                          | Yes (accent variant)                                 |                                            |
| separableBorderColor                   | Separable                             | Yes                          | Yes                                                  |                                            |
| separableBorderRadius                  | Separable                             | Yes                          | Yes                                                  |                                            |
| focusedRingColor                       | Focused                               | Yes                          | Yes                                                  |                                            |
| sentimentNegativeAccentBackground      | Sentiment (Negative - non-actionable) | Yes                          | Yes (accent)                                         | For alerts, error messages                 |
| sentimentPositiveForeground            | Sentiment (Positive)                  | Yes                          | Yes                                                  |                                            |
| sentimentPositiveAccentBackground      | Sentiment (Positive)                  | Yes                          | Yes (accent)                                         |                                            |
| sentimentCautionForeground             | Sentiment (Caution)                   | Yes                          | Yes                                                  |                                            |
| sentimentCautionAccentBackground       | Sentiment (Caution)                   | Yes                          | Yes (accent)                                         |                                            |
| statusInfoForeground                   | Status (Info)                         | Yes                          | Yes                                                  |                                            |
| statusInfoAccentBackground             | Status (Info)                         | Yes                          | Yes (accent)                                         |                                            |
| statusSuccessForeground                | Status (Success)                      | Yes (fallback via sentiment) | Yes                                                  | Falls back to positive if unset            |
| statusSuccessAccentBackground          | Status (Success)                      | Yes (fallback via sentiment) | Yes                                                  | Falls back to positive if unset            |
| statusWarningForeground                | Status (Warning)                      | Yes (fallback via sentiment) | Yes                                                  | Falls back to caution if unset             |
| statusWarningAccentBackground          | Status (Warning)                      | Yes (fallback via sentiment) | Yes                                                  | Falls back to caution if unset             |
| accentBackground                       | Accent                                | Yes                          | Salt has accent patterns                             |                                            |
| contentAccentForeground                | Accent                                | Yes                          | Salt has accent patterns                             |                                            |
| accentMetricBackground                 | Accent/Metric                         | Yes                          | Salt supports metric accents                         |                                            |
| spacingUnit                            | Layout/Spacing                        | Yes                          | Salt uses density/size scales (not a characteristic) | Our layout token                           |
| alertForegroundColor                   | Legacy/Compat                         | Yes                          | Not a Salt characteristic                            | Back-compat only                           |
| Category tokens (Salt)                 | Category                              | No                           | Yes                                                  | Salt-only; not implemented                 |
| Selectable tokens (Salt)               | Selectable                            | No                           | Yes                                                  | Salt-only; not implemented                 |
| Target tokens (Salt)                   | Target                                | No                           | Yes                                                  | Salt-only; not implemented                 |
| Text characteristic (Salt separate)    | Text                                  | No (folded into Content)     | Yes                                                  | Salt separates Text; we keep under Content |

Salt characteristics not present in EB tokens: `Category`, `Selectable`, `Target`, separate `Text` characteristic (we fold into Content). Add only when needed.

## Design Token Utility Reference

Quick reference for common Tailwind utilities and their underlying CSS variables:

### Text Color Tokens

| Token Utility              | CSS Variable                  | Purpose                |
| -------------------------- | ----------------------------- | ---------------------- |
| `eb-text-foreground`       | `--eb-foreground`             | Primary text color     |
| `eb-text-muted-foreground` | `--eb-muted-foreground`       | Secondary/muted text   |
| `eb-text-destructive`      | `--eb-destructive-foreground` | Error/destructive text |
| `eb-text-success`          | `--eb-success`                | Success text           |
| `eb-text-warning`          | `--eb-warning`                | Warning text           |
| `eb-text-informative`      | `--eb-informative`            | Info text              |

### Background Color Tokens

| Token Utility              | CSS Variable              | Purpose                     |
| -------------------------- | ------------------------- | --------------------------- |
| `eb-bg-background`         | `--eb-background`         | Main background             |
| `eb-bg-card`               | `--eb-card`               | Card/container background   |
| `eb-bg-muted`              | `--eb-muted`              | Muted/accent background     |
| `eb-bg-primary`            | `--eb-primary`            | Primary action background   |
| `eb-bg-secondary`          | `--eb-secondary`          | Secondary action background |
| `eb-bg-success-accent`     | `--eb-success-accent`     | Success badge background    |
| `eb-bg-warning-accent`     | `--eb-warning-accent`     | Warning badge background    |
| `eb-bg-informative-accent` | `--eb-informative-accent` | Info badge background       |
| `eb-bg-popover`            | `--eb-popover`            | Dialog/popover background   |

### Border Tokens

| Token Utility       | CSS Variable         | Purpose                 |
| ------------------- | -------------------- | ----------------------- |
| `eb-border`         | `--eb-border`        | Default border color    |
| `eb-border-border`  | `--eb-border`        | Border color (alias)    |
| `eb-rounded-*`      | `--eb-radius`        | Border radius utilities |
| `eb-rounded-button` | `--eb-button-radius` | Button border radius    |
| `eb-rounded-input`  | `--eb-input-radius`  | Input border radius     |

### Spacing Tokens

| Token Utility      | CSS Variable        | Purpose                           |
| ------------------ | ------------------- | --------------------------------- |
| `eb-p-*`, `eb-m-*` | `--eb-spacing-unit` | Padding/margin (scales with unit) |
| `eb-gap-*`         | `--eb-spacing-unit` | Gap spacing                       |

### Typography Tokens

| Token Utility                                                    | CSS Variable       | Purpose        |
| ---------------------------------------------------------------- | ------------------ | -------------- |
| `eb-font-mono`                                                   | `--eb-font-family` | Monospace font |
| Font sizes use Tailwind scale (xs, sm, base, lg, etc.)           |                    |                |
| Font weights use Tailwind scale (normal, medium, semibold, bold) |                    |                |
