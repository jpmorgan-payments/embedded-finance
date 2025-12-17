# Color Contrast Checker - Requirements & Design

## Overview

Add real-time WCAG color contrast validation to the theme customization drawer to help users create accessible color combinations that meet web accessibility standards.

## Problem Statement

Users customizing theme colors may inadvertently create color combinations with insufficient contrast, making content difficult to read, especially for users with visual impairments. This violates WCAG accessibility guidelines and creates poor user experiences.

## Goals

1. **Real-time Validation**: Check color contrast ratios as users modify theme colors
2. **WCAG Compliance**: Support WCAG 2.1 Level AA and AAA standards
3. **Clear Feedback**: Visual indicators showing pass/fail status with specific ratio values
4. **Educational**: Help users understand accessibility requirements
5. **Non-Intrusive**: Don't block users, but inform them of accessibility issues

## Non-Goals

- Automatic color correction/suggestion (v1)
- Contrast checking for images or gradients (v1)
- Support for WCAG 3.0 APCA algorithm (future consideration)

## WCAG Color Contrast Standards

### WCAG 2.1 Level AA (Minimum)
- **Normal Text**: 4.5:1 minimum contrast ratio
- **Large Text**: 3:1 minimum contrast ratio (18pt+ or 14pt+ bold)
- **UI Components**: 3:1 minimum for interactive elements

### WCAG 2.1 Level AAA (Enhanced)
- **Normal Text**: 7:1 minimum contrast ratio
- **Large Text**: 4.5:1 minimum contrast ratio

### Text Size Definitions
- **Normal Text**: < 18pt (24px) regular or < 14pt (18.7px) bold
- **Large Text**: ≥ 18pt (24px) regular or ≥ 14pt (18.7px) bold

## Technical Requirements

### 1. Color Contrast Calculation Utility

**File**: `app/client-next-ts/src/lib/color-contrast.ts`

```typescript
/**
 * Color contrast utility following WCAG 2.1 guidelines
 */

export interface ContrastResult {
  ratio: number;
  AANormal: boolean;      // 4.5:1
  AALarge: boolean;       // 3:1
  AAA Normal: boolean;    // 7:1
  AAALarge: boolean;      // 4.5:1
  level: 'AAA' | 'AA' | 'Fail';
}

/**
 * Calculate relative luminance of a color (WCAG formula)
 */
function getRelativeLuminance(color: string): number;

/**
 * Calculate contrast ratio between two colors
 */
export function calculateContrast(foreground: string, background: string): ContrastResult;

/**
 * Parse any color format to RGB
 */
function parseColor(color: string): { r: number; g: number; b: number } | null;
```

**Supported Color Formats**:
- Hex: `#ff0000`, `#f00`
- RGB: `rgb(255, 0, 0)`
- RGBA: `rgba(255, 0, 0, 0.5)`
- HSL: `hsl(0, 100%, 50%)`
- HSLA: `hsla(0, 100%, 50%, 0.5)`
- Named colors: `red`, `blue`, etc.

**Algorithm** (WCAG 2.1):
```
Relative Luminance (L) = 0.2126 * R + 0.7152 * G + 0.0722 * B
where R, G, B are gamma-corrected values:
  if RsRGB <= 0.03928 then R = RsRGB/12.92 
  else R = ((RsRGB+0.055)/1.055)^2.4

Contrast Ratio = (L1 + 0.05) / (L2 + 0.05)
where L1 is the lighter color and L2 is the darker color
```

### 2. Contrast Checker Component

**File**: `app/client-next-ts/src/components/sellsense/contrast-checker.tsx`

```typescript
interface ContrastCheckerProps {
  foreground: string;
  background: string;
  label?: string;
  textSize?: 'normal' | 'large';
  showRatio?: boolean;
  compact?: boolean;
}

export function ContrastChecker({
  foreground,
  background,
  label = 'Contrast',
  textSize = 'normal',
  showRatio = true,
  compact = false,
}: ContrastCheckerProps): JSX.Element;
```

**Visual Design**:

```
┌─────────────────────────────────────────┐
│ Primary Button Contrast                 │
│                                          │
│ Ratio: 4.52:1                           │
│ ✓ AA (Normal)   ✓ AA (Large)           │
│ ✗ AAA (Normal)  ✓ AAA (Large)          │
│                                          │
│ [Preview: "Sample Text"]                │
└─────────────────────────────────────────┘
```

**Compact Mode**:
```
[✓ 4.52:1] or [✗ 2.1:1]
```

**States**:
- **Pass AAA**: Green indicator (✓ 7:1)
- **Pass AA**: Yellow/amber indicator (✓ 4.5:1)
- **Fail**: Red indicator (✗ 2.1:1)

