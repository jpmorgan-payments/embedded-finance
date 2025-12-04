/**
 * Shared utilities for IndirectOwnership stories
 */

import {
  baseStoryArgTypes,
  baseStoryDefaults,
  BaseStoryProps,
  resolveTheme,
} from '@storybook/shared-story-types';

import { EBComponentsProvider } from '@/core/EBComponentsProvider';
import { IndirectOwnership } from '../IndirectOwnership';
import type { IndirectOwnershipProps } from '../IndirectOwnership.types';

// ============================================================================
// Story Wrapper Component
// ============================================================================

/**
 * Props for IndirectOwnership stories.
 * Extends BaseStoryProps for common provider/theme configuration.
 */
export interface IndirectOwnershipStoryProps extends BaseStoryProps, IndirectOwnershipProps {}

export const IndirectOwnershipStory: React.FC<IndirectOwnershipStoryProps> = ({
  apiBaseUrl,
  clientId,
  headers,
  themePreset = 'Salt',
  theme: customTheme,
  contentTokensPreset = 'enUS',
  contentTokens,
  // IndirectOwnership specific props
  rootCompanyName,
  onOwnershipComplete,
  onValidationChange,
  initialOwners,
  config,
  readOnly,
  className,
  testId,
}) => {
  // Resolve theme: use custom theme if themePreset is 'custom', otherwise use preset
  const selectedTheme = resolveTheme(themePreset, customTheme);

  const selectedContentTokens = contentTokens ?? { name: contentTokensPreset };

  return (
    <EBComponentsProvider
      apiBaseUrl={apiBaseUrl}
      headers={headers}
      theme={selectedTheme}
      contentTokens={selectedContentTokens}
      clientId={clientId ?? ''}
    >
      <IndirectOwnership
        rootCompanyName={rootCompanyName}
        onOwnershipComplete={onOwnershipComplete}
        onValidationChange={onValidationChange}
        initialOwners={initialOwners}
        config={config}
        readOnly={readOnly}
        className={className}
        testId={testId}
      />
    </EBComponentsProvider>
  );
};

// ============================================================================
// Common Story Configuration
// ============================================================================

/**
 * Common args for IndirectOwnership stories
 */
export const commonArgs = {
  ...baseStoryDefaults,
  onOwnershipComplete: (owners: any) => console.log('Ownership completed:', owners),
  onValidationChange: (summary: any) => console.log('Validation changed:', summary),
};

/**
 * Common argTypes for IndirectOwnership stories
 */
export const commonArgTypes = {
  ...baseStoryArgTypes,
  rootCompanyName: {
    control: { type: 'text' as const },
    description: 'Name of the company being onboarded',
    table: {
      category: 'Component',
    },
  },
  readOnly: {
    control: { type: 'boolean' as const },
    description: 'Whether the component is in read-only mode',
    table: {
      category: 'Component',
      defaultValue: { summary: 'false' },
    },
  },
  initialOwners: {
    control: { type: 'object' as const },
    description: 'Pre-populated beneficial owners for editing scenarios',
    table: {
      category: 'Component',
    },
  },
  onOwnershipComplete: { action: 'onOwnershipComplete' },
  onValidationChange: { action: 'onValidationChange' },
};
