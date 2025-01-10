import { useState } from 'react';
import { IconCheck } from '@tabler/icons-react';
import { QueryClient, useQueries } from '@tanstack/react-query';
import { get } from 'lodash';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

import {
  smbdoDownloadDocument,
  smbdoGetDocumentDetail,
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
import { useIPAddress } from '../utils/getIPAddress';
import OutstandingKYCRequirements from './OutstandingKYCRequirements';
import { individualFields, organizationFields } from './partyFields';

const generateSessionId = () => {
  const sessionId = uuidv4();
  return sessionId.replace(/[^a-zA-Z0-9_-]/g, '');
};

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
  const queryClient = new QueryClient();

  const [termsAgreed, setTermsAgreed] = useState({
    useOfAccount: false,
    dataAccuracy: false,
    termsAndConditions: false,
  });

  const [termsDocumentsOpened, setTermsDocumentsOpened] = useState<{
    [key: string]: boolean;
  }>({});
  const [loadingDocuments, setLoadingDocuments] = useState<{
    [key: string]: boolean;
  }>({});

  // Fetch client data
  const { data: clientData } = useSmbdoGetClient(clientId ?? '');

  const { data: IPAddress } = useIPAddress();

  // Update client attestation
  const { mutateAsync: updateClientAsync, error: updateClientError } =
    useSmbdoUpdateClient();

  // Initiate KYC
  const { mutateAsync: initiateKYCAsync, error: clientVerificationsError } =
    useSmbdoPostClientVerifications();

  const documentIds = clientData?.outstanding?.attestationDocumentIds || [];

  const documentQueries = useQueries({
    queries: documentIds.map((id) => ({
      queryKey: ['documentDetail', id],
      queryFn: () => smbdoGetDocumentDetail(id), // Ensure this returns a promise
    })),
  });

  const { data: questionsDetails } = useSmbdoListQuestions({
    questionIds: clientData?.questionResponses
      ?.map((r) => r.questionId)
      .join(','),
  });

  const allTermsAgreed = Object.values(termsAgreed).every(Boolean);
  const allDocumentsOpened = Object.values(termsDocumentsOpened).every(Boolean);
  const canSubmit = allTermsAgreed && allDocumentsOpened;

  const handleTermsChange =
    (term: keyof typeof termsAgreed) => (checked: boolean) => {
      setTermsAgreed((prev) => ({ ...prev, [term]: checked }));
    };

  const handleDocumentOpen = (documentId: string) => async () => {
    try {
      setLoadingDocuments((prev) => ({ ...prev, [documentId]: true }));

      // Fetch the document
      const response = await smbdoDownloadDocument(documentId, {
        responseType: 'blob',
      });

      // Create a URL for the blob and open it
      const blob = new Blob([response as BlobPart], {
        type: 'application/pdf',
      });
      const url = URL.createObjectURL(blob);

      window.open(url, '_blank')?.focus();
      setTermsDocumentsOpened((prev) => ({ ...prev, [documentId]: true }));
    } catch (error) {
      console.error('Error downloading document:', error);
      toast.error('Failed to download document');
    } finally {
      setLoadingDocuments((prev) => ({ ...prev, [documentId]: false }));
    }
  };

  const onCompleteKYCHandler = async () => {
    if (clientId) {
      const requestBody = {
        addAttestations: [
          {
            attestationTime: new Date().toISOString(),
            attesterFullName: clientData?.parties?.find(
              (party) => party?.partyType === 'INDIVIDUAL'
            )?.individualDetails?.firstName,
            ipAddress: IPAddress,
            documentId: clientData?.outstanding?.attestationDocumentIds?.[0],
          },
        ],
      } as UpdateClientRequestSmbdo;

      const verificationRequestBody = {
        consumerDevice: {
          ipAddress: IPAddress,
          sessionId: generateSessionId(), // Generate session ID matching the pattern
        },
      };

      try {
        if (clientData?.outstanding?.attestationDocumentIds?.length) {
          await updateClientAsync(
            {
              id: clientId,
              data: requestBody,
            },
            {
              onSettled: (data, error) => {
                onPostClientResponse?.(data, error?.response?.data);
              },
              onSuccess: () => {
                toast.success('Attestation details updated successfully');
              },
              onError: () => {
                toast.error('Failed to update attestation details');
              },
            }
          );
        }

        if (!blockPostVerification) {
          await initiateKYCAsync(
            { id: clientId, data: verificationRequestBody },
            {
              onSuccess: () => {
                toast.success('KYC initiated successfully');
                queryClient.invalidateQueries();
                nextStep();
              },
              onError: () => {
                toast.error('Failed to initiate KYC');
              },
            }
          );
        }
      } catch (error) {
        console.error('Error completing KYC process:', error);
        toast.error('An error occurred while completing the KYC process');
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
          <div className="eb-w-xl eb-px-4">
            <h2 className="eb-mb-4 eb-text-xl eb-font-bold">
              Question Responses
            </h2>
            {clientData?.questionResponses?.map((questionResponse) => (
              <>
                {!!questionResponse?.values?.length && (
                  <div key={questionResponse.questionId} className="eb-p-4">
                    <dl className="eb-ml-2">
                      <dt className="">
                        {
                          questionsDetails?.questions?.find(
                            (q) => q.id === questionResponse.questionId
                          )?.description
                        }
                      </dt>
                      <dd className="">
                        <b>Response:</b> {questionResponse?.values?.join(', ')}
                      </dd>
                    </dl>
                  </div>
                )}
              </>
            ))}
          </div>
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
                className="eb-mr-4"
              />
              <Label
                htmlFor="termsAndConditions"
                className="eb-peer-disabled:eb-cursor-not-allowed eb-peer-disabled:eb-opacity-70 eb-text-sm eb-leading-none"
              >
                I have read and agree to the below attestation documents:
                {documentQueries.map((query, index) => (
                  <div key={index}>
                    <Button
                      onClick={handleDocumentOpen(query.data?.id ?? '')}
                      className="eb-text-blue-600 eb-underline"
                      variant="link"
                      disabled={
                        query.data?.id ? loadingDocuments[query.data.id] : false
                      } // Disable button while loading
                    >
                      <span className="">
                        {query.data?.id &&
                        termsDocumentsOpened[query.data.id] ? (
                          <IconCheck className="eb-h-4 eb-w-4" />
                        ) : (
                          <span className="eb-h-4" />
                        )}
                      </span>
                      {query.data?.id && loadingDocuments[query.data.id]
                        ? 'Downloading...'
                        : query.data?.documentType}
                    </Button>
                  </div>
                ))}
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
