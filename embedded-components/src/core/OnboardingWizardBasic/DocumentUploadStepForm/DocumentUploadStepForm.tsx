import { Fragment, useMemo } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueries, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

import {
  smbdoGetDocumentRequest,
  useSmbdoGetClient,
  useSmbdoSubmitDocumentRequest,
  useSmbdoUploadDocument,
} from '@/api/generated/smbdo';
import {
  DocumentRequestResponse,
  DocumentTypeSmbdo,
  PostUploadDocument,
} from '@/api/generated/smbdo.schemas';
import Dropzone from '@/components/ui/dropzone';
import { useStepper } from '@/components/ui/stepper';
import {
  Button,
  Card,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui';

import { FormActions } from '../FormActions/FormActions';
import { FormLoadingState } from '../FormLoadingState/FormLoadingState';
import { useOnboardingContext } from '../OnboardingContextProvider/OnboardingContextProvider';
import { DOCUMENT_TYPE_MAPPING } from '../utils/documentTypeMapping';

interface DocumentUploadStepFormProps {
  standalone?: boolean;
  onSubmit?: (values: any) => void;
  partyFilter?: string;
  onComplete?: () => void;
}

const generateRequestId = () => {
  return uuidv4()
    .replace(/[^a-zA-Z0-9_-]/g, '')
    .slice(0, 32);
};

export const DocumentUploadStepForm = ({
  standalone = false,
  onSubmit: externalOnSubmit,
  partyFilter,
  onComplete,
}: DocumentUploadStepFormProps) => {
  const { nextStep } = useStepper();
  const { clientId } = useOnboardingContext();
  const queryClient = useQueryClient();
  const uploadDocumentMutation = useSmbdoUploadDocument();

  const submitDocumentMutation = useSmbdoSubmitDocumentRequest();

  // Fetch client data
  const { data: clientData } = useSmbdoGetClient(clientId ?? '');

  const partiesDocumentRequests = Array.from(
    new Set(
      clientData?.parties
        ?.map((p) => p?.validationResponse?.map((v) => v?.documentRequestIds))
        ?.flat(2)
        ?.filter((v) => v?.length)
        .concat(clientData?.outstanding?.documentRequestIds)
    )
  );

  // Filter document requests by partyId if partyFilter is provided
  const filteredDocumentRequests = partyFilter
    ? Array.from(
        new Set(
          clientData?.parties
            ?.filter((p) => p.id === partyFilter)
            ?.map((p) =>
              p?.validationResponse?.map((v) => v?.documentRequestIds)
            )
            ?.flat(2)
            ?.filter((v) => v?.length)
            // Include outstanding document requests if the filtered party is an organization
            .concat(
              clientData?.parties?.find((p) => p.id === partyFilter)
                ?.partyType === 'ORGANIZATION'
                ? clientData?.outstanding?.documentRequestIds || []
                : []
            )
        )
      )
    : partiesDocumentRequests;

  const documentRequestsQueries = useQueries({
    queries: (filteredDocumentRequests ?? []).map((documentRequestId) => ({
      queryKey: ['documentRequest', documentRequestId],
      queryFn: () =>
        documentRequestId && smbdoGetDocumentRequest(documentRequestId), // Ensure this returns a promise
    })),
    combine: (results) => {
      return {
        data: results.map((result) => result.data) as DocumentRequestResponse[],
        pending: results.some((result) => result.isPending),
      };
    },
  });

  // zod schema, dynamically generated based on the document types
  const DocumentUploadSchema = useMemo(() => {
    const schema: Record<string, z.ZodType<any>> = {};
    documentRequestsQueries?.data?.forEach((documentRequest) => {
      if (!documentRequest?.id) {
        return;
      }
      const nestedSchema: Record<string, z.ZodType<any>> = {};
      documentRequest?.requirements?.forEach((requirement) => {
        const documentType = requirement.documentTypes[0];
        nestedSchema[documentType] = z
          .array(z.instanceof(File))
          .nonempty('Document is required');
      });
      schema[documentRequest.id] = z.object(nestedSchema);
    });
    return z.object(schema);
  }, [JSON.stringify(documentRequestsQueries?.data)]);

  const form = useForm<z.infer<typeof DocumentUploadSchema>>({
    resolver: zodResolver(DocumentUploadSchema),
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      // Convert files to base64 and upload them
      for (const [documentRequestId, documentTypes] of Object.entries(values)) {
        for (const [documentType, files] of Object.entries(documentTypes)) {
          for (const file of files as File[]) {
            const base64Content = await new Promise<string>((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => {
                const base64 = reader.result as string;
                resolve(base64.split(',')[1]); // Remove data URL prefix
              };
              reader.readAsDataURL(file);
            });

            const documentData: PostUploadDocument = {
              requestId: generateRequestId(),
              documentContent: base64Content,
              documentName: file.name,
              documentType,
              documentMetadata: {
                documentRequestId,
              },
            };

            await uploadDocumentMutation.mutateAsync({ data: documentData });
          }
        }
        await submitDocumentMutation.mutateAsync({
          id: documentRequestId,
        });
      }

      // Invalidate both client and document request queries
      queryClient.invalidateQueries();

      if (externalOnSubmit) {
        externalOnSubmit(values);
      } else if (onComplete) {
        onComplete();
      } else {
        nextStep();
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error uploading documents:', error);
      toast.error('Error uploading document');
    }
  });

  if (documentRequestsQueries?.pending) {
    return <FormLoadingState message="Fetching document requests..." />;
  }

  if (filteredDocumentRequests?.length === 0 && !standalone) {
    return (
      <p className="eb-text-sm eb-text-gray-700">
        No document requests found. Please proceed to the next step.
      </p>
    );
  }

  return (
    <Form {...form}>
      <form
        onSubmit={onSubmit}
        className="eb-grid eb-w-full eb-items-start eb-gap-4 eb-overflow-auto"
      >
        {documentRequestsQueries?.data?.map((documentRequest, index) => {
          const partyDetails = clientData?.parties?.find(
            (p) => p.id === documentRequest?.partyId
          );
          const partyName =
            partyDetails?.partyType === 'INDIVIDUAL'
              ? `${partyDetails?.individualDetails?.firstName} ${partyDetails?.individualDetails?.lastName}`
              : partyDetails?.organizationDetails?.organizationName;

          // Only show the party heading if not in standalone mode or if there are multiple document requests
          const shouldShowPartyHeading =
            !standalone || documentRequestsQueries.data.length > 1;

          return (
            <Fragment key={`${documentRequest?.id}-${index}`}>
              {documentRequest?.partyId && shouldShowPartyHeading && (
                <h3 className="eb-mb-3 eb-text-lg eb-font-semibold eb-text-gray-800">
                  {`Document request for ${partyName}`}
                </h3>
              )}
              <Card className="eb-mb-4 eb-w-full eb-overflow-hidden eb-shadow-sm">
                <div className="eb-border-l-4 eb-border-amber-500 eb-bg-amber-50 eb-p-3 eb-text-amber-800">
                  {documentRequest?.description
                    ?.split('\n')
                    .map((item, key) => (
                      <p key={key} className="eb-text-sm">
                        {item}
                      </p>
                    ))}
                </div>
                <div className="eb-space-y-4 eb-p-4">
                  {documentRequest?.requirements?.map(
                    (requirement, requirementIndex) => {
                      const documentType = requirement
                        .documentTypes[0] as DocumentTypeSmbdo;
                      return (
                        <FormField
                          key={`${requirement?.documentTypes[0]}-${requirementIndex}`}
                          control={form.control}
                          name={`${documentRequest?.id}.${documentType}`}
                          render={({ field: { onChange, ...fieldProps } }) => {
                            return (
                              <FormItem className="eb-space-y-2">
                                <FormLabel
                                  asterisk
                                  className="eb-text-sm eb-font-medium eb-text-gray-700"
                                >
                                  {DOCUMENT_TYPE_MAPPING[documentType].label}
                                </FormLabel>
                                <FormDescription className="eb-text-xs eb-text-gray-500">
                                  {
                                    DOCUMENT_TYPE_MAPPING[documentType]
                                      .description
                                  }
                                </FormDescription>
                                <FormControl>
                                  <Dropzone
                                    containerClassName="eb-max-w-full"
                                    {...fieldProps}
                                    multiple={
                                      (requirement.minRequired ?? 0) > 1
                                    }
                                    accept={{
                                      'application/pdf': ['.pdf'],
                                      'image/jpeg': ['.jpeg', '.jpg'],
                                      'image/png': ['.png'],
                                      'image/gif': ['.gif'],
                                      'image/bmp': ['.bmp'],
                                      'image/tiff': ['.tiff', '.tif'],
                                      'image/webp': ['.webp'],
                                    }}
                                    onChange={(files) => {
                                      const maxSize = 2 * 1024 * 1024; // 2 MB
                                      const validFiles = files.filter(
                                        (file) => {
                                          if (file.size > maxSize) {
                                            form.setError(
                                              `${documentRequest?.id}.${documentType}`,
                                              {
                                                message:
                                                  'Each file must be less than 2MB',
                                              }
                                            );
                                            return false;
                                          }
                                          form.clearErrors(
                                            `${documentRequest?.id}.${documentType}`
                                          );

                                          return true;
                                        }
                                      );
                                      onChange(validFiles);
                                    }}
                                  />
                                </FormControl>
                                <FormMessage className="eb-text-xs" />
                              </FormItem>
                            );
                          }}
                        />
                      );
                    }
                  )}
                </div>
              </Card>
            </Fragment>
          );
        })}

        <div className="eb-mt-2 eb-flex eb-w-full eb-justify-end">
          {!standalone && <FormActions />}
          {standalone && filteredDocumentRequests?.length !== 0 && (
            <Button
              type="submit"
              disabled={!form.formState.isValid || form.formState.isSubmitting}
              className="eb-ml-auto"
            >
              {form.formState.isSubmitting
                ? 'Uploading...'
                : 'Upload Documents'}
            </Button>
          )}
        </div>
      </form>
    </Form>
  );
};
