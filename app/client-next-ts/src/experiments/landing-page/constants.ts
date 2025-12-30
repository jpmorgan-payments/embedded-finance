/**
 * Landing Page Experiment Constants
 *
 * Defines all available landing page experiments with type-safe identifiers.
 */

export enum LandingPageExperiment {
  COMPACT_HOMEPAGE = 'compact-homepage',
  COMPACT_HOMEPAGE_2 = 'compact-homepage2',
  COMPACT_HOMEPAGE_3 = 'compact-homepage3',
}

/**
 * Constant for the compact homepage experiment
 */
export const COMPACT_HOMEPAGE = LandingPageExperiment.COMPACT_HOMEPAGE;

/**
 * Constant for the enhanced compact homepage experiment (v2)
 * Features: animations, quick start snippet, featured cards
 */
export const COMPACT_HOMEPAGE_2 = LandingPageExperiment.COMPACT_HOMEPAGE_2;

/**
 * Constant for the code-first centered homepage experiment (v3)
 * Features: centered layout, code blocks, 3-column cards, horizontal tabs
 */
export const COMPACT_HOMEPAGE_3 = LandingPageExperiment.COMPACT_HOMEPAGE_3;
