# Design Tokens Reference

This document provides a comprehensive guide to the design token system used in the Embedded Finance Components library.

## Overview

The design token system follows the [Salt Design System](https://www.saltdesignsystem.com/salt/themes/design-tokens/how-to-read-tokens) semantic nomenclature, organizing tokens by **characteristics** - groups of tokens sharing the same purpose or intent.

## Token Architecture

### Token Mapping Flow

```text
Salt Design System Token → Legacy Token → CSS Variable → Tailwind Utility
```

**Example:**

```text
actionableAccentedBoldBackground → primaryColor → --eb-primary → bg-primary
```

### Configuration Files

1. **`token-mappings.ts`** - Central configuration mapping design tokens to CSS variables
2. **`css-variables.types.ts`** - Type-safe CSS variable definitions
3. **`convert-theme-to-css-variables.ts`** - Runtime conversion logic
4. **`tailwind.config.js`** - Tailwind CSS integration

## Token Characteristics

### 1. Typography (Content)

Typography tokens control text appearance across the application.

| CSS Variable | Token Name | Legacy Name | Default |
|--------------|------------|-------------|---------|
| `--eb-font-family` | `contentFontFamily` | `fontFamily` | `"Geist"` |
| `--eb-header-font-family` | `textHeadingFontFamily` | `headerFontFamily` | Inherits |
| `--eb-button-font-family` | `actionableFontFamily` | `buttonFontFamily` | Inherits |

**Usage:**

```tsx
<EBComponentsProvider
  theme={{
    variables: {
      contentFontFamily: '"Inter", sans-serif',
      textHeadingFontFamily: '"Playfair Display", serif',
    }
  }}
>
```

### 2. Container (Surfaces)

Container tokens define background and foreground colors for surfaces.

| CSS Variable | Token Name | Light Default | Dark Default |
|--------------|------------|---------------|--------------|
| `--eb-background` | `containerPrimaryBackground` | `hsl(0 0% 100%)` | `hsl(240 10% 3.9%)` |
| `--eb-foreground` | `contentPrimaryForeground` | `hsl(240 10% 3.9%)` | `hsl(0 0% 98%)` |
| `--eb-card` | `containerCardBackground` | `hsl(0 0% 100%)` | `hsl(240 10% 3.9%)` |
| `--eb-card-foreground` | `containerPrimaryForeground` | `hsl(240 10% 3.9%)` | `hsl(0 0% 98%)` |
| `--eb-muted` | `containerSecondaryBackground` | `hsl(240 4.8% 95.9%)` | `hsl(240 3.7% 15.9%)` |
| `--eb-muted-foreground` | `containerSecondaryForeground` | `hsl(240 3.8% 46.1%)` | `hsl(240 5% 64.9%)` |

**Tailwind Usage:**

```tsx
<div className="eb-bg-background eb-text-foreground">
  <Card className="eb-bg-card eb-text-card-foreground">
    <p className="eb-text-muted-foreground">Muted text</p>
  </Card>
</div>
```

### 3. Actionable (Interactive Elements)

Actionable tokens control the appearance of interactive elements like buttons and links.

#### Common Properties

| CSS Variable | Token Name | Description |
|--------------|------------|-------------|
| `--eb-button-font-weight` | `actionableFontWeight` | Button text weight |
| `--eb-button-font-size` | `actionableFontSize` | Button text size |
| `--eb-button-line-height` | `actionableLineHeight` | Button line height |
| `--eb-button-text-transform` | `actionableTextTransform` | Text transformation |
| `--eb-button-letter-spacing` | `actionableLetterSpacing` | Letter spacing |
| `--eb-button-radius` | `actionableBorderRadius` | Border radius |
| `--eb-button-translate-y-active` | `actionableShiftOnActive` | Active state shift |

#### Accented Bold (Primary)

| CSS Variable | Token Name | Description |
|--------------|------------|-------------|
| `--eb-primary` | `actionableAccentedBoldBackground` | Background |
| `--eb-primary-hover` | `actionableAccentedBoldBackgroundHover` | Hover background (90% opacity fallback) |
| `--eb-primary-active` | `actionableAccentedBoldBackgroundActive` | Active background |
| `--eb-primary-foreground` | `actionableAccentedBoldForeground` | Text color |
| `--eb-primary-foreground-hover` | `actionableAccentedBoldForegroundHover` | Hover text |
| `--eb-primary-foreground-active` | `actionableAccentedBoldForegroundActive` | Active text |
| `--eb-primary-border-width` | `actionableAccentedBoldBorderWidth` | Border width |
| `--eb-button-primary-font-weight` | `actionableAccentedBoldFontWeight` | Font weight |

**Tailwind Usage:**

```tsx
<Button variant="default">Primary Button</Button>
// Generates: bg-primary text-primary-foreground hover:bg-primary-hover
```

#### Subtle (Secondary)

| CSS Variable | Token Name | Description |
|--------------|------------|-------------|
| `--eb-secondary` | `actionableSubtleBackground` | Background |
| `--eb-secondary-hover` | `actionableSubtleBackgroundHover` | Hover (90% opacity fallback) |
| `--eb-secondary-active` | `actionableSubtleBackgroundActive` | Active state |
| `--eb-secondary-foreground` | `actionableSubtleForeground` | Text color |
| `--eb-secondary-border-width` | `actionableSubtleBorderWidth` | Border width |

**Tailwind Usage:**

```tsx
<Button variant="secondary">Secondary Button</Button>
```

#### Negative Bold (Destructive)

| CSS Variable | Token Name | Description |
|--------------|------------|-------------|
| `--eb-destructive` | `actionableNegativeBoldBackground` | Background |
| `--eb-destructive-hover` | `actionableNegativeBoldBackgroundHover` | Hover (90% opacity fallback) |
| `--eb-destructive-active` | `actionableNegativeBoldBackgroundActive` | Active state |
| `--eb-destructive-foreground` | `actionableNegativeBoldForeground` | Text color |
| `--eb-destructive-border-width` | `actionableNegativeBoldBorderWidth` | Border width |

### 4. Editable (Form Inputs)

Editable tokens control form input appearance.

| CSS Variable | Token Name | Description |
|--------------|------------|-------------|
| `--eb-input` | `editableBackground` | Input background |
| `--eb-input-border` | `editableBorderColor` | Border color |
| `--eb-input-radius` | `editableBorderRadius` | Border radius (fallback to `--eb-radius`) |
| `--eb-form-label-font-size` | `editableLabelFontSize` | Label font size |
| `--eb-form-label-line-height` | `editableLabelLineHeight` | Label line height |
| `--eb-form-label-font-weight` | `editableLabelFontWeight` | Label font weight |
| `--eb-form-label-foreground` | `editableLabelForeground` | Label color |

### 5. Overlayable (Dialogs, Popovers)

| CSS Variable | Token Name | Description |
|--------------|------------|-------------|
| `--eb-popover` | `overlayableBackground` | Background |
| `--eb-popover-foreground` | `overlayableForeground` | Text color |
| `--eb-z-overlay` | `overlayableZIndex` | Z-index |

### 6. Navigable (Sidebars)

| CSS Variable | Token Name | Description |
|--------------|------------|-------------|
| `--eb-sidebar-background` | `navigableBackground` | Background |
| `--eb-sidebar-foreground` | `navigableForeground` | Text color |
| `--eb-sidebar-accent` | `navigableAccentBackground` | Accent background |
| `--eb-sidebar-accent-foreground` | `navigableAccentForeground` | Accent text |

### 7. Separable (Borders)

| CSS Variable | Token Name | Description |
|--------------|------------|-------------|
| `--eb-border` | `separableBorderColor` | Border color |
| `--eb-radius` | `separableBorderRadius` | Base border radius |

### 8. Focused (Focus Indicators)

| CSS Variable | Token Name | Description |
|--------------|------------|-------------|
| `--eb-ring` | `focusedRingColor` | Focus ring color |

### 9. Sentiment (Emotional States)

| CSS Variable | Token Name | Description |
|--------------|------------|-------------|
| `--eb-destructive-accent` | `sentimentNegativeAccentBackground` | Negative accent |
| `--eb-success` | `sentimentPositiveForeground` | Success color |
| `--eb-success-accent` | `sentimentPositiveAccentBackground` | Success accent |
| `--eb-warning` | `sentimentCautionForeground` | Warning color |
| `--eb-warning-accent` | `sentimentCautionAccentBackground` | Warning accent |

### 10. Status (Informational States)

| CSS Variable | Token Name | Description |
|--------------|------------|-------------|
| `--eb-informative` | `statusInfoForeground` | Info color |
| `--eb-informative-accent` | `statusInfoAccentBackground` | Info accent |

### 11. Accent (Highlights)

| CSS Variable | Token Name | Description |
|--------------|------------|-------------|
| `--eb-accent` | `accentBackground` | Accent background |
| `--eb-accent-foreground` | `contentAccentForeground` | Accent text |
| `--eb-metric-accent` | `accentMetricBackground` | Metric accent |

### 12. Layout

| CSS Variable | Token Name | Description |
|--------------|------------|-------------|
| `--eb-spacing-unit` | `spacingUnit` | Base spacing unit |

## Customization Examples

### Basic Theme Customization

```tsx
<EBComponentsProvider
  theme={{
    colorScheme: 'light',
    variables: {
      // Typography
      contentFontFamily: '"Inter", sans-serif',
      
      // Container
      containerPrimaryBackground: 'hsl(0 0% 98%)',
      contentPrimaryForeground: 'hsl(0 0% 10%)',
      
      // Primary buttons
      actionableAccentedBoldBackground: 'hsl(221 83% 53%)',
      actionableAccentedBoldForeground: 'hsl(0 0% 100%)',
      
      // Border radius
      separableBorderRadius: '0.5rem',
    }
  }}
>
  {/* Your app */}
</EBComponentsProvider>
```

### Color Scheme Specific Tokens

```tsx
<EBComponentsProvider
  theme={{
    colorScheme: 'system',
    variables: {
      contentFontFamily: '"Inter", sans-serif',
    },
    light: {
      containerPrimaryBackground: 'hsl(0 0% 100%)',
      contentPrimaryForeground: 'hsl(240 10% 3.9%)',
    },
    dark: {
      containerPrimaryBackground: 'hsl(240 10% 3.9%)',
      contentPrimaryForeground: 'hsl(0 0% 98%)',
    }
  }}
>
```

### Brand Color Integration

```tsx
const brandTheme = {
  variables: {
    // Primary brand color
    actionableAccentedBoldBackground: 'hsl(142 76% 36%)', // Green
    actionableAccentedBoldForeground: 'hsl(0 0% 100%)',
    
    // Secondary brand color
    actionableSubtleBackground: 'hsl(215 16% 47%)', // Gray-blue
    actionableSubtleForeground: 'hsl(0 0% 100%)',
    
    // Destructive actions
    actionableNegativeBoldBackground: 'hsl(0 84% 60%)', // Red
    actionableNegativeBoldForeground: 'hsl(0 0% 100%)',
  }
};

<EBComponentsProvider theme={brandTheme}>
  {/* Your app */}
</EBComponentsProvider>
```

## Special Behaviors

### Automatic Hover State Fallbacks

If hover states are not explicitly set, the system automatically generates them at 90% opacity:

```typescript
// If actionableAccentedBoldBackgroundHover is not set:
--eb-primary-hover = colorToHsl(actionableAccentedBoldBackground, 0.9)
```

This applies to:

- `--eb-primary-hover`
- `--eb-secondary-hover`
- `--eb-destructive-hover`

### Border Radius Fallbacks

If specific radius values are not set, they fall back to the base radius:

```typescript
--eb-button-radius = actionableBorderRadius ?? separableBorderRadius
--eb-input-radius = editableBorderRadius ?? separableBorderRadius
```

### Font Weight Inheritance

Button variant font weights inherit from the base button font weight:

```typescript
--eb-button-primary-font-weight = actionableAccentedBoldFontWeight ?? actionableFontWeight
--eb-button-secondary-font-weight = actionableSubtleFontWeight ?? actionableFontWeight
--eb-button-destructive-font-weight = actionableNegativeBoldFontWeight ?? actionableFontWeight
```

## Migration from Legacy Tokens

The system maintains backward compatibility with legacy token names:

| Legacy Token | New Salt Token |
|--------------|----------------|
| `fontFamily` | `contentFontFamily` |
| `backgroundColor` | `containerPrimaryBackground` |
| `foregroundColor` | `contentPrimaryForeground` |
| `primaryColor` | `actionableAccentedBoldBackground` |
| `secondaryColor` | `actionableSubtleBackground` |
| `destructiveColor` | `actionableNegativeBoldBackground` |
| `inputColor` | `editableBackground` |
| `borderColor` | `separableBorderColor` |
| `ringColor` | `focusedRingColor` |

**Both names work**, but new code should use Salt-aligned names for consistency.

## Type Safety

The system provides full TypeScript type safety:

```typescript
import { EBCSSVariable, getCSSVariableValue, setCSSVariable } from '@/core/EBComponentsProvider/css-variables.types';

// Type-safe CSS variable access
const primaryColor = getCSSVariableValue(element, '--eb-primary'); // ✅
const invalid = getCSSVariableValue(element, '--invalid'); // ❌ Type error

// Type-safe CSS variable setting
setCSSVariable(element, '--eb-primary', 'hsl(221 83% 53%)'); // ✅
```

## Tailwind Integration

Design tokens are automatically available in Tailwind CSS:

```tsx
// Colors
<div className="eb-bg-primary eb-text-primary-foreground" />
<div className="eb-bg-secondary eb-text-secondary-foreground" />
<div className="eb-bg-destructive eb-text-destructive-foreground" />

// Typography
<p className="eb-font-sans" /> {/* Uses contentFontFamily */}
<h1 className="eb-font-header" /> {/* Uses textHeadingFontFamily */}

// Borders
<div className="eb-border eb-border-border eb-rounded-radius" />

// Buttons (custom utilities)
<button className="button-padding button-text-transform button-shift-active" />
```

## Best Practices

1. **Use Salt-aligned names** for new code (e.g., `actionableAccentedBoldBackground` instead of `primaryColor`)
2. **Set theme at the provider level**, not in individual components
3. **Use Tailwind utilities** instead of inline CSS variables when possible
4. **Leverage automatic fallbacks** - don't set every hover state manually
5. **Follow characteristic naming** - understand the purpose, not just the visual result
6. **Test both color schemes** when customizing tokens

## Resources

- [Salt Design System Documentation](https://www.saltdesignsystem.com/salt/themes/design-tokens)
- [Theming Guide](./README.md#theming)
- [Token Mappings Source](./src/core/EBComponentsProvider/token-mappings.ts)