### 3. Color Pair Mapping

**File**: `app/client-next-ts/src/components/sellsense/theme-color-pairs.ts`

Map design tokens to their foreground/background relationships:

```typescript
export interface ColorPair {
  background: keyof EBThemeVariables;
  foreground: keyof EBThemeVariables;
  label: string;
  context: 'text' | 'button' | 'input' | 'status';
  textSize?: 'normal' | 'large';
}

export const COLOR_PAIRS: ColorPair[] = [
  // Primary buttons
  {
    background: 'actionableAccentedBoldBackground',
    foreground: 'actionableAccentedBoldForeground',
    label: 'Primary Button',
    context: 'button',
  },
  {
    background: 'actionableAccentedBoldBackgroundHover',
    foreground: 'actionableAccentedBoldForegroundHover',
    label: 'Primary Button (Hover)',
    context: 'button',
  },
  
  // Secondary buttons
  {
    background: 'actionableSubtleBackground',
    foreground: 'actionableSubtleForeground',
    label: 'Secondary Button',
    context: 'button',
  },
  
  // Container text
  {
    background: 'containerPrimaryBackground',
    foreground: 'contentPrimaryForeground',
    label: 'Body Text',
    context: 'text',
    textSize: 'normal',
  },
  {
    background: 'containerCardBackground',
    foreground: 'containerPrimaryForeground',
    label: 'Card Text',
    context: 'text',
  },
  
  // Form inputs
  {
    background: 'editableBackground',
    foreground: 'containerPrimaryForeground',
    label: 'Input Field',
    context: 'input',
  },
  {
    background: 'containerPrimaryBackground',
    foreground: 'editableLabelForeground',
    label: 'Form Label',
    context: 'text',
    textSize: 'normal',
  },
  
  // Status colors
  {
    background: 'sentimentPositiveAccentBackground',
    foreground: 'sentimentPositiveForeground',
    label: 'Success Message',
    context: 'status',
  },
  {
    background: 'sentimentNegativeAccentBackground',
    foreground: 'actionableNegativeBoldForeground',
    label: 'Error Message',
    context: 'status',
  },
  {
    background: 'sentimentCautionAccentBackground',
    foreground: 'sentimentCautionForeground',
    label: 'Warning Message',
    context: 'status',
  },
  
  // Navigation
  {
    background: 'navigableBackground',
    foreground: 'navigableForeground',
    label: 'Sidebar Text',
    context: 'text',
  },
  {
    background: 'navigableAccentBackground',
    foreground: 'navigableAccentForeground',
    label: 'Sidebar Active',
    context: 'text',
  },
  
  // Overlays
  {
    background: 'overlayableBackground',
    foreground: 'overlayableForeground',
    label: 'Dialog/Popover',
    context: 'text',
  },
];
```

## UI/UX Design

### Integration into Theme Customization Drawer

**Location**: Add a new collapsible section below the token groups

```
┌─────────────────────────────────────────┐
│ Theme Customization                     │
├─────────────────────────────────────────┤
│ [Base Theme Dropdown]                   │
│ [Copy] [Share] [Import]                 │
├─────────────────────────────────────────┤
│ ▼ Actionable (32)                       │
│ ▼ Container (5)                         │
│ ...                                      │
├─────────────────────────────────────────┤
│ ▼ Accessibility Check                   │  ← NEW SECTION
│                                          │
│   Overall Status: ⚠ 12/18 Pairs Pass   │
│   AA: 12 pass, 6 fail                   │
│   AAA: 8 pass, 10 fail                  │
│                                          │
│   [Show Details ▼]                      │
│                                          │
│   ┌─ Color Pairs ─────────────────┐    │
│   │ Primary Button                 │    │
│   │ Ratio: 4.52:1                  │    │
│   │ ✓ AA  ✗ AAA                    │    │
│   │ [Preview Sample]               │    │
│   ├────────────────────────────────┤    │
│   │ Body Text                      │    │
│   │ Ratio: 8.1:1                   │    │
│   │ ✓ AA  ✓ AAA                    │    │
│   │ [Preview Sample]               │    │
│   └────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

### Visual Indicators

**Badge System**:
```tsx
// Pass AAA
<Badge variant="success" className="bg-green-100 text-green-800">
  ✓ 8.1:1 AAA
</Badge>

// Pass AA only
<Badge variant="warning" className="bg-amber-100 text-amber-800">
  ✓ 4.5:1 AA
</Badge>

// Fail
<Badge variant="destructive" className="bg-red-100 text-red-800">
  ✗ 2.3:1 Fail
