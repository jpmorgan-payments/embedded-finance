/**
 * Shared type definitions for Storybook stories
 *
 * Location: .storybook/shared-story-types.ts
 *
 * This file contains common prop types that are used across all component stories
 * to ensure consistency and reduce duplication.
 *
 * Import this in your story-utils.tsx files:
 * import { BaseStoryProps, baseStoryDefaults, baseStoryArgTypes } from '../../../../.storybook/shared-story-types';
 */

/// <reference types="vite/client" />

import { defaultResources } from '@/i18n/config';

import { EBTheme } from '../src/core/EBComponentsProvider/config.types';
import { ThemeName, THEMES } from './themes';

/**
 * Base props that are common to all component stories.
 * These correspond to the EBComponentsProvider props and global Storybook controls.
 */
export interface BaseStoryProps {
  /** Base URL for API requests */
  apiBaseUrl: string;
  /** Platform ID for API requests (added to headers) */
  platformId?: string;
  /** Additional headers to pass to API requests */
  headers?: Record<string, string>;
  /** Theme preset name (from THEMES) or 'custom' to use the theme object */
  themePreset?: ThemeName | 'custom';
  /** Custom theme object (only used when themePreset is 'custom') */
  theme?: EBTheme;
  /** Locale/language for content tokens */
  contentTokensPreset?: keyof typeof defaultResources;
  /** Custom content tokens object (only used when contentTokensPreset is 'custom') */
  contentTokens?: Record<string, any>;
}

/**
 * Common default values for base story props
 */
export const baseStoryDefaults: BaseStoryProps = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? '/',
  headers: {
    platform_id: import.meta.env.VITE_API_PLATFORM_ID ?? '',
  },
  themePreset: 'Salt',
  contentTokensPreset: 'enUS',
};

/**
 * Common argTypes for base story props.
 * These can be spread into individual story argTypes definitions.
 */
export const baseStoryArgTypes = {
  apiBaseUrl: {
    control: { type: 'text' },
    description: 'Base URL for API requests',
    table: {
      category: 'Provider',
    },
  },
  headers: {
    control: { type: 'object' },
    description: 'Additional headers for API requests',
    table: {
      category: 'Provider',
    },
  },
  themePreset: {
    control: { type: 'radio' },
    options: ['custom', ...Object.keys(THEMES)],
    description:
      'Select a theme preset or choose "custom" to edit the theme object',
    table: {
      category: 'Provider',
      defaultValue: { summary: 'Salt' },
    },
  },
  theme: {
    control: { type: 'object' },
    description:
      'Theme configuration object (editable when themePreset is "custom")',
    table: {
      category: 'Provider',
    },
    if: { arg: 'themePreset', eq: 'custom' },
  },
  contentTokensPreset: {
    control: { type: 'select' },
    options: ['custom', ...Object.keys(defaultResources)],
    description: 'Content token preset',
    table: {
      category: 'Provider',
      defaultValue: { summary: 'enUS' },
    },
  },
  contentTokens: {
    control: { type: 'object' },
    description: 'Content tokens object',
    table: {
      category: 'Provider',
    },
    if: { arg: 'contentTokensPreset', eq: 'custom' },
  },
} as const;
