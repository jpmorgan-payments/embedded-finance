import React from 'react';
import {
  AlertCircleIcon,
  CheckCircleIcon,
  CircleIcon,
  ClockIcon,
  PauseCircleIcon,
  XCircleIcon,
} from 'lucide-react';

import { useSmbdoGetClient } from '@/api/generated/smbdo';
import { ClientStatus } from '@/api/generated/smbdo.schemas';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { DocumentUploadStepForm } from '../DocumentUploadStepForm/DocumentUploadStepForm';
import { useOnboardingContext } from '../OnboardingContextProvider/OnboardingContextProvider';
import { Skeleton } from '@/components/ui/skeleton';

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
      color: 'eb-bg-blue-100 eb-text-blue-800',
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

const statusMessages: Record<ClientStatus, string> = {
  NEW: 'A new client application has been submitted and is awaiting review.',
  REVIEW_IN_PROGRESS: 'The client application is currently under review.',
  INFORMATION_REQUESTED:
    'Additional information has been requested from the client.',
  APPROVED: 'The client application has been approved.',
  DECLINED: 'The client application has been declined.',
  SUSPENDED: 'The client account has been temporarily suspended.',
  TERMINATED: 'The client account has been terminated.',
};

interface DetailRowProps {
  label: string;
  value: string;
}

const DetailRow: React.FC<DetailRowProps> = ({ label, value }) => (
  <div className="eb-flex eb-items-center eb-justify-between">
    <span className="eb-text-sm eb-font-medium eb-text-gray-500">{label}:</span>
    <span className="eb-text-sm eb-font-bold">{value}</span>
  </div>
);

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

export const ClientOnboardingStateView: React.FC = () => {
  const { clientId } = useOnboardingContext();
  const {
    data: clientData,
    isLoading,
    error,
  } = useSmbdoGetClient(clientId ?? '');

  if (isLoading) {
    return <LoadingState />;
  }

  if (error || !clientData) {
    return (
      <Card className="eb-w-full">
        <CardContent className="eb-p-6">
          <div className="eb-text-center eb-text-red-600">
            {error
              ? 'Error loading client information'
              : 'No client data available'}
          </div>
        </CardContent>
      </Card>
    );
  }

  const businessDetails = clientData.parties?.find(
    (party) => party?.partyType === 'ORGANIZATION'
  );

  const status = clientData.status as ClientStatus;
  const { icon, color } = statusConfig[status] || statusConfig.NEW;

  return (
    <Card className="eb-w-full">
      <CardHeader>
        <CardTitle className="eb-text-xl eb-font-bold">
          Client Onboarding Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="eb-space-y-4">
          <div className="eb-flex eb-items-center eb-justify-between">
            <span className="eb-text-sm eb-font-medium eb-text-gray-500">
              Status:
            </span>
            <Badge className={`eb-flex eb-items-center eb-gap-1 ${color}`}>
              {icon}
              {status}
            </Badge>
          </div>

          <DetailRow label="Client ID" value={clientData.id} />
          <DetailRow
            label="Organization"
            value={
              businessDetails?.organizationDetails?.organizationName || 'N/A'
            }
          />
          <DetailRow
            label="Organization Type"
            value={
              businessDetails?.organizationDetails?.organizationType || 'N/A'
            }
          />

          <div className="eb-mt-4 eb-text-sm eb-text-gray-500">
            <p>{statusMessages[status]}</p>
          </div>
        </div>
        <DocumentUploadStepForm standalone />
      </CardContent>
    </Card>
  );
};