</Badge>
```

**Color Swatches**:
```tsx
<div className="flex items-center gap-2">
  <div 
    className="w-6 h-6 rounded border"
    style={{ backgroundColor: foreground }}
    title="Foreground color"
  />
  <div 
    className="w-6 h-6 rounded border"
    style={{ backgroundColor: background }}
    title="Background color"
  />
  <span className="text-xs">→</span>
  <ContrastBadge ratio={4.52} />
</div>
```

**Live Preview**:
```tsx
<div 
  className="p-2 rounded text-center text-sm"
  style={{
    backgroundColor: background,
    color: foreground,
  }}
>
  Sample Text
</div>
```

### Interaction Design

**1. Collapsible Section**:
- Default: Collapsed with summary (12/18 pairs pass)
- Expand to see detailed breakdown
- Sticky header when scrolling through pairs

**2. Filter Options**:
```tsx
<div className="flex gap-2 mb-3">
  <Button variant="outline" size="sm">
    All (18)
  </Button>
  <Button variant="outline" size="sm">
    Failing (6)
  </Button>
  <Button variant="outline" size="sm">
    AA Only (4)
  </Button>
</div>
```

**3. Contextual Help**:
- Info icon (ℹ) next to section title
- Tooltip explaining WCAG standards
- Link to WCAG documentation

**4. Export Report**:
- Button to export contrast report as JSON/CSV
- Include all color pairs with ratios and pass/fail status

## Implementation Details

### Calculation Performance

**Optimization Strategies**:

1. **Memoization**: Cache contrast calculations
   ```typescript
   const contrastCache = new Map<string, ContrastResult>();
   
   function getCachedContrast(fg: string, bg: string): ContrastResult {
     const key = `${fg}-${bg}`;
     if (!contrastCache.has(key)) {
       contrastCache.set(key, calculateContrast(fg, bg));
     }
     return contrastCache.get(key)!;
   }
   ```

2. **Debouncing**: Delay calculation while user types color values
   ```typescript
   const debouncedCalculate = useMemo(
     () => debounce((fg, bg) => calculateContrast(fg, bg), 300),
     []
   );
   ```

3. **Lazy Calculation**: Only calculate visible pairs (virtualization)
   ```typescript
   // Calculate only when section is expanded
   const [isExpanded, setIsExpanded] = useState(false);
   ```

### Color Format Handling

**Strategy**: Convert all formats to RGB for calculation

```typescript
// Use existing ColorTranslator library if available
import { ColorTranslator } from 'colortranslator';

function parseColor(color: string): { r: number; g: number; b: number } | null {
  try {
    const ct = new ColorTranslator(color);
    return { r: ct.R, g: ct.G, b: ct.B };
  } catch {
    return null;
  }
}
```

**Fallback Values**:
- Invalid colors: Show warning, use black (#000000)
- Undefined tokens: Skip contrast check
- Transparent colors: Use background with alpha blending

### Error Handling

```typescript
function calculateContrast(fg: string, bg: string): ContrastResult | null {
  try {
    const fgRGB = parseColor(fg);
    const bgRGB = parseColor(bg);
    
    if (!fgRGB || !bgRGB) {
      return null; // Invalid colors
    }
    
    // Calculate contrast...
    
  } catch (error) {
    console.error('Contrast calculation error:', error);
    return null;
  }
}
```

### Accessibility

The contrast checker itself must be accessible:

- **Keyboard Navigation**: Full keyboard support for expanding/collapsing
- **Screen Reader**: Proper ARIA labels for pass/fail status
- **Focus Management**: Clear focus indicators
- **Color Independence**: Don't rely solely on color (use icons + text)

```tsx
<div 
  role="region" 
  aria-label="Color contrast validation results"
>
  <button
    aria-expanded={isExpanded}
    aria-controls="contrast-details"
    onClick={() => setIsExpanded(!isExpanded)}
  >
    Accessibility Check
    <span className="sr-only">
      {failingCount > 0 ? `${failingCount} pairs failing` : 'All pairs passing'}
    </span>
  </button>
  
  {isExpanded && (
    <div id="contrast-details">
      {/* Contrast pair details */}
    </div>
  )}
