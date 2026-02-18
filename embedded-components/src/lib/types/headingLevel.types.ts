/**
 * Heading Level Types - Accessibility support for semantic heading hierarchy
 *
 * These types enable consuming applications to maintain proper heading hierarchy
 * when embedding components at different levels of their page structure.
 */

/**
 * Valid HTML heading levels (1-6)
 */
export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

/**
 * Props for components that support configurable heading levels
 */
export interface HeadingLevelProps {
  /**
   * The heading level for the component's main title.
   * This allows consuming applications to maintain proper heading hierarchy.
   *
   * - Use `1` if the component title should be the page's main heading
   * - Use `2` (default) when the component is a section within a page
   * - Use `3` or higher for nested sections
   *
   * Child headings within the component will automatically use derived levels
   * (e.g., if headingLevel is 2, child section headings will be h3).
   *
   * @default 2
   */
  headingLevel?: HeadingLevel;
}

/**
 * Calculates the next heading level (clamped to valid range 1-6)
 *
 * @param level - Current heading level
 * @param offset - How many levels deeper (default: 1)
 * @returns The next heading level, clamped to 6
 *
 * @example
 * getChildHeadingLevel(2) // returns 3
 * getChildHeadingLevel(5, 2) // returns 6 (clamped)
 */
export function getChildHeadingLevel(
  level: HeadingLevel,
  offset: number = 1
): HeadingLevel {
  return Math.min(6, level + offset) as HeadingLevel;
}

/**
 * Creates a heading element tag name from a level
 *
 * @param level - Heading level (1-6)
 * @returns Heading tag name ('h1' through 'h6')
 *
 * @example
 * getHeadingTag(2) // returns 'h2'
 */
export function getHeadingTag(
  level: HeadingLevel
): 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' {
  return `h${level}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
}
