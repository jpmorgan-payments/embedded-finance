import { useState } from 'react';
import { IconCheck } from '@tabler/icons-react';
import { get } from 'lodash';
import { toast } from 'sonner';

import {
  useSmbdoGetClient,
  useSmbdoListQuestions,
  useSmbdoPostClientVerifications,
  useSmbdoUpdateClient,
} from '@/api/generated/smbdo';
import {
  PartyResponse,
  UpdateClientRequestSmbdo,
} from '@/api/generated/smbdo.schemas';
import { useStepper } from '@/components/ui/stepper';
import { Button, Checkbox, Label, Stack, Title } from '@/components/ui';

import { useOnboardingContext } from '../OnboardingContextProvider/OnboardingContextProvider';
import { ServerErrorAlert } from '../ServerErrorAlert/ServerErrorAlert';
import OutstandingKYCRequirements from './OutstandingKYCRequirements';
import { individualFields, organizationFields } from './partyFields';

interface ClientResponseOutstanding {
  [key: string]: any[];
}

const isOutstandingEmpty = (
  outstanding: ClientResponseOutstanding | undefined
): boolean => {
  if (!outstanding || typeof outstanding !== 'object') {
    return false;
  }

  return Object.keys(outstanding).every((key) => {
    if (key === 'attestationDocumentIds') {
      return true;
    }
    return Array.isArray(outstanding[key]) && outstanding[key].length === 0;
  });
};

