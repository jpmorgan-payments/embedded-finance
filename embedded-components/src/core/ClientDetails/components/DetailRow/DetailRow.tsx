/**
 * DetailRow - Renders a single label/value row (ReviewSection-style).
 */
import type { ReactNode } from 'react';

import { useTranslationWithTokens } from '@/components/i18n';

interface DetailRowProps {
  /** Label - can be a translated ReactNode from t() */
  label: ReactNode;
  /** Value - can be a string, boolean, array, or ReactNode */
  value: ReactNode | string[] | boolean | undefined;
}

export function DetailRow({ label, value }: DetailRowProps) {
  const { t } = useTranslationWithTokens('client-details');

  if (value === undefined || value === null || value === '') return null;

  let display: ReactNode;
  if (typeof value === 'boolean') {
    display = value ? t('booleanValues.true') : t('booleanValues.false');
  } else if (Array.isArray(value)) {
    display = value.join(', ');
  } else {
    display = String(value);
  }

  if (!display) return null;

  return (
    <div className="eb-flex eb-items-start eb-justify-between eb-gap-4 eb-py-2 eb-text-sm">
      <dt className="eb-shrink-0 eb-font-medium eb-text-muted-foreground">
        {label}
      </dt>
      <dd className="eb-min-w-0 eb-break-words eb-text-right eb-text-foreground">
        {display}
      </dd>
    </div>
  );
}
