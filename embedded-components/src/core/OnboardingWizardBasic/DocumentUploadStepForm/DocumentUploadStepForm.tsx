import { Fragment, useEffect, useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueries, useQueryClient } from '@tanstack/react-query';
import { useForm, useWatch } from 'react-hook-form';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
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

interface UploadedDocument {
  documentType: DocumentTypeSmbdo;
  files: File[];
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

  // State to track which requirements are active/visible
  const [activeRequirements, setActiveRequirements] = useState<
    Record<string, number[]>
  >({});

  // State to track satisfied document types
  const [satisfiedDocTypes, setSatisfiedDocTypes] = useState<
    DocumentTypeSmbdo[]
  >([]);

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

  // Initialize active requirements when document requests are loaded
  useEffect(() => {
    if (documentRequestsQueries?.data?.length) {
      const initialActiveReqs: Record<string, number[]> = {};
      documentRequestsQueries.data.forEach((docRequest) => {
        if (docRequest?.id) {
          // Only make the first requirement active initially
          initialActiveReqs[docRequest.id] = [0];
        }
      });
      setActiveRequirements(initialActiveReqs);
    }
  }, [JSON.stringify(documentRequestsQueries?.data)]);

  // zod schema, dynamically generated based on the document types
  const DocumentUploadSchema = useMemo(() => {
    const schema: Record<string, z.ZodType<any>> = {};
    documentRequestsQueries?.data?.forEach((documentRequest) => {
      if (!documentRequest?.id) {
        return;
      }
      const nestedSchema: Record<string, z.ZodType<any>> = {};

      // Only include active requirements in the schema
      documentRequest?.requirements?.forEach((requirement, index) => {
        const docId = documentRequest.id;
        if (docId && activeRequirements[docId]?.includes(index)) {
          // Add a field for document type selection
          nestedSchema[`requirement_${index}_docType`] = z
            .string()
            .nonempty('Document type is required');
          // Add a field for file upload
          nestedSchema[`requirement_${index}_files`] = z
            .array(z.instanceof(File))
            .nonempty('Document is required');
        }
      });

      schema[documentRequest.id] = z.object(nestedSchema);
    });
    return z.object(schema);
  }, [
    JSON.stringify(documentRequestsQueries?.data),
    JSON.stringify(activeRequirements),
  ]);

  const form = useForm<z.infer<typeof DocumentUploadSchema>>({
    resolver: zodResolver(DocumentUploadSchema),
  });

  // Watch form values to evaluate requirements
  const formValues = useWatch({
    control: form.control,
  });

