import React from 'react';
import {
  AlertCircleIcon,
  BellIcon,
  CheckCircleIcon,
  CircleIcon,
  ClockIcon,
  InfoIcon,
  PauseCircleIcon,
  XCircleIcon,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useSmbdoGetClient } from '@/api/generated/smbdo';
import { ClientStatus } from '@/api/generated/smbdo.schemas';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { LinkedAccountWidget } from '@/core/LinkedAccountWidget/LinkedAccountWidget';

import { useOnboardingContext } from '../OnboardingContextProvider/OnboardingContextProvider';
import { AdvancedReviewInProgressLoadingState } from './AdvancedReviewInProgressLoadingState';
import { BusinessSummaryCard } from './BusinessSummaryCard';
import { IndividualPartyCards } from './IndividualPartyCards';
import { NotificationService } from './NotificationService';
import { useClientStatusMonitor } from './useStatusMonitor';

interface ClientOnboardingStateViewProps {
  showLinkedAccountPanel?: boolean;
}

const statusConfig: Record<ClientStatus, { icon: JSX.Element; color: string }> =
  {
    APPROVED: {
      icon: <CheckCircleIcon className="eb-h-4 eb-w-4" />,
      color: 'eb-bg-green-100 eb-text-green-800',
    },
    DECLINED: {
      icon: <XCircleIcon className="eb-h-4 eb-w-4" />,
      color: 'eb-bg-red-100 eb-text-red-800',
    },
    INFORMATION_REQUESTED: {
      icon: <AlertCircleIcon className="eb-h-4 eb-w-4" />,
      color: 'eb-bg-amber-100 eb-text-amber-800',
    },
    NEW: {
      icon: <CircleIcon className="eb-h-4 eb-w-4" />,
      color: 'eb-bg-purple-100 eb-text-purple-800',
    },
    REVIEW_IN_PROGRESS: {
      icon: <ClockIcon className="eb-h-4 eb-w-4" />,
      color: 'eb-bg-yellow-100 eb-text-yellow-800',
    },
    SUSPENDED: {
      icon: <PauseCircleIcon className="eb-h-4 eb-w-4" />,
      color: 'eb-bg-orange-100 eb-text-orange-800',
    },
    TERMINATED: {
      icon: <XCircleIcon className="eb-h-4 eb-w-4" />,
      color: 'eb-bg-gray-100 eb-text-gray-800',
    },
  };

const LoadingState: React.FC = () => (
  <Card className="eb-w-full">
    <CardHeader>
      <Skeleton className="eb-h-6 eb-w-48" />
    </CardHeader>
    <CardContent>
      <div className="eb-space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="eb-h-4 eb-w-full" />
        ))}
      </div>
    </CardContent>
  </Card>
);

export const ClientOnboardingStateView: React.FC<
  ClientOnboardingStateViewProps
