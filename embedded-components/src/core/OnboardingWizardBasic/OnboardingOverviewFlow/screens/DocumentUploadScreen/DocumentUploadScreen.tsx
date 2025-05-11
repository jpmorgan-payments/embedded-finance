import { useState } from 'react';
import { UploadIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Badge,
  Card,
  CardTitle,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui';

import { StepLayout } from '../../components/StepLayout/StepLayout';
import { useFlowContext } from '../../context/FlowContext';
import { useOnboardingOverviewContext } from '../../OnboardingContext/OnboardingContext';
import { DocumentUploadForm } from './DocumentUploadForm';

export const DocumentUploadScreen = () => {
  const { clientData } = useOnboardingOverviewContext();

  const partiesWithDocumentRequests = clientData?.parties
    ?.filter((party) =>
      party.validationResponse?.some((v) => v.documentRequestIds)
    )
    .map((party) => party.id);

  const { goBack } = useFlowContext();

  const [open, setOpen] = useState(false);

  return (
    <StepLayout title="Upload documents">
      <div className="eb-mt-6 eb-flex-auto eb-space-y-6">
        {clientData?.parties?.map((party) => {
          return (
            <Card
              key={party.id}
              className="eb-space-y-4 eb-rounded-lg eb-border eb-p-4"
            >
              <div className="eb-space-y-1">
                <CardTitle className="eb-text-xl eb-font-bold eb-tracking-tight">
                  {party.individualDetails
                    ? [
                        party.individualDetails?.firstName,
                        party.individualDetails?.middleName,
                        party.individualDetails?.lastName,
                        party.individualDetails?.nameSuffix,
                      ].join(' ')
                    : party.organizationDetails?.organizationName}
                </CardTitle>
                <div className="eb-flex eb-gap-2 eb-pt-2">
                  {party.roles?.includes('CLIENT') && (
                    <Badge
                      variant="outline"
                      className="eb-border-transparent eb-bg-[#E6F7FF] eb-text-[#005EB8]"
                    >
                      Client
                    </Badge>
                  )}
                  {party.roles?.includes('BENEFICIAL_OWNER') && (
                    <Badge
                      variant="outline"
                      className="eb-border-transparent eb-bg-[#EDF4FF] eb-text-[#355FA1]"
                    >
                      Owner
                    </Badge>
                  )}
                  {party.roles?.includes('CONTROLLER') && (
                    <Badge
                      variant="outline"
                      className="eb-border-transparent eb-bg-[#FFEBD9] eb-text-[#8F521F]"
                    >
                      Controller
                    </Badge>
                  )}
                </div>
              </div>
              <div>
                {partiesWithDocumentRequests?.includes(party.id) ? (
                  <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline">
                        <UploadIcon /> Upload supporting document
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="eb-max-h-[90vh] eb-max-w-4xl eb-overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="eb-text-xl eb-font-semibold">
                          Upload supporting documents for{' '}
                          <b>
                            {party.individualDetails
                              ? [
                                  party.individualDetails?.firstName,
                                  party.individualDetails?.middleName,
                                  party.individualDetails?.lastName,
                                  party.individualDetails?.nameSuffix,
                                ].join(' ')
                              : party.organizationDetails?.organizationName}
                          </b>
                        </DialogTitle>
                      </DialogHeader>
                      <div className="eb-mt-4">
                        <DocumentUploadForm
                          partyFilter={party.id}
                          onComplete={() => setOpen(false)}
                        />
                      </div>
                    </DialogContent>
                  </Dialog>
                ) : (
                  <div className="eb-italic eb-text-muted-foreground">
                    No documents required
                  </div>
                )}
              </div>
            </Card>
          );
        })}
      </div>

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
    </StepLayout>
  );
};