export const ReviewAndAttestStepForm = () => {
  const { nextStep, prevStep, isDisabledStep } = useStepper();
  const { clientId, onPostClientResponse, blockPostVerification } =
    useOnboardingContext();

  const [termsAgreed, setTermsAgreed] = useState({
    useOfAccount: false,
    dataAccuracy: false,
    termsAndConditions: false,
  });
  const [termsDocumentsOpened, setTermsDocumentsOpened] = useState({
    paymentTerms: false,
    eSignDisclosure: false,
  });

  // Fetch client data
  const { data: clientData } = useSmbdoGetClient(clientId ?? '');

  // Update client attestation
  const { mutateAsync: updateClient, error: updateClientError } =
    useSmbdoUpdateClient({
      mutation: {
        onSettled: (data, error) => {
          onPostClientResponse?.(data, error?.response?.data);
        },
        onSuccess: () => {
          toast.success('Attestation details updated successfully');
          nextStep();
        },
        onError: () => {
          toast.error('Failed to update attestation details');
        },
      },
    });

  // Initiate KYC
  const { mutateAsync: initiateKYC, error: clientVerificationsError } =
    useSmbdoPostClientVerifications({
      mutation: {
        onSuccess: () => {
          toast.success('KYC initiated successfully');
        },
        onError: () => {
          toast.error('Failed to initiate KYC');
        },
      },
    });

  const { data: questionsDetails } = useSmbdoListQuestions(
    {
      questionIds: clientData?.questionResponses
        ?.map((r) => r.questionId)
        .join(','),
    },
    { query: { enabled: !!clientData?.outstanding?.questionIds?.length } }
  );

  const allTermsAgreed = Object.values(termsAgreed).every(Boolean);
  const allDocumentsOpened = Object.values(termsDocumentsOpened).every(Boolean);
  const canSubmit = allTermsAgreed && allDocumentsOpened;

  const handleTermsChange =
    (term: keyof typeof termsAgreed) => (checked: boolean) => {
      setTermsAgreed((prev) => ({ ...prev, [term]: checked }));
    };

  const handleDocumentOpen =
    (document: keyof typeof termsDocumentsOpened) => () => {
      setTermsDocumentsOpened((prev) => ({ ...prev, [document]: true }));
      // Here you would typically open the document or navigate to it
      toast.info(`${document} document opened`);
      window.open('https://www.jpmorgan.com', '_blank')?.focus();
    };

  const onCompleteKYCHandler = async () => {
    if (clientId) {
      const requestBody = {
        addAttestations: {
          ...clientData?.attestations?.concat({
            attestationTime: new Date().toISOString(),
            attesterFullName: clientData?.parties?.find(
              (party) => party?.partyType === 'INDIVIDUAL'
            )?.individualDetails?.firstName,
            ipAddress: '', // TODO: get IP address
            documentId: '', // TODO: get document id
          }),
        },
      } as UpdateClientRequestSmbdo;

      await updateClient({
        id: clientId,
        data: requestBody,
      });

      if (!blockPostVerification) {
        await initiateKYC({ id: clientId, data: requestBody });
      }
    }
  };

  const renderParty = (
    party: PartyResponse,
    fields: { label: any; path: any; transformFunc?: any }[]
  ) => (
    <div
      key={(party?.id ?? '') + (party?.partyType ?? '')}
      className="eb-mb-4 eb-p-4"
    >
      <h2 className="eb-mb-4 eb-text-xl eb-font-bold">{party?.partyType}</h2>
      <dl className="eb-ml-2 eb-space-y-2">
        {fields.map(({ label, path, transformFunc }) => {
          const value = get(party, path);
          if (value !== undefined && value !== null) {
            return (
              <div
                key={path}
                className="eb-flex eb-border-b eb-border-dotted eb-border-gray-300 sm:eb-justify-between"
              >
                <dt className="eb-w-1/3 sm:eb-mb-0">{label}:</dt>
                <dd className="sm:eb-w-2/3 sm:eb-pl-4">
                  {transformFunc
                    ? transformFunc(value)
                    : typeof value === 'boolean'
                      ? value.toString()
                      : Array.isArray(value)
                        ? value.join(', ')
                        : value}
                </dd>
              </div>
            );
          }
          return null;
        })}
      </dl>
    </div>
  );

  return (
    <>
      <Stack className="eb-w-full eb-text-sm">
        <Title as="h2" className="eb-mb-4">
          Review
        </Title>

        {!isOutstandingEmpty(clientData?.outstanding) && clientData && (
          <OutstandingKYCRequirements clientData={clientData} />
        )}

        {isOutstandingEmpty(clientData?.outstanding) && clientData && (
          <div className="eb-mb-4 eb-bg-green-100 eb-p-4 eb-text-green-800">
            All outstanding KYC requirements have been addressed.
          </div>
        )}

        <div className="eb-w-xl eb-px-4">
          {clientData?.parties?.map((party) =>
            party?.partyType === 'ORGANIZATION'
              ? renderParty(party, organizationFields)
              : renderParty(party, individualFields)
          )}
        </div>

        {!!clientData?.questionResponses?.length && (
          <>
            <h2 className="eb-mb-4 eb-text-xl eb-font-bold">
              Question Responses
            </h2>
            {clientData?.questionResponses?.map((questionResponse) => (
              <div
                key={questionResponse.questionId}
                className="eb-mb-4 eb-border-b eb-border-dotted eb-border-gray-300 eb-p-4"
              >
                <dl className="eb-ml-2 eb-space-y-2">
                  <dt className="eb-w-1/3 sm:eb-mb-0">
                    {
                      questionsDetails?.questions?.find(
                        (q) => q.id === questionResponse.questionId
                      )?.description
                    }
                  </dt>
                  <dd className="sm:eb-w-2/3sm:eb-pl-4">
                    <b>Response:</b> {questionResponse?.values?.join(', ')}
                  </dd>
                </dl>
              </div>
            ))}
          </>
        )}

        <div className="eb-mt-8 eb-border-t eb-pt-4">
          <Title as="h3" className="eb-mb-4">
            Terms and Conditions
          </Title>
          <p className="eb-mb-4">
            Please read the Deposit Agreement and review the Online Disclosure
            for Caterease Banking by J.P. Morgan to complete the process.
          </p>

          <div className="eb-space-y-6">
            <div className="eb-flex eb-items-center eb-space-x-2">
              <Checkbox
                id="useOfAccount"
                checked={termsAgreed.useOfAccount}
                onCheckedChange={handleTermsChange('useOfAccount')}
                className="eb-mr-4"
              />
              <Label
                htmlFor="useOfAccount"
                className="eb-peer-disabled:eb-cursor-not-allowed eb-peer-disabled:eb-opacity-70 eb-text-sm eb-leading-none"
              >
                The Embedded Payment Account may only be used to receive funds
                through [the Platform] pursuant to [my Commerce Terms with the
                Platform] and I am appointing [the Platform] as my agent for the
                Account.
              </Label>
            </div>

            <div className="eb-flex eb-items-center eb-space-x-2">
              <Checkbox
                id="dataAccuracy"
                checked={termsAgreed.dataAccuracy}
                onCheckedChange={handleTermsChange('dataAccuracy')}
                className="eb-mr-4"
              />
              <Label
                htmlFor="dataAccuracy"
                className="eb-peer-disabled:eb-cursor-not-allowed eb-peer-disabled:eb-opacity-70 eb-text-sm eb-leading-none"
              >
                The data I am providing is true, accurate, current and complete
                to the best of my knowledge.
              </Label>
            </div>

            <div className="eb-flex eb-items-center eb-space-x-2">
              <Checkbox
                id="termsAndConditions"
                checked={termsAgreed.termsAndConditions}
                onCheckedChange={handleTermsChange('termsAndConditions')}
                disabled={
                  !termsDocumentsOpened.paymentTerms ||
                  !termsDocumentsOpened.eSignDisclosure
                }
                className="eb-mr-4"
              />
              <Label
                htmlFor="termsAndConditions"
                className="eb-peer-disabled:eb-cursor-not-allowed eb-peer-disabled:eb-opacity-70 eb-text-sm eb-leading-none"
              >
                I have read and agree to the below and the certifications
                directly above conditions checkbox.
                <Button
                  onClick={handleDocumentOpen('paymentTerms')}
                  className="eb-text-blue-600 eb-underline"
                  variant="link"
                >
                  <span className="">
                    {termsDocumentsOpened.paymentTerms ? (
                      <IconCheck className="eb-h-4 eb-w-4" />
                    ) : (
                      <span className="eb-h-4" />
                    )}
                  </span>
                  J.P. Morgan Embedded Payment Terms & Conditions
                </Button>
                <Button
                  onClick={handleDocumentOpen('eSignDisclosure')}
                  className="eb-text-blue-600 eb-underline"
                  variant="link"
                >
                  <span className="">
                    {termsDocumentsOpened.eSignDisclosure ? (
                      <IconCheck className="eb-h-4 eb-w-4" />
                    ) : (
                      <span className="eb-h-4" />
                    )}
                  </span>
                  the E-Sign Disclosure and Consent
                </Button>
                {!allDocumentsOpened && (
                  <p className="eb-text-sm eb-font-semibold eb-text-red-600">
                    Please open the documents links to enable the terms and
                    conditions checkbox.
                  </p>
                )}
              </Label>
            </div>
          </div>
        </div>

        <ServerErrorAlert
          error={updateClientError || clientVerificationsError}
        />

        <div className="eb-mt-8 eb-flex eb-w-full eb-justify-end eb-gap-4">
          <Button
            disabled={isDisabledStep}
            variant="secondary"
            onClick={prevStep}
          >
            Previous
          </Button>
          <Button
            onClick={onCompleteKYCHandler}
            disabled={
              !canSubmit || !isOutstandingEmpty(clientData?.outstanding)
            }
          >
            {!canSubmit
              ? 'Please agree to all terms and review all documents'
              : !isOutstandingEmpty(clientData?.outstanding)
                ? 'Please address all outstanding items'
                : 'Submit'}
          </Button>
        </div>
      </Stack>
    </>
  );
};
