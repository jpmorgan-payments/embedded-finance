import { useTranslationWithTokens } from '@/i18n';
import { PencilLineIcon } from 'lucide-react';

import { Button } from '@/components/ui';

import { useIsMaintenanceBusy } from './MaintenanceBusyContext';

/** The same action, in the same corner of every profile page's header. */
export function MaintenanceRequestChangeButton({
  onClick,
}: {
  onClick: () => void;
}) {
  const { t } = useTranslationWithTokens('approved-client-maintenance');
  const isBusy = useIsMaintenanceBusy();

  return (
    <Button
      size="sm"
      className="eb-shrink-0"
      disabled={isBusy}
      onClick={onClick}
      data-request-change=""
    >
      <PencilLineIcon />
      {t('requestChange.action')}
    </Button>
  );
}
