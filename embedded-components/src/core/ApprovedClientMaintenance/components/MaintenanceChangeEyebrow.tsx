import { useTranslationWithTokens } from '@/i18n';
import { PencilLineIcon } from 'lucide-react';

/** Marks a page as part of a change request rather than the profile itself. */
export function MaintenanceChangeEyebrow() {
  const { t } = useTranslationWithTokens('approved-client-maintenance');

  return (
    <p
      data-change-eyebrow=""
      className="eb-mb-1 eb-inline-flex eb-items-center eb-gap-1.5 eb-text-xs eb-font-semibold eb-uppercase eb-tracking-wider eb-text-primary"
    >
      <PencilLineIcon className="eb-size-3.5" aria-hidden="true" />
      {t('requestChange.action')}
    </p>
  );
}

export const PAGE_CLASS =
  'eb-component eb-w-full eb-overflow-hidden eb-rounded eb-border eb-bg-background';
export const HEADER_CLASS = 'eb-border-b eb-px-4 eb-py-4';
/** Header and card accents shared by every page in a change request. */
export const CHANGE_CARD_CLASS = 'eb-border-primary/40';
export const CHANGE_HEADER_CLASS = 'eb-border-primary/30 eb-bg-primary/5';
