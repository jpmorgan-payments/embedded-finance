import type { EBThemeVariables } from '@jpmorgan-payments/embedded-finance-components';

export interface A11yCheckResult {
  id: string;
  label: string;
  status: 'pass' | 'warning' | 'fail';
  message: string;
  recommendation?: string;
}

export interface A11yCheckSummary {
  total: number;
  passing: number;
  warnings: number;
  failing: number;
  checks: A11yCheckResult[];
}

/**
 * Check font sizes meet minimum readable sizes
 */
function checkFontSizes(variables: EBThemeVariables): A11yCheckResult[] {
  const results: A11yCheckResult[] = [];

  // Check actionable font size (buttons, links)
  const actionableFontSize = variables.actionableFontSize;
  if (actionableFontSize) {
    const sizeValue = parseFloat(String(actionableFontSize).replace(/rem|px|em/, ''));
    const unit = String(actionableFontSize).replace(/[\d.]/g, '') || 'rem';
    
    // Convert to pixels for comparison (assuming 16px base)
    const pxSize = unit === 'rem' ? sizeValue * 16 : sizeValue;
    
    if (pxSize < 14) {
      results.push({
        id: 'font-size-actionable',
        label: 'Actionable Font Size',
        status: 'fail',
        message: `Font size is ${actionableFontSize} (${pxSize.toFixed(1)}px), below minimum 14px`,
        recommendation: 'Increase actionableFontSize to at least 0.875rem (14px) for better readability',
      });
    } else if (pxSize < 16) {
      results.push({
        id: 'font-size-actionable',
        label: 'Actionable Font Size',
        status: 'warning',
        message: `Font size is ${actionableFontSize} (${pxSize.toFixed(1)}px), consider 16px for optimal readability`,
        recommendation: 'Consider increasing actionableFontSize to 1rem (16px)',
      });
    } else {
      results.push({
        id: 'font-size-actionable',
        label: 'Actionable Font Size',
        status: 'pass',
        message: `Font size is ${actionableFontSize} (${pxSize.toFixed(1)}px), meets minimum requirements`,
      });
    }
  }

  // Check label font size
  const labelFontSize = variables.editableLabelFontSize;
  if (labelFontSize) {
    const sizeValue = parseFloat(String(labelFontSize).replace(/rem|px|em/, ''));
    const unit = String(labelFontSize).replace(/[\d.]/g, '') || 'rem';
    const pxSize = unit === 'rem' ? sizeValue * 16 : sizeValue;
    
    if (pxSize < 12) {
      results.push({
        id: 'font-size-label',
        label: 'Label Font Size',
        status: 'fail',
        message: `Label font size is ${labelFontSize} (${pxSize.toFixed(1)}px), below minimum 12px`,
        recommendation: 'Increase editableLabelFontSize to at least 0.75rem (12px)',
      });
    } else {
      results.push({
        id: 'font-size-label',
        label: 'Label Font Size',
        status: 'pass',
        message: `Label font size is ${labelFontSize} (${pxSize.toFixed(1)}px), meets requirements`,
      });
    }
  }

  return results;
}

/**
 * Check focus ring visibility
 */
function checkFocusRing(variables: EBThemeVariables): A11yCheckResult[] {
  const results: A11yCheckResult[] = [];

  const focusRingColor = variables.focusedRingColor;
  if (!focusRingColor) {
    results.push({
      id: 'focus-ring-missing',
      label: 'Focus Ring',
      status: 'fail',
      message: 'Focus ring color is not defined',
      recommendation: 'Set focusedRingColor to ensure keyboard navigation is visible',
    });
    return results;
  }

  // We'll rely on contrast checker for detailed analysis, but check if it exists
  results.push({
    id: 'focus-ring-defined',
    label: 'Focus Ring',
    status: 'pass',
    message: `Focus ring color is defined: ${focusRingColor}`,
    recommendation: 'Ensure focus ring has at least 3:1 contrast with background colors',
  });

  return results;
}

/**
 * Check spacing/touch target sizes
 */
function checkTouchTargets(variables: EBThemeVariables): A11yCheckResult[] {
  const results: A11yCheckResult[] = [];

  const spacingUnit = variables.spacingUnit;
  if (spacingUnit) {
    const spacingValue = parseFloat(String(spacingUnit).replace(/rem|px|em/, ''));
    const unit = String(spacingUnit).replace(/[\d.]/g, '') || 'rem';
    const pxSpacing = unit === 'rem' ? spacingValue * 16 : spacingValue;

    // Minimum touch target is 44x44px (iOS) or 48x48px (Material)
    // Check if spacing unit allows for adequate padding
    if (pxSpacing < 8) {
      results.push({
        id: 'touch-target-spacing',
        label: 'Touch Target Spacing',
        status: 'warning',
        message: `Spacing unit is ${spacingUnit} (${pxSpacing.toFixed(1)}px), may be too small for touch targets`,
        recommendation: 'Ensure interactive elements have at least 44px (2.75rem) touch target size',
      });
    } else {
      results.push({
        id: 'touch-target-spacing',
        label: 'Touch Target Spacing',
        status: 'pass',
        message: `Spacing unit is ${spacingUnit} (${pxSpacing.toFixed(1)}px), adequate for touch targets`,
      });
    }
  }

  return results;
}

/**
 * Check border radius for readability
 */
function checkBorderRadius(variables: EBThemeVariables): A11yCheckResult[] {
  const results: A11yCheckResult[] = [];

  const borderRadius = variables.actionableBorderRadius;
  if (borderRadius) {
    const radiusValue = parseFloat(String(borderRadius).replace(/rem|px|em|%/, ''));
    const unit = String(borderRadius).replace(/[\d.]/g, '') || 'rem';
    const pxRadius = unit === 'rem' ? radiusValue * 16 : unit === '%' ? radiusValue : radiusValue;

    // Very large border radius can make buttons look like pills and reduce clarity
    if (pxRadius > 50) {
      results.push({
        id: 'border-radius-large',
        label: 'Border Radius',
        status: 'warning',
        message: `Border radius is ${borderRadius}, may reduce button clarity`,
        recommendation: 'Consider using smaller border radius (typically 4-8px) for better button recognition',
      });
    } else {
      results.push({
        id: 'border-radius-ok',
        label: 'Border Radius',
        status: 'pass',
        message: `Border radius is ${borderRadius}, appropriate for UI elements`,
      });
    }
  }

  return results;
}

/**
 * Run all a11y checks on theme variables
 */
export function runA11yChecks(variables: EBThemeVariables): A11yCheckSummary {
  const checks: A11yCheckResult[] = [
    ...checkFontSizes(variables),
    ...checkFocusRing(variables),
    ...checkTouchTargets(variables),
    ...checkBorderRadius(variables),
  ];

  const passing = checks.filter((c) => c.status === 'pass').length;
  const warnings = checks.filter((c) => c.status === 'warning').length;
  const failing = checks.filter((c) => c.status === 'fail').length;

  return {
    total: checks.length,
    passing,
    warnings,
    failing,
    checks,
  };
}

