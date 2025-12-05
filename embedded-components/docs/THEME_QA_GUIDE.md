# Theme QA and Design Token Alignment

Use this checklist when validating component theming and when adding or refining design tokens. It assumes the existing token pipeline: `EBComponentsProvider` → `convert-theme-to-css-variables.ts` → `tailwind.config.js` → `eb-` utilities.

## Quick QA Checklist (per component)

- Wrap in `EBComponentsProvider` and toggle `theme.colorScheme` (`light`, `dark`, `system`); verify surfaces, text, borders, focus rings, overlays, and sentiment/status colors react correctly.
- Override a few tokens at runtime (e.g., `actionablePrimaryBackground`, `containerBackground`, `separableBorderColor`, `contentFontFamily`) and confirm the component updates without local overrides.
- Inspect DOM: ensure classes are namespaced (`eb-...`) and colors come from CSS variables (`var(--eb-...)`), not hard-coded hex/HSL.
- Check interactive states: hover/active/focus use semantic variants (`primary-hover`, `destructive-hover`, `ring`), not custom colors.
- Verify typography tokens: headings/body (`font-family` via `--eb-font-family`/`--eb-header-font-family`), button and label fonts via tokenized utilities (`eb-font-button`, `eb-text-label`).
- Borders and radii: should come from `separable`/`button`/`input` tokens (`eb-border`, `eb-rounded`, `eb-rounded-button`, `eb-rounded-input`).
- Spacing: confirm padding/margin uses tokenized spacing (`eb-p-*`, `eb-m-*`) which map to `--eb-spacing-unit`.

## When You Add or Refine a Token

1. **Add/rename in theme types** (if new): update `EBTheme`/`EBThemeVariables` and `defaultTheme` with a sensible default.
2. **Map to CSS variables**: wire the token in `convert-theme-to-css-variables.ts`, ensuring legacy fallback if relevant, and emit a `--eb-*` variable.
3. **Expose in Tailwind**: extend `tailwind.config.js` so the new `--eb-*` variable is reachable via an `eb-` utility (color, spacing, radius, font, shadow, z-index, etc.).
4. **Consume via utilities**: update components to use the `eb-` utility instead of inline styles or raw colors. Do not use hex/HSL directly.
5. **QA**: override the token through `EBComponentsProvider` and confirm live changes in Storybook (light/dark/system).

## Hotspots to Regress-Check

- **Borders**: use `eb-border` and tokenized shadows (`shadow-border-primary`/`secondary`/`destructive`) instead of `border-gray-*`.
- **Text**: use `eb-text-foreground` or `eb-text-muted-foreground` for secondary content; avoid `text-gray-*`. For labels, prefer `eb-text-label` utilities if present.
- **Buttons/links**: variants must use `primary`/`secondary`/`destructive` tokens; hover/active states should not introduce ad-hoc colors.
- **Inputs/forms**: backgrounds/borders/radii via `editable` tokens (`eb-bg-input`, `eb-border-input`, `eb-rounded-input`); labels via label font/weight tokens.
- **Overlays/popovers/dialogs**: `eb-bg-popover`, `eb-text-popover-foreground`, `eb-z-overlay`.
- **Navigation**: `eb-bg-sidebar`, `eb-text-sidebar-foreground`, `eb-bg-sidebar-accent`.
- **Status/sentiment**: use `informative`, `warning`, `success`, `destructive` token utilities instead of arbitrary palette choices.
- **Spacing**: rely on tokenized spacing scale; avoid pixel literals unless necessary for layout math.

## Minimal Storybook Token Smoke Test

- Light mode override: set `actionablePrimaryBackground`, `containerBackground`, `contentPrimaryForeground`, `separableBorderColor`.
- Dark mode override: repeat with darker values and ensure text/background meet contrast.
- Interaction: hover buttons/links, focus inputs to see `--eb-ring`, open popovers/dialogs to verify overlay tokens and z-index.

## Pitfalls to Avoid

- Hard-coded `gray-*` for text, borders, or icons—always swap to semantic tokens (`foreground`, `muted-foreground`, `label-foreground`, `border`).
- Inline styles with colors or spacing—prefer `eb-` utilities so theme overrides apply globally.
- Adding a Tailwind color without first defining the backing `--eb-*` variable in the converter.
- Forgetting hover/active/focus mappings when introducing a new token; wire state variants in Tailwind if needed.

## If a Token Seems Missing

- First see if an existing semantic token fits (content/container/actionable/editable/overlayable/navigable/separable/focused/sentiment/status/accent/layout).
- If genuinely new:
  - Define semantic name aligned to Salt nomenclature.
  - Add default in `defaultTheme` (light/dark if applicable).
  - Map in `convert-theme-to-css-variables.ts` → `--eb-*`.
  - Expose in `tailwind.config.js`.
  - Add a tiny Storybook knob or theme override example to validate it.

## Reference: Salt Token Structure and Taxonomy

