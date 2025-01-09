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
  PostUploadDocument,
} from '@/api/generated/smbdo.schemas';
import Dropzone from '@/components/ui/dropzone';
import { useStepper } from '@/components/ui/stepper';
import {
  Button,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Separator,
} from '@/components/ui';

import { FormActions } from '../FormActions/FormActions';
import { FormLoadingState } from '../FormLoadingState/FormLoadingState';
import { useOnboardingContext } from '../OnboardingContextProvider/OnboardingContextProvider';
import { DOCUMENT_TYPE_MAPPING } from '../utils/documentTypeMapping';

interface DocumentUploadStepFormProps {
  standalone?: boolean;
  onSubmit?: (values: any) => void;
}

const generateRequestId = () => {
  return uuidv4()
    .replace(/[^a-zA-Z0-9_-]/g, '')
    .slice(0, 32);
};

export const DocumentUploadStepForm = ({
  standalone = false,
  onSubmit: externalOnSubmit,
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

  const documentRequestsQueries = useQueries({
    queries: (partiesDocumentRequests ?? []).map((documentRequestId) => ({
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

            await uploadDocumentMutation.mutateAsync(
              { data: documentData },
              {
                onSuccess: async () => {
                  toast.success('Document uploaded successfully');

                  // submit documetn request
                  await submitDocumentMutation.mutateAsync({
                    id: documentRequestId,
                  });
                },
                onError: () => {
                  toast.error('Error uploading document');
                },
              }
            );
          }
        }
      }
      // Invalidate both client and document request queries
      queryClient.invalidateQueries();

      if (externalOnSubmit) {
        externalOnSubmit(values);
      } else {
        nextStep();
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error uploading documents:', error);
    }
  });

  if (documentRequestsQueries?.pending) {
    return <FormLoadingState message="Fetching document requests..." />;
  }

  if (documentRequestsQueries?.data?.length === 0) {
    return (
      <p className="eb-text-sm">
        No document requests found. Please proceed to the next step.
      </p>
    );
  }

  return (
    <Form {...form}>
      <form
        onSubmit={onSubmit}
        className="eb-grid eb-w-full eb-items-start eb-gap-6 eb-overflow-auto eb-p-1"
      >
        {documentRequestsQueries?.data?.map((documentRequest) => {
          return (
            <Fragment key={documentRequest?.id}>
              <div className="eb-border-l-4 eb-border-yellow-500 eb-bg-yellow-100 eb-p-4 eb-text-yellow-700">
                {documentRequest?.description?.split('\n').map((item, key) => (
                  <p key={key} className="eb-text-sm">
                    {item}
                  </p>
                ))}
              </div>
              <Separator />
              {documentRequest?.requirements?.map((requirement, index) => {
                const documentType = requirement.documentTypes[0];
                return (
                  <FormField
                    key={index}
                    control={form.control}
                    name={`${documentRequest?.id}.${documentType}`}
                    render={({ field: { onChange, ...fieldProps } }) => {
                      return (
                        <>
                          <FormItem>
                            <FormLabel asterisk>
                              {DOCUMENT_TYPE_MAPPING[documentType].label}
                            </FormLabel>
                            <FormDescription>
                              {DOCUMENT_TYPE_MAPPING[documentType].description}
                            </FormDescription>
                            <FormControl>
                              <Dropzone
                                containerClassName="eb-max-w-xl"
                                {...fieldProps}
                                multiple={(requirement.minRequired ?? 0) > 1}
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
                                  const validFiles = files.filter((file) => {
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
                                  });
                                  onChange(validFiles);
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>

                          <Separator />
                        </>
                      );
                    }}
                  />
                );
              })}
            </Fragment>
          );
        })}

        {!standalone && <FormActions />}
        {standalone && (
          <Button
            type="submit"
            disabled={!form.formState.isValid || form.formState.isSubmitting}
            className="eb-ml-auto"
          >
            {form.formState.isSubmitting ? 'Uploading...' : 'Upload Documents'}
          </Button>
        )}
      </form>
    </Form>
  );
};
