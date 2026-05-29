/**
 * Color contrast utility following WCAG 2.1 guidelines
 * Calculates contrast ratios between foreground and background colors
 */

export interface ContrastResult {
  ratio: number;
  passes: {
    AA: {
      normal: boolean; // 4.5:1
      large: boolean; // 3:1
    };
    AAA: {
      normal: boolean; // 7:1
      large: boolean; // 4.5:1
    };
  };
  level: 'AAA' | 'AA' | 'Fail';
  recommendation?: string;
}

/**
 * Parse any color format to RGB
 */
function parseColor(color: string): { r: number; g: number; b: number } | null {
  if (!color || typeof color !== 'string') {
    return null;
  }

  const trimmed = color.trim();

  // Handle hex colors
  if (trimmed.startsWith('#')) {
    const hex = trimmed.slice(1);
    if (hex.length === 3) {
      const r = parseInt(hex[0] + hex[0], 16);
      const g = parseInt(hex[1] + hex[1], 16);
      const b = parseInt(hex[2] + hex[2], 16);
      return { r, g, b };
    }
    if (hex.length === 6) {
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      return { r, g, b };
    }
    return null;
  }

  // Handle rgb/rgba
  const rgbMatch = trimmed.match(
    /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/
  );
  if (rgbMatch) {
    return {
      r: parseInt(rgbMatch[1], 10),
      g: parseInt(rgbMatch[2], 10),
      b: parseInt(rgbMatch[3], 10),
    };
  }

  // Handle hsl/hsla (convert to RGB)
  const hslMatch = trimmed.match(
    /hsla?\((\d+),\s*(\d+)%,\s*(\d+)%(?:,\s*[\d.]+)?\)/
  );
  if (hslMatch) {
    const h = parseInt(hslMatch[1], 10) / 360;
    const s = parseInt(hslMatch[2], 10) / 100;
    const l = parseInt(hslMatch[3], 10) / 100;

    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h * 6) % 2) - 1));
    const m = l - c / 2;

    let r = 0,
      g = 0,
      b = 0;

    if (h < 1 / 6) {
      r = c;
      g = x;
    } else if (h < 2 / 6) {
      r = x;
      g = c;
    } else if (h < 3 / 6) {
      g = c;
      b = x;
    } else if (h < 4 / 6) {
      g = x;
      b = c;
    } else if (h < 5 / 6) {
      r = x;
      b = c;
    } else {
      r = c;
      b = x;
    }

    return {
      r: Math.round((r + m) * 255),
      g: Math.round((g + m) * 255),
      b: Math.round((b + m) * 255),
    };
  }

  // Handle named colors (basic set)
  const namedColors: Record<string, { r: number; g: number; b: number }> = {
    black: { r: 0, g: 0, b: 0 },
    white: { r: 255, g: 255, b: 255 },
    red: { r: 255, g: 0, b: 0 },
    green: { r: 0, g: 128, b: 0 },
    blue: { r: 0, g: 0, b: 255 },
    yellow: { r: 255, g: 255, b: 0 },
    cyan: { r: 0, g: 255, b: 255 },
    magenta: { r: 255, g: 0, b: 255 },
    gray: { r: 128, g: 128, b: 128 },
    grey: { r: 128, g: 128, b: 128 },
    transparent: { r: 255, g: 255, b: 255 }, // Treat transparent as white
  };

  const lower = trimmed.toLowerCase();
  if (namedColors[lower]) {
    return namedColors[lower];
  }

  return null;
}

/**
 * Calculate relative luminance of a color (WCAG formula)
 */
function getRelativeLuminance(color: string): number {
  const rgb = parseColor(color);
  if (!rgb) {
    return 0;
  }

  // Normalize RGB values to 0-1
  const rsRGB = rgb.r / 255;
  const gsRGB = rgb.g / 255;
  const bsRGB = rgb.b / 255;

  // Apply gamma correction
  const r =
    rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
  const g =
    gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
  const b =
    bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);

  // Calculate relative luminance
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Calculate contrast ratio between two colors
 */
export function calculateContrast(
  foreground: string,
  background: string
): ContrastResult | null {
  try {
    const fgLuminance = getRelativeLuminance(foreground);
    const bgLuminance = getRelativeLuminance(background);

    if (isNaN(fgLuminance) || isNaN(bgLuminance)) {
      return null;
    }

    // Contrast ratio formula: (L1 + 0.05) / (L2 + 0.05)
    // where L1 is the lighter color and L2 is the darker color
    const lighter = Math.max(fgLuminance, bgLuminance);
    const darker = Math.min(fgLuminance, bgLuminance);
    const ratio = (lighter + 0.05) / (darker + 0.05);

    // WCAG 2.1 thresholds
    const passesAA = {
      normal: ratio >= 4.5,
      large: ratio >= 3.0,
    };

    const passesAAA = {
      normal: ratio >= 7.0,
      large: ratio >= 4.5,
    };

    // Determine overall level
    let level: 'AAA' | 'AA' | 'Fail';
    if (passesAAA.normal) {
      level = 'AAA';
    } else if (passesAA.normal) {
      level = 'AA';
    } else {
      level = 'Fail';
    }

    // Generate recommendation
    let recommendation: string | undefined;
    if (level === 'Fail') {
      const isFgLighter = fgLuminance > bgLuminance;
      if (isFgLighter) {
        recommendation =
          'Consider using a darker foreground color or lighter background';
      } else {
        recommendation =
          'Consider using a lighter foreground color or darker background';
      }
    }

    return {
      ratio: Math.round(ratio * 100) / 100, // Round to 2 decimal places
      passes: {
        AA: passesAA,
        AAA: passesAAA,
      },
      level,
      recommendation,
    };
  } catch (error) {
    console.error('Contrast calculation error:', error);
    return null;
  }
}

/**
 * Cache for contrast calculations
 */
const contrastCache = new Map<string, ContrastResult | null>();

/**
 * Get cached contrast result or calculate new one
 */
export function getCachedContrast(
  foreground: string,
  background: string
): ContrastResult | null {
  const key = `${foreground}-${background}`;
  if (contrastCache.has(key)) {
    return contrastCache.get(key)!;
  }

  const result = calculateContrast(foreground, background);
  contrastCache.set(key, result);
  return result;
}

/**
 * Clear contrast cache (useful for testing or memory management)
 */
export function clearContrastCache(): void {
  contrastCache.clear();
}