- Salt semantic token format and characteristics: see Salt “How to read semantic tokens” ([link](https://www.saltdesignsystem.com/salt/themes/design-tokens/how-to-read-tokens)).
- Broader Salt token taxonomy and packages: Salt DS repo ([link](https://github.com/jpmorganchase/salt-ds)).
- Keep new tokens aligned to Salt characteristics (actionable, container, content, editable, overlayable, navigable, separable, focused, sentiment, status, accent). Avoid ad-hoc names or “default”; prefer explicit state/variant naming per Salt guidance.

## Token Inventory (by characteristic)

| Characteristic                | Tokens (theme inputs)                                                                                                                                                                                                                                                                                              |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Content                       | `contentFontFamily`, `contentHeaderFontFamily`                                                                                                                                                                                                                                                                     |
| Container                     | `containerBackground`, `contentPrimaryForeground`, `containerPrimaryBackground`, `containerPrimaryForeground`, `containerSecondaryBackground`, `containerSecondaryForeground`                                                                                                                                      |
| Actionable (common)           | `actionableFontFamily`, `actionableFontWeight`, `actionableFontSize`, `actionableLineHeight`, `actionableTextTransform`, `actionableLetterSpacing`, `actionableBorderRadius`, `actionableShiftOnActive`                                                                                                            |
| Actionable Primary            | `actionablePrimaryBackground`, `actionablePrimaryBackgroundHover`, `actionablePrimaryBackgroundActive`, `actionablePrimaryForeground`, `actionablePrimaryForegroundHover`, `actionablePrimaryForegroundActive`, `actionablePrimaryBorderWidth`, `actionablePrimaryFontWeight`                                      |
| Actionable Secondary          | `actionableSecondaryBackground`, `actionableSecondaryBackgroundHover`, `actionableSecondaryBackgroundActive`, `actionableSecondaryForeground`, `actionableSecondaryForegroundHover`, `actionableSecondaryForegroundActive`, `actionableSecondaryBorderWidth`, `actionableSecondaryFontWeight`                      |
| Editable (inputs/forms)       | `editableBackground`, `editableBorderColor`, `editableBorderRadius`, `editableLabelFontSize`, `editableLabelLineHeight`, `editableLabelFontWeight`, `editableLabelForeground`                                                                                                                                      |
| Overlayable                   | `overlayableBackground`, `overlayableForeground`, `overlayableZIndex`                                                                                                                                                                                                                                              |
| Navigable                     | `navigableBackground`, `navigableForeground`, `navigableAccentBackground`, `navigableAccentForeground`                                                                                                                                                                                                             |
| Separable                     | `separableBorderColor`, `separableBorderRadius`                                                                                                                                                                                                                                                                    |
| Focused                       | `focusedRingColor`                                                                                                                                                                                                                                                                                                 |
| Sentiment – Negative          | `sentimentNegativeBackground`, `sentimentNegativeBackgroundHover`, `sentimentNegativeBackgroundActive`, `sentimentNegativeForeground`, `sentimentNegativeForegroundHover`, `sentimentNegativeForegroundActive`, `sentimentNegativeAccentBackground`, `sentimentNegativeBorderWidth`, `sentimentNegativeFontWeight` |
| Sentiment – Positive          | `sentimentPositiveForeground`, `sentimentPositiveAccentBackground`                                                                                                                                                                                                                                                 |
| Sentiment – Caution           | `sentimentCautionForeground`, `sentimentCautionAccentBackground`                                                                                                                                                                                                                                                   |
| Status (Info/Success/Warning) | `statusInfoForeground`, `statusInfoAccentBackground`, `statusSuccessForeground`_, `statusSuccessAccentBackground`_, `statusWarningForeground`_, `statusWarningAccentBackground`_ (\*fallback to sentiment positive/caution when unset)                                                                             |
| Accent / Metric               | `accentBackground`, `accentForeground`, `accentMetricBackground`                                                                                                                                                                                                                                                   |
| Layout / Spacing              | `spacingUnit`                                                                                                                                                                                                                                                                                                      |
| Legacy/Compat                 | `alertForegroundColor` (maps to `--eb-alert-foreground`)                                                                                                                                                                                                                                                           |

Not in our taxonomy (Salt-only today): `Category`, `Selectable`, `Target`, separate `Text` characteristic. Add only when use-cases emerge.

## Token Coverage vs Salt (per token)

> **Note**: Salt token names shown without `--salt-` prefix. Our tokens use camelCase; Salt uses kebab-case. This table shows all Salt tokens individually.

### Accent Characteristic

| Token                     | In EB? | Salt Token                  | Notes                                     |
| ------------------------- | ------ | --------------------------- | ----------------------------------------- |
| accentBackground          | Yes    | accent-background           |                                           |
| accentBackgroundDisabled  | No     | accent-background-disabled  | Salt-only                                 |
| accentBorderColor         | No     | accent-borderColor          | Salt-only                                 |
| accentBorderColorDisabled | No     | accent-borderColor-disabled | Salt-only                                 |
| accentForeground          | Yes    | (not in accent.css)         | We have this; Salt may handle via palette |
| accentMetricBackground    | Yes    | (not in accent.css)         | Our metric accent token                   |

### Actionable Characteristic

| Token                                     | In EB? | Salt Token                                    | Notes                                         |
| ----------------------------------------- | ------ | --------------------------------------------- | --------------------------------------------- |
| actionableFontFamily                      | Yes    | (typography handled separately)               |                                               |
| actionableFontWeight                      | Yes    | (typography handled separately)               |                                               |
| actionableFontSize                        | Yes    | (typography handled separately)               |                                               |
| actionableLineHeight                      | Yes    | (typography handled separately)               |                                               |
| actionableTextTransform                   | Yes    | (typography handled separately)               |                                               |
| actionableLetterSpacing                   | Yes    | (typography handled separately)               |                                               |
| actionableBorderRadius                    | Yes    | (typography handled separately)               |                                               |
| actionableShiftOnActive                   | Yes    | (custom behavior)                             |                                               |
| actionablePrimaryBackground               | Yes    | actionable-bold-background                    | Maps to Salt's "bold" (solid) variant         |
| actionablePrimaryBackgroundHover          | Yes    | actionable-bold-background-hover              |                                               |
| actionablePrimaryBackgroundActive         | Yes    | actionable-bold-background-active             |                                               |
| actionablePrimaryForeground               | Yes    | actionable-bold-foreground                    |                                               |
| actionablePrimaryForegroundHover          | Yes    | actionable-bold-foreground-hover              |                                               |
| actionablePrimaryForegroundActive         | Yes    | actionable-bold-foreground-active             |                                               |
| actionablePrimaryBorderWidth              | Yes    | actionable-bold-borderColor                   | We use borderWidth; Salt uses borderColor     |
| actionablePrimaryFontWeight               | Yes    | (typography handled separately)               |                                               |
| actionableSecondaryBackground             | Yes    | actionable-subtle-background                  | Maps to Salt's "subtle" (transparent) variant |
| actionableSecondaryBackgroundHover        | Yes    | actionable-subtle-background-hover            |                                               |
| actionableSecondaryBackgroundActive       | Yes    | actionable-subtle-background-active           |                                               |
| actionableSecondaryForeground             | Yes    | actionable-subtle-foreground                  |                                               |
| actionableSecondaryForegroundHover        | Yes    | actionable-subtle-foreground-hover            |                                               |
| actionableSecondaryForegroundActive       | Yes    | actionable-subtle-foreground-active           |                                               |
| actionableSecondaryBorderWidth            | Yes    | actionable-subtle-borderColor                 | We use borderWidth; Salt uses borderColor     |
| actionableSecondaryFontWeight             | Yes    | (typography handled separately)               |                                               |
| actionableAccentedBoldBackground          | No     | actionable-accented-bold-background           | Salt-only variant                             |
| actionableAccentedBoldBackgroundActive    | No     | actionable-accented-bold-background-active    | Salt-only                                     |
| actionableAccentedBoldBackgroundHover     | No     | actionable-accented-bold-background-hover     | Salt-only                                     |
| actionableAccentedBoldBorderColor         | No     | actionable-accented-bold-borderColor          | Salt-only                                     |
| actionableAccentedBoldBorderColorActive   | No     | actionable-accented-bold-borderColor-active   | Salt-only                                     |
| actionableAccentedBoldBorderColorHover    | No     | actionable-accented-bold-borderColor-hover    | Salt-only                                     |
| actionableAccentedBoldForeground          | No     | actionable-accented-bold-foreground           | Salt-only                                     |
| actionableAccentedBoldForegroundActive    | No     | actionable-accented-bold-foreground-active    | Salt-only                                     |
| actionableAccentedBoldForegroundHover     | No     | actionable-accented-bold-foreground-hover     | Salt-only                                     |
| actionableAccentedBackground              | No     | actionable-accented-background                | Salt-only (bordered variant)                  |
| actionableAccentedBackgroundActive        | No     | actionable-accented-background-active         | Salt-only                                     |
| actionableAccentedBackgroundHover         | No     | actionable-accented-background-hover          | Salt-only                                     |
| actionableAccentedBackgroundSelected      | No     | actionable-accented-background-selected       | Salt-only                                     |
| actionableAccentedBorderColor             | No     | actionable-accented-borderColor               | Salt-only                                     |
| actionableAccentedBorderColorActive       | No     | actionable-accented-borderColor-active        | Salt-only                                     |
| actionableAccentedBorderColorHover        | No     | actionable-accented-borderColor-hover         | Salt-only                                     |
| actionableAccentedBorderColorSelected     | No     | actionable-accented-borderColor-selected      | Salt-only                                     |
| actionableAccentedForeground              | No     | actionable-accented-foreground                | Salt-only                                     |
| actionableAccentedForegroundActive        | No     | actionable-accented-foreground-active         | Salt-only                                     |
| actionableAccentedForegroundHover         | No     | actionable-accented-foreground-hover          | Salt-only                                     |
| actionableAccentedForegroundSelected      | No     | actionable-accented-foreground-selected       | Salt-only                                     |
| actionableAccentedSubtleBackground        | No     | actionable-accented-subtle-background         | Salt-only (transparent variant)               |
| actionableAccentedSubtleBackgroundActive  | No     | actionable-accented-subtle-background-active  | Salt-only                                     |
| actionableAccentedSubtleBackgroundHover   | No     | actionable-accented-subtle-background-hover   | Salt-only                                     |
| actionableAccentedSubtleBorderColor       | No     | actionable-accented-subtle-borderColor        | Salt-only                                     |
| actionableAccentedSubtleBorderColorActive | No     | actionable-accented-subtle-borderColor-active | Salt-only                                     |
| actionableAccentedSubtleBorderColorHover  | No     | actionable-accented-subtle-borderColor-hover  | Salt-only                                     |
| actionableAccentedSubtleForeground        | No     | actionable-accented-subtle-foreground         | Salt-only                                     |
| actionableAccentedSubtleForegroundActive  | No     | actionable-accented-subtle-foreground-active  | Salt-only                                     |
| actionableAccentedSubtleForegroundHover   | No     | actionable-accented-subtle-foreground-hover   | Salt-only                                     |
| actionableBackground                      | No     | actionable-background                         | Salt-only (neutral bordered variant)          |
| actionableBackgroundActive                | No     | actionable-background-active                  | Salt-only                                     |
| actionableBackgroundHover                 | No     | actionable-background-hover                   | Salt-only                                     |
| actionableBackgroundSelected              | No     | actionable-background-selected                | Salt-only                                     |
| actionableBorderColor                     | No     | actionable-borderColor                        | Salt-only                                     |
| actionableBorderColorActive               | No     | actionable-borderColor-active                 | Salt-only                                     |
| actionableBorderColorHover                | No     | actionable-borderColor-hover                  | Salt-only                                     |
| actionableBorderColorSelected             | No     | actionable-borderColor-selected               | Salt-only                                     |
| actionableForeground                      | No     | actionable-foreground                         | Salt-only                                     |
| actionableForegroundActive                | No     | actionable-foreground-active                  | Salt-only                                     |
| actionableForegroundHover                 | No     | actionable-foreground-hover                   | Salt-only                                     |
| actionableForegroundSelected              | No     | actionable-foreground-selected                | Salt-only                                     |
| actionableNegativeBoldBackground          | No     | actionable-negative-bold-background           | Salt-only                                     |
| actionableNegativeBoldBackgroundActive    | No     | actionable-negative-bold-background-active    | Salt-only                                     |
| actionableNegativeBoldBackgroundHover     | No     | actionable-negative-bold-background-hover     | Salt-only                                     |
| actionableNegativeBoldBorderColor         | No     | actionable-negative-bold-borderColor          | Salt-only                                     |
| actionableNegativeBoldBorderColorActive   | No     | actionable-negative-bold-borderColor-active   | Salt-only                                     |
| actionableNegativeBoldBorderColorHover    | No     | actionable-negative-bold-borderColor-hover    | Salt-only                                     |
| actionableNegativeBoldForeground          | No     | actionable-negative-bold-foreground           | Salt-only                                     |
| actionableNegativeBoldForegroundActive    | No     | actionable-negative-bold-foreground-active    | Salt-only                                     |
| actionableNegativeBoldForegroundHover     | No     | actionable-negative-bold-foreground-hover     | Salt-only                                     |
| actionableNegativeBackground              | No     | actionable-negative-background                | Salt-only                                     |
| actionableNegativeBackgroundActive        | No     | actionable-negative-background-active         | Salt-only                                     |
| actionableNegativeBackgroundHover         | No     | actionable-negative-background-hover          | Salt-only                                     |
| actionableNegativeBackgroundSelected      | No     | actionable-negative-background-selected       | Salt-only                                     |
| actionableNegativeBorderColor             | No     | actionable-negative-borderColor               | Salt-only                                     |
| actionableNegativeBorderColorActive       | No     | actionable-negative-borderColor-active        | Salt-only                                     |
| actionableNegativeBorderColorHover        | No     | actionable-negative-borderColor-hover         | Salt-only                                     |
| actionableNegativeBorderColorSelected     | No     | actionable-negative-borderColor-selected      | Salt-only                                     |
| actionableNegativeForeground              | No     | actionable-negative-foreground                | Salt-only                                     |
| actionableNegativeForegroundActive        | No     | actionable-negative-foreground-active         | Salt-only                                     |
| actionableNegativeForegroundHover         | No     | actionable-negative-foreground-hover          | Salt-only                                     |
| actionableNegativeForegroundSelected      | No     | actionable-negative-foreground-selected       | Salt-only                                     |
| actionableNegativeSubtleBackground        | No     | actionable-negative-subtle-background         | Salt-only                                     |
| actionableNegativeSubtleBackgroundActive  | No     | actionable-negative-subtle-background-active  | Salt-only                                     |
| actionableNegativeSubtleBackgroundHover   | No     | actionable-negative-subtle-background-hover   | Salt-only                                     |
| actionableNegativeSubtleBorderColor       | No     | actionable-negative-subtle-borderColor        | Salt-only                                     |
| actionableNegativeSubtleBorderColorActive | No     | actionable-negative-subtle-borderColor-active | Salt-only                                     |
| actionableNegativeSubtleBorderColorHover  | No     | actionable-negative-subtle-borderColor-hover  | Salt-only                                     |
| actionableNegativeSubtleForeground        | No     | actionable-negative-subtle-foreground         | Salt-only                                     |
| actionableNegativeSubtleForegroundActive  | No     | actionable-negative-subtle-foreground-active  | Salt-only                                     |
| actionableNegativeSubtleForegroundHover   | No     | actionable-negative-subtle-foreground-hover   | Salt-only                                     |
| actionablePositiveBoldBackground          | No     | actionable-positive-bold-background           | Salt-only                                     |
| actionablePositiveBoldBackgroundActive    | No     | actionable-positive-bold-background-active    | Salt-only                                     |
| actionablePositiveBoldBackgroundHover     | No     | actionable-positive-bold-background-hover     | Salt-only                                     |
| actionablePositiveBoldBorderColor         | No     | actionable-positive-bold-borderColor          | Salt-only                                     |
| actionablePositiveBoldBorderColorActive   | No     | actionable-positive-bold-borderColor-active   | Salt-only                                     |
| actionablePositiveBoldBorderColorHover    | No     | actionable-positive-bold-borderColor-hover    | Salt-only                                     |
| actionablePositiveBoldForeground          | No     | actionable-positive-bold-foreground           | Salt-only                                     |
| actionablePositiveBoldForegroundActive    | No     | actionable-positive-bold-foreground-active    | Salt-only                                     |
| actionablePositiveBoldForegroundHover     | No     | actionable-positive-bold-foreground-hover     | Salt-only                                     |
| actionablePositiveBackground              | No     | actionable-positive-background                | Salt-only                                     |
| actionablePositiveBackgroundActive        | No     | actionable-positive-background-active         | Salt-only                                     |
| actionablePositiveBackgroundHover         | No     | actionable-positive-background-hover          | Salt-only                                     |
| actionablePositiveBackgroundSelected      | No     | actionable-positive-background-selected       | Salt-only                                     |
| actionablePositiveBorderColor             | No     | actionable-positive-borderColor               | Salt-only                                     |
| actionablePositiveBorderColorActive       | No     | actionable-positive-borderColor-active        | Salt-only                                     |
| actionablePositiveBorderColorHover        | No     | actionable-positive-borderColor-hover         | Salt-only                                     |
| actionablePositiveBorderColorSelected     | No     | actionable-positive-borderColor-selected      | Salt-only                                     |
| actionablePositiveForeground              | No     | actionable-positive-foreground                | Salt-only                                     |
| actionablePositiveForegroundActive        | No     | actionable-positive-foreground-active         | Salt-only                                     |
| actionablePositiveForegroundHover         | No     | actionable-positive-foreground-hover          | Salt-only                                     |
| actionablePositiveForegroundSelected      | No     | actionable-positive-foreground-selected       | Salt-only                                     |
| actionablePositiveSubtleBackground        | No     | actionable-positive-subtle-background         | Salt-only                                     |
| actionablePositiveSubtleBackgroundActive  | No     | actionable-positive-subtle-background-active  | Salt-only                                     |
| actionablePositiveSubtleBackgroundHover   | No     | actionable-positive-subtle-background-hover   | Salt-only                                     |
| actionablePositiveSubtleBorderColor       | No     | actionable-positive-subtle-borderColor        | Salt-only                                     |
| actionablePositiveSubtleBorderColorActive | No     | actionable-positive-subtle-borderColor-active | Salt-only                                     |
| actionablePositiveSubtleBorderColorHover  | No     | actionable-positive-subtle-borderColor-hover  | Salt-only                                     |
| actionablePositiveSubtleForeground        | No     | actionable-positive-subtle-foreground         | Salt-only                                     |
| actionablePositiveSubtleForegroundActive  | No     | actionable-positive-subtle-foreground-active  | Salt-only                                     |
| actionablePositiveSubtleForegroundHover   | No     | actionable-positive-subtle-foreground-hover   | Salt-only                                     |
| actionableCautionBoldBackground           | No     | actionable-caution-bold-background            | Salt-only                                     |
| actionableCautionBoldBackgroundActive     | No     | actionable-caution-bold-background-active     | Salt-only                                     |
| actionableCautionBoldBackgroundHover      | No     | actionable-caution-bold-background-hover      | Salt-only                                     |
| actionableCautionBoldBorderColor          | No     | actionable-caution-bold-borderColor           | Salt-only                                     |
| actionableCautionBoldBorderColorActive    | No     | actionable-caution-bold-borderColor-active    | Salt-only                                     |
| actionableCautionBoldBorderColorHover     | No     | actionable-caution-bold-borderColor-hover     | Salt-only                                     |
| actionableCautionBoldForeground           | No     | actionable-caution-bold-foreground            | Salt-only                                     |
| actionableCautionBoldForegroundActive     | No     | actionable-caution-bold-foreground-active     | Salt-only                                     |
| actionableCautionBoldForegroundHover      | No     | actionable-caution-bold-foreground-hover      | Salt-only                                     |
| actionableCautionBackground               | No     | actionable-caution-background                 | Salt-only                                     |
| actionableCautionBackgroundActive         | No     | actionable-caution-background-active          | Salt-only                                     |
| actionableCautionBackgroundHover          | No     | actionable-caution-background-hover           | Salt-only                                     |
| actionableCautionBackgroundSelected       | No     | actionable-caution-background-selected        | Salt-only                                     |
| actionableCautionBorderColor              | No     | actionable-caution-borderColor                | Salt-only                                     |
| actionableCautionBorderColorActive        | No     | actionable-caution-borderColor-active         | Salt-only                                     |
| actionableCautionBorderColorHover         | No     | actionable-caution-borderColor-hover          | Salt-only                                     |
| actionableCautionBorderColorSelected      | No     | actionable-caution-borderColor-selected       | Salt-only                                     |
| actionableCautionForeground               | No     | actionable-caution-foreground                 | Salt-only                                     |
| actionableCautionForegroundActive         | No     | actionable-caution-foreground-active          | Salt-only                                     |
| actionableCautionForegroundHover          | No     | actionable-caution-foreground-hover           | Salt-only                                     |
| actionableCautionForegroundSelected       | No     | actionable-caution-foreground-selected        | Salt-only                                     |
| actionableCautionSubtleBackground         | No     | actionable-caution-subtle-background          | Salt-only                                     |
| actionableCautionSubtleBackgroundActive   | No     | actionable-caution-subtle-background-active   | Salt-only                                     |
| actionableCautionSubtleBackgroundHover    | No     | actionable-caution-subtle-background-hover    | Salt-only                                     |
| actionableCautionSubtleBorderColor        | No     | actionable-caution-subtle-borderColor         | Salt-only                                     |
| actionableCautionSubtleBorderColorActive  | No     | actionable-caution-subtle-borderColor-active  | Salt-only                                     |
| actionableCautionSubtleBorderColorHover   | No     | actionable-caution-subtle-borderColor-hover   | Salt-only                                     |
| actionableCautionSubtleForeground         | No     | actionable-caution-subtle-foreground          | Salt-only                                     |
| actionableCautionSubtleForegroundActive   | No     | actionable-caution-subtle-foreground-active   | Salt-only                                     |
| actionableCautionSubtleForegroundHover    | No     | actionable-caution-subtle-foreground-hover    | Salt-only                                     |

### Category Characteristic (Salt-only)

| Token                                     | In EB? | Salt Token                                                        | Notes                                                 |
| ----------------------------------------- | ------ | ----------------------------------------------------------------- | ----------------------------------------------------- |
| category1SubtleForeground                 | No     | category-1-subtle-foreground                                      | Salt-only (20 categories × 4 tokens each = 80 tokens) |
| category1SubtleBackground                 | No     | category-1-subtle-background                                      | Salt-only                                             |
| category1SubtleBorderColor                | No     | category-1-subtle-borderColor                                     | Salt-only                                             |
| category1BoldBackground                   | No     | category-1-bold-background                                        | Salt-only                                             |
| ... (categories 2-20 follow same pattern) | No     | category-{2-20}-{subtle/bold}-{foreground/background/borderColor} | Salt-only; 80 total tokens                            |

### Container Characteristic

| Token                                 | In EB? | Salt Token                               | Notes        |
| ------------------------------------- | ------ | ---------------------------------------- | ------------ |
| containerBackground                   | Yes    | (maps to base background)                |              |
| containerPrimaryBackground            | Yes    | container-primary-background             |              |
| containerPrimaryBackgroundDisabled    | No     | container-primary-background-disabled    | Salt-only    |
| containerPrimaryBorderColor           | No     | container-primary-borderColor            | Salt-only    |
| containerPrimaryBorderColorDisabled   | No     | container-primary-borderColor-disabled   | Salt-only    |
| containerPrimaryForeground            | Yes    | (not in container.css)                   | We have this |
| containerSecondaryBackground          | Yes    | container-secondary-background           |              |
| containerSecondaryBackgroundDisabled  | No     | container-secondary-background-disabled  | Salt-only    |
| containerSecondaryBorderColor         | No     | container-secondary-borderColor          | Salt-only    |
| containerSecondaryBorderColorDisabled | No     | container-secondary-borderColor-disabled | Salt-only    |
| containerSecondaryForeground          | Yes    | (not in container.css)                   | We have this |
| containerTertiaryBackground           | No     | container-tertiary-background            | Salt-only    |
| containerTertiaryBackgroundDisabled   | No     | container-tertiary-background-disabled   | Salt-only    |
| containerTertiaryBorderColor          | No     | container-tertiary-borderColor           | Salt-only    |
| containerTertiaryBorderColorDisabled  | No     | container-tertiary-borderColor-disabled  | Salt-only    |
| containerGhostBackground              | No     | container-ghost-background               | Salt-only    |
| containerGhostBorderColor             | No     | container-ghost-borderColor              | Salt-only    |
| contentPrimaryForeground              | Yes    | content-primary-foreground               |              |
| contentPrimaryForegroundDisabled      | No     | content-primary-foreground-disabled      | Salt-only    |
| contentSecondaryForeground            | No     | content-secondary-foreground             | Salt-only    |
| contentSecondaryForegroundDisabled    | No     | content-secondary-foreground-disabled    | Salt-only    |
| contentAccentForeground               | No     | content-accent-foreground                | Salt-only    |
| contentAttentionForeground            | No     | content-attention-foreground             | Salt-only    |
| contentBoldForeground                 | No     | content-bold-foreground                  | Salt-only    |
| contentBoldForegroundDisabled         | No     | content-bold-foreground-disabled         | Salt-only    |
| contentForegroundVisited              | No     | content-foreground-visited               | Salt-only    |

### Content Characteristic

| Token                   | In EB? | Salt Token                        | Notes                |
| ----------------------- | ------ | --------------------------------- | -------------------- |
| contentFontFamily       | Yes    | (handled via Text characteristic) | We fold into Content |
| contentHeaderFontFamily | Yes    | (handled via Text characteristic) | We fold into Content |

### Editable Characteristic

| Token                               | In EB? | Salt Token                             | Notes                                                        |
| ----------------------------------- | ------ | -------------------------------------- | ------------------------------------------------------------ |
| editableBackground                  | Yes    | editable-primary-background            | We use single editableBackground; Salt has primary/secondary |
| editableBackgroundActive            | No     | editable-primary-background-active     | Salt-only                                                    |
| editableBackgroundDisabled          | No     | editable-primary-background-disabled   | Salt-only                                                    |
| editableBackgroundHover             | No     | editable-primary-background-hover      | Salt-only                                                    |
| editableBackgroundReadonly          | No     | editable-primary-background-readonly   | Salt-only                                                    |
| editableSecondaryBackground         | No     | editable-secondary-background          | Salt-only                                                    |
| editableSecondaryBackgroundActive   | No     | editable-secondary-background-active   | Salt-only                                                    |
| editableSecondaryBackgroundDisabled | No     | editable-secondary-background-disabled | Salt-only                                                    |
| editableSecondaryBackgroundHover    | No     | editable-secondary-background-hover    | Salt-only                                                    |
| editableSecondaryBackgroundReadonly | No     | editable-secondary-background-readonly | Salt-only                                                    |
| editableBorderColor                 | Yes    | editable-borderColor                   |                                                              |
| editableBorderColorActive           | No     | editable-borderColor-active            | Salt-only                                                    |
| editableBorderColorDisabled         | No     | editable-borderColor-disabled          | Salt-only                                                    |
| editableBorderColorHover            | No     | editable-borderColor-hover             | Salt-only                                                    |
| editableBorderColorReadonly         | No     | editable-borderColor-readonly          | Salt-only                                                    |
| editableBorderRadius                | Yes    | (not in editable.css)                  | We have this                                                 |
| editableLabelFontSize               | Yes    | (handled via Text characteristic)      |                                                              |
| editableLabelLineHeight             | Yes    | (handled via Text characteristic)      |                                                              |
| editableLabelFontWeight             | Yes    | (handled via Text characteristic)      |                                                              |
| editableLabelForeground             | Yes    | (handled via Text characteristic)      |                                                              |

### Focused Characteristic

| Token                | In EB? | Salt Token            | Notes                                    |
| -------------------- | ------ | --------------------- | ---------------------------------------- |
| focusedRingColor     | Yes    | focused-outlineColor  | We use ringColor; Salt uses outlineColor |
| focusedOutlineStyle  | No     | focused-outlineStyle  | Salt-only                                |
| focusedOutlineWidth  | No     | focused-outlineWidth  | Salt-only                                |
| focusedOutlineInset  | No     | focused-outlineInset  | Salt-only                                |
| focusedOutlineOffset | No     | focused-outlineOffset | Salt-only                                |
| focusedOutline       | No     | focused-outline       | Salt-only (CSS shortcut)                 |

### Navigable Characteristic

| Token                          | In EB? | Salt Token                          | Notes                  |
| ------------------------------ | ------ | ----------------------------------- | ---------------------- |
| navigableBackground            | Yes    | (not in navigable.css)              | We have this           |
| navigableForeground            | Yes    | (not in navigable.css)              | We have this           |
| navigableAccentBackground      | Yes    | navigable-accent-background-active  | Salt uses active state |
| navigableAccentBorderColor     | No     | navigable-accent-borderColor-active | Salt-only              |
| navigableAccentForeground      | Yes    | (not in navigable.css)              | We have this           |
| navigableIndicatorHover        | No     | navigable-indicator-hover           | Salt-only              |
| navigableAccentIndicatorActive | No     | navigable-accent-indicator-active   | Salt-only              |

### Overlayable Characteristic

| Token                               | In EB? | Salt Token                            | Notes        |
| ----------------------------------- | ------ | ------------------------------------- | ------------ |
| overlayableBackground               | Yes    | overlayable-background                |              |
| overlayableBackgroundHover          | No     | overlayable-background-hover          | Salt-only    |
| overlayableBackgroundHighlight      | No     | overlayable-background-highlight      | Salt-only    |
| overlayableBackgroundRangeSelection | No     | overlayable-background-rangeSelection | Salt-only    |
| overlayableForeground               | Yes    | (not in overlayable.css)              | We have this |
| overlayableZIndex                   | Yes    | (not in overlayable.css)              | We have this |
| overlayableShadow                   | No     | overlayable-shadow                    | Salt-only    |
| overlayableShadowHover              | No     | overlayable-shadow-hover              | Salt-only    |
| overlayableShadowScroll             | No     | overlayable-shadow-scroll             | Salt-only    |
| overlayableShadowRegion             | No     | overlayable-shadow-region             | Salt-only    |
| overlayableShadowPopout             | No     | overlayable-shadow-popout             | Salt-only    |
| overlayableShadowDrag               | No     | overlayable-shadow-drag               | Salt-only    |
| overlayableShadowModal              | No     | overlayable-shadow-modal              | Salt-only    |

### Selectable Characteristic (Salt-only)

| Token                                 | In EB? | Salt Token                              | Notes     |
| ------------------------------------- | ------ | --------------------------------------- | --------- |
| selectableBackground                  | No     | selectable-background                   | Salt-only |
| selectableBackgroundHover             | No     | selectable-background-hover             | Salt-only |
| selectableBackgroundSelected          | No     | selectable-background-selected          | Salt-only |
| selectableBackgroundDisabled          | No     | selectable-background-disabled          | Salt-only |
| selectableBackgroundSelectedDisabled  | No     | selectable-background-selectedDisabled  | Salt-only |
| selectableForeground                  | No     | selectable-foreground                   | Salt-only |
| selectableForegroundHover             | No     | selectable-foreground-hover             | Salt-only |
| selectableForegroundSelected          | No     | selectable-foreground-selected          | Salt-only |
| selectableForegroundDisabled          | No     | selectable-foreground-disabled          | Salt-only |
| selectableForegroundSelectedDisabled  | No     | selectable-foreground-selectedDisabled  | Salt-only |
| selectableBorderColor                 | No     | selectable-borderColor                  | Salt-only |
| selectableBorderColorHover            | No     | selectable-borderColor-hover            | Salt-only |
| selectableBorderColorSelected         | No     | selectable-borderColor-selected         | Salt-only |
| selectableBorderColorDisabled         | No     | selectable-borderColor-disabled         | Salt-only |
| selectableBorderColorSelectedDisabled | No     | selectable-borderColor-selectedDisabled | Salt-only |
| selectableBorderColorReadonly         | No     | selectable-borderColor-readonly         | Salt-only |

### Separable Characteristic

| Token                         | In EB? | Salt Token                      | Notes                                                                   |
| ----------------------------- | ------ | ------------------------------- | ----------------------------------------------------------------------- |
| separableBorderColor          | Yes    | separable-primary-borderColor   | We use single separableBorderColor; Salt has primary/secondary/tertiary |
| separableSecondaryBorderColor | No     | separable-secondary-borderColor | Salt-only                                                               |
| separableTertiaryBorderColor  | No     | separable-tertiary-borderColor  | Salt-only                                                               |
| separableBorderRadius         | Yes    | (not in separable.css)          | We have this                                                            |
| separableForeground           | No     | separable-foreground            | Salt-only                                                               |
| separableForegroundHover      | No     | separable-foreground-hover      | Salt-only                                                               |
| separableForegroundActive     | No     | separable-foreground-active     | Salt-only                                                               |
| separableBackgroundHover      | No     | separable-background-hover      | Salt-only                                                               |
| separableBackgroundActive     | No     | separable-background-active     | Salt-only                                                               |

### Sentiment Characteristic

| Token                                  | In EB? | Salt Token                                | Notes        |
| -------------------------------------- | ------ | ----------------------------------------- | ------------ |
| sentimentNegativeBackground            | Yes    | (not in sentiment.css)                    | We have this |
| sentimentNegativeBackgroundHover       | Yes    | (not in sentiment.css)                    | We have this |
| sentimentNegativeBackgroundActive      | Yes    | (not in sentiment.css)                    | We have this |
| sentimentNegativeForeground            | Yes    | (not in sentiment.css)                    | We have this |
| sentimentNegativeForegroundHover       | Yes    | (not in sentiment.css)                    | We have this |
| sentimentNegativeForegroundActive      | Yes    | (not in sentiment.css)                    | We have this |
| sentimentNegativeAccentBackground      | Yes    | (not in sentiment.css)                    | We have this |
| sentimentNegativeBorderWidth           | Yes    | (not in sentiment.css)                    | We have this |
| sentimentNegativeFontWeight            | Yes    | (not in sentiment.css)                    | We have this |
| sentimentNegativeForegroundInformative | No     | sentiment-negative-foreground-informative | Salt-only    |
| sentimentNegativeForegroundDecorative  | No     | sentiment-negative-foreground-decorative  | Salt-only    |
| sentimentPositiveForeground            | Yes    | (not in sentiment.css)                    | We have this |
| sentimentPositiveAccentBackground      | Yes    | (not in sentiment.css)                    | We have this |
| sentimentPositiveForegroundInformative | No     | sentiment-positive-foreground-informative | Salt-only    |
| sentimentPositiveForegroundDecorative  | No     | sentiment-positive-foreground-decorative  | Salt-only    |
| sentimentCautionForeground             | Yes    | (not in sentiment.css)                    | We have this |
| sentimentCautionAccentBackground       | Yes    | (not in sentiment.css)                    | We have this |
| sentimentNeutralTrack                  | No     | sentiment-neutral-track                   | Salt-only    |
| sentimentNeutralTrackDisabled          | No     | sentiment-neutral-track-disabled          | Salt-only    |

### Status Characteristic

| Token                             | In EB?         | Salt Token                            | Notes                                         |
| --------------------------------- | -------------- | ------------------------------------- | --------------------------------------------- |
| statusInfoForeground              | Yes            | status-info-foreground-informative    | Salt has informative/decorative variants      |
| statusInfoForegroundDecorative    | No             | status-info-foreground-decorative     | Salt-only                                     |
| statusInfoAccentBackground        | Yes            | status-info-background                | Salt uses "background" not "accentBackground" |
| statusInfoBoldBackground          | No             | status-info-bold-background           | Salt-only                                     |
| statusInfoBorderColor             | No             | status-info-borderColor               | Salt-only                                     |
| statusSuccessForeground           | Yes (fallback) | status-success-foreground-informative | Falls back to positive                        |
| statusSuccessForegroundDecorative | No             | status-success-foreground-decorative  | Salt-only                                     |
| statusSuccessAccentBackground     | Yes (fallback) | status-success-background             | Falls back to positive                        |
| statusSuccessBoldBackground       | No             | status-success-bold-background        | Salt-only                                     |
| statusSuccessBackgroundSelected   | No             | status-success-background-selected    | Salt-only                                     |
| statusSuccessBorderColor          | No             | status-success-borderColor            | Salt-only                                     |
| statusWarningForeground           | Yes (fallback) | status-warning-foreground-informative | Falls back to caution                         |
| statusWarningForegroundDecorative | No             | status-warning-foreground-decorative  | Salt-only                                     |
| statusWarningAccentBackground     | Yes (fallback) | status-warning-background             | Falls back to caution                         |
| statusWarningBoldBackground       | No             | status-warning-bold-background        | Salt-only                                     |
| statusWarningBackgroundSelected   | No             | status-warning-background-selected    | Salt-only                                     |
| statusWarningBorderColor          | No             | status-warning-borderColor            | Salt-only                                     |
| statusErrorForeground             | No             | status-error-foreground-informative   | Salt-only (maps to negative)                  |
| statusErrorForegroundDecorative   | No             | status-error-foreground-decorative    | Salt-only                                     |
| statusErrorAccentBackground       | No             | status-error-background               | Salt-only                                     |
| statusErrorBoldBackground         | No             | status-error-bold-background          | Salt-only                                     |
| statusErrorBackgroundSelected     | No             | status-error-background-selected      | Salt-only                                     |
| statusErrorBorderColor            | No             | status-error-borderColor              | Salt-only                                     |

### Target Characteristic (Salt-only)

| Token                  | In EB? | Salt Token               | Notes     |
| ---------------------- | ------ | ------------------------ | --------- |
| targetBackgroundHover  | No     | target-background-hover  | Salt-only |
| targetBorderColorHover | No     | target-borderColor-hover | Salt-only |

### Text Characteristic (Salt-only; we fold into Content)

| Token                        | In EB?                           | Salt Token                      | Notes                         |
| ---------------------------- | -------------------------------- | ------------------------------- | ----------------------------- |
| textFontFamily               | Yes (as contentFontFamily)       | text-fontFamily                 | We fold into Content          |
| textFontWeight               | No                               | text-fontWeight                 | Salt-only                     |
| textFontWeightSmall          | No                               | text-fontWeight-small           | Salt-only                     |
| textFontWeightStrong         | No                               | text-fontWeight-strong          | Salt-only                     |
| textFontSize                 | No                               | text-fontSize                   | Salt-only (density-dependent) |
| textLineHeight               | No                               | text-lineHeight                 | Salt-only (density-dependent) |
| textMinHeight                | No                               | text-minHeight                  | Salt-only (density-dependent) |
| textLetterSpacing            | No                               | text-letterSpacing              | Salt-only                     |
| textTextAlign                | No                               | text-textAlign                  | Salt-only                     |
| textTextAlignEmbedded        | No                               | text-textAlign-embedded         | Salt-only                     |
| textActionFontFamily         | No                               | text-action-fontFamily          | Salt-only                     |
| textActionLetterSpacing      | No                               | text-action-letterSpacing       | Salt-only                     |
| textActionTextTransform      | No                               | text-action-textTransform       | Salt-only                     |
| textActionTextAlign          | No                               | text-action-textAlign           | Salt-only                     |
| textActionFontWeight         | No                               | text-action-fontWeight          | Salt-only                     |
| textActionFontWeightSmall    | No                               | text-action-fontWeight-small    | Salt-only                     |
| textActionFontWeightStrong   | No                               | text-action-fontWeight-strong   | Salt-only                     |
| textLabelFontFamily          | No                               | text-label-fontFamily           | Salt-only                     |
| textLabelFontWeight          | No                               | text-label-fontWeight           | Salt-only                     |
| textLabelFontWeightSmall     | No                               | text-label-fontWeight-small     | Salt-only                     |
| textLabelFontWeightStrong    | No                               | text-label-fontWeight-strong    | Salt-only                     |
| textLabelFontSize            | Yes (as editableLabelFontSize)   | text-label-fontSize             | We have via editable          |
| textLabelLineHeight          | Yes (as editableLabelLineHeight) | text-label-lineHeight           | We have via editable          |
| textH1FontFamily             | Yes (as contentHeaderFontFamily) | text-h1-fontFamily              | We fold into Content          |
| textH1FontWeight             | No                               | text-h1-fontWeight              | Salt-only                     |
| textH1FontWeightSmall        | No                               | text-h1-fontWeight-small        | Salt-only                     |
| textH1FontWeightStrong       | No                               | text-h1-fontWeight-strong       | Salt-only                     |
| textH1FontSize               | No                               | text-h1-fontSize                | Salt-only (density-dependent) |
| textH1LineHeight             | No                               | text-h1-lineHeight              | Salt-only (density-dependent) |
| textH2FontFamily             | No                               | text-h2-fontFamily              | Salt-only                     |
| textH2FontWeight             | No                               | text-h2-fontWeight              | Salt-only                     |
| textH2FontWeightSmall        | No                               | text-h2-fontWeight-small        | Salt-only                     |
| textH2FontWeightStrong       | No                               | text-h2-fontWeight-strong       | Salt-only                     |
| textH2FontSize               | No                               | text-h2-fontSize                | Salt-only (density-dependent) |
| textH2LineHeight             | No                               | text-h2-lineHeight              | Salt-only (density-dependent) |
| textH3FontFamily             | No                               | text-h3-fontFamily              | Salt-only                     |
| textH3FontWeight             | No                               | text-h3-fontWeight              | Salt-only                     |
| textH3FontWeightSmall        | No                               | text-h3-fontWeight-small        | Salt-only                     |
| textH3FontWeightStrong       | No                               | text-h3-fontWeight-strong       | Salt-only                     |
| textH3FontSize               | No                               | text-h3-fontSize                | Salt-only (density-dependent) |
| textH3LineHeight             | No                               | text-h3-lineHeight              | Salt-only (density-dependent) |
| textH4FontFamily             | No                               | text-h4-fontFamily              | Salt-only                     |
| textH4FontWeight             | No                               | text-h4-fontWeight              | Salt-only                     |
| textH4FontWeightSmall        | No                               | text-h4-fontWeight-small        | Salt-only                     |
| textH4FontWeightStrong       | No                               | text-h4-fontWeight-strong       | Salt-only                     |
| textH4FontSize               | No                               | text-h4-fontSize                | Salt-only (density-dependent) |
| textH4LineHeight             | No                               | text-h4-lineHeight              | Salt-only (density-dependent) |
| textDisplay1FontFamily       | No                               | text-display1-fontFamily        | Salt-only                     |
| textDisplay1FontWeight       | No                               | text-display1-fontWeight        | Salt-only                     |
| textDisplay1FontWeightSmall  | No                               | text-display1-fontWeight-small  | Salt-only                     |
| textDisplay1FontWeightStrong | No                               | text-display1-fontWeight-strong | Salt-only                     |
| textDisplay1FontSize         | No                               | text-display1-fontSize          | Salt-only (density-dependent) |
| textDisplay1LineHeight       | No                               | text-display1-lineHeight        | Salt-only (density-dependent) |
| textDisplay2FontFamily       | No                               | text-display2-fontFamily        | Salt-only                     |
| textDisplay2FontWeight       | No                               | text-display2-fontWeight        | Salt-only                     |
| textDisplay2FontWeightSmall  | No                               | text-display2-fontWeight-small  | Salt-only                     |
| textDisplay2FontWeightStrong | No                               | text-display2-fontWeight-strong | Salt-only                     |
| textDisplay2FontSize         | No                               | text-display2-fontSize          | Salt-only (density-dependent) |
| textDisplay2LineHeight       | No                               | text-display2-lineHeight        | Salt-only (density-dependent) |
| textDisplay3FontFamily       | No                               | text-display3-fontFamily        | Salt-only                     |
| textDisplay3FontWeight       | No                               | text-display3-fontWeight        | Salt-only                     |
| textDisplay3FontWeightSmall  | No                               | text-display3-fontWeight-small  | Salt-only                     |
| textDisplay3FontWeightStrong | No                               | text-display3-fontWeight-strong | Salt-only                     |
| textDisplay3FontSize         | No                               | text-display3-fontSize          | Salt-only (density-dependent) |
| textDisplay3LineHeight       | No                               | text-display3-lineHeight        | Salt-only (density-dependent) |
| textDisplay4FontFamily       | No                               | text-display4-fontFamily        | Salt-only                     |
| textDisplay4FontWeight       | No                               | text-display4-fontWeight        | Salt-only                     |
| textDisplay4FontWeightSmall  | No                               | text-display4-fontWeight-small  | Salt-only                     |
| textDisplay4FontWeightStrong | No                               | text-display4-fontWeight-strong | Salt-only                     |
| textDisplay4FontSize         | No                               | text-display4-fontSize          | Salt-only (density-dependent) |
| textDisplay4LineHeight       | No                               | text-display4-lineHeight        | Salt-only (density-dependent) |
| textNotationFontFamily       | No                               | text-notation-fontFamily        | Salt-only                     |
| textNotationFontWeight       | No                               | text-notation-fontWeight        | Salt-only                     |
| textNotationFontWeightSmall  | No                               | text-notation-fontWeight-small  | Salt-only                     |
| textNotationFontWeightStrong | No                               | text-notation-fontWeight-strong | Salt-only                     |
| textNotationFontSize         | No                               | text-notation-fontSize          | Salt-only (density-dependent) |
| textNotationLineHeight       | No                               | text-notation-lineHeight        | Salt-only (density-dependent) |
| textCodeFontFamily           | No                               | text-code-fontFamily            | Salt-only                     |

### Layout/Spacing (EB-specific)

| Token       | In EB? | Salt Token                      | Notes                                      |
| ----------- | ------ | ------------------------------- | ------------------------------------------ |
| spacingUnit | Yes    | (Salt uses density/size scales) | Our layout token; Salt handles via density |

### Legacy/Compat (EB-specific)

| Token                | In EB? | Salt Token                  | Notes            |
| -------------------- | ------ | --------------------------- | ---------------- |
| alertForegroundColor | Yes    | (not a Salt characteristic) | Back-compat only |

---

**Summary**: We implement the core Salt characteristics needed for our components (actionable primary/secondary, container, content, editable, overlayable, navigable, separable, focused, sentiment, status, accent). Salt has additional variants (accented, negative, positive, caution actionable variants; tertiary/ghost containers; Category 1-20; Selectable; Target; separate Text characteristic with density-dependent sizing). Add these only when use-cases emerge.