  // Evaluate requirements when form values change
  useEffect(() => {
    if (!formValues) return;

    const newUploadedDocs: Record<string, UploadedDocument[]> = {};
    const newSatisfiedDocTypes: DocumentTypeSmbdo[] = [];

    // Process form values to extract uploaded documents
    Object.entries(formValues).forEach(([docRequestId, requirementValues]) => {
      newUploadedDocs[docRequestId] = [];

      Object.entries(requirementValues as Record<string, any>).forEach(
        ([fieldName, value]) => {
          if (fieldName.endsWith('_docType') && value) {
            const reqIndex = parseInt(fieldName.split('_')[1], 10);
            const filesFieldName = `requirement_${reqIndex}_files`;
            const files = (requirementValues as any)[filesFieldName];

            if (files && files.length > 0) {
              newUploadedDocs[docRequestId].push({
                documentType: value as DocumentTypeSmbdo,
                files,
              });

              // Add to satisfied document types
              if (!newSatisfiedDocTypes.includes(value as DocumentTypeSmbdo)) {
                newSatisfiedDocTypes.push(value as DocumentTypeSmbdo);
              }
            }
          }
        }
      );
    });

    setSatisfiedDocTypes(newSatisfiedDocTypes);

    // Evaluate which requirements should be active
    const newActiveReqs = { ...activeRequirements };

    documentRequestsQueries?.data?.forEach((docRequest) => {
      if (!docRequest?.id) return;

      const docId = docRequest.id;

      // Always keep the first requirement active
      if (!newActiveReqs[docId]) {
        newActiveReqs[docId] = [0];
      }

      // Check if we need to activate more requirements
      if (docRequest.requirements) {
        docRequest.requirements.forEach((requirement, reqIndex) => {
          // Skip the first requirement as it's always active
          if (reqIndex === 0) return;

          // Check if previous requirements are satisfied
          const prevRequirementsSatisfied = docRequest.requirements
            ? docRequest.requirements.slice(0, reqIndex).every((prevReq) => {
                // Count how many documents of the required types have been uploaded
                const uploadedDocsOfRequiredTypes =
                  newUploadedDocs[docId]?.filter((doc: UploadedDocument) =>
                    prevReq.documentTypes.includes(doc.documentType)
                  ).length || 0;

                return (
                  uploadedDocsOfRequiredTypes >= (prevReq.minRequired || 1)
                );
              })
            : false;

          // If previous requirements are satisfied, activate this requirement
          if (prevRequirementsSatisfied) {
            if (!newActiveReqs[docId].includes(reqIndex)) {
              newActiveReqs[docId].push(reqIndex);
            }
          } else {
            // If not satisfied, deactivate this requirement
            newActiveReqs[docId] = newActiveReqs[docId].filter(
              (idx: number) => idx !== reqIndex
            );
          }
        });
      }
    });

    setActiveRequirements(newActiveReqs);
  }, [formValues, documentRequestsQueries?.data]);

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      // Convert files to base64 and upload them
      for (const [documentRequestId, requirementValues] of Object.entries(
        values
      )) {
        const docRequestUploads: Record<string, File[]> = {};

        // Process form values to extract document types and files
        Object.entries(requirementValues as Record<string, any>).forEach(
          ([fieldName, value]) => {
            if (fieldName.endsWith('_docType') && value) {
              const reqIndex = parseInt(fieldName.split('_')[1], 10);
              const filesFieldName = `requirement_${reqIndex}_files`;
              const files = (requirementValues as any)[filesFieldName];

              if (files && files.length > 0) {
                docRequestUploads[value as string] = files;
              }
            }
          }
        );

        // Upload files for each document type
        for (const [documentType, files] of Object.entries(docRequestUploads)) {
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

  // Helper function to check if a document type is satisfied
  const isDocTypeSatisfied = (docType: DocumentTypeSmbdo) => {
    return satisfiedDocTypes.includes(docType);
  };

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
                <div className="eb-space-y-6 eb-p-4">
                  {documentRequest?.requirements?.map(
                    (requirement, requirementIndex) => {
                      // Check if this requirement is active
                      const docId = documentRequest?.id;
                      const isActive =
                        docId &&
                        activeRequirements[docId]?.includes(requirementIndex);

                      // Count how many document types are already satisfied
                      const satisfiedCount = requirement.documentTypes.filter(
                        (docType) =>
                          isDocTypeSatisfied(docType as DocumentTypeSmbdo)
                      ).length;

                      // Calculate remaining docs needed
                      const remainingNeeded = Math.max(
                        (requirement.minRequired || 1) - satisfiedCount,
                        0
                      );

                      // Get list of satisfied doc types for this requirement
                      const satisfiedDocTypesForReq =
                        requirement.documentTypes.filter((docType) =>
                          isDocTypeSatisfied(docType as DocumentTypeSmbdo)
                        );

                      // Get a formatted list of already provided doc names for display
                      const alreadyProvidedDocNames = satisfiedDocTypesForReq
                        .map(
                          (docType) =>
                            DOCUMENT_TYPE_MAPPING[docType as DocumentTypeSmbdo]
                              ?.label || docType
                        )
                        .join(', ');

                      // If not active, show a summary instead
                      if (!isActive) {
                        return (
                          <div
                            key={`${requirementIndex}-summary`}
                            className="eb-rounded-md eb-border eb-border-gray-200 eb-bg-gray-50 eb-p-3"
                          >
                            <h4 className="eb-mb-2 eb-text-sm eb-font-medium eb-text-gray-700">
                              {satisfiedCount > 0 ? (
                                <span>
                                  Requirement {requirementIndex + 1}:{' '}
                                  {satisfiedCount ===
                                  requirement.documentTypes.length ? (
                                    <span className="eb-text-green-700">
                                      All document types already provided
                                    </span>
                                  ) : remainingNeeded === 0 ? (
                                    <span className="eb-text-green-700">
                                      Minimum requirement met (
                                      {requirement.minRequired} of{' '}
                                      {requirement.minRequired})
                                    </span>
                                  ) : (
                                    <span>
                                      {alreadyProvidedDocNames} already
                                      provided. Need {remainingNeeded} more
                                      document(s) from the list below.
                                    </span>
                                  )}
                                </span>
                              ) : (
                                <span>
                                  Requirement {requirementIndex + 1}: Upload{' '}
                                  {requirement.minRequired} of the following
                                  document types
                                </span>
                              )}
                            </h4>

                            {/* Only show document types that aren't already satisfied */}
                            {remainingNeeded > 0 && (
                              <div className="eb-mt-2 eb-text-sm eb-text-gray-600">
                                <p>Remaining document types needed:</p>
                                <ul className="eb-mt-1 eb-list-disc eb-pl-5">
                                  {requirement.documentTypes
                                    .filter(
                                      (docType) =>
                                        !isDocTypeSatisfied(
                                          docType as DocumentTypeSmbdo
                                        )
                                    )
                                    .map((docType) => (
                                      <li key={docType}>
                                        {DOCUMENT_TYPE_MAPPING[
                                          docType as DocumentTypeSmbdo
                                        ]?.label || docType}
                                      </li>
                                    ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        );
                      }

                      // Filter out already satisfied document types if they weren't selected in this requirement
                      const availableDocTypes =
                        requirement.documentTypes.filter((docType) => {
                          const docTypeStr = docType as DocumentTypeSmbdo;
                          const isCurrentlySelected =
                            form.watch(
                              `${documentRequest?.id}.requirement_${requirementIndex}_docType`
                            ) === docTypeStr;
                          return (
                            isCurrentlySelected ||
                            !isDocTypeSatisfied(docTypeStr)
                          );
                        });

                      return (
                        <div
                          key={`${requirementIndex}-active`}
                          className="eb-rounded-md eb-border eb-border-gray-200 eb-p-4"
                        >
                          <h4 className="eb-mb-3 eb-text-sm eb-font-medium eb-text-gray-700">
                            {satisfiedCount > 0 ? (
                              <span>
                                Requirement {requirementIndex + 1}:{' '}
                                {alreadyProvidedDocNames} already provided.
                                {remainingNeeded > 0 ? (
                                  <span>
                                    {' '}
                                    Need {remainingNeeded} more document(s).
                                  </span>
                                ) : (
                                  <span className="eb-text-green-700">
                                    {' '}
                                    Minimum requirement met.
                                  </span>
                                )}
                              </span>
                            ) : (
                              <span>
                                Requirement {requirementIndex + 1}: Upload{' '}
                                {requirement.minRequired} of the following
                                document types
                              </span>
                            )}
                          </h4>

                          {/* Only show the selection if there are still document types to choose from */}
                          {availableDocTypes.length > 0 && (
                            <>
                              {/* Document Type Selection */}
                              <FormField
                                control={form.control}
                                name={`${documentRequest?.id}.requirement_${requirementIndex}_docType`}
                                render={({ field }) => (
                                  <FormItem className="eb-mb-4">
                                    <FormLabel
                                      asterisk
                                      className="eb-text-sm eb-font-medium eb-text-gray-700"
                                    >
                                      Select Document Type
                                    </FormLabel>
                                    <FormControl>
                                      <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                      >
                                        <SelectTrigger className="eb-w-full">
                                          <SelectValue placeholder="Select a document type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {availableDocTypes.map((docType) => (
                                            <SelectItem
                                              key={docType}
                                              value={docType}
                                            >
                                              {DOCUMENT_TYPE_MAPPING[
                                                docType as DocumentTypeSmbdo
                                              ]?.label || docType}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </FormControl>
                                    <FormMessage className="eb-text-xs" />
                                  </FormItem>
                                )}
                              />

                              {/* File Upload */}
                              <FormField
                                control={form.control}
                                name={`${documentRequest?.id}.requirement_${requirementIndex}_files`}
                                render={({
                                  field: { onChange, ...fieldProps },
                                }) => {
                                  // Get the selected document type
                                  const selectedDocType = form.watch(
                                    `${documentRequest?.id}.requirement_${requirementIndex}_docType`
                                  );

                                  return (
                                    <FormItem className="eb-space-y-2">
                                      <FormLabel
                                        asterisk
                                        className="eb-text-sm eb-font-medium eb-text-gray-700"
                                      >
                                        Upload Document
                                      </FormLabel>
                                      {selectedDocType && (
                                        <FormDescription className="eb-text-xs eb-text-gray-500">
                                          {DOCUMENT_TYPE_MAPPING[
                                            selectedDocType as DocumentTypeSmbdo
                                          ]?.description || ''}
                                        </FormDescription>
                                      )}
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
                                                    `${documentRequest?.id}.requirement_${requirementIndex}_files`,
                                                    {
                                                      message:
                                                        'Each file must be less than 2MB',
                                                    }
                                                  );
                                                  return false;
                                                }
                                                form.clearErrors(
                                                  `${documentRequest?.id}.requirement_${requirementIndex}_files`
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
                            </>
                          )}

                          {/* Show message when all requirements are met */}
                          {availableDocTypes.length === 0 && (
                            <div className="eb-rounded-md eb-bg-green-50 eb-p-2 eb-text-sm eb-font-medium eb-text-green-700">
                              All document types for this requirement have been
                              provided. You can proceed to the next step.
                            </div>
                          )}
                        </div>
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
