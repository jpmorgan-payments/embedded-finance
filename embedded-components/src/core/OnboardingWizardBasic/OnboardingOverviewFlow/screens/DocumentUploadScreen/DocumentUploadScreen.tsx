import { FC } from 'react';
import {
  AlertTriangle,
  CheckCircle2Icon,
  CheckIcon,
  CircleDashedIcon,
  InfoIcon,
  UploadIcon,
} from 'lucide-react';

import { useSmbdoListDocumentRequests } from '@/api/generated/smbdo';
import {
  DocumentRequestStatus,
  PartyResponse,
} from '@/api/generated/smbdo.schemas';
import { AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Alert, Badge, Card } from '@/components/ui';
import { FormLoadingState } from '@/core/OnboardingWizardBasic/FormLoadingState/FormLoadingState';

import { StepLayout } from '../../components/StepLayout/StepLayout';
import { useFlowContext } from '../../context/FlowContext';
import { useOnboardingOverviewContext } from '../../OnboardingContext/OnboardingContext';
import { getPartyName } from '../../utils/dataUtils';

/**
 * Interface for the PartyCardProps component
 */
interface PartyCardProps {
  party: PartyResponse;
  docRequestStatus?: DocumentRequestStatus;
  onUploadClick: (party: PartyResponse) => void;
}

/**
 * Component to display a party card with document upload functionality
 */
const PartyCard: FC<PartyCardProps> = ({
  party,
  docRequestStatus,
  onUploadClick,
}) => {
  return (
    <Card className="eb-space-y-6 eb-rounded-lg eb-border eb-p-6 eb-shadow">
      <div className="eb-space-y-1.5">
        <div className="eb-flex eb-items-center eb-justify-between">
          <h3 className="eb-font-header eb-text-lg eb-font-medium">
            {getPartyName(party)}
          </h3>
          {docRequestStatus === 'ACTIVE' && (
            <span>
              <CircleDashedIcon className="eb-size-5 eb-text-muted-foreground" />
              <span className="eb-sr-only">Pending</span>
            </span>
          )}
          {docRequestStatus === 'CLOSED' && (
            <span>
              <CheckCircle2Icon className="eb-size-5 eb-stroke-green-700" />
              <span className="eb-sr-only">Completed</span>
            </span>
          )}
          {docRequestStatus === 'EXPIRED' && (
            <span>
              <AlertTriangle className="eb-size-5 eb-stroke-[#C75300]" />
              <span className="eb-sr-only">Expired</span>
            </span>
          )}
        </div>
        <div className="eb-flex eb-gap-2">
          {party.roles?.includes('CLIENT') && (
            <Badge variant="subtle" size="lg">
              Business
            </Badge>
          )}
          {party.roles?.includes('BENEFICIAL_OWNER') && (
            <Badge variant="subtle" size="lg">
              Owner
            </Badge>
          )}
          {party.roles?.includes('CONTROLLER') && (
            <Badge variant="subtle" size="lg">
              Controller
            </Badge>
          )}
        </div>
      </div>
      <div>
        {docRequestStatus === 'ACTIVE' ? (
          <Button
            variant="outline"
            className="eb-w-full eb-border-primary eb-text-primary"
            onClick={() => onUploadClick(party)}
          >
            <UploadIcon /> Upload documents
          </Button>
        ) : (
          <div className="eb-inline-flex eb-items-center eb-justify-center eb-gap-2 eb-text-xs eb-text-green-700">
            <CheckIcon className="eb-size-4" />
            Required documents successfully uploaded
          </div>
        )}
      </div>
    </Card>
  );
};

/**
 * Component for document upload screen in the onboarding process
 */
