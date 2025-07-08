import { FC, useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import {
  getSmbdoGetClientQueryKey,
  useSmbdoListDocumentRequests,
} from '@/api/generated/smbdo';
import { Button } from '@/components/ui/button';
import { FormLoadingState } from '@/core/OnboardingWizardBasic/FormLoadingState/FormLoadingState';

import { StepLayout } from '../../components/StepLayout/StepLayout';
import { useFlowContext } from '../../context/FlowContext';
import { useOnboardingOverviewContext } from '../../OnboardingContext/OnboardingContext';
import { DocumentRequestsSection } from './DocumentRequestsSection';
import { groupDocumentRequests } from './documentUtils';
import { StatusMessages } from './StatusMessages';

/**
 * Component for document upload screen in the onboarding process
 */
export const DocumentUploadScreen: FC = () => {
  const { clientData, docUploadOnlyMode } = useOnboardingOverviewContext();
  const { goTo } = useFlowContext();
  const queryClient = useQueryClient();
  const prevDocRequestsRef = useRef<string | null>(null);

  // Fetch document requests
  const {
    data: documentRequestListResponse,
    status: documentRequestGetListStatus,
  } = useSmbdoListDocumentRequests(
    {
      clientId: clientData?.id,
      // @ts-expect-error - API expects this parameter
      includeRelatedParty: true,
    },
    {
      query: {
        enabled: !!clientData?.id, // Only fetch if clientData is available
      },
    }
  );

  const documentRequests = documentRequestListResponse?.documentRequests;
  const hasDocumentRequests = !!documentRequests?.length;

  // Refetch client data when document requests change to ensure client status is up-to-date
  useEffect(() => {
    if (clientData?.id && documentRequests) {
      const currentDocRequestsString = JSON.stringify(documentRequests);

      // Only invalidate if we have a previous value AND the value has changed
      if (
        prevDocRequestsRef.current !== null &&
        prevDocRequestsRef.current !== currentDocRequestsString
      ) {
        queryClient.invalidateQueries({
          queryKey: getSmbdoGetClientQueryKey(clientData.id),
        });
      }

      // Update the ref after checking
      prevDocRequestsRef.current = currentDocRequestsString;
    }
  }, [clientData?.id, documentRequests, queryClient]);

  /**
   * Handler for when a party is selected to upload documents
   */
  const handleDocRequestSelect = (docRequestId: string | undefined) => {
    goTo('document-upload-form', {
      editingPartyId: docRequestId,
    });
  };

  /**
   * Renders the main content based on status and document requests
   */
  const renderContent = () => {
    // Show loading state when requests are pending
    // @ts-expect-error - Status can be 'pending'
    if (documentRequestGetListStatus === 'pending') {
      return <FormLoadingState message="Loading document requests" />;
    }

    // Check for status messages that should be displayed
    const statusMessages = StatusMessages({
      clientStatus: clientData?.status,
      documentRequestStatus: documentRequestGetListStatus,
      hasDocumentRequests,
      clientOutstanding: clientData?.outstanding,
    });

    // Only set statusComponent if StatusMessages returns non-null
    const statusComponent = statusMessages !== null ? statusMessages : null;

    // If there's a status message to display, show it
    if (statusComponent) {
      return statusComponent;
    }

    // Group document requests by party type
    const { businessDocumentRequests, individualDocumentRequests } =
      groupDocumentRequests(documentRequests, clientData);

    // Render document request sections
    return (
      <div className="eb-space-y-6">
        {/* Business document requests section */}
        <DocumentRequestsSection
          title="For the business"
          documentRequests={businessDocumentRequests}
          clientData={clientData}
          onDocRequestSelect={handleDocRequestSelect}
        />

        {/* Individual document requests section */}
        <DocumentRequestsSection
          title="For owners and key roles"
          documentRequests={individualDocumentRequests}
          clientData={clientData}
          onDocRequestSelect={handleDocRequestSelect}
        />
      </div>
    );
  };

  return (
    <StepLayout
      title="Supporting documents"
      description={
        documentRequestGetListStatus === 'success' &&
        clientData?.status === 'INFORMATION_REQUESTED' &&
        hasDocumentRequests
          ? 'To satisfy regulatory requirements, we need to obtain the following'
          : undefined
      }
    >
      <div className="eb-mt-6 eb-flex-auto eb-space-y-6">{renderContent()}</div>

      {!docUploadOnlyMode && (
        <div className="eb-mt-6 eb-space-y-6">
          <div className="eb-flex eb-justify-between eb-gap-4">
            <Button
              type="button"
              variant="default"
              size="lg"
              className="eb-w-full eb-text-lg"
              onClick={() => goTo('overview')}
            >
              Return to overview
            </Button>
          </div>
        </div>
      )}
    </StepLayout>
  );
};
