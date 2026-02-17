import React from 'react';
import { LandmarkIcon, PlusCircleIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { HeadingLevel } from '@/lib/types/headingLevel.types';
import { getHeadingTag } from '@/lib/types/headingLevel.types';
import { cn } from '@/lib/utils';

import { RecipientI18nNamespace } from '../../types';

export interface EmptyStateProps {
  /** Optional custom message */
  message?: string;
  /** Optional custom description */
  description?: string;
  /** Optional CSS class name */
  className?: string;
  /** Optional action element (e.g., a button to link a new account) */
  action?: React.ReactNode;
  /** Compact mode - reduces height and removes non-crucial elements */
  compact?: boolean;
  /**
   * i18n namespace to use for translations
   * @default 'linked-accounts'
   */
  i18nNamespace?: RecipientI18nNamespace;
  /**
   * Heading level for the empty state title.
   * Should be one level below the parent widget's heading.
   *
   * @default 3
   */
  headingLevel?: HeadingLevel;
}

/**
 * EmptyState - Displays when no linked accounts are found
 * Enhanced with icon and helpful description
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  message,
  description,
  className,
  action,
  compact = false,
  i18nNamespace = 'linked-accounts',
  headingLevel = 3,
}) => {
  const { t } = useTranslation(i18nNamespace);
  const Heading = getHeadingTag(headingLevel);

  return (
    <div
      className={cn(
        'eb-flex eb-flex-col eb-items-center eb-justify-center eb-text-center',
        compact ? 'eb-space-y-2 eb-py-4' : 'eb-space-y-3 eb-py-12',
        className
      )}
    >
      {!compact && (
        <div className="eb-relative">
          <div className="eb-rounded-full eb-bg-muted eb-p-4">
            <LandmarkIcon className="eb-h-8 eb-w-8 eb-text-muted-foreground" />
          </div>
          <div className="eb-absolute -eb-bottom-1 -eb-right-1 eb-rounded-full eb-bg-background eb-p-0.5">
            <PlusCircleIcon className="eb-h-4 eb-w-4 eb-text-muted-foreground" />
          </div>
        </div>
      )}
      <div className="eb-mb-2 eb-space-y-1">
        <Heading
          className={cn(
            'eb-font-semibold eb-text-foreground',
            compact ? 'eb-text-sm' : 'eb-text-base'
          )}
        >
          {message || t('emptyState.title')}
        </Heading>
        <p
          className={cn(
            'eb-text-muted-foreground',
            compact ? 'eb-text-xs' : 'eb-max-w-sm eb-text-sm'
          )}
        >
          {description || t('emptyState.description')}
        </p>
      </div>
      {action}
    </div>
  );
};