> = () => {
  const { clientId, showLinkedAccountPanel } = useOnboardingContext();
  const {
    data: clientData,
    isLoading,
    error,
  } = useSmbdoGetClient(clientId ?? '');
  const { t } = useTranslation(['onboarding-old', 'common']);

  const handleStatusChange = (
    oldStatus: ClientStatus,
    newStatus: ClientStatus
  ) => {
    // If tab is not visible, show a notification
    NotificationService.showNotification('Status Changed', {
      body: `Status changed from ${oldStatus} to ${newStatus}`,
      icon: '/path/to/icon.png',
    });

    // You can also implement additional logic here
    console.log(`Status changed from ${oldStatus} to ${newStatus}`);
  };

  useClientStatusMonitor(clientId, handleStatusChange);

  const statusMessages: Record<ClientStatus, string> = {
    NEW: t('clientOnboardingStatus.statusMessages.NEW'),
    REVIEW_IN_PROGRESS: t(
      'clientOnboardingStatus.statusMessages.REVIEW_IN_PROGRESS'
    ),
    INFORMATION_REQUESTED: t(
      'clientOnboardingStatus.statusMessages.INFORMATION_REQUESTED'
    ),
    APPROVED: t('clientOnboardingStatus.statusMessages.APPROVED'),
    DECLINED: t('clientOnboardingStatus.statusMessages.DECLINED'),
    SUSPENDED: t('clientOnboardingStatus.statusMessages.SUSPENDED'),
    TERMINATED: t('clientOnboardingStatus.statusMessages.TERMINATED'),
  };

  const handleNotificationSignup = () => {
    NotificationService.requestPermission();
  };

  if (isLoading) {
    return <LoadingState />;
  }

  if (error || !clientData) {
    return (
      <Card className="eb-w-full">
        <CardContent className="eb-p-6">
          <div className="eb-text-center eb-text-red-600">
            {error
              ? t('clientOnboardingStatus.errors.loadingError')
              : t('clientOnboardingStatus.errors.noData')}
          </div>
        </CardContent>
      </Card>
    );
  }

  const status = clientData.status as ClientStatus;
  const { icon, color } = statusConfig[status] || statusConfig.NEW;

  return (
    <div className="eb-space-y-6">
      <Alert className="eb-border-blue-200 eb-bg-blue-50">
        <InfoIcon className="eb-h-5 eb-w-5 eb-text-blue-600" />
        <AlertTitle className="eb-text-blue-800">
          {t(
            'clientOnboardingStatus.notification.title',
            'KYC Process in Progress'
          )}
        </AlertTitle>
        <AlertDescription className="eb-mt-2 eb-text-blue-700">
          <p className="eb-mb-3">
            {t(
              'clientOnboardingStatus.notification.description',
              'Your client KYC process is currently being reviewed. Please check back regularly for updates on the verification status.'
            )}
          </p>
          {NotificationService.getStatus() === 'default' ? (
            <Button
              variant="outline"
              className="eb-border-blue-200 eb-bg-white eb-text-blue-700 hover:eb-bg-blue-50"
              onClick={handleNotificationSignup}
            >
              <BellIcon className="eb-mr-2 eb-h-4 eb-w-4" />
              {t(
                'clientOnboardingStatus.notification.cta',
                'Get notification updates'
              )}
            </Button>
          ) : (
            <div className="eb-flex eb-items-center eb-text-sm eb-text-gray-600">
              <BellIcon className="eb-mr-2 eb-h-4 eb-w-4" />
              {NotificationService.getStatus() === 'granted'
                ? t(
                    'clientOnboardingStatus.notification.enabled',
                    'Notifications enabled'
                  )
                : NotificationService.getStatus() === 'denied'
                  ? t(
                      'clientOnboardingStatus.notification.denied',
                      'Notifications blocked'
                    )
                  : t(
                      'clientOnboardingStatus.notification.unsupported',
                      'Notifications not supported'
                    )}
            </div>
          )}
        </AlertDescription>
      </Alert>
      {status === ClientStatus.REVIEW_IN_PROGRESS ? (
        <AdvancedReviewInProgressLoadingState />
      ) : null}

      <div className="eb-flex eb-justify-center">
        <Card className="eb-w-full eb-max-w-screen-xl eb-shadow-md">
          <CardHeader className="eb-border-b eb-bg-gray-50">
            <div className="eb-flex eb-flex-col eb-gap-2">
              <div className="eb-flex eb-items-center eb-justify-between">
                <CardTitle className="eb-text-xl eb-font-bold eb-text-gray-800">
                  {t('clientOnboardingStatus.title')}
                </CardTitle>
                <Badge
                  className={`eb-pointer-events-none eb-flex eb-h-6 eb-items-center eb-gap-1 eb-rounded-md eb-p-4 eb-text-sm ${color}`}
                >
                  {icon}
                  {t(`clientOnboardingStatus.statusLabels.${status}`)}
                </Badge>
              </div>
              <p className="eb-text-xs eb-text-gray-600">
                {statusMessages[status]}
              </p>
            </div>
          </CardHeader>
          <CardContent className="eb-p-6">
            <div className="eb-space-y-6">
              {/* Business Summary Card */}
              <BusinessSummaryCard clientData={clientData} />

              {/* Individual Party Cards */}
              <IndividualPartyCards clientData={clientData} />
            </div>
            {showLinkedAccountPanel && (
              <div className="eb-mt-6 eb-rounded-lg eb-border eb-p-4">
                <h3 className="eb-mb-4 eb-text-lg eb-font-semibold">
                  {t('linkedAccount.title', 'Linked Accounts')}
                </h3>
                <p className="eb-mb-4 eb-text-sm eb-text-gray-600">
                  {t(
                    'linkedAccount.disclaimer',
                    'While your onboarding is being processed, you can start adding linked accounts to your profile.'
                  )}
                </p>
                <LinkedAccountWidget variant="singleAccount" />
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
