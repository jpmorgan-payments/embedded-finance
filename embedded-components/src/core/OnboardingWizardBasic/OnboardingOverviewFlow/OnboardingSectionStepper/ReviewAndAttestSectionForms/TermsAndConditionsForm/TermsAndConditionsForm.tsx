import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueries } from '@tanstack/react-query';
import {
  AlertCircleIcon,
  CheckCircleIcon,
  ExternalLinkIcon,
  FileIcon,
  InfoIcon,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

import { cn } from '@/lib/utils';
import {
  smbdoDownloadDocument,
  smbdoGetDocumentDetail,
  useSmbdoPostClientVerifications,
  useSmbdoUpdateClient,
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
import { ServerErrorAlert } from '@/core/OnboardingWizardBasic/ServerErrorAlert/ServerErrorAlert';
import { useIPAddress } from '@/core/OnboardingWizardBasic/utils/getIPAddress';

import { useOnboardingOverviewContext } from '../../../OnboardingContext/OnboardingContext';
import { GlobalStepper } from '../../../OnboardingGlobalStepper';
import { SectionStepComponent } from '../../../types';

const generateSessionId = () => {
  const sessionId = uuidv4();
  return sessionId.replace(/[^a-zA-Z0-9_-]/g, '');
};

export const TermsAndConditionsForm: SectionStepComponent = ({
  stepId,
  handleNext,
}) => {
  const { clientData, onPostClientResponse } = useOnboardingOverviewContext();
  const globalStepper = GlobalStepper.useStepper();

  const { t } = useTranslation('onboarding');

  const metadata = globalStepper.getMetadata('section-stepper');

  const form = useForm({
    defaultValues: {
      attested: Boolean(metadata?.attested),
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

  const allDocumentsOpened = Object.values(termsDocumentsOpened).every(Boolean);

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
                onPostClientResponse?.(data, error?.response?.data);
              },
            }
          );
        }

        await initiateKYCAsync(
          { id: clientData.id, data: verificationRequestBody },
          {
            onSuccess: () => {
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

  return (
    <Form {...form}>
      <form
        id={stepId}
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
      >
        <div className="eb-mt-6 eb-space-y-6">
          {!allDocumentsOpened && shouldDisplayAlert && (
            <Alert
              variant="destructive"
              className="eb-border-[#E52135] eb-bg-[#FFECEA] eb-pb-3"
            >
              <AlertCircleIcon className="eb-h-4 eb-w-4" />
              <AlertDescription>
                Please open the document links and confirm that you have read
                and agree to all documents.
              </AlertDescription>
            </Alert>
          )}
          <div className="eb-mt-2 eb-flex eb-flex-col eb-gap-2">
            {documentQueries.map((query) => (
              <div key={query.data?.id}>
                <Button
                  onClick={handleDocumentOpen(query.data?.id ?? '')}
                  variant="ghost"
                  className={cn(
                    'eb-flex eb-h-14 eb-w-full eb-justify-between eb-rounded-md eb-border eb-bg-card eb-px-4 eb-py-2 eb-font-sans eb-text-sm eb-font-normal eb-shadow-md',
                    {
                      'eb-border-[#00875D] eb-bg-[#EAF5F2] hover:eb-bg-[#e0ebe8]':
                        query.data?.id && termsDocumentsOpened[query.data.id],
                    }
                  )}
                  disabled={
                    query.data?.id ? loadingDocuments[query.data.id] : false
                  }
                >
                  <span className="eb-flex eb-items-center eb-gap-2">
                    <FileIcon />
                    <p className="eb-text-[#12647E] eb-underline">
                      {query.data?.documentType}
                    </p>
                    <ExternalLinkIcon className="eb-text-[#12647E]" />
                  </span>
                  <span>
                    {query.data?.id && termsDocumentsOpened[query.data.id] && (
                      <CheckCircleIcon className="eb-text-[#00875D]" />
                    )}
                    {query.data?.id &&
                      loadingDocuments[query.data.id] &&
                      t('reviewAndAttest.termsAndConditions.downloading')}
                  </span>
                </Button>
              </div>
            ))}
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
                      />
                    </FormControl>
                    <FormLabel className="eb-text-sm eb-font-normal peer-disabled:eb-cursor-not-allowed peer-disabled:eb-opacity-70">
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
            <Alert variant="informative" className="eb-pb-3">
              <InfoIcon className="eb-h-4 eb-w-4" />
              <AlertDescription>
                You must open and review all documents before selecting the
                checkbox
              </AlertDescription>
            </Alert>
          )}
          <ServerErrorAlert
            error={updateClientError || clientVerificationsError}
            className="eb-border-[#E52135] eb-bg-[#FFECEA]"
          />
        </div>
      </form>
    </Form>
  );
};
