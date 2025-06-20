import { FC } from 'react';

import { useSmbdoListDocumentRequests } from '@/api/generated/smbdo';
import { PartyResponse } from '@/api/generated/smbdo.schemas';
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

  // Fetch document requests
  const {
    data: documentRequestListResponse,
    status: documentRequestGetListStatus,
  } = useSmbdoListDocumentRequests({
    clientId: clientData?.id,
    // @ts-ignore - API expects this parameter
    includeRelatedParty: true,
  });

  const documentRequests = documentRequestListResponse?.documentRequests;
  const hasDocumentRequests = !!documentRequests?.length;

  /**
   * Handler for when a party is selected to upload documents
   */
  const handlePartySelect = (party: PartyResponse) => {
    goTo('document-upload-form', {
      editingPartyId: party.id,
    });
  };

  /**
   * Renders the main content based on status and document requests
   */
  const renderContent = () => {
    // Show loading state when requests are pending
    // @ts-ignore - Status can be 'pending'
    if (documentRequestGetListStatus === 'pending') {
      return <FormLoadingState message="Loading document requests" />;
    }

    // Check for status messages that should be displayed
    const statusMessages = StatusMessages({
      clientStatus: clientData?.status,
      documentRequestStatus: documentRequestGetListStatus,
      hasDocumentRequests,
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
          onPartySelect={handlePartySelect}
        />

        {/* Individual document requests section */}
        <DocumentRequestsSection
          title="For owners and key roles"
          documentRequests={individualDocumentRequests}
          clientData={clientData}
          onPartySelect={handlePartySelect}
        />
      </div>
    );
  };

  return (
    <StepLayout
      title="Supporting documents"
      description="To satisfy regulatory requirements, we need to obtain the following"
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
