import { Fragment, useEffect, useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueries, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, CheckCircle, CircleDashed, RefreshCw } from 'lucide-react';
import { useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

import {
  smbdoGetDocumentRequest,
  useSmbdoSubmitDocumentRequest,
  useSmbdoUploadDocument,
} from '@/api/generated/smbdo';
import {
  DocumentRequestResponse,
  DocumentTypeSmbdo,
  PostUploadDocument,
} from '@/api/generated/smbdo.schemas';
import Dropzone from '@/components/ui/dropzone';
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

import { FormLoadingState } from '../../../FormLoadingState/FormLoadingState';
import { DOCUMENT_TYPE_MAPPING } from '../../../utils/documentTypeMapping';
import { useFlowContext } from '../../context/FlowContext';
import { useOnboardingOverviewContext } from '../../OnboardingContext/OnboardingContext';

interface DocumentUploadFormProps {
  onSubmit?: (values: any) => void;
  partyFilter?: string;
  onComplete?: () => void;
}

interface UploadedDocument {
  documentType: DocumentTypeSmbdo;
  files: File[];
}

export const ACCEPTED_FILE_TYPES = {
  'application/pdf': ['.pdf'],
  'image/jpeg': ['.jpeg', '.jpg'],
  'image/png': ['.png'],
  'image/gif': ['.gif'],
  'image/bmp': ['.bmp'],
  'image/tiff': ['.tiff', '.tif'],
  'image/webp': ['.webp'],
};

const generateRequestId = () => {
  return uuidv4()
    .replace(/[^a-zA-Z0-9_-]/g, '')
    .slice(0, 32);
};

export const DocumentUploadForm = ({
  onSubmit: externalOnSubmit,
  partyFilter,
  onComplete,
}: DocumentUploadFormProps) => {
  const { clientData } = useOnboardingOverviewContext();
  const queryClient = useQueryClient();

  const { goBack } = useFlowContext();

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

  // State to track which document types were uploaded for each requirement
  const [requirementDocTypes, setRequirementDocTypes] = useState<
    Record<string, Record<number, DocumentTypeSmbdo[]>>
  >({});

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
        documentRequestId && smbdoGetDocumentRequest(documentRequestId),
    })),
    combine: (results) => {
      return {
        data: results
          .map((result) => result.data)
          .filter(
            (data): data is DocumentRequestResponse =>
              !!data && data.status === 'ACTIVE'
          ) as DocumentRequestResponse[],
        pending: results.some((result) => result.isPending),
      };
    },
  });

  // Initialize active requirements when document requests are loaded
  useEffect(() => {
    if (documentRequestsQueries?.data?.length) {
      const initialActiveReqs: Record<string, number[]> = {};
      documentRequestsQueries.data.forEach((docRequest) => {
        if (docRequest?.id && docRequest.requirements?.length) {
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
      if (!documentRequest?.id || !documentRequest.requirements) {
        return;
      }
      const nestedSchema: Record<string, z.ZodType<any>> = {};

      // Include all requirements in the schema, not just active ones
      documentRequest.requirements.forEach((requirement, index) => {
        // Calculate how many document fields we need
        const remainingNeeded = Math.max(
          (requirement.minRequired || 1) -
            requirement.documentTypes.filter((docType) =>
              satisfiedDocTypes.includes(docType as DocumentTypeSmbdo)
            ).length,
          0
        );

        // If documents are still needed, create the required fields
        if (remainingNeeded > 0) {
          // Use fixed number of fields based on requirement
          const numFieldsToShow = requirement.minRequired || 1;

          // Create fields for each document upload
          for (let i = 0; i < numFieldsToShow; i += 1) {
            const fieldSuffix = i > 0 ? `_${i}` : '';
            // Add a field for document type selection
            nestedSchema[`requirement_${index}_docType${fieldSuffix}`] = z
              .string()
              .optional(); // Make optional instead of required
            // Add a field for file upload
            nestedSchema[`requirement_${index}_files${fieldSuffix}`] = z
              .array(z.instanceof(File))
              .refine(
                (files) => {
                  if (!files?.length) return true;
                  const MAX_FILE_SIZE = 2 * 1024 * 1024; // 10MB in bytes
                  return files.every((file) => file.size <= MAX_FILE_SIZE);
                },
                {
                  message: 'Each file must be 2MB or less',
                }
              )
              .optional(); // Make optional instead of required
          }
        }
      });

      schema[documentRequest.id] = z.object(nestedSchema);
    });
    return z.object(schema);
  }, [
    JSON.stringify(documentRequestsQueries?.data),
    JSON.stringify(satisfiedDocTypes),
  ]);

  const form = useForm<z.infer<typeof DocumentUploadSchema>>({
    resolver: zodResolver(DocumentUploadSchema),
    mode: 'onChange', // Add this to validate on change
  });

  // Add useEffect to trigger validation when form state needs updating
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      // Trigger validation manually after schema changes
      form.trigger();
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [JSON.stringify(activeRequirements), form]);

  // Watch form values to evaluate requirements
  const formValues = useWatch({
    control: form.control,
  });

  // Evaluate requirements when form values change
  useEffect(() => {
    if (!formValues) return;

    const newUploadedDocs: Record<string, UploadedDocument[]> = {};
    const newSatisfiedDocTypes: DocumentTypeSmbdo[] = [];
    const newRequirementDocTypes: Record<
      string,
      Record<number, DocumentTypeSmbdo[]>
    > = {};

    // Process form values to extract uploaded documents
    Object.entries(formValues).forEach(([docRequestId, requirementValues]) => {
      newUploadedDocs[docRequestId] = [];
      // Initialize the object for this document request
      newRequirementDocTypes[docRequestId] = {};

      Object.entries(requirementValues as Record<string, any>).forEach(
        ([fieldName, value]) => {
          if (fieldName.includes('_docType') && value) {
            // Extract requirement index and suffix from field name
            const reqParts = fieldName.split('_');
            const reqIndex = parseInt(reqParts[1], 10);

            // Determine if this is a suffixed field
            const fieldBase = `requirement_${reqIndex}_files`;
            const fieldSuffix = fieldName.replace(
              `requirement_${reqIndex}_docType`,
              ''
            );
            const filesFieldName = `${fieldBase}${fieldSuffix}`;

            const files = (requirementValues as any)[filesFieldName];

            if (files && files.length > 0) {
              const docType = value as DocumentTypeSmbdo;
              newUploadedDocs[docRequestId].push({
                documentType: docType,
                files,
              });

              // Add to satisfied document types
              if (!newSatisfiedDocTypes.includes(docType)) {
                newSatisfiedDocTypes.push(docType);
              }

              // Track which document types were uploaded for each requirement
              if (!newRequirementDocTypes[docRequestId][reqIndex]) {
                newRequirementDocTypes[docRequestId][reqIndex] = [];
              }
              if (
                !newRequirementDocTypes[docRequestId][reqIndex].includes(
                  docType
                )
              ) {
                newRequirementDocTypes[docRequestId][reqIndex].push(docType);
              }
            }
          }
        }
      );
    });

    setSatisfiedDocTypes(newSatisfiedDocTypes);
    setRequirementDocTypes(newRequirementDocTypes);

    // Evaluate which requirements should be active
    const newActiveReqs = { ...activeRequirements };

    documentRequestsQueries?.data?.forEach((docRequest) => {
      if (!docRequest?.id) return;

      const docId = docRequest.id;

      // Always keep the first requirement active if nothing is satisfied yet
      if (!newActiveReqs[docId]) {
        newActiveReqs[docId] = [0];
      }

      // Check each requirement to find the first unsatisfied one
      if (docRequest.requirements) {
        let foundActiveStep = false;

        // First pass: determine if any steps are fully satisfied
        const satisfiedSteps: number[] = [];
        docRequest.requirements.forEach((requirement, reqIndex) => {
          // Count how many documents of the required types have been uploaded
          const uploadedDocsOfRequiredTypes =
            newUploadedDocs[docId]?.filter((doc: UploadedDocument) =>
              requirement.documentTypes.includes(doc.documentType)
            ).length || 0;

          // If this step is satisfied, mark it
          if (uploadedDocsOfRequiredTypes >= (requirement.minRequired || 1)) {
            satisfiedSteps.push(reqIndex);
          }
        });

        // Second pass: find the first unsatisfied step to make active
        for (
          let reqIndex = 0;
          reqIndex < docRequest.requirements.length;
          reqIndex += 1
        ) {
          // If this step is not satisfied, make it the active one
          if (!satisfiedSteps.includes(reqIndex)) {
            // Only make this step active if all previous steps are satisfied
            const allPreviousSatisfied =
              reqIndex === 0 ||
              docRequest.requirements
                .slice(0, reqIndex)
                .every((_, idx) => satisfiedSteps.includes(idx));

            if (allPreviousSatisfied) {
              newActiveReqs[docId] = [reqIndex];
              foundActiveStep = true;
              break;
            }
          }
        }

        // If all steps are satisfied, keep the last one active
        if (!foundActiveStep && docRequest.requirements.length > 0) {
          if (satisfiedSteps.length === docRequest.requirements.length) {
            // All steps are satisfied, don't keep any active to show them all as completed
            newActiveReqs[docId] = [];
          } else {
            // Default to the first step if something went wrong with our logic
            newActiveReqs[docId] = [0];
          }
        }
      }
    });

    setActiveRequirements(newActiveReqs);
  }, [formValues, documentRequestsQueries?.data]);

  const onSubmit = form.handleSubmit(async () => {
    // Clear any potential stale errors before submitting
    form.clearErrors();

    // Use form.getValues() directly instead of the values passed to the handler
    const values = form.getValues();

    try {
      // Step 1: Upload all documents for all document requests first
      const documentRequestIds: string[] = [];

      for (const [documentRequestId, requirementValues] of Object.entries(
        values
      )) {
        documentRequestIds.push(documentRequestId);

        // Create a more direct mapping of document type to files to ensure each document is uploaded
        const documentUploads: { documentType: string; file: File }[] = [];

        // Process form values to extract document types and files directly
        Object.entries(requirementValues as Record<string, any>).forEach(
          ([fieldName, value]) => {
            if (fieldName.includes('_docType') && value) {
              // Extract requirement index and suffix from field name
              const reqParts = fieldName.split('_');
              const reqIndex = parseInt(reqParts[1], 10);

              // Determine if this is a suffixed field
              const fieldBase = `requirement_${reqIndex}_files`;
              const fieldSuffix = fieldName.replace(
                `requirement_${reqIndex}_docType`,
                ''
              );
              const filesFieldName = `${fieldBase}${fieldSuffix}`;

              const files = (requirementValues as any)[filesFieldName];

              if (files && files.length > 0) {
                // For each file, create a direct mapping to document type
                files.forEach((file: File) => {
                  documentUploads.push({
                    documentType: value as string,
                    file,
                  });
                });
              }
            }
          }
        );

        // Upload each document individually
        for (const { documentType, file } of documentUploads) {
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

      // Step 2: After all uploads are complete, submit each document request
      // Only if we have request IDs to submit
      if (documentRequestIds.length > 0) {
        // If no new documents to upload but we have satisfied requirements,
        // we still need to submit the document requests
        for (const documentRequestId of documentRequestIds) {
          await submitDocumentMutation.mutateAsync({
            id: documentRequestId,
          });
        }
      }

      // Invalidate both client and document request queries
      queryClient.invalidateQueries();

      if (externalOnSubmit) {
        externalOnSubmit(values);
      } else if (onComplete) {
        onComplete();
      } else {
        goBack();
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error uploading documents:', error);
      toast.error('Error uploading document');
    }
  });

  const resetForm = () => {
    form.reset();
    setSatisfiedDocTypes([]);
    setRequirementDocTypes({});

    // Reset active requirements to initial state (first requirement active)
    const initialActiveReqs: Record<string, number[]> = {};
    documentRequestsQueries.data.forEach((docRequest) => {
      if (docRequest?.id) {
        initialActiveReqs[docRequest.id] = [0];
      }
    });
    setActiveRequirements(initialActiveReqs);

    toast.success('Form has been reset');
  };

  // Additional check to see if all requirements are satisfied
  const allRequirementsSatisfied = useMemo(() => {
    if (!documentRequestsQueries?.data?.length) return false;

    // Helper to determine if a requirement should be considered completed based on UI logic
    const isRequirementCompletedInUI = (
      docRequest: DocumentRequestResponse,
      reqIndex: number
    ) => {
      if (!docRequest?.id || !docRequest.requirements) return false;

      // Check if this requirement is active in the UI
      const isActive = activeRequirements[docRequest.id]?.includes(reqIndex);
      if (isActive) return false; // Active requirements aren't considered completed yet

      const requirement = docRequest.requirements[reqIndex];
      if (!requirement) return false;

      // If minRequired is 0, the requirement is optional and considered satisfied
      if (requirement.minRequired === 0) return true;

      // Count how many documents of the required types have been uploaded
      const satisfiedDocCount = requirement.documentTypes.filter((docType) =>
        satisfiedDocTypes.includes(docType as DocumentTypeSmbdo)
      ).length;

      // This matches the UI logic for showing a requirement as completed
      const isPastRequirement =
        satisfiedDocCount > 0 &&
        (satisfiedDocCount === requirement.documentTypes.length ||
          satisfiedDocCount >= (requirement.minRequired || 1));

      return isPastRequirement;
    };

    // Check if there are any document requests that have unsatisfied requirements
    const result = documentRequestsQueries.data.every((docRequest) => {
      if (!docRequest?.id || !docRequest.requirements?.length) return true;

      // For this document request, check each requirement
      const requirementsSatisfied = docRequest.requirements.every(
        (requirement, reqIndex) => {
          // Count how many documents of the required types have been uploaded
          const satisfiedDocCount = requirement.documentTypes.filter(
            (docType) =>
              satisfiedDocTypes.includes(docType as DocumentTypeSmbdo)
          ).length;

          // Check if this requirement is active
          const isActive =
            docRequest.id &&
            activeRequirements[docRequest.id]?.includes(reqIndex);

          // Check if UI would show this as completed
          const isCompletedInUI = isRequirementCompletedInUI(
            docRequest,
            reqIndex
          );

          // A requirement is satisfied if:
          // 1. It has enough satisfied document types to meet the missing requirement, OR
          // 2. It's shown as completed in the UI
          const isSatisfied =
            satisfiedDocCount >= (requirement.minRequired ?? 1) ||
            isCompletedInUI ||
            !isActive;

          return isSatisfied;
        }
      );

      return requirementsSatisfied;
    });

    return result;
  }, [documentRequestsQueries?.data, satisfiedDocTypes, activeRequirements]);

  if (documentRequestsQueries?.pending) {
    return <FormLoadingState message="Fetching document requests..." />;
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
            documentRequestsQueries.data.length > 1;

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
                <div className="eb-flex eb-justify-end eb-px-4 eb-pb-0 eb-pt-3">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={resetForm}
                    className="eb-flex eb-items-center eb-gap-1 eb-text-xs"
                  >
                    <RefreshCw className="eb-h-3 eb-w-3" /> Reset form
                  </Button>
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

                      // Calculate how many document fields we need based on requirement
                      const numFieldsToShow = Math.max(
                        (requirement.minRequired || 1) - satisfiedCount,
                        0
                      );

                      // Get list of satisfied doc types for this requirement
                      const allSatisfiedDocTypesForReq =
                        requirement.documentTypes.filter((docType) =>
                          isDocTypeSatisfied(docType as DocumentTypeSmbdo)
                        );

                      const numFieldsToShowForReq =
                        numFieldsToShow +
                        (allSatisfiedDocTypesForReq.length > 0
                          ? allSatisfiedDocTypesForReq.length - 1
                          : 0);

                      // Get document types that were specifically uploaded for this requirement
                      const docTypesForThisRequirement =
                        (documentRequest?.id &&
                          requirementDocTypes[documentRequest.id]?.[
                            requirementIndex
                          ]) ||
                        [];

                      // For display, show only document types specifically uploaded for this requirement
                      // If none found, fall back to all satisfied doc types for this requirement
                      const displayedDocTypes =
                        docTypesForThisRequirement.length > 0
                          ? docTypesForThisRequirement
                          : allSatisfiedDocTypesForReq;

                      // If not active, show a summary instead
                      if (!isActive) {
                        // Check if this is a past (completed) requirement or future requirement
                        const isPastRequirement =
                          satisfiedCount > 0 &&
                          (satisfiedCount ===
                            requirement.documentTypes.length ||
                            numFieldsToShow === 0);

                        return (
                          <div
                            key={`${requirementIndex}-summary`}
                            className="eb-rounded-md eb-border eb-border-gray-200 eb-p-3"
                          >
                            <h4 className="eb-text-sm eb-font-medium eb-text-gray-700">
                              {isPastRequirement ? (
                                // Past requirement (completed)
                                <span className="eb-flex eb-items-center">
                                  <CheckCircle className="eb-mr-2 eb-h-4 eb-w-4 eb-text-green-600" />
                                  <span className="eb-font-medium">
                                    Step {requirementIndex + 1}.
                                  </span>
                                  <span className="eb-normal eb-ml-1">
                                    Already provided:
                                  </span>
                                  <span className="eb-ml-1 eb-inline-flex eb-flex-wrap eb-gap-1">
                                    {displayedDocTypes.map((docType) => (
                                      <span
                                        key={docType}
                                        className="eb-inline-flex eb-items-center eb-rounded-full eb-bg-green-100 eb-px-2 eb-py-0.5 eb-text-xs eb-font-medium eb-text-green-800"
                                      >
                                        {DOCUMENT_TYPE_MAPPING[
                                          docType as DocumentTypeSmbdo
                                        ]?.label || docType}
                                      </span>
                                    ))}
                                  </span>
                                </span>
                              ) : (
                                // Future requirement
                                <div className="eb-flex eb-items-center">
                                  <CircleDashed className="eb-mr-2 eb-h-4 eb-w-4 eb-text-gray-400" />
                                  <span className="eb-font-medium">
                                    Step {requirementIndex + 1}.
                                  </span>
                                  <span className="eb-ml-2 eb-text-gray-500">
                                    Pending completion of previous steps
                                  </span>
                                </div>
                              )}
                            </h4>
                          </div>
                        );
                      }

                      // Filter document types to only include ones not yet satisfied
                      const availableDocTypes =
                        requirement.documentTypes.filter((docType) => {
                          const docTypeStr = docType as DocumentTypeSmbdo;
                          // Keep document types that:
                          // 1. Are not yet satisfied globally, OR
                          // 2. Are currently selected in this requirement's form fields

                          // Check if this document type is currently selected in any field
                          const isSelectedInForm = Array.from({
                            length: numFieldsToShowForReq,
                          }).some((_, idx) => {
                            const fieldName = `${documentRequest?.id}.requirement_${requirementIndex}_docType${idx > 0 ? `_${idx}` : ''}`;
                            return form.watch(fieldName) === docTypeStr;
                          });

                          return (
                            !isDocTypeSatisfied(docTypeStr) || isSelectedInForm
                          );
                        });

                      // Get only document types that haven't been satisfied yet for display
                      const unsatisfiedDocTypes =
                        requirement.documentTypes.filter(
                          (docType) =>
                            !isDocTypeSatisfied(docType as DocumentTypeSmbdo)
                        );

                      return (
                        <div
                          key={`${requirementIndex}-active`}
                          className="eb-rounded-md eb-border eb-border-gray-200 eb-p-4"
                        >
                          <h4 className="eb-mb-3 eb-text-sm eb-font-medium eb-text-gray-700">
                            <div className="eb-flex eb-items-center">
                              <ArrowRight className="eb-mr-2 eb-h-4 eb-w-4 eb-text-amber-600" />
                              <span className="eb-font-medium">
                                Step {requirementIndex + 1}.
                              </span>
                              {numFieldsToShow > 0 ? (
                                <span className="eb-ml-2 eb-font-normal eb-text-gray-600">
                                  {requirement.minRequired === 0 ? (
                                    <>
                                      Optional: Upload any of the following
                                      document types
                                      <span className="eb-ml-2 eb-inline-flex eb-items-center eb-rounded-full eb-bg-gray-100 eb-px-2 eb-py-0.5 eb-text-xs eb-font-medium eb-text-gray-500">
                                        Optional
                                      </span>
                                    </>
                                  ) : (
                                    `Upload ${numFieldsToShow} of the following document types`
                                  )}
                                </span>
                              ) : (
                                <span className="eb-ml-2 eb-font-normal eb-text-gray-600">
                                  All required documents provided
                                </span>
                              )}
                            </div>

                            <div className="eb-mt-2 eb-flex eb-flex-wrap eb-gap-2">
                              {unsatisfiedDocTypes.map((docType) => (
                                <span
                                  key={docType}
                                  className="eb-inline-flex eb-items-center eb-rounded-full eb-bg-gray-100 eb-px-2.5 eb-py-0.5 eb-text-xs eb-font-medium eb-text-gray-800"
                                >
                                  {DOCUMENT_TYPE_MAPPING[
                                    docType as DocumentTypeSmbdo
                                  ]?.label || docType}
                                </span>
                              ))}
                            </div>
                          </h4>

                          {/* Only show the form if there are still document types to choose from and documents needed */}
                          {availableDocTypes.length > 0 &&
                          numFieldsToShowForReq > 0 ? (
                            <>
                              {/* Show fixed number of upload sections based on requirement */}
                              {Array.from({
                                length: numFieldsToShowForReq,
                              }).map((_, uploadIndex) => {
                                // Get the current field name to maintain selection state
                                const docTypeFieldName = `${documentRequest?.id}.requirement_${requirementIndex}_docType${uploadIndex > 0 ? `_${uploadIndex}` : ''}`;
                                const selectedValue =
                                  form.watch(docTypeFieldName);

                                return (
                                  <div
                                    key={`upload-section-${uploadIndex}`}
                                    className="eb-mb-6"
                                  >
                                    <div className="eb-mb-2 eb-flex eb-items-center">
                                      <span className="eb-rounded-full eb-bg-amber-100 eb-px-2 eb-py-0.5 eb-text-xs eb-font-medium eb-text-amber-800">
                                        Document {uploadIndex + 1} of{' '}
                                        {numFieldsToShowForReq}
                                      </span>
                                    </div>

                                    {/* Document Type Selection */}
                                    <FormField
                                      control={form.control}
                                      name={docTypeFieldName}
                                      render={({ field }) => (
                                        <FormItem className="eb-mb-4">
                                          <FormLabel
                                            asterisk={
                                              requirement.minRequired !== 0
                                            }
                                            className="eb-text-sm eb-font-medium eb-text-gray-700"
                                          >
                                            Select Document Type
                                            {requirement.minRequired === 0 && (
                                              <span className="eb-ml-2 eb-text-xs eb-font-normal eb-text-gray-500">
                                                (Optional)
                                              </span>
                                            )}
                                          </FormLabel>
                                          <FormControl>
                                            <Select
                                              onValueChange={field.onChange}
                                              value={
                                                field.value || selectedValue
                                              }
                                            >
                                              <SelectTrigger className="eb-w-full">
                                                <SelectValue placeholder="Select a document type" />
                                              </SelectTrigger>
                                              <SelectContent>
                                                {availableDocTypes.map(
                                                  (docType) => (
                                                    <SelectItem
                                                      key={docType}
                                                      value={docType}
                                                    >
                                                      {DOCUMENT_TYPE_MAPPING[
                                                        docType as DocumentTypeSmbdo
                                                      ]?.label || docType}
                                                    </SelectItem>
                                                  )
                                                )}
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
                                      name={`${documentRequest?.id}.requirement_${requirementIndex}_files${uploadIndex > 0 ? `_${uploadIndex}` : ''}`}
                                      render={({
                                        field: { onChange, ...fieldProps },
                                      }) => {
                                        // Get the selected document type
                                        const selectedDocType = form.watch(
                                          `${documentRequest?.id}.requirement_${requirementIndex}_docType${uploadIndex > 0 ? `_${uploadIndex}` : ''}`
                                        );

                                        return (
                                          <FormItem className="eb-space-y-2">
                                            <FormLabel
                                              asterisk={
                                                requirement.minRequired !== 0
                                              }
                                              className="eb-text-sm eb-font-medium eb-text-gray-700"
                                            >
                                              Upload Document
                                              {requirement.minRequired ===
                                                0 && (
                                                <span className="eb-ml-2 eb-text-xs eb-font-normal eb-text-gray-500">
                                                  (Optional)
                                                </span>
                                              )}
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
                                                multiple={false}
                                                accept={ACCEPTED_FILE_TYPES}
                                                onChange={(files) => {
                                                  onChange(files);
                                                }}
                                              />
                                            </FormControl>
                                            <FormMessage className="eb-text-xs" />
                                          </FormItem>
                                        );
                                      }}
                                    />
                                  </div>
                                );
                              })}
                            </>
                          ) : (
                            // Show message when all requirements are met
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

        <div className="eb-mt-2 eb-flex eb-w-full eb-items-center eb-justify-end">
          {filteredDocumentRequests?.length !== 0 && (
            <>
              <div className="eb-mr-auto eb-flex eb-items-center">
                {allRequirementsSatisfied ? (
                  <div className="eb-flex eb-items-center eb-text-sm eb-text-green-600">
                    <CheckCircle className="eb-mr-1 eb-h-4 eb-w-4" />
                    All required documents ready to upload
                  </div>
                ) : (
                  <div className="eb-flex eb-items-center eb-text-sm eb-text-amber-600">
                    <CircleDashed className="eb-mr-1 eb-h-4 eb-w-4" />
                    Please complete all required documents
                  </div>
                )}
              </div>
              <Button
                type="submit"
                disabled={
                  form.formState.isSubmitting || !allRequirementsSatisfied
                }
                className="eb-ml-4"
              >
                {form.formState.isSubmitting
                  ? 'Uploading...'
                  : !allRequirementsSatisfied
                    ? 'Complete All Required Documents'
                    : 'Upload Documents'}
              </Button>
            </>
          )}
        </div>
      </form>
    </Form>
  );
};
