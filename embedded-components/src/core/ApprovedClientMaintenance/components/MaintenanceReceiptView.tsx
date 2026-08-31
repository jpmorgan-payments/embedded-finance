import { useTranslationWithTokens } from '@/i18n';
import { CheckCircle2Icon } from 'lucide-react';

import { Button } from '@/components/ui';

type MaintenanceReceiptViewProps = {
  requestId?: string;
  acceptedAt?: string;
  receivedAt: string;
  onReturn: () => void;
};

export function MaintenanceReceiptView({
  requestId,
  acceptedAt,
  receivedAt,
  onReturn,
}: MaintenanceReceiptViewProps) {
  const { t } = useTranslationWithTokens('approved-client-maintenance');
  const timestamp = new Date(acceptedAt ?? receivedAt);

  return (
    <div className="eb-component eb-w-full eb-overflow-hidden eb-rounded eb-border eb-bg-background eb-p-6">
      <CheckCircle2Icon className="eb-size-7 eb-text-success" />
      <h2 className="eb-mt-3 eb-text-lg eb-font-semibold">
        {t('submission.receiptTitle')}
      </h2>
      <p className="eb-mt-1 eb-text-sm eb-text-muted-foreground">
        {t('submission.receiptDescription', {
          date: timestamp.toLocaleString(),
        })}
      </p>
      <p className="eb-mt-2 eb-text-sm eb-text-muted-foreground">
        {t('submission.profileRemainsActive')}
      </p>
      {requestId ? (
        <p className="eb-mt-4 eb-text-xs eb-text-muted-foreground">
          {t('flow.changeSet', { requestId })}
        </p>
      ) : null}
      <Button className="eb-mt-6" onClick={onReturn}>
        {t('submission.returnToProfile')}
      </Button>
    </div>
  );
}
