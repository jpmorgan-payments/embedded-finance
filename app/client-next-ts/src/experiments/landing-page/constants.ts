/**
 * Landing Page Experiment Constants
 *
 * Defines all available landing page experiments with type-safe identifiers.
 */

export enum LandingPageExperiment {
  COMPACT_HOMEPAGE = 'compact-homepage',
  COMPACT_HOMEPAGE_2 = 'compact-homepage2',
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
