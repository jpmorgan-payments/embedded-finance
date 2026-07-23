import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useTranslationWithTokens } from '@/i18n';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueries, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircleIcon,
  CheckCircleIcon,
  DownloadIcon,
  ExternalLinkIcon,
  FileIcon,
  InfoIcon,
} from 'lucide-react';
import {
  useForm,
  useFormState,
  useWatch,
  type UseFormReturn,
} from 'react-hook-form';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

import { useIPAddress } from '@/lib/hooks';
import { cn } from '@/lib/utils';
import {
  getSmbdoGetClientQueryKey,
  useSmbdoDownloadDocumentHook,
  useSmbdoGetDocumentDetailHook,
  useSmbdoPostClientVerifications,
  useSmbdoUpdateClientLegacy,
} from '@/api/generated/smbdo';
import { UpdateClientRequestSmbdo } from '@/api/generated/smbdo.schemas';
import type { DocumentTypeSmbdo } from '@/api/generated/smbdo.schemas';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ServerErrorAlert } from '@/components/ServerErrorAlert';
import {
  Button,
  Checkbox,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui';
import { DOCUMENT_TYPE_MAPPING } from '@/core/OnboardingFlow/config';
import {
  useFlowContext,
  useOnboardingContext,
} from '@/core/OnboardingFlow/contexts';
import { useFlowUnsavedChangesSync } from '@/core/OnboardingFlow/hooks/useFlowUnsavedChangesSync';

import { TermsAttestationAcknowledgementsGroup } from './TermsAttestationAcknowledgementsGroup';

const generateSessionId = () => {
  const sessionId = uuidv4();
  return sessionId.replace(/[^a-zA-Z0-9_-]/g, '');
};

/**
 * Resolve a human-friendly label for a document type. Prefers the curated
 * label from DOCUMENT_TYPE_MAPPING; for any unmapped enum value it falls back
 * to converting SNAKE_CASE to Title Case so a raw enum (e.g. TERMS_CONDITIONS)
 * is never shown to the user.
 */
const formatDocumentTypeLabel = (documentType?: string): string => {
  if (!documentType) {
    return '';
  }
  const mappedLabel =
    DOCUMENT_TYPE_MAPPING[documentType as DocumentTypeSmbdo]?.label;
  if (mappedLabel) {
    return mappedLabel;
  }
  return documentType
    .toLowerCase()
    .split(/[_\s]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

type TermsFormValues = {
  attested?: boolean;
  attestAuthorizeSharing?: boolean;
  // Delta-mode combined attestation: four discrete acknowledgements shown at
  // the end of the review step (see `combineAccuracyAttestation`).
  attestTermsRead?: boolean;
  attestAccountUse?: boolean;
  attestAgent?: boolean;
  attestDataAccuracy?: boolean;
};

export type UseTermsAndConditionsResult = {
  form: UseFormReturn<TermsFormValues>;
  allLinksOpened: boolean;
  shouldDisplayAlert: boolean;
  setShouldDisplayAlert: (value: boolean) => void;
  shouldDisplayHostAckAlert: boolean;
  setShouldDisplayHostAckAlert: (value: boolean) => void;
  useHostAckList: boolean;
  hostAckComplete: boolean;
  /** True when required attestation checkbox(es) are selected. */
  attestationComplete: boolean;
  isFormSubmitting: boolean;
  /** True when accuracy + terms are merged into one checkbox (delta mode). */
  combineAccuracyAttestation: boolean;
  trySubmit: () => Promise<boolean>;
  /** Stable JSX (not a component) so checkbox state is not remounted away. */
  termsBody: ReactNode;
};

/**
 * Shared terms documents + attestation state/UI used by the standalone Terms
 * step and by delta-mode Review (combined acknowledgement).
 */
export function useTermsAndConditions(options?: {
  onAfterKycSuccess?: () => void;
  /** When false, skip document fetches and unsaved-change tracking (still safe to call unconditionally). */
  enabled?: boolean;
  /**
   * Merge data-accuracy attestation into the terms checkbox (delta mode).
   * Host ack lists and authorize-sharing (disclosure) stay separate when present.
   */
  combineAccuracyAttestation?: boolean;
}): UseTermsAndConditionsResult {
  const enabled = options?.enabled !== false;
  const combineAccuracyAttestation = !!options?.combineAccuracyAttestation;
  const queryClient = useQueryClient();
  const {
    clientData,
    onPostClientSettled,
    disclosureConfig,
    reviewAttestTermsAcknowledgements,
    showReviewAttestTermsAcknowledgementsIntro,
    skipTermsDocumentAcknowledgment,
  } = useOnboardingContext();
  const { isFormSubmitting: isFormSubmittingContext, setIsFormSubmitting } =
    useFlowContext();

  const smbdoDownloadDocument = useSmbdoDownloadDocumentHook();
  const smbdoGetDocumentDetail = useSmbdoGetDocumentDetailHook();
  const { t, tString } = useTranslationWithTokens('onboarding-overview');

  const hasDisclosureConfig = !!disclosureConfig?.platformName;
  const hostAckItems = useMemo(
    () => reviewAttestTermsAcknowledgements ?? [],
    [reviewAttestTermsAcknowledgements]
  );
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
    // Delta-mode combined attestation: four discrete acknowledgements, all
    // required. Replaces the single combined checkbox (and authorize-sharing).
    if (combineAccuracyAttestation) {
      const requiredBool = z.boolean().refine((value) => value === true, {
        message: mustAgreeAll,
      });
      return z.object({
        attestTermsRead: requiredBool,
        attestAccountUse: requiredBool,
        attestAgent: requiredBool,
        attestDataAccuracy: requiredBool,
      });
    }
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
  }, [
    useHostAckList,
    combineAccuracyAttestation,
    hasDisclosureConfig,
    tString,
  ]);

  const form = useForm<TermsFormValues>({
    defaultValues: useHostAckList
      ? {}
      : combineAccuracyAttestation
        ? {
            attestTermsRead: false,
            attestAccountUse: false,
            attestAgent: false,
            attestDataAccuracy: false,
          }
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

  const attested = useWatch({ control: form.control, name: 'attested' });
  const attestAuthorizeSharing = useWatch({
    control: form.control,
    name: 'attestAuthorizeSharing',
  });
  // Delta-mode combined attestation checkboxes.
  const attestTermsRead = useWatch({
    control: form.control,
    name: 'attestTermsRead',
  });
  const attestAccountUse = useWatch({
    control: form.control,
    name: 'attestAccountUse',
  });
  const attestAgent = useWatch({ control: form.control, name: 'attestAgent' });
  const attestDataAccuracy = useWatch({
    control: form.control,
    name: 'attestDataAccuracy',
  });

  const attestationComplete = useMemo(() => {
    if (useHostAckList) {
      return hostAckComplete;
    }
    if (combineAccuracyAttestation) {
      return (
        !!attestTermsRead &&
        !!attestAccountUse &&
        !!attestAgent &&
        !!attestDataAccuracy
      );
    }
    if (!attested) {
      return false;
    }
    if (hasDisclosureConfig && !attestAuthorizeSharing) {
      return false;
    }
    return true;
  }, [
    useHostAckList,
    hostAckComplete,
    combineAccuracyAttestation,
    attestTermsRead,
    attestAccountUse,
    attestAgent,
    attestDataAccuracy,
    attested,
    hasDisclosureConfig,
    attestAuthorizeSharing,
  ]);

  const { isDirty } = useFormState({ control: form.control });
  const hostAckDirty = useMemo(
    () => Object.values(hostAckChecked).some(Boolean),
    [hostAckChecked]
  );
  useFlowUnsavedChangesSync(
    enabled && (useHostAckList ? hostAckDirty : isDirty),
    'terms-and-conditions'
  );

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
  const [documentBlobUrls, setDocumentBlobUrls] = useState<{
    [key: string]: string | null;
  }>({});

  const {
    mutateAsync: updateClientAsync,
    error: updateClientError,
    status: clientUpdateStatus,
  } = useSmbdoUpdateClientLegacy();

  const {
    mutateAsync: initiateKYCAsync,
    error: clientVerificationsError,
    status: clientVerificationsStatus,
  } = useSmbdoPostClientVerifications();

  const documentIds = enabled
    ? clientData?.outstanding?.attestationDocumentIds || []
    : [];

  const documentQueries = useQueries({
    queries: documentIds.map((id) => ({
      queryKey: ['documentDetail', id],
      queryFn: () => smbdoGetDocumentDetail(id),
      enabled,
    })),
  });

  const hasPlatformAgreement = !!disclosureConfig?.platformAgreementUrl;
  const [platformAgreementOpened, setPlatformAgreementOpened] = useState(false);

  // When the host opts out of document-open gating, the attestation checkboxes
  // are enabled immediately (links still render, opening them is optional).
  const allLinksOpened =
    skipTermsDocumentAcknowledgment ||
    (documentIds.every((id) => termsDocumentsOpened[id]) &&
      (!hasPlatformAgreement || platformAgreementOpened));

  const handlePlatformAgreementOpen = () => {
    if (disclosureConfig?.platformAgreementUrl) {
      window.open(disclosureConfig.platformAgreementUrl, '_blank')?.focus();
      setPlatformAgreementOpened(true);
    }
  };

  const handleDocumentOpen = (documentId: string) => async () => {
    try {
      setDocumentErrors((prev) => ({ ...prev, [documentId]: null }));
      setLoadingDocuments((prev) => ({ ...prev, [documentId]: true }));

      const response = await smbdoDownloadDocument(documentId, {
        responseType: 'blob',
      });

      const blob = new Blob([response as BlobPart], {
        type: 'application/pdf',
      });
      const url = URL.createObjectURL(blob);
      setDocumentBlobUrls((prev) => ({ ...prev, [documentId]: url }));

      const newWindow = window.open(url, '_blank');
      if (!newWindow) {
        throw new Error(
          tString(
            'reviewAndAttest.termsAndConditions.popupBlocked',
            'Failed to open document. Please check your popup blocker settings or use the save button to download the document.'
          )
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
    } finally {
      setLoadingDocuments((prev) => ({ ...prev, [documentId]: false }));
    }
  };

  const handleDocumentSave = (documentId: string) => async () => {
    try {
      setLoadingDocuments((prev) => ({ ...prev, [documentId]: true }));

      let url = documentBlobUrls[documentId];
      if (!url) {
        const response = await smbdoDownloadDocument(documentId, {
          responseType: 'blob',
        });
        const blob = new Blob([response as BlobPart], {
          type: 'application/pdf',
        });
        url = URL.createObjectURL(blob);
        setDocumentBlobUrls((prev) => ({ ...prev, [documentId]: url }));
      }

      const query = documentQueries.find((q) => q.data?.id === documentId);
      const documentType = query?.data?.documentType;
      const fileName =
        formatDocumentTypeLabel(documentType)
          .replace(/\s+/g, '_')
          .replace(/[^a-zA-Z0-9_-]/g, '') || documentId;

      const link = document.createElement('a');
      link.href = url;
      link.download = `${fileName}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTermsDocumentsOpened((prev) => ({ ...prev, [documentId]: true }));
      setDocumentErrors((prev) => ({ ...prev, [documentId]: null }));
    } catch (error) {
      setDocumentErrors((prev) => ({
        ...prev,
        [documentId]:
          error instanceof Error ? error.message : 'Failed to save document',
      }));
    } finally {
      setLoadingDocuments((prev) => ({ ...prev, [documentId]: false }));
    }
  };

  const onCompleteKYCHandler = async () => {
    if (!clientData?.id) {
      return;
    }

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
            return [details?.firstName, details?.middleName, details?.lastName]
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
        sessionId: generateSessionId(),
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
            await queryClient.invalidateQueries({
              queryKey: getSmbdoGetClientQueryKey(clientData.id),
            });
            options?.onAfterKycSuccess?.();
          },
        }
      );
    } catch (error) {
      setIsFormSubmitting(false);
      console.error('Error completing KYC process:', error);
    }
  };

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

  const trySubmit = async (): Promise<boolean> => {
    if (!allLinksOpened) {
      setShouldDisplayAlert(true);
      setShouldDisplayHostAckAlert(false);
      return false;
    }
    if (useHostAckList) {
      if (!hostAckComplete) {
        setShouldDisplayHostAckAlert(true);
        return false;
      }
      setShouldDisplayHostAckAlert(false);
      await onCompleteKYCHandler();
      return true;
    }
    setShouldDisplayHostAckAlert(false);
    let valid = false;
    await form.handleSubmit(async () => {
      valid = true;
      await onCompleteKYCHandler();
    })();
    return valid;
  };

  const documentLinkClassName = cn(
    combineAccuracyAttestation
      ? 'eb-flex eb-h-10 eb-w-full eb-justify-between eb-rounded-md eb-border eb-bg-card eb-px-3 eb-py-2 eb-font-sans eb-text-sm eb-font-normal'
      : 'eb-flex eb-h-14 eb-w-full eb-justify-between eb-rounded-md eb-border eb-bg-card eb-px-4 eb-py-2 eb-font-sans eb-text-sm eb-font-normal eb-shadow-md'
  );

  const documentLinks = (
    <div className="eb-flex eb-flex-col eb-gap-2">
      {documentIds.map((id) => {
        const query = documentQueries.find((q) => q.data?.id === id);

        return (
          <div key={id} className="eb-flex eb-flex-col eb-gap-1">
            <Button
              type="button"
              onClick={handleDocumentOpen(id)}
              variant="ghost"
              className={cn(documentLinkClassName, {
                'eb-border-success eb-bg-success-accent hover:eb-bg-success-accent/80':
                  termsDocumentsOpened[id],
              })}
              disabled={query?.isFetching || loadingDocuments[id]}
            >
              <span className="eb-flex eb-min-w-0 eb-items-center eb-gap-2">
                <FileIcon
                  className={
                    combineAccuracyAttestation
                      ? 'eb-size-4 eb-shrink-0'
                      : 'eb-shrink-0'
                  }
                />
                <p className="eb-truncate eb-normal-case eb-text-[#12647E] eb-underline">
                  {query?.isFetching || loadingDocuments[id] || !query?.data
                    ? t('common:loading', 'Loading...')
                    : formatDocumentTypeLabel(query?.data?.documentType)}
                </p>
                <ExternalLinkIcon
                  className={
                    combineAccuracyAttestation
                      ? 'eb-size-3.5 eb-shrink-0 eb-text-[#12647E]'
                      : 'eb-shrink-0 eb-text-[#12647E]'
                  }
                />
              </span>
              <span className="eb-shrink-0">
                {termsDocumentsOpened[id] && (
                  <CheckCircleIcon className="eb-size-4 eb-text-success" />
                )}
                {loadingDocuments[id] &&
                  t('reviewAndAttest.termsAndConditions.downloading')}
              </span>
            </Button>
            {query?.data?.id && documentErrors[query?.data.id] && (
              <div className="eb-ml-1 eb-flex eb-flex-col eb-gap-1">
                <div className="eb-flex eb-items-start eb-gap-1.5 eb-text-sm eb-text-destructive">
                  <AlertCircleIcon className="eb-mt-0.5 eb-h-4 eb-w-4 eb-shrink-0" />
                  <span>
                    {t(
                      'reviewAndAttest.termsAndConditions.failedToDownload',
                      'Failed to download document:'
                    )}{' '}
                    {documentErrors[id]}
                  </span>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleDocumentSave(id)}
                  disabled={loadingDocuments[id]}
                  className="eb-w-fit eb-gap-1"
                >
                  <DownloadIcon className="eb-h-4 eb-w-4" />
                  {t(
                    'reviewAndAttest.termsAndConditions.saveDocument',
                    'Save document'
                  )}
                </Button>
              </div>
            )}
            {!query && documentErrors[id] && (
              <div className="eb-ml-1 eb-flex eb-items-start eb-gap-1.5 eb-text-sm eb-text-destructive">
                <AlertCircleIcon className="eb-mt-0.5 eb-h-4 eb-w-4 eb-shrink-0" />
                <span>
                  {t(
                    'reviewAndAttest.termsAndConditions.failedToFetchDetails',
                    'Failed to fetch document details:'
                  )}{' '}
                  {documentErrors[id]}
                </span>
              </div>
            )}
          </div>
        );
      })}
      {hasPlatformAgreement && (
        <div className="eb-flex eb-flex-col eb-gap-1">
          <Button
            type="button"
            onClick={handlePlatformAgreementOpen}
            variant="ghost"
            className={cn(documentLinkClassName, {
              'eb-border-success eb-bg-success-accent hover:eb-bg-success-accent/80':
                platformAgreementOpened,
            })}
          >
            <span className="eb-flex eb-min-w-0 eb-items-center eb-gap-2">
              <FileIcon
                className={
                  combineAccuracyAttestation
                    ? 'eb-size-4 eb-shrink-0'
                    : 'eb-shrink-0'
                }
              />
              <p className="eb-truncate eb-normal-case eb-text-[#12647E] eb-underline">
                {disclosureConfig?.platformAgreementLabel ??
                  `${disclosureConfig?.platformName}'s Program Agreement`}
              </p>
              <ExternalLinkIcon
                className={
                  combineAccuracyAttestation
                    ? 'eb-size-3.5 eb-shrink-0 eb-text-[#12647E]'
                    : 'eb-shrink-0 eb-text-[#12647E]'
                }
              />
            </span>
            <span className="eb-shrink-0">
              {platformAgreementOpened && (
                <CheckCircleIcon className="eb-size-4 eb-text-success" />
              )}
            </span>
          </Button>
        </div>
      )}
    </div>
  );

  const attestedCheckboxLabel = combineAccuracyAttestation
    ? hasPlatformAgreement
      ? t('reviewAndAttest.deltaCombinedAttestation.checkboxWithPlatform', {
          platformAgreementLabel:
            disclosureConfig?.platformAgreementLabel ??
            `${disclosureConfig?.platformName}'s Program Agreement`,
          defaultValue:
            'I confirm that the information I provided is true, accurate, and complete to the best of my knowledge, and that I have read and agree to the J.P. Morgan Account Terms and the {{platformAgreementLabel}}.',
        })
      : t(
          'reviewAndAttest.deltaCombinedAttestation.checkbox',
          'I confirm that the information I provided is true, accurate, and complete to the best of my knowledge, and that I have read and agree to the J.P. Morgan Account Terms.'
        )
    : hasPlatformAgreement
      ? t('reviewAndAttest.termsAndConditions.agreeToTermsWithPlatform', {
          platformAgreementLabel:
            disclosureConfig?.platformAgreementLabel ??
            `${disclosureConfig?.platformName}'s Program Agreement`,
          defaultValue:
            'You have read and agree to the J.P. Morgan Account Terms and the {{platformAgreementLabel}}.',
        })
      : t(
          'reviewAndAttest.termsAndConditions.agreeToTerms',
          'You have read and agree to the J.P. Morgan Account Terms.'
        );

  const reviewHelperText =
    documentIds.length === 1
      ? t(
          'reviewAndAttest.termsAndConditions.mustReviewDocument',
          'Open and review the document above before selecting the checkbox.'
        )
      : t(
          'reviewAndAttest.termsAndConditions.mustReviewDocuments',
          'Open and review all documents above before selecting the checkbox.'
        );

  // Delta compact card: helper sits above the doc link, so use "below".
  const deltaReviewHelperText =
    documentIds.length === 1
      ? t(
          'reviewAndAttest.termsAndConditions.mustReviewDocumentBelow',
          'Open and review the document below before selecting the checkbox.'
        )
      : t(
          'reviewAndAttest.termsAndConditions.mustReviewDocumentsBelow',
          'Open and review all documents below before selecting the checkbox.'
        );

  // Render as JSX (not a nested component) so parent re-renders from
  // useWatch(attested) do not remount the checkbox tree and wipe the click.
  // Delta combined attestation: one compact card (docs + checkbox + helper).
  const termsBody: ReactNode =
    combineAccuracyAttestation && !useHostAckList ? (
      <div className="eb-space-y-3">
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
        <div
          className="eb-space-y-3 eb-rounded-md eb-border eb-border-border eb-bg-muted/30 eb-p-3"
          role="group"
          aria-label={tString(
            'reviewAndAttest.deltaCombinedAttestation.groupLabel',
            'Accuracy and terms attestation'
          )}
        >
          {!allLinksOpened && (
            <p className="eb-text-xs eb-text-muted-foreground">
              {deltaReviewHelperText}
            </p>
          )}
          {documentLinks}
          <FormField
            control={form.control}
            name="attestTermsRead"
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
                  <FormLabel className="eb-cursor-pointer eb-text-sm eb-font-normal eb-leading-snug eb-text-foreground peer-disabled:eb-cursor-not-allowed peer-disabled:eb-opacity-70">
                    {t(
                      'reviewAndAttest.deltaCombinedAttestation.checkboxTermsRead',
                      'I have read and agreed to the J.P. Morgan Embedded Payments Terms and Conditions'
                    )}
                  </FormLabel>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="attestAccountUse"
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
                  <FormLabel className="eb-cursor-pointer eb-text-sm eb-font-normal eb-leading-snug eb-text-foreground peer-disabled:eb-cursor-not-allowed peer-disabled:eb-opacity-70">
                    {t(
                      'reviewAndAttest.deltaCombinedAttestation.checkboxAccountUse',
                      'I understand that the Embedded Payments account may only be used to receive funds through SellSense pursuant to my commerce terms with the platform.'
                    )}
                  </FormLabel>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="attestAgent"
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
                  <FormLabel className="eb-cursor-pointer eb-text-sm eb-font-normal eb-leading-snug eb-text-foreground peer-disabled:eb-cursor-not-allowed peer-disabled:eb-opacity-70">
                    {t(
                      'reviewAndAttest.deltaCombinedAttestation.checkboxAgent',
                      'I understand I am appointing the platform provider as a non-discretionary agent for the account. This means that only the platform provider will give instructions on the payment of funds from my Embedded Payments account on a day-to-day basis in accordance with my commerce terms.'
                    )}
                  </FormLabel>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="attestDataAccuracy"
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
                  <FormLabel className="eb-cursor-pointer eb-text-sm eb-font-normal eb-leading-snug eb-text-foreground peer-disabled:eb-cursor-not-allowed peer-disabled:eb-opacity-70">
                    {t(
                      'reviewAndAttest.deltaCombinedAttestation.checkboxDataAccuracy',
                      'The data I am providing is true, accurate, current, and complete to the best of my knowledge.'
                    )}
                  </FormLabel>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <ServerErrorAlert
          error={updateClientError || clientVerificationsError}
        />
      </div>
    ) : (
      <>
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
        <div className="eb-mt-2">{documentLinks}</div>
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
                        {attestedCheckboxLabel}
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
            <AlertDescription>{reviewHelperText}</AlertDescription>
          </Alert>
        )}
        <ServerErrorAlert
          error={updateClientError || clientVerificationsError}
        />
      </>
    );

  return {
    form,
    allLinksOpened,
    shouldDisplayAlert,
    setShouldDisplayAlert,
    shouldDisplayHostAckAlert,
    setShouldDisplayHostAckAlert,
    useHostAckList,
    hostAckComplete,
    attestationComplete,
    isFormSubmitting,
    combineAccuracyAttestation,
    trySubmit,
    termsBody,
  };
}
