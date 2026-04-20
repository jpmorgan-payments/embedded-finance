import { useEffect, useMemo, useState } from 'react';
import { useTranslationWithTokens } from '@/i18n';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueries, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircleIcon,
  CheckCircleIcon,
  ExternalLinkIcon,
  FileIcon,
  InfoIcon,
  Loader2Icon,
} from 'lucide-react';
import { useForm, useFormState } from 'react-hook-form';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

import { useIPAddress } from '@/lib/hooks';
import { cn } from '@/lib/utils';
import {
  getSmbdoGetClientQueryKey,
  smbdoDownloadDocument,
  smbdoGetDocumentDetail,
  useSmbdoPostClientVerifications,
  useSmbdoUpdateClientLegacy,
} from '@/api/generated/smbdo';
import { UpdateClientRequestSmbdo } from '@/api/generated/smbdo.schemas';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ServerErrorAlert } from '@/components/ServerErrorAlert';
import {
  Button,
  Checkbox,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui';
import {
  useFlowContext,
  useOnboardingContext,
} from '@/core/OnboardingFlow/contexts';
import { useFlowUnsavedChangesSync } from '@/core/OnboardingFlow/hooks/useFlowUnsavedChangesSync';
import { StepperStepProps } from '@/core/OnboardingFlow/types/flow.types';

import { TermsAttestationAcknowledgementsGroup } from './TermsAttestationAcknowledgementsGroup';

const generateSessionId = () => {
  const sessionId = uuidv4();
  return sessionId.replace(/[^a-zA-Z0-9_-]/g, '');
};

export const TermsAndConditionsForm: React.FC<StepperStepProps> = ({
  handlePrev,
  handleNext,
  getPrevButtonLabel,
  getNextButtonLabel,
}) => {
  const queryClient = useQueryClient();
  const {
    clientData,
    onPostClientSettled,
    disclosureConfig,
    reviewAttestTermsAcknowledgements,
    showReviewAttestTermsAcknowledgementsIntro,
  } = useOnboardingContext();
  const { isFormSubmitting: isFormSubmittingContext, setIsFormSubmitting } =
    useFlowContext();

  const { t, tString } = useTranslationWithTokens('onboarding-overview');

  const hasDisclosureConfig = !!disclosureConfig?.platformName;

  const hostAckItems = reviewAttestTermsAcknowledgements ?? [];
  const useHostAckList = hostAckItems.length > 0;

  const hostAckIdsKey = useMemo(
    () => hostAckItems.map((a) => a.id).join('\0'),
    [hostAckItems]
  );

  const [hostAckChecked, setHostAckChecked] = useState<Record<string, boolean>>(
    {}
  );

  useEffect(() => {
    if (!useHostAckList) {
      setHostAckChecked({});
      return;
    }
    setHostAckChecked(
      Object.fromEntries(
        hostAckIdsKey
          .split('\0')
          .filter(Boolean)
          .map((id) => [id, false])
      )
    );
  }, [useHostAckList, hostAckIdsKey]);

  const hostAckComplete = useMemo(() => {
    if (!useHostAckList) {
      return true;
    }
    return hostAckItems.every((a) => hostAckChecked[a.id] === true);
  }, [useHostAckList, hostAckItems, hostAckChecked]);

  const labelInterpolationValues = useMemo(() => {
    if (!disclosureConfig?.platformName) {
      return undefined;
    }
    return {
      platformName: disclosureConfig.platformName,
      platformAgreementLabel:
        disclosureConfig.platformAgreementLabel ??
        `${disclosureConfig.platformName}'s Program Agreement`,
    };
  }, [disclosureConfig]);

  const formSchema = useMemo(() => {
    if (useHostAckList) {
      return z.object({});
    }
    const mustAgreeAll = tString(
      'reviewAndAttest.attestation.mustAgreeToAll',
      'You must agree to all attestations before proceeding.'
    );
    const mustAgreeTerms = tString(
      'reviewAndAttest.attestation.mustAgreeToTerms',
      'You must agree to the terms before proceeding.'
    );
    if (hasDisclosureConfig) {
      return z.object({
        attested: z.boolean().refine((value) => value === true, {
          message: mustAgreeTerms,
        }),
        attestAuthorizeSharing: z.boolean().refine((value) => value === true, {
          message: mustAgreeAll,
        }),
      });
    }
    return z.object({
      attested: z.boolean().refine((value) => value === true, {
        message: mustAgreeTerms,
      }),
    });
  }, [useHostAckList, hasDisclosureConfig, tString]);

  const form = useForm({
    defaultValues: useHostAckList
      ? {}
      : hasDisclosureConfig
        ? {
            attested: false,
            attestAuthorizeSharing: false,
          }
        : {
            attested: false,
          },
    resolver: zodResolver(formSchema),
  });

  const { isDirty } = useFormState({ control: form.control });
  const hostAckDirty = useMemo(
    () => Object.values(hostAckChecked).some(Boolean),
    [hostAckChecked]
  );
  useFlowUnsavedChangesSync(useHostAckList ? hostAckDirty : isDirty);

  const { data: ipAddress } = useIPAddress();

  const [termsDocumentsOpened, setTermsDocumentsOpened] = useState<{
    [key: string]: boolean;
  }>({});

  const [loadingDocuments, setLoadingDocuments] = useState<{
    [key: string]: boolean;
  }>({});

  const [documentErrors, setDocumentErrors] = useState<{
    [key: string]: string | null;
  }>({});

  // Update client attestation
  const {
    mutateAsync: updateClientAsync,
    error: updateClientError,
    status: clientUpdateStatus,
  } = useSmbdoUpdateClientLegacy();

  // Initiate KYC
  const {
    mutateAsync: initiateKYCAsync,
    error: clientVerificationsError,
    status: clientVerificationsStatus,
  } = useSmbdoPostClientVerifications();

  const documentIds = clientData?.outstanding?.attestationDocumentIds || [];

  const documentQueries = useQueries({
    queries: documentIds.map((id) => ({
      queryKey: ['documentDetail', id],
      queryFn: () => smbdoGetDocumentDetail(id), // Ensure this returns a promise
    })),
  });

  const hasPlatformAgreement = !!disclosureConfig?.platformAgreementUrl;
  const [platformAgreementOpened, setPlatformAgreementOpened] = useState(false);

  const allLinksOpened =
    documentIds.every((id) => termsDocumentsOpened[id] || documentErrors[id]) &&
    (!hasPlatformAgreement || platformAgreementOpened);

  const handlePlatformAgreementOpen = () => {
    if (disclosureConfig?.platformAgreementUrl) {
      window.open(disclosureConfig.platformAgreementUrl, '_blank')?.focus();
      setPlatformAgreementOpened(true);
    }
  };

  const handleDocumentOpen = (documentId: string) => async () => {
    try {
      // Clear previous errors for this document
      setDocumentErrors((prev) => ({ ...prev, [documentId]: null }));
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

      const newWindow = window.open(url, '_blank');
      if (!newWindow) {
        throw new Error(
          'Failed to open document. Please check your popup blocker settings.'
        );
      }
      newWindow.focus();

      setTermsDocumentsOpened((prev) => ({ ...prev, [documentId]: true }));
    } catch (error) {
      setDocumentErrors((prev) => ({
        ...prev,
        [documentId]:
          error instanceof Error
            ? error.message
            : 'Failed to download document',
      }));
      // TODO: temporarily set opened document
      setTermsDocumentsOpened((prev) => ({ ...prev, [documentId]: true }));
    } finally {
      setLoadingDocuments((prev) => ({ ...prev, [documentId]: false }));
    }
  };

  const onCompleteKYCHandler = async () => {
    if (clientData?.id) {
      const requestBody = {
        addAttestations: [
          {
            attestationTime: new Date().toISOString(),
            attesterFullName: (() => {
              const controllerParty = clientData?.parties?.find(
                (party) =>
                  party?.partyType === 'INDIVIDUAL' &&
                  party?.roles?.includes('CONTROLLER')
              );
              const details = controllerParty?.individualDetails;
              return [
                details?.firstName,
                details?.middleName,
                details?.lastName,
              ]
                .filter(Boolean)
                .join(' ');
            })(),
            ipAddress,
            documentId: clientData?.outstanding?.attestationDocumentIds?.[0],
          },
        ],
      } as UpdateClientRequestSmbdo;

      const verificationRequestBody = {
        consumerDevice: {
          ipAddress,
          sessionId: generateSessionId(), // Generate session ID matching the pattern
        },
      };

      setIsFormSubmitting(true);
      try {
        if (clientData?.outstanding?.attestationDocumentIds?.length) {
          await updateClientAsync(
            {
              id: clientData.id,
              data: requestBody,
            },
            {
              onSettled: (data, error) => {
                onPostClientSettled?.(data, error?.response?.data);
              },
            }
          );
        }

        await initiateKYCAsync(
          { id: clientData.id, data: verificationRequestBody },
          {
            onSuccess: async () => {
              // Wait for the client data to refetch so every section's
              // statusResolver sees the updated status before we navigate.
              // This keeps the user on the T&C step with the spinner
              // instead of briefly flashing stale section states on overview.
              await queryClient.invalidateQueries({
                queryKey: getSmbdoGetClientQueryKey(clientData.id),
              });
              handleNext();
            },
          }
        );
      } catch (error) {
        setIsFormSubmitting(false);
        console.error('Error completing KYC process:', error);
      }
    }
  };

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

  const [shouldDisplayAlert, setShouldDisplayAlert] = useState(false);
  const [shouldDisplayHostAckAlert, setShouldDisplayHostAckAlert] =
    useState(false);

  const isMutationPending =
    clientUpdateStatus === 'pending' || clientVerificationsStatus === 'pending';
  const isFormSubmitting = isFormSubmittingContext || isMutationPending;

  return (
    <Form {...form}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!allLinksOpened) {
            setShouldDisplayAlert(true);
            setShouldDisplayHostAckAlert(false);
            return;
          }
          if (useHostAckList) {
            if (!hostAckComplete) {
              setShouldDisplayHostAckAlert(true);
              return;
            }
            setShouldDisplayHostAckAlert(false);
            onCompleteKYCHandler();
            return;
          }
          setShouldDisplayHostAckAlert(false);
          form.handleSubmit(() => {
            onCompleteKYCHandler();
          })(e);
        }}
        className="eb-flex eb-flex-auto eb-flex-col"
      >
        <div className="eb-mt-6 eb-flex-auto eb-space-y-6">
          {!allLinksOpened && shouldDisplayAlert && (
            <Alert variant="destructive" noTitle>
              <AlertCircleIcon className="eb-h-4 eb-w-4" />
              <AlertDescription>
                {t(
                  'reviewAndAttest.termsAndConditions.openDocumentsAlert',
                  'Please open the document links and confirm that you have read and agree to all documents.'
                )}
              </AlertDescription>
            </Alert>
          )}
          {allLinksOpened && useHostAckList && shouldDisplayHostAckAlert && (
            <Alert variant="destructive" noTitle>
              <AlertCircleIcon className="eb-h-4 eb-w-4" />
              <AlertDescription>
                {tString(
                  'reviewAndAttest.attestation.mustAgreeToAll',
                  'You must agree to all attestations before proceeding.'
                )}
              </AlertDescription>
            </Alert>
          )}
          <div className="eb-mt-2 eb-flex eb-flex-col eb-gap-2">
            {documentIds.map((id) => {
              const query = documentQueries.find((q) => q.data?.id === id);

              return (
                <div key={id} className="eb-flex eb-flex-col eb-gap-1">
                  <Button
                    type="button"
                    onClick={handleDocumentOpen(id)}
                    variant="ghost"
                    className={cn(
                      'eb-flex eb-h-14 eb-w-full eb-justify-between eb-rounded-md eb-border eb-bg-card eb-px-4 eb-py-2 eb-font-sans eb-text-sm eb-font-normal eb-shadow-md',
                      {
                        'eb-border-success eb-bg-success-accent hover:eb-bg-success-accent/80':
                          termsDocumentsOpened[id],
                      }
                    )}
                    disabled={query?.isFetching || loadingDocuments[id]}
                  >
                    <span className="eb-flex eb-items-center eb-gap-2">
                      <FileIcon />
                      <p className="eb-text-[#12647E] eb-underline">
                        {query?.isFetching ||
                        loadingDocuments[id] ||
                        !query?.data
                          ? t('common:loading', 'Loading...')
                          : query?.data?.documentType}
                      </p>
                      <ExternalLinkIcon className="eb-text-[#12647E]" />
                    </span>
                    <span>
                      {termsDocumentsOpened[id] && (
                        <CheckCircleIcon className="eb-text-success" />
                      )}
                      {loadingDocuments[id] &&
                        t('reviewAndAttest.termsAndConditions.downloading')}
                    </span>
                  </Button>
                  {query?.data?.id && documentErrors[query?.data.id] && (
                    <div className="eb-ml-1 eb-text-sm eb-text-destructive">
                      {t(
                        'reviewAndAttest.termsAndConditions.failedToDownload',
                        'Failed to download document:'
                      )}{' '}
                      {documentErrors[id]}
                    </div>
                  )}
                  {!query && documentErrors[id] && (
                    <div className="eb-ml-1 eb-text-sm eb-text-destructive">
                      {t(
                        'reviewAndAttest.termsAndConditions.failedToFetchDetails',
                        'Failed to fetch document details:'
                      )}{' '}
                      {documentErrors[id]}
                    </div>
                  )}
                </div>
              );
            })}
            {/* Platform Agreement link card — shown when URL is provided */}
            {hasPlatformAgreement && (
              <div className="eb-flex eb-flex-col eb-gap-1">
                <Button
                  type="button"
                  onClick={handlePlatformAgreementOpen}
                  variant="ghost"
                  className={cn(
                    'eb-flex eb-h-14 eb-w-full eb-justify-between eb-rounded-md eb-border eb-bg-card eb-px-4 eb-py-2 eb-font-sans eb-text-sm eb-font-normal eb-shadow-md',
                    {
                      'eb-border-success eb-bg-success-accent hover:eb-bg-success-accent/80':
                        platformAgreementOpened,
                    }
                  )}
                >
                  <span className="eb-flex eb-items-center eb-gap-2">
                    <FileIcon />
                    <p className="eb-text-[#12647E] eb-underline">
                      {disclosureConfig?.platformAgreementLabel ??
                        `${disclosureConfig?.platformName}'s Program Agreement`}
                    </p>
                    <ExternalLinkIcon className="eb-text-[#12647E]" />
                  </span>
                  <span>
                    {platformAgreementOpened && (
                      <CheckCircleIcon className="eb-text-success" />
                    )}
                  </span>
                </Button>
              </div>
            )}
          </div>
          <div className="eb-space-y-3">
            {!(useHostAckList && showReviewAttestTermsAcknowledgementsIntro) ? (
              <p className="eb-text-sm eb-font-medium">
                {t(
                  'reviewAndAttest.attestation.heading',
                  'By electronically submitting this Application, you agree that:'
                )}
              </p>
            ) : null}
            {useHostAckList ? (
              <TermsAttestationAcknowledgementsGroup
                items={hostAckItems}
                checked={hostAckChecked}
                onCheckedChange={(id, value) => {
                  setHostAckChecked((prev) => ({ ...prev, [id]: value }));
                  setShouldDisplayHostAckAlert(false);
                }}
                disabled={!allLinksOpened}
                groupAriaLabel={tString(
                  'reviewAndAttest.termsAndConditions.attestations',
                  'Attestations'
                )}
                intro={
                  showReviewAttestTermsAcknowledgementsIntro
                    ? t(
                        'reviewAndAttest.termsAcknowledgements.intro',
                        'By electronically submitting this application, you agree that:'
                      )
                    : undefined
                }
                labelInterpolationValues={labelInterpolationValues}
              />
            ) : (
              <div
                className="eb-space-y-3 eb-rounded-md eb-border eb-border-border eb-bg-muted/30 eb-p-4"
                role="group"
                aria-label={tString(
                  'reviewAndAttest.termsAndConditions.attestations',
                  'Attestations'
                )}
              >
                <FormField
                  control={form.control}
                  name="attested"
                  disabled={!allLinksOpened}
                  render={({ field }) => (
                    <FormItem>
                      <div className="eb-flex eb-items-start eb-gap-2">
                        <FormControl>
                          <Checkbox
                            className="eb-mt-0.5"
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={field.disabled}
                          />
                        </FormControl>
                        <FormLabel className="eb-cursor-pointer eb-text-sm eb-font-normal eb-leading-relaxed eb-text-foreground peer-disabled:eb-cursor-not-allowed peer-disabled:eb-opacity-70">
                          {hasPlatformAgreement
                            ? t(
                                'reviewAndAttest.termsAndConditions.agreeToTermsWithPlatform',
                                {
                                  platformAgreementLabel:
                                    disclosureConfig?.platformAgreementLabel ??
                                    `${disclosureConfig?.platformName}'s Program Agreement`,
                                  defaultValue:
                                    'You have read and agree to the J.P. Morgan Account Terms and the {{platformAgreementLabel}}.',
                                }
                              )
                            : t(
                                'reviewAndAttest.termsAndConditions.agreeToTerms',
                                'You have read and agree to the J.P. Morgan Account Terms.'
                              )}
                        </FormLabel>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {hasDisclosureConfig && (
                  <FormField
                    control={form.control}
                    name="attestAuthorizeSharing"
                    render={({ field }) => (
                      <FormItem>
                        <div className="eb-flex eb-items-start eb-gap-2">
                          <FormControl>
                            <Checkbox
                              className="eb-mt-0.5"
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="eb-cursor-pointer eb-text-sm eb-font-normal eb-leading-relaxed eb-text-foreground">
                            {t('reviewAndAttest.attestation.authorizeSharing', {
                              platformName: disclosureConfig!.platformName,
                              defaultValue:
                                'You authorize {{platformName}} and JPMorgan Chase Bank, N.A. ("JPMC") to share information to facilitate the opening of your deposit account(s), and appoint {{platformName}} as your agent to act on your behalf regarding your deposit account.',
                            })}
                          </FormLabel>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            )}
          </div>
          {!allLinksOpened && (
            <Alert variant="informative" noTitle>
              <InfoIcon className="eb-h-4 eb-w-4" />
              <AlertDescription>
                {t(
                  'reviewAndAttest.termsAndConditions.mustReviewDocuments',
                  'You must open and review all documents before selecting the checkbox'
                )}
              </AlertDescription>
            </Alert>
          )}
          <ServerErrorAlert
            error={updateClientError || clientVerificationsError}
          />
        </div>
        <div className="eb-mt-6 eb-space-y-6">
          <div className="eb-flex eb-flex-col eb-gap-3">
            <Button
              type="submit"
              variant="default"
              size="lg"
              className={cn('eb-w-full eb-text-lg', {
                'eb-hidden': getNextButtonLabel() === null,
              })}
              disabled={
                isFormSubmitting || (useHostAckList && !hostAckComplete)
              }
            >
              {isFormSubmitting && <Loader2Icon className="eb-animate-spin" />}
              {getNextButtonLabel()}
            </Button>
            <Button
              type="button"
              onClick={handlePrev}
              variant="secondary"
              size="lg"
              className={cn('eb-w-full eb-text-lg', {
                'eb-hidden': getPrevButtonLabel() === null,
              })}
            >
              {getPrevButtonLabel()}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
};
