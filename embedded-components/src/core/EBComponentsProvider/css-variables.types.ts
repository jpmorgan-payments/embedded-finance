import { TOKEN_MAPPINGS } from './token-mappings';

/**
 * Auto-generated union type of all CSS variable names
 * This provides type safety for CSS variable usage throughout the codebase
 */
export type EBCSSVariable =
  // Typography
  | '--eb-font-family'
  | '--eb-header-font-family'
  | '--eb-button-font-family'
  // Container
  | '--eb-background'
  | '--eb-foreground'
  | '--eb-card'
  | '--eb-card-foreground'
  | '--eb-muted'
  | '--eb-muted-foreground'
  // Actionable Common
  | '--eb-button-font-weight'
  | '--eb-button-font-size'
  | '--eb-button-line-height'
  | '--eb-button-text-transform'
  | '--eb-button-letter-spacing'
  | '--eb-button-radius'
  | '--eb-button-translate-y-active'
  // Actionable Accented Bold (Primary)
  | '--eb-primary'
  | '--eb-primary-hover'
  | '--eb-primary-active'
  | '--eb-primary-foreground'
  | '--eb-primary-foreground-hover'
  | '--eb-primary-foreground-active'
  | '--eb-primary-border-width'
  | '--eb-button-primary-font-weight'
  // Actionable Subtle (Secondary)
  | '--eb-secondary'
  | '--eb-secondary-hover'
  | '--eb-secondary-active'
  | '--eb-secondary-foreground'
  | '--eb-secondary-foreground-hover'
  | '--eb-secondary-foreground-active'
  | '--eb-secondary-border-width'
  | '--eb-button-secondary-font-weight'
  // Actionable Negative Bold (Destructive)
  | '--eb-destructive'
  | '--eb-destructive-hover'
  | '--eb-destructive-active'
  | '--eb-destructive-foreground'
  | '--eb-destructive-foreground-hover'
  | '--eb-destructive-foreground-active'
  | '--eb-destructive-border-width'
  | '--eb-button-destructive-font-weight'
  // Editable
  | '--eb-input'
  | '--eb-input-border'
  | '--eb-input-radius'
  | '--eb-form-label-font-size'
  | '--eb-form-label-line-height'
  | '--eb-form-label-font-weight'
  | '--eb-form-label-foreground'
  // Overlayable
  | '--eb-popover'
  | '--eb-popover-foreground'
  | '--eb-z-overlay'
  // Navigable
  | '--eb-sidebar-background'
  | '--eb-sidebar-foreground'
  | '--eb-sidebar-accent'
  | '--eb-sidebar-accent-foreground'
  // Separable
  | '--eb-border'
  | '--eb-radius'
  // Focused
  | '--eb-ring'
  // Sentiment
  | '--eb-destructive-accent'
  | '--eb-success'
  | '--eb-success-accent'
  | '--eb-warning'
  | '--eb-warning-accent'
  // Status
  | '--eb-informative'
  | '--eb-informative-accent'
  // Accent
  | '--eb-accent'
  | '--eb-accent-foreground'
  | '--eb-metric-accent'
  // Layout
  | '--eb-spacing-unit'
  // Alert (Backward Compatibility)
  | '--eb-alert-foreground';

/**
 * Type guard to check if a string is a valid CSS variable name
 */
export function isEBCSSVariable(key: string): key is EBCSSVariable {
  return key.startsWith('--eb-');
}

/**
 * Get all CSS variable names from token mappings
 * This is useful for runtime validation and documentation generation
 */
export function getAllCSSVariableNames(): EBCSSVariable[] {
  const varNames = new Set<string>();

  // Add all variables from token mappings
  Object.values(TOKEN_MAPPINGS).forEach((category) => {
    Object.values(category).forEach((mapping) => {
      varNames.add(`--eb-${mapping.cssVar}`);
    });
  });

  // Add special case variables
  const specialVars = [
    '--eb-primary-hover',
    '--eb-primary-active',
    '--eb-secondary-hover',
    '--eb-secondary-active',
    '--eb-destructive-hover',
    '--eb-destructive-active',
    '--eb-button-radius',
    '--eb-input-radius',
    '--eb-button-primary-font-weight',
    '--eb-button-secondary-font-weight',
    '--eb-button-destructive-font-weight',
  ];

  specialVars.forEach((v) => varNames.add(v));

  return Array.from(varNames).sort() as EBCSSVariable[];
}

/**
 * Get CSS variable value from computed styles
 * Provides type-safe access to CSS variable values
 */
export function getCSSVariableValue(
  element: HTMLElement,
  variable: EBCSSVariable
): string {
  return getComputedStyle(element).getPropertyValue(variable).trim();
}

/**
 * Set CSS variable value on an element
 * Provides type-safe way to set CSS variables
 */
export function setCSSVariable(
  element: HTMLElement,
  variable: EBCSSVariable,
  value: string
): void {
  element.style.setProperty(variable, value);
}
