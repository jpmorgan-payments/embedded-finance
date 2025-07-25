import { useEffect, useState } from 'react';
import { useQueries, useQueryClient } from '@tanstack/react-query';
import { CheckIcon, EditIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

import { _get, isValueEmpty } from '@/lib/utils';
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

import {
  EditMode,
  useOnboardingContext,
} from '../OnboardingContextProvider/OnboardingContextProvider';
import { ServerErrorAlert } from '../ServerErrorAlert/ServerErrorAlert';
import { useIPAddress } from '../utils/getIPAddress';
import { MissingPartyFields } from './MissingPartyFields';
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
  const { t } = useTranslation();
  // Get QueryClient from the context
  const queryClient = useQueryClient();

  const { prevStep, isDisabledStep } = useStepper();
  const {
    clientId,
    onPostClientResponse,
    blockPostVerification,
    setCurrentStepIndex,
    setEditMode,
  } = useOnboardingContext();

  const [termsAgreed, setTermsAgreed] = useState({
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
  const { data: clientData, isLoading: isClientDataLoading } =
    useSmbdoGetClient(clientId ?? '');

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

  const getStepForParty = (party: PartyResponse) => {
    const isSoleProprietorship =
      clientData?.parties?.find((p) => p.partyType === 'ORGANIZATION')
        ?.organizationDetails?.organizationType === 'SOLE_PROPRIETORSHIP';

    if (party.partyType === 'ORGANIZATION') {
      return 1; // Organization step
    }

    if (party.roles?.includes('CONTROLLER')) {
      return 2; // Controller step
    }

    // For Sole Proprietorship, there's no Beneficial Owner step
    if (party.roles?.includes('BENEFICIAL_OWNER') && !isSoleProprietorship) {
      return 3; // Beneficial Owner step (only for non-sole-prop)
    }

    return isSoleProprietorship ? 3 : 4;
  };

  const renderParty = (
    party: PartyResponse,
    fields: Array<{
      label: string;
      path: string;
      transformFunc?: (value: any) => string | string[] | undefined;
    }>
  ) => (
    <div
      key={(party?.id ?? '') + (party?.partyType ?? '')}
      className="eb-mb-6 eb-p-4"
    >
      <div className="eb-flex eb-w-full eb-flex-col">
        <div className="eb-mb-4 eb-flex eb-items-center eb-justify-between">
          <h2 className="eb-text-xl eb-font-bold">
            {party?.organizationDetails?.organizationName ||
              `${party?.individualDetails?.firstName} ${party?.individualDetails?.lastName}`}{' '}
            {party?.partyType && (
              <span className="eb-text-gray-600">
                (
                {party?.roles
                  ?.map((role) => t(`onboarding:partyRoles.${role}`))
                  .join(', ')}
                )
              </span>
            )}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setEditMode(EditMode.Review);
              setCurrentStepIndex(getStepForParty(party));
            }}
            className="eb-flex eb-items-center eb-gap-2"
          >
            <EditIcon className="eb-h-4 eb-w-4" />
            {t('onboarding:edit')}
          </Button>
        </div>
        <div className="eb-py-4">
          <MissingPartyFields party={party} />
        </div>
      </div>
      <dl className="eb-ml-2 eb-space-y-4">
        {fields.map(({ label, path, transformFunc }) => {
          const value = _get(party, path);
          if (!isValueEmpty(value)) {
            return (
              <div
                key={path}
                className="eb-flex eb-flex-col eb-border-b eb-border-dotted eb-border-gray-300 eb-pb-1 sm:eb-flex-row sm:eb-justify-between"
              >
                <dt className="eb-w-full eb-font-medium sm:eb-w-1/3">
                  {label}:
                </dt>
                <dd className="eb-w-full eb-break-words sm:eb-w-2/3 sm:eb-pl-4">
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

  // Add useEffect to initialize termsDocumentsOpened when documents are loaded
  useEffect(() => {
    const initialDocumentStates = documentQueries.reduce(
      (acc, query) => {
        if (query.data?.id) {
          acc[query.data.id] = false;
        }
        return acc;
      },
      {} as { [key: string]: boolean }
    );

    // Only update if we have new document IDs that aren't already in termsDocumentsOpened
    const hasNewDocuments = Object.keys(initialDocumentStates).some(
      (id) => !(id in termsDocumentsOpened)
    );

    if (hasNewDocuments) {
      setTermsDocumentsOpened(initialDocumentStates);
    }
  }, [documentQueries.map((query) => query.data?.id).filter(Boolean)]);

  return (
    <>
      <Stack className="eb-mx-auto eb-w-full eb-max-w-full eb-text-sm md:eb-max-w-3xl lg:eb-max-w-4xl">
        <Title as="h2" className="eb-mb-4">
          {t('onboarding:stepLabels.reviewAndAttest')}
        </Title>

        {isClientDataLoading ? (
          <div className="eb-mb-4 eb-bg-gray-50 eb-p-4 eb-text-gray-600">
            {t('onboarding:reviewAndAttest.loading')}
          </div>
        ) : (
          <>
            {!isOutstandingEmpty(clientData?.outstanding) && clientData && (
              <OutstandingKYCRequirements clientData={clientData} />
            )}

            {isOutstandingEmpty(clientData?.outstanding) && clientData && (
              <div className="eb-mb-4 eb-bg-green-100 eb-p-4 eb-text-green-800">
                {t('onboarding:reviewAndAttest.allRequirementsComplete')}
              </div>
            )}
          </>
        )}

        <div className="eb-w-xl eb-px-4">
          {clientData?.parties?.map((party) =>
            party?.partyType === 'ORGANIZATION'
              ? renderParty(party, organizationFields(t))
              : renderParty(party, individualFields(t))
          )}
        </div>

        {!!clientData?.questionResponses?.length && (
          <div className="eb-w-xl eb-px-4">
            <div className="eb-mb-4 eb-flex eb-items-center eb-justify-between">
              <h2 className="eb-mb-4 eb-text-xl eb-font-bold">
                {t('onboarding:reviewAndAttest.questionResponses')}
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditMode(EditMode.Review);
                  setCurrentStepIndex(4);
                }}
              >
                <EditIcon className="eb-h-4 eb-w-4" />
                {t('onboarding:edit')}
              </Button>
            </div>
            {clientData?.questionResponses?.map((questionResponse) => (
              <>
                {!!questionResponse?.values?.length && (
                  <div key={questionResponse.questionId} className="eb-p-4">
                    <div className="eb-mb-2 eb-flex eb-items-start eb-justify-between">
                      <dl className="eb-ml-2">
                        <dt className="">
                          {
                            questionsDetails?.questions?.find(
                              (q) => q.id === questionResponse.questionId
                            )?.description
                          }
                        </dt>
                        <dd className="">
                          <b>{t('onboarding:reviewAndAttest.response')}:</b>{' '}
                          {questionResponse?.values?.join(', ')}
                        </dd>
                      </dl>
                    </div>
                  </div>
                )}
              </>
            ))}
          </div>
        )}

        <div className="eb-mt-8 eb-border-t eb-pt-4">
          <Title as="h3" className="eb-mb-4">
            {t('onboarding:reviewAndAttest.termsAndConditions.title')}
          </Title>
          <p className="eb-mb-4">
            {t('onboarding:reviewAndAttest.termsAndConditions.description')}
          </p>

          <div className="eb-space-y-6">
            <div className="eb-flex eb-flex-col eb-gap-4 sm:eb-flex-row sm:eb-items-center">
              <Checkbox
                id="dataAccuracy"
                checked={termsAgreed.dataAccuracy}
                onCheckedChange={handleTermsChange('dataAccuracy')}
                className="eb-shrink-0"
              />
              <Label
                htmlFor="dataAccuracy"
                className="eb-text-sm eb-leading-normal sm:eb-leading-none"
              >
                {t(
                  'onboarding:reviewAndAttest.termsAndConditions.dataAccuracyCheckbox'
                )}
              </Label>
            </div>

            <div className="eb-flex eb-flex-col eb-gap-4 sm:eb-flex-row sm:eb-items-start">
              <Checkbox
                id="termsAndConditions"
                checked={termsAgreed.termsAndConditions}
                onCheckedChange={handleTermsChange('termsAndConditions')}
                className="eb-shrink-0"
                disabled={!allDocumentsOpened}
              />
              <Label
                htmlFor="termsAndConditions"
                className="eb-text-sm eb-leading-normal"
              >
                {t(
                  'onboarding:reviewAndAttest.termsAndConditions.termsCheckbox'
                )}
                <div className="eb-mt-2 eb-flex eb-flex-col eb-gap-2">
                  {documentQueries.map((query, index) => (
                    <div key={index}>
                      <Button
                        onClick={handleDocumentOpen(query.data?.id ?? '')}
                        className="eb-text-left eb-text-blue-600 eb-underline"
                        variant="link"
                        disabled={
                          query.data?.id
                            ? loadingDocuments[query.data.id]
                            : false
                        }
                      >
                        <span className="eb-inline-flex eb-items-center eb-gap-2">
                          {query.data?.id &&
                          termsDocumentsOpened[query.data.id] ? (
                            <CheckIcon className="eb-h-4 eb-w-4 eb-shrink-0" />
                          ) : (
                            <span className="eb-h-4 eb-w-4" />
                          )}
                          {query.data?.id && loadingDocuments[query.data.id]
                            ? t(
                                'onboarding:reviewAndAttest.termsAndConditions.downloading'
                              )
                            : query.data?.documentType}
                        </span>
                      </Button>
                    </div>
                  ))}
                </div>
                {!allDocumentsOpened && (
                  <p className="eb-mt-2 eb-text-sm eb-font-semibold eb-text-red-600">
                    {t(
                      'onboarding:reviewAndAttest.termsAndConditions.openDocumentsWarning'
                    )}
                  </p>
                )}
              </Label>
            </div>
          </div>
        </div>
        <div className="eb-mt-6 eb-space-y-6">
          <ServerErrorAlert
            error={updateClientError || clientVerificationsError}
          />

          <div className="eb-flex eb-flex-col eb-gap-3">
            <Button
              onClick={onCompleteKYCHandler}
              disabled={
                !canSubmit || !isOutstandingEmpty(clientData?.outstanding)
              }
              className="eb-w-full sm:eb-w-auto"
            >
              <span className="eb-block eb-max-w-[200px] eb-truncate sm:eb-max-w-none">
                {!canSubmit
                  ? t(
                      'onboarding:reviewAndAttest.termsAndConditions.submitDisabled'
                    )
                  : !isOutstandingEmpty(clientData?.outstanding)
                    ? t(
                        'onboarding:reviewAndAttest.termsAndConditions.outstandingItemsWarning'
                      )
                    : t('common:submit')}
              </span>
            </Button>
            <Button
              disabled={isDisabledStep}
              variant="secondary"
              className="eb-w-full sm:eb-w-auto"
              onClick={prevStep}
            >
              {t('common:previous')}
            </Button>
          </div>
        </div>
      </Stack>
    </>
  );
};
