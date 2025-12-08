/**
 * Shared utilities for IndirectOwnership stories
 */

import { SELLSENSE_THEME } from '@storybook-themes';

import { EBComponentsProvider } from '@/core/EBComponentsProvider';
import type { EBTheme } from '@/core/EBComponentsProvider/config.types';

import { IndirectOwnership } from '../IndirectOwnership';
import type { IndirectOwnershipProps } from '../IndirectOwnership.types';

// ============================================================================
// Story Wrapper Component
// ============================================================================

interface IndirectOwnershipStoryProps extends IndirectOwnershipProps {
  apiBaseUrl?: string;
  headers?: Record<string, string>;
  theme?: EBTheme;
  contentTokens?: { name: 'enUS' | 'frCA' };
}

export const IndirectOwnershipStory: React.FC<IndirectOwnershipStoryProps> = ({
  apiBaseUrl = 'https://api.example.com',
  headers = {},
  theme = SELLSENSE_THEME,
  contentTokens = { name: 'enUS' as const },
  // IndirectOwnership specific props
  client,
  onOwnershipComplete,
  onValidationChange,
  config,
  readOnly,
  className,
  testId,
}) => {
  return (
    <EBComponentsProvider
      apiBaseUrl={apiBaseUrl}
      headers={headers}
      theme={theme}
      contentTokens={contentTokens}
    >
      <div className="eb-mx-auto eb-max-w-4xl eb-p-6">
        <IndirectOwnership
          client={client}
          onOwnershipComplete={onOwnershipComplete}
          onValidationChange={onValidationChange}
          config={config}
          readOnly={readOnly}
          className={className}
          testId={testId}
        />
      </div>
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
  apiBaseUrl: 'https://api.example.com',
  headers: {},
  theme: SELLSENSE_THEME,
  contentTokens: { name: 'enUS' as const },
  onOwnershipComplete: (owners: any) =>
    console.log('Ownership completed:', owners),
  onValidationChange: (summary: any) =>
    console.log('Validation changed:', summary),
};

/**
 * Common argTypes for IndirectOwnership stories
 */
export const commonArgTypes = {
  apiBaseUrl: {
    control: { type: 'text' as const },
    description: 'API base URL',
    table: {
      category: 'Provider',
    },
  },
  headers: {
    control: { type: 'object' as const },
    description: 'API headers',
    table: {
      category: 'Provider',
    },
  },
  theme: {
    control: { type: 'object' as const },
    description: 'Theme configuration',
    table: {
      category: 'Provider',
    },
  },
  contentTokens: {
    control: { type: 'object' as const },
    description: 'Content tokens configuration',
    table: {
      category: 'Provider',
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
  client: {
    control: { type: 'object' as const },
    description: 'Client data with ownership structure',
    table: {
      category: 'Component',
    },
  },
  onOwnershipComplete: { action: 'onOwnershipComplete' },
  onValidationChange: { action: 'onValidationChange' },
};
