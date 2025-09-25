import { FC, ReactElement } from 'react';
import { AlertTriangle, CheckIcon, InfoIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import {
  ClientResponseOutstanding,
  ClientStatus,
} from '@/api/generated/smbdo.schemas';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface StatusMessagesProps {
  /**
   * Status of client data fetching
   */
  clientGetStatus: 'error' | 'success' | 'pending';
  /**
   * Status of the client
   */
  clientStatus?: ClientStatus;
  /**
   * Status of document requests fetching
   */
  documentRequestStatus: 'pending' | 'error' | 'success' | string;
  /**
   * Whether document requests exist
   */
  hasDocumentRequests: boolean;
  clientOutstanding: ClientResponseOutstanding | undefined;
}

/**
 * Component that displays appropriate status messages based on client and document request status
 */
export const StatusMessages: FC<StatusMessagesProps> = ({
  clientGetStatus,
  clientStatus,
  documentRequestStatus,
  hasDocumentRequests,
  clientOutstanding,
}): ReactElement | undefined => {
  const { t } = useTranslation(['onboarding-overview']);
  // If client data is still loading
  if (clientGetStatus === 'pending') {
    return undefined; // FormLoadingState will be shown by the parent component
  }

  // Client is under review
  if (clientStatus === 'REVIEW_IN_PROGRESS') {
    return (
      <Alert variant="informative">
        <InfoIcon className="eb-h-4 eb-w-4" />
        <AlertTitle>
          {t(
            'onboarding-overview:documentUpload.statusMessages.reviewInProgress.title'
          )}
        </AlertTitle>
        <AlertDescription>
          {t(
            'onboarding-overview:documentUpload.statusMessages.reviewInProgress.description'
          )}
        </AlertDescription>
      </Alert>
    );
  }

  // Client is approved
  if (clientStatus === 'APPROVED') {
    return (
      <Alert variant="success" noTitle>
        <CheckIcon className="eb-h-4 eb-w-4" />
        <AlertDescription>
          {t(
            'onboarding-overview:documentUpload.statusMessages.approved.description'
          )}
        </AlertDescription>
      </Alert>
    );
  }

  // No client data available
  if (!clientStatus) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="eb-h-4 eb-w-4" />
        <AlertTitle>
          {t(
            'onboarding-overview:documentUpload.statusMessages.problemLoadingClient.title'
          )}
        </AlertTitle>
        <AlertDescription>
          {t(
            'onboarding-overview:documentUpload.statusMessages.problemLoadingClient.description'
          )}
        </AlertDescription>
      </Alert>
    );
  }

  // Document requests are loading
  if (documentRequestStatus === 'pending') {
    return undefined; // FormLoadingState will be shown by the parent component
  }

  // Error loading document requests
  if (documentRequestStatus === 'error') {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="eb-h-4 eb-w-4" />
        <AlertTitle>
          {t(
            'onboarding-overview:documentUpload.statusMessages.problemLoadingDocuments.title'
          )}
        </AlertTitle>
        <AlertDescription>
          {t(
            'onboarding-overview:documentUpload.statusMessages.problemLoadingDocuments.description'
          )}
        </AlertDescription>
      </Alert>
    );
  }

  // No document requests found
  if (!hasDocumentRequests) {
    return (
      <Alert variant="warning">
        <AlertTriangle className="eb-h-4 eb-w-4" />
        <AlertTitle>
          {t(
            'onboarding-overview:documentUpload.statusMessages.noDocumentRequests.title'
          )}
        </AlertTitle>
        <AlertDescription>
          {t(
            'onboarding-overview:documentUpload.statusMessages.noDocumentRequests.description'
          )}
        </AlertDescription>
      </Alert>
    );
  }

  // Client has outstanding items
  if (
    clientStatus === 'NEW' &&
    ((clientOutstanding?.attestationDocumentIds?.length ?? 0) > 0 ||
      (clientOutstanding?.partyIds?.length ?? 0) > 0 ||
      (clientOutstanding?.partyRoles?.length ?? 0) > 0 ||
      (clientOutstanding?.questionIds?.length ?? 0) > 0)
  ) {
    return (
      <Alert variant="warning">
        <AlertTriangle className="eb-h-4 eb-w-4" />
        <AlertTitle>
          {t(
            'onboarding-overview:documentUpload.statusMessages.outstandingItems.title'
          )}
        </AlertTitle>
        <AlertDescription>
          {t(
            'onboarding-overview:documentUpload.statusMessages.outstandingItems.description'
          )}
        </AlertDescription>
      </Alert>
    );
  }

  // If all checks pass, no status message is needed
  return undefined;
};
