import { useState } from 'react';
import { AlertTriangle, CheckIcon, InfoIcon, UploadIcon } from 'lucide-react';

import { useSmbdoListDocumentRequests } from '@/api/generated/smbdo';
import { PartyResponse } from '@/api/generated/smbdo.schemas';
import { AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Alert,
  Badge,
  Card,
  CardTitle,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui';
import { FormLoadingState } from '@/core/OnboardingWizardBasic/FormLoadingState/FormLoadingState';

import { StepLayout } from '../../components/StepLayout/StepLayout';
import { useFlowContext } from '../../context/FlowContext';
import { useOnboardingOverviewContext } from '../../OnboardingContext/OnboardingContext';
import { DocumentUploadForm } from './DocumentUploadForm';

export const DocumentUploadScreen = () => {
  const { clientData, docUploadOnlyMode } = useOnboardingOverviewContext();

  // const partiesWithDocumentRequests = clientData?.parties
  //   ?.filter((party) =>
  //     party.validationResponse?.some((v) => v.documentRequestIds)
  //   )
  //   .map((party) => party.id);

  const { goBack } = useFlowContext();

  const {
    data: documentRequestListResponse,
    status: documentRequestGetListStatus,
  } = useSmbdoListDocumentRequests({
    clientId: clientData?.id,
    // @ts-ignore
    includeRelatedParty: true,
  });

  const [open, setOpen] = useState(false);
  const [currentParty, setCurrentParty] = useState<PartyResponse | undefined>(
    undefined
  );

  const documentRequests = documentRequestListResponse?.documentRequests;

  return (
    <StepLayout title="Upload documents">
      <div className="eb-mt-6 eb-flex-auto eb-space-y-6">
        {clientData?.status === 'REVIEW_IN_PROGRESS' ? (
          <Alert variant="informative">
            <InfoIcon className="eb-h-4 eb-w-4" />
            <AlertTitle>Review in progress</AlertTitle>
            <AlertDescription>
              Your onboarding is currently under review. Please check back
              later.
            </AlertDescription>
          </Alert>
        ) : clientData?.status === 'APPROVED' ? (
          <Alert variant="informative">
            <CheckIcon className="eb-h-4 eb-w-4" />
            <AlertDescription>
              Your onboarding has been approved. No documents are required.
            </AlertDescription>
          </Alert>
        ) : clientData && documentRequestGetListStatus !== 'success' ? (
          <FormLoadingState message="Loading document requests" />
        ) : !clientData || (clientData && !documentRequests.length) ? (
          <Alert variant="warning">
            <AlertTriangle className="eb-h-4 eb-w-4" />
            <AlertTitle>There is a problem</AlertTitle>
            <AlertDescription>No document requests found.</AlertDescription>
          </Alert>
        ) : (
          <>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogContent className="eb-max-h-[90vh] eb-max-w-4xl eb-overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="eb-text-xl eb-font-semibold">
                    Upload supporting documents for{' '}
                    <b>
                      {currentParty?.individualDetails
                        ? [
                            currentParty?.individualDetails?.firstName,
                            currentParty?.individualDetails?.middleName,
                            currentParty?.individualDetails?.lastName,
                            currentParty?.individualDetails?.nameSuffix,
                          ].join(' ')
                        : currentParty?.organizationDetails?.organizationName}
                    </b>
                  </DialogTitle>
                </DialogHeader>
                <div className="eb-mt-4">
                  <DocumentUploadForm
                    partyFilter={currentParty?.id}
                    onComplete={() => setOpen(false)}
                  />
                </div>
              </DialogContent>
            </Dialog>
            {documentRequests.map((docRequest) => {
              const party = docRequest.partyId
                ? clientData?.parties?.find((p) => p.id === docRequest.partyId)
                : clientData?.parties?.find((p) => p.roles?.includes('CLIENT'));

              if (!party) return null;
              return (
                <Card
                  key={party.id}
                  className="eb-space-y-4 eb-rounded-lg eb-border eb-p-4"
                >
                  <div className="eb-space-y-1">
                    <CardTitle className="eb-text-xl eb-font-bold eb-tracking-tight">
                      {party.organizationDetails?.organizationName ||
                        [
                          party.individualDetails?.firstName,
                          party.individualDetails?.middleName,
                          party.individualDetails?.lastName,
                          party.individualDetails?.nameSuffix,
                        ].join(' ')}
                    </CardTitle>
                    <div className="eb-flex eb-gap-2 eb-pt-2">
                      {party.roles?.includes('CLIENT') && (
                        <Badge
                          variant="outline"
                          className="eb-border-transparent eb-bg-gray-100 eb-text-gray-700"
                        >
                          Client
                        </Badge>
                      )}
                      {party.roles?.includes('BENEFICIAL_OWNER') && (
                        <Badge
                          variant="outline"
                          className="eb-border-transparent eb-bg-gray-100 eb-text-gray-700"
                        >
                          Owner
                        </Badge>
                      )}
                      {party.roles?.includes('CONTROLLER') && (
                        <Badge
                          variant="outline"
                          className="eb-border-transparent eb-bg-gray-100 eb-text-gray-700"
                        >
                          Controller
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div>
                    {docRequest.status === 'ACTIVE' ? (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setCurrentParty(party);
                          setOpen(true);
                        }}
                      >
                        <UploadIcon /> Upload supporting document
                      </Button>
                    ) : (
                      <div className="eb-mt-2 eb-inline-flex eb-h-8 eb-items-center eb-justify-center eb-gap-2 eb-text-sm eb-text-muted-foreground">
                        <CheckIcon className="eb-pointer-events-none eb-size-4 eb-shrink-0" />
                        Documents uploaded
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </>
        )}
      </div>

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