</div>
```

## Data Structures

### Contrast Result
```typescript
interface ContrastResult {
  ratio: number;              // e.g., 4.52
  passes: {
    AA: {
      normal: boolean;        // 4.5:1
      large: boolean;         // 3:1
    };
    AAA: {
      normal: boolean;        // 7:1
      large: boolean;         // 4.5:1
    };
  };
  level: 'AAA' | 'AA' | 'Fail';
  recommendation?: string;    // e.g., "Consider darker foreground"
}
```

### Summary Stats
```typescript
interface ContrastSummary {
  total: number;
  passing: {
    AA: number;
    AAA: number;
  };
  failing: number;
  pairs: {
    label: string;
    result: ContrastResult;
    foreground: string;
    background: string;
  }[];
}
```

## Testing Requirements

### Unit Tests

1. **Color Parsing**:
   - Test all color formats (hex, rgb, hsl, named)
   - Test invalid colors
   - Test edge cases (black, white, transparent)

2. **Luminance Calculation**:
   - Test known color values
   - Verify gamma correction
   - Test boundary conditions

3. **Contrast Ratio**:
   - Test WCAG example values
   - Verify ratio calculation formula
   - Test color order independence

4. **WCAG Compliance**:
   - Test threshold values (4.5:1, 3:1, 7:1, 4.5:1)
   - Test text size variants
   - Test level determination (AA, AAA, Fail)

### Integration Tests

1. **Component Rendering**:
   - Render with valid color pairs
   - Render with invalid colors
   - Test compact vs. full mode

2. **Theme Integration**:
   - Test with different theme variables
   - Test with custom theme values
   - Test real-time updates

3. **User Interactions**:
   - Expand/collapse functionality
   - Filter functionality
   - Export functionality

### Visual Regression Tests

1. Different contrast ratios (passing/failing)
2. Different themes (light/dark)
3. Different viewport sizes (responsive)

## Performance Benchmarks

Target metrics:

- **Calculation Time**: < 1ms per color pair
- **Initial Render**: < 100ms for all pairs
- **Update Time**: < 50ms when color changes
- **Memory Usage**: < 1MB for cache

## Documentation

### User Documentation

**Location**: Add section to theme customization guide

```markdown
## Accessibility - Color Contrast Checking

The theme editor includes a built-in accessibility checker that validates
color contrast ratios according to WCAG 2.1 guidelines.

### Understanding Contrast Ratios

- **4.5:1** - Minimum for normal text (WCAG AA)
- **3:1** - Minimum for large text (WCAG AA)
- **7:1** - Enhanced for normal text (WCAG AAA)

### Using the Checker

1. Expand the "Accessibility Check" section
2. Review the overall status
3. Click on individual pairs to see details
4. Adjust colors until all pairs pass

### Troubleshooting

If a color pair fails:
- Increase the darkness of dark colors
- Increase the lightness of light colors
- Consider using the suggested color values
```

### Developer Documentation

```markdown
## Contrast Checker API

### calculateContrast(foreground, background)

Calculates WCAG 2.1 contrast ratio between two colors.

**Parameters:**
- foreground: string - Any valid CSS color
- background: string - Any valid CSS color

**Returns:** ContrastResult | null

**Example:**
```typescript
const result = calculateContrast('#ffffff', '#000000');
// { ratio: 21, level: 'AAA', passes: { AA: {...}, AAA: {...} } }
```
```

## Implementation Phases

### Phase 1: Core Calculation (Week 1)
- [ ] Implement color-contrast.ts utility
- [ ] Write unit tests for contrast calculation
- [ ] Validate against WCAG test cases

### Phase 2: Basic UI (Week 1-2)
- [ ] Create ContrastChecker component
- [ ] Implement basic badge/indicator system
- [ ] Add color pair definitions

### Phase 3: Integration (Week 2)
- [ ] Integrate into theme drawer
- [ ] Add collapsible section
- [ ] Wire up to theme state

### Phase 4: Enhancement (Week 3)
- [ ] Add filter functionality
- [ ] Implement export feature
- [ ] Add contextual help/tooltips
- [ ] Performance optimization

### Phase 5: Polish (Week 3-4)
- [ ] Visual design refinement
- [ ] Accessibility audit
- [ ] User testing
- [ ] Documentation

## Success Metrics

1. **Adoption**: % of users who expand the contrast checker
2. **Impact**: Reduction in failing contrast ratios in shared themes
3. **Usability**: Time to fix a failing contrast pair
4. **Performance**: Calculation time < 1ms
5. **Accuracy**: 100% match with official WCAG calculators

## Future Enhancements (v2)

1. **Auto-Suggest**: Recommend color adjustments to pass WCAG
2. **Bulk Fix**: One-click to fix all failing pairs
3. **Color Blindness Simulation**: Preview theme with different vision types
4. **WCAG 3.0**: Support APCA (Advanced Perceptual Contrast Algorithm)
5. **Export Report**: PDF/HTML accessibility report
6. **Historical Tracking**: Track contrast improvements over time
7. **Team Collaboration**: Share accessibility reports with team

## References

- [WCAG 2.1 Contrast Guidelines](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Contrast Ratio Math](https://www.w3.org/TR/WCAG20-TECHS/G17.html)
- [MDN: Color Contrast](https://developer.mozilla.org/en-US/docs/Web/Accessibility/Understanding_WCAG/Perceivable/Color_contrast)
