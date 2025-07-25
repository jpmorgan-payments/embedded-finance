import { FC, ReactElement } from 'react';
import { AlertTriangle, CheckIcon, InfoIcon } from 'lucide-react';

import {
  ClientResponseOutstanding,
  ClientStatus,
} from '@/api/generated/smbdo.schemas';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface StatusMessagesProps {
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
  clientStatus,
  documentRequestStatus,
  hasDocumentRequests,
  clientOutstanding,
}): ReactElement | undefined => {
  // Client is under review
  if (clientStatus === 'REVIEW_IN_PROGRESS') {
    return (
      <Alert variant="informative">
        <InfoIcon className="eb-h-4 eb-w-4" />
        <AlertTitle>Review in progress</AlertTitle>
        <AlertDescription>
          Your onboarding is currently under review. Please check back later.
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
          Your onboarding has been approved. No documents are required.
        </AlertDescription>
      </Alert>
    );
  }

  // No client data available
  if (!clientStatus) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="eb-h-4 eb-w-4" />
        <AlertTitle>There was a problem</AlertTitle>
        <AlertDescription>
          Unable to load client data. Please try again later.
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
        <AlertTitle>There was a problem</AlertTitle>
        <AlertDescription>
          Unable to load document requests. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  // No document requests found
  if (!hasDocumentRequests) {
    return (
      <Alert variant="warning">
        <AlertTriangle className="eb-h-4 eb-w-4" />
        <AlertTitle>There is a problem</AlertTitle>
        <AlertDescription>No document requests found.</AlertDescription>
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
        <AlertTitle>Outstanding items</AlertTitle>
        <AlertDescription>
          Your onboarding has outstanding items that need to be addressed.
          Please return to the onboarding flow to resolve them.
        </AlertDescription>
      </Alert>
    );
  }

  // If all checks pass, no status message is needed
  return undefined;
};
