import { useTranslationWithTokens } from '@/i18n';
import {
  AlertTriangleIcon,
  ClipboardListIcon,
  Clock3Icon,
  PencilLineIcon,
} from 'lucide-react';

import type { MaintenanceRequestSummaryState } from '../utils/getMaintenanceRequestSummaryState';

export type MaintenanceUpdateScope = 'product' | 'maintenance' | 'combined';

export function useMaintenanceRequestSummary(
  summaryState: MaintenanceRequestSummaryState,
  updateScope: MaintenanceUpdateScope
) {
  const { t, tString } = useTranslationWithTokens(
    'approved-client-maintenance'
  );
  const Icon =
    summaryState === 'action'
      ? AlertTriangleIcon
      : summaryState === 'draftRequirements'
        ? ClipboardListIcon
        : summaryState === 'submitted'
          ? Clock3Icon
          : PencilLineIcon;
  const title =
    updateScope === 'maintenance'
      ? t(`requestSummary.${summaryState}.title`)
      : tString([
          `updateSummary.${updateScope}.${summaryState}.title`,
        ] as unknown as TemplateStringsArray);
  const description =
    updateScope === 'maintenance'
      ? t(`requestSummary.${summaryState}.description`)
      : tString([
          `updateSummary.${updateScope}.${summaryState}.description`,
        ] as unknown as TemplateStringsArray);
  const actionLabel =
    summaryState === 'draft'
      ? t('submission.reviewAndSubmit')
      : summaryState === 'draftRequirements'
        ? t('requestSummary.completeRequirements')
        : summaryState === 'action'
          ? t('requestSummary.completeRequiredActions')
          : t('requestSummary.viewSubmittedChanges');
  const needsAttention =
    summaryState === 'action' || summaryState === 'draftRequirements';

  return { Icon, title, description, actionLabel, needsAttention };
}
