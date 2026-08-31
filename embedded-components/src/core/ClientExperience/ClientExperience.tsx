import { useEffect, useMemo } from 'react';
import { useTranslationWithTokens } from '@/i18n';
import { AlertCircleIcon, RefreshCwIcon } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ServerErrorAlert } from '@/components/ServerErrorAlert';
import { Button, Skeleton } from '@/components/ui';
import { ApprovedClientMaintenanceWorkspace } from '@/core/ApprovedClientMaintenance/ApprovedClientMaintenance';
import { useMaintenanceWorkspace } from '@/core/ApprovedClientMaintenance/hooks/useMaintenanceWorkspace';
import { resolveClientExperience } from '@/core/ApprovedClientMaintenance/utils/resolveClientExperience';
import { useClientId } from '@/core/EBComponentsProvider/EBComponentsProvider';
import { OnboardingFlow } from '@/core/OnboardingFlow';

import type { ClientExperienceProps } from './ClientExperience.types';

export function ClientExperience({
  onboarding,
  maintenance,
  onExperienceResolved,
}: ClientExperienceProps) {
  const clientId = useClientId() ?? '';
  const { t } = useTranslationWithTokens('approved-client-maintenance');
  const workspace = useMaintenanceWorkspace(clientId);
  const { clientQuery, maintenanceQuery } = workspace;
  const resolution = useMemo(
    () =>
      resolveClientExperience({
        client: clientQuery.data,
        maintenanceParties: maintenanceQuery.data?.parties,
        isClientComplete: clientQuery.isSuccess,
        isMaintenanceComplete: maintenanceQuery.isSuccess,
      }),
    [
      clientQuery.data,
      clientQuery.isSuccess,
      maintenanceQuery.data?.parties,
      maintenanceQuery.isSuccess,
    ]
  );

  useEffect(() => {
    if (resolution.kind !== 'discovery-error') {
      onExperienceResolved?.(resolution);
    }
  }, [onExperienceResolved, resolution]);

  const retry = async () => {
    await Promise.all([clientQuery.refetch(), maintenanceQuery.refetch()]);
  };

  if (!clientId) {
    return (
      <Alert variant="destructive">
        <AlertTitle>{t('errors.loadTitle')}</AlertTitle>
        <AlertDescription>{t('errors.loadDescription')}</AlertDescription>
      </Alert>
    );
  }

  if (clientQuery.isPending || maintenanceQuery.isPending) {
    return (
      <div className="eb-component eb-space-y-4 eb-p-6">
        <span className="eb-sr-only">{t('loading')}</span>
        <Skeleton className="eb-h-8 eb-w-52" />
        <Skeleton className="eb-h-40 eb-w-full" />
      </div>
    );
  }

  if (resolution.kind === 'discovery-error') {
    const discoveryError = clientQuery.error ?? maintenanceQuery.error;
    return (
      <div className="eb-component eb-p-6">
        {discoveryError ? (
          <ServerErrorAlert
            error={discoveryError as never}
            tryAgainAction={retry}
          />
        ) : (
          <Alert variant="destructive">
            <AlertCircleIcon />
            <AlertTitle>{t('errors.loadTitle')}</AlertTitle>
            <AlertDescription className="eb-space-y-3">
              <p>{t('errors.loadDescription')}</p>
              <Button size="sm" variant="outline" onClick={retry}>
                <RefreshCwIcon />
                {t('errors.retry')}
              </Button>
            </AlertDescription>
          </Alert>
        )}
      </div>
    );
  }

  if (resolution.kind === 'onboarding') {
    return <OnboardingFlow {...onboarding} />;
  }

  return (
    <ApprovedClientMaintenanceWorkspace
      {...maintenance}
      clientId={clientId}
      workspace={workspace}
    />
  );
}