export const DocumentUploadScreen: FC = () => {
  const { clientData, docUploadOnlyMode } = useOnboardingOverviewContext();
  const { goBack, goTo } = useFlowContext();

  const {
    data: documentRequestListResponse,
    status: documentRequestGetListStatus,
  } = useSmbdoListDocumentRequests({
    clientId: clientData?.id,
    // includeRelatedParty: true,
  });

  const documentRequests = documentRequestListResponse?.documentRequests;

  const handlePartySelect = (party: PartyResponse) => {
    goTo('document-upload-form', {
      editingPartyId: party.id,
    });
  };

  /**
   * Renders content based on client status and document requests
   */
  const renderContent = () => {
    if (clientData?.status === 'REVIEW_IN_PROGRESS') {
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

    if (clientData?.status === 'APPROVED') {
      return (
        <Alert variant="informative">
          <CheckIcon className="eb-h-4 eb-w-4" />
          <AlertDescription>
            Your onboarding has been approved. No documents are required.
          </AlertDescription>
        </Alert>
      );
    }

    if (!clientData) {
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

    if (documentRequestGetListStatus === 'pending') {
      return <FormLoadingState message="Loading document requests" />;
    }

    if (documentRequestGetListStatus === 'error') {
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

    if (!documentRequests?.length) {
      return (
        <Alert variant="warning">
          <AlertTriangle className="eb-h-4 eb-w-4" />
          <AlertTitle>There is a problem</AlertTitle>
          <AlertDescription>No document requests found.</AlertDescription>
        </Alert>
      );
    }

    const clientPartyId = clientData.parties?.find((p) =>
      p.roles?.includes('CLIENT')
    )?.id;

    const clientDocumentRequests = documentRequests.filter(
      (docRequest) =>
        (!docRequest.partyId && docRequest.clientId === clientData.id) ||
        (docRequest.partyId && docRequest.partyId === clientPartyId)
    );

    const otherDocumentRequests = documentRequests.filter(
      (docRequest) =>
        docRequest.partyId &&
        docRequest.clientId === clientData.id &&
        docRequest.partyId !== clientPartyId
    );

    return (
      <div className="eb-space-y-6">
        <div className="eb-space-y-3">
          <h2 className="eb-font-header eb-text-2xl eb-font-medium">
            For the business
          </h2>
          {clientDocumentRequests.length > 0 ? (
            clientDocumentRequests.map((docRequest) => {
              const party = clientData.parties?.find((p) =>
                p.roles?.includes('CLIENT')
              );

              if (!party) return null;

              return (
                <PartyCard
                  key={party.id}
                  party={party}
                  docRequestStatus={docRequest.status}
                  onUploadClick={handlePartySelect}
                />
              );
            })
          ) : (
            <Card className="eb-space-y-6 eb-rounded-lg eb-border eb-p-6 eb-shadow">
              <p className="eb-flex eb-items-center eb-justify-center eb-text-sm eb-font-medium">
                No documents required
              </p>
            </Card>
          )}
        </div>
        <div className="eb-space-y-3">
          <h2 className="eb-font-header eb-text-2xl eb-font-medium">
            For owners and key roles
          </h2>
          {otherDocumentRequests.length > 0 ? (
            otherDocumentRequests.map((docRequest) => {
              const party = clientData.parties?.find(
                (p) => p.id === docRequest.partyId
              );

              if (!party) return null;

              return (
                <PartyCard
                  key={party.id}
                  party={party}
                  docRequestStatus={docRequest.status}
                  onUploadClick={handlePartySelect}
                />
              );
            })
          ) : (
            <Card className="eb-space-y-6 eb-rounded-lg eb-border eb-p-6 eb-shadow">
              <p className="eb-flex eb-items-center eb-justify-center eb-text-sm eb-font-medium">
                No documents required
              </p>
            </Card>
          )}
        </div>
      </div>
    );
  };

  return (
    <StepLayout
      title="Supporting documents"
      description="To satisfy regularatory requirements, we need to obtain the following"
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
              onClick={() => goBack()}
            >
              Return to overview
            </Button>
          </div>
        </div>
      )}
    </StepLayout>
  );
};
