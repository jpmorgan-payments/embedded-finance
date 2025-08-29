import { useEffect, useState } from 'react';
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
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

import { cn, useIPAddress } from '@/lib/utils';
import {
  getSmbdoGetClientQueryKey,
  smbdoDownloadDocument,
  smbdoGetDocumentDetail,
  useSmbdoPostClientVerifications,
  useSmbdoUpdateClientLegacy,
} from '@/api/generated/smbdo';
import { UpdateClientRequestSmbdo } from '@/api/generated/smbdo.schemas';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
import { ServerErrorAlert } from '@/core/OnboardingFlow/components';
import {
  useFlowContext,
  useOnboardingContext,
} from '@/core/OnboardingFlow/contexts';
import { StepperStepProps } from '@/core/OnboardingFlow/types/flow.types';

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
  const { clientData, onPostClientSettled } = useOnboardingContext();
  const { updateSessionData } = useFlowContext();

  const { t } = useTranslation('onboarding');

  const form = useForm({
    defaultValues: {
      attested: false,
    },
    resolver: zodResolver(
      z.object({
        attested: z.boolean().refine((value) => value === true, {
          message:
            'You must agree to all of the documents listed on this page.',
        }),
      })
    ),
  });

  const { data: IPAddress } = useIPAddress();

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

  const allDocumentsOpened = documentIds.every(
    (id) => termsDocumentsOpened[id] || documentErrors[id]
  );

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
            onSuccess: () => {
              updateSessionData({
                mockedKycCompleted: true,
              });
              queryClient.invalidateQueries({
                queryKey: getSmbdoGetClientQueryKey(clientData.id),
              });
              handleNext();
            },
          }
        );
      } catch (error) {
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

  const isFormSubmitting =
    clientUpdateStatus === 'pending' || clientVerificationsStatus === 'pending';

  return (
    <Form {...form}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!allDocumentsOpened) {
            setShouldDisplayAlert(true);
          } else {
            form.handleSubmit(() => {
              onCompleteKYCHandler();
            })(e);
          }
        }}
        className="eb-flex eb-flex-auto eb-flex-col"
      >
        <div className="eb-mt-6 eb-flex-auto eb-space-y-6">
          {!allDocumentsOpened && shouldDisplayAlert && (
            <Alert variant="destructive" noTitle>
              <AlertCircleIcon className="eb-h-4 eb-w-4" />
              <AlertDescription>
                Please open the document links and confirm that you have read
                and agree to all documents.
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
                          ? 'Loading...'
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
                      Failed to download document: {documentErrors[id]}
                    </div>
                  )}
                  {!query && documentErrors[id] && (
                    <div className="eb-ml-1 eb-text-sm eb-text-destructive">
                      Failed to fetch document details: {documentErrors[id]}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className="eb-space-y-1">
            <p className="eb-text-sm eb-font-medium">Document attestation</p>
            <FormField
              control={form.control}
              name="attested"
              disabled={!allDocumentsOpened}
              render={({ field }) => (
                <FormItem>
                  <div className="eb-flex eb-items-center eb-space-x-2">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={field.disabled}
                      />
                    </FormControl>
                    <FormLabel className="eb-text-sm eb-font-normal eb-text-foreground peer-disabled:eb-cursor-not-allowed peer-disabled:eb-opacity-70">
                      I have read and agree to all of the documents listed on
                      this page
                    </FormLabel>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          {!allDocumentsOpened && (
            <Alert variant="informative" noTitle>
              <InfoIcon className="eb-h-4 eb-w-4" />
              <AlertDescription>
                You must open and review all documents before selecting the
                checkbox
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
              disabled={isFormSubmitting}
            >
              {isFormSubmitting && <Loader2Icon className="eb-animate-spin" />}
              {getNextButtonLabel()}
            </Button>
            <Button
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
