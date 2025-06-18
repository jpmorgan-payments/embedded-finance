import { Fragment, useEffect, useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueries, useQueryClient } from '@tanstack/react-query';
import {
  ArrowRight,
  CheckCircle,
  CircleDashed,
  InfoIcon,
  RefreshCw,
} from 'lucide-react';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';

import { compressImage } from '@/lib/utils';
import {
  smbdoGetDocumentRequest,
  useSmbdoSubmitDocumentRequest,
  useSmbdoUploadDocument,
} from '@/api/generated/smbdo';
import {
  DocumentRequestResponse,
  DocumentTypeSmbdo,
  // PostUploadDocument,
} from '@/api/generated/smbdo.schemas';
import { AlertDescription } from '@/components/ui/alert';
import Dropzone from '@/components/ui/dropzone';
import {
  Alert,
  Badge,
  Button,
  Card,
  Form,
  FormControl,
  // FormDescription,
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
import { ServerErrorAlert } from '@/core/OnboardingWizardBasic/ServerErrorAlert/ServerErrorAlert';

import { FormLoadingState } from '../../../FormLoadingState/FormLoadingState';
import { DOCUMENT_TYPE_MAPPING } from '../../../utils/documentTypeMapping';
import { StepLayout } from '../../components/StepLayout/StepLayout';
import { useFlowContext } from '../../context/FlowContext';
import { useOnboardingOverviewContext } from '../../OnboardingContext/OnboardingContext';
import { getPartyName } from '../../utils/dataUtils';

interface UploadedDocument {
  documentType: DocumentTypeSmbdo;
  files: File[];
}

export const ACCEPTED_FILE_TYPES = {
  'application/pdf': ['.pdf'],
  'image/jpeg': ['.jpeg', '.jpg'],
  'image/png': ['.png'],
};

export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 2MB

// Helper function to format document request descriptions
const formatDocumentDescription = (description?: string) => {
  if (!description) return null;

  // First split by newlines to get main sections
  return description.split('\n').map((section, sectionIndex) => {
    // Check if this section starts with a number (like "1. Formation Document")
    const isNumberedSection = /^\d+\./.test(section.trim());

    // Check if this section has OR conditions
    if (section.includes('[OR]')) {
      // Split by "Acceptable documents are" if present
      let parts = section.split('Acceptable documents are');

      if (parts.length === 2) {
        // Handle the case with "Acceptable documents are" text
        const [mainText, documentsList] = parts;

        // Process the documents list by replacing [OR] with bullet points and removing [AND]
        const documents = documentsList
          .split(/\[AND\]|\[OR\]/g) // Split by [OR] or [AND]
          .map((doc) => doc.trim()) // Trim whitespace
          .filter((doc) => doc); // Filter empty items

        return (
          <div key={`section-${sectionIndex}`} className="eb-mb-2">
            <p
              className={`eb-text-sm ${isNumberedSection ? 'eb-font-medium' : ''}`}
            >
              {mainText}
            </p>
            <p className="eb-ml-4 eb-mt-1 eb-text-sm">
              Acceptable documents are:
            </p>
            <ul className="eb-ml-12 eb-mt-1 eb-list-disc eb-text-sm">
              {documents.map((doc, docIndex) => (
                <li key={`doc-${docIndex}`} className="eb-mb-1">
                  {doc}
                </li>
              ))}
            </ul>
          </div>
        );
      }
      // Process section with OR conditions but no "Acceptable documents are" text
      // Replace [OR] with bullet points
      parts = section
        .split(/\[OR\]/g)
        .map((part) => part.trim())
        .filter((part) => part);

      return (
        <div key={`section-${sectionIndex}`} className="eb-mb-2">
          <p
            className={`eb-text-sm ${isNumberedSection ? 'eb-font-medium' : ''}`}
          >
            {parts[0]}
          </p>
          {parts.length > 1 && (
            <>
              <ul className="eb-ml-6 eb-list-disc eb-text-sm">
                {parts.slice(1).map((part, partIndex) => (
                  <li key={`part-${partIndex}`} className="eb-mb-1">
                    {part}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      );
    }
    if (section.includes('[AND]')) {
      // Handle [AND] sections - split and treat each part as a separate section with its own formatting
      const parts = section
        .split('[AND]')
        .map((part) => part.trim())
        .filter((part) => part);

      return (
        <div key={`section-${sectionIndex}`} className="eb-mb-2">
          {parts.map((part, partIndex) => {
            // Check if this part starts with a number (like "1. Formation Document")
            const isPartNumbered = /^\d+\./.test(part.trim());

            return (
              <p
                key={`and-part-${partIndex}`}
                className={`eb-text-sm ${isPartNumbered || (isNumberedSection && partIndex === 0) ? 'eb-font-medium' : ''} ${partIndex > 0 ? 'eb-mt-2' : ''}`}
              >
                {part}
              </p>
            );
          })}
        </div>
      );
    }
    // Simple text with no OR/AND conditions
    return (
      <p
        key={`section-${sectionIndex}`}
        className={`eb-mb-2 eb-text-sm ${isNumberedSection ? 'eb-font-medium' : ''}`}
      >
        {section}
      </p>
    );
  });
};

export const DocumentUploadForm = () => {
  const { clientData } = useOnboardingOverviewContext();
  const queryClient = useQueryClient();

  const { goTo, editingPartyIds } = useFlowContext();

  const partyId = editingPartyIds['document-upload-form'];

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

  // State to force dropzone reset by changing the key
  const [dropzoneResetKey, setDropzoneResetKey] = useState<number>(0);

  const currentPartyData = clientData?.parties?.find((p) => p.id === partyId);

  const partiesDocumentRequests = Array.from(
    new Set(
      clientData?.parties
        ?.map((p) => p?.validationResponse?.map((v) => v?.documentRequestIds))
        ?.flat(2)
        ?.filter((v) => v?.length)
        .concat(clientData?.outstanding?.documentRequestIds)
    )
  );

  // Filter document requests by partyId
  const filteredDocumentRequests = partyId
    ? Array.from(
        new Set(
          clientData?.parties
            ?.filter((p) => p.id === partyId)
            ?.map((p) =>
              p?.validationResponse?.map((v) => v?.documentRequestIds)
            )
            ?.flat(2)
            ?.filter((v) => v?.length)
            // Include outstanding document requests if the filtered party is an organization
            .concat(
              clientData?.parties?.find((p) => p.id === partyId)?.partyType ===
                'ORGANIZATION'
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
              // Check for validation errors on both document type and files fields

              const docRequestErrors = form.formState.errors?.[docRequestId] as
                | Record<string, any>
                | undefined;
              const hasDocTypeError = !!docRequestErrors?.[fieldName];
              const hasFilesError = !!docRequestErrors?.[filesFieldName];

              // Only consider documents as satisfied if there are no validation errors
              if (!hasDocTypeError && !hasFilesError) {
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
  }, [formValues, documentRequestsQueries?.data, form.formState.errors]);

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

        // Upload each document individually (files are already compressed if applicable)
        for (const { documentType, file } of documentUploads) {
          const documentData = {
            documentRequestId,
            documentType,
          };

          await uploadDocumentMutation.mutateAsync({
            data: {
              documentData: JSON.stringify(documentData),
              file,
            },
          });
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

      goTo('upload-documents-section');
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error uploading documents:', error);
    }
  });

  const resetForm = () => {
    // Reset form data with empty default values
    form.reset({});

    // Clear form state and trigger re-render
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

    // Clear API error messages from mutations
    uploadDocumentMutation.reset();
    submitDocumentMutation.reset();

    // Force dropzone and selects to reset by changing the key
    setDropzoneResetKey((prev) => prev + 1);
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
      if (isActive) {
        // For active requirements, also check if there are any validation errors
        const docRequestErrors = form.formState.errors?.[docRequest.id] as
          | Record<string, any>
          | undefined;
        if (docRequestErrors) {
          // Check if any field for this requirement has validation errors
          const hasValidationErrors = Object.keys(docRequestErrors).some(
            (fieldName) => fieldName.includes(`requirement_${reqIndex}_`)
          );
          if (hasValidationErrors) {
            return false; // Can't be considered completed if there are validation errors
          }
        }
        return false; // Active requirements aren't considered completed yet
      }

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

          // Check for validation errors in this requirement
          const docRequestErrors = docRequest.id
            ? (form.formState.errors?.[docRequest.id] as
                | Record<string, any>
                | undefined)
            : undefined;
          const hasValidationErrors = docRequestErrors
            ? Object.keys(docRequestErrors).some((fieldName) =>
                fieldName.includes(`requirement_${reqIndex}_`)
              )
            : false;

          // A requirement is satisfied if:
          // 1. It has enough satisfied document types to meet the missing requirement, AND
          // 2. There are no validation errors, AND
          // 3. Either it's shown as completed in the UI OR it's not active
          const isSatisfied =
            satisfiedDocCount >= (requirement.minRequired ?? 1) &&
            !hasValidationErrors &&
            (isCompletedInUI || !isActive);

          return isSatisfied;
        }
      );

      return requirementsSatisfied;
    });

    return result;
  }, [
    documentRequestsQueries?.data,
    satisfiedDocTypes,
    activeRequirements,
    form.formState.errors,
  ]);

  if (documentRequestsQueries?.pending) {
    return <FormLoadingState message="Fetching document requests..." />;
  }

  // Helper function to check if a document type is satisfied
  const isDocTypeSatisfied = (docType: DocumentTypeSmbdo) => {
    return satisfiedDocTypes.includes(docType);
  };

  return (
    <Form {...form}>
      <form onSubmit={onSubmit} className="eb-flex eb-min-h-full eb-flex-col">
        <StepLayout title={getPartyName(currentPartyData)}>
          <div className="eb-flex-auto eb-space-y-6">
            <div className="eb-mb-6 eb-mt-1">
              {currentPartyData?.roles?.includes('CLIENT') && (
                <Badge variant="subtle" size="lg">
                  Business
                </Badge>
              )}
              {currentPartyData?.roles?.includes('BENEFICIAL_OWNER') && (
                <Badge variant="subtle" size="lg">
                  Owner
                </Badge>
              )}
              {currentPartyData?.roles?.includes('CONTROLLER') && (
                <Badge variant="subtle" size="lg">
                  Controller
                </Badge>
              )}
            </div>
            <div className="eb-space-y-4">
              {documentRequestsQueries?.data?.map((documentRequest, index) => {
                return (
                  <div key={`${documentRequest?.id}-${index}`}>
                    <Alert variant="informative" className="eb-pb-3">
                      <InfoIcon className="eb-h-4 eb-w-4" />
                      <AlertDescription>
                        {formatDocumentDescription(
                          documentRequest?.description
                        )}
                      </AlertDescription>
                    </Alert>
                    <Card className="eb-mt-6 eb-w-full eb-shadow-sm">
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
                              activeRequirements[docId]?.includes(
                                requirementIndex
                              );

                            // Count how many document types are already satisfied
                            const satisfiedCount =
                              requirement.documentTypes.filter((docType) =>
                                isDocTypeSatisfied(docType as DocumentTypeSmbdo)
                              ).length;

                            // Calculate how many document fields we need based on requirement
                            const numFieldsToShow = Math.max(
                              (requirement.minRequired || 1) - satisfiedCount,
                              0
                            );

                            // Check if this is a past (completed) requirement or future requirement
                            const isPastRequirement =
                              satisfiedCount > 0 &&
                              (satisfiedCount ===
                                requirement.documentTypes.length ||
                                numFieldsToShow === 0);

                            // Get list of satisfied doc types for this requirement
                            const allSatisfiedDocTypesForReq =
                              requirement.documentTypes.filter((docType) =>
                                isDocTypeSatisfied(docType as DocumentTypeSmbdo)
                              );

                            // For completed steps, ensure we show at least the satisfied documents
                            // For active steps, use the calculated number
                            let numFieldsToShowForReq: number;
                            if (isPastRequirement) {
                              numFieldsToShowForReq = Math.max(
                                allSatisfiedDocTypesForReq.length,
                                requirement.minRequired || 1
                              );
                            } else {
                              numFieldsToShowForReq =
                                numFieldsToShow +
                                (allSatisfiedDocTypesForReq.length > 0
                                  ? allSatisfiedDocTypesForReq.length - 1
                                  : 0);
                            }

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

                            // Only collapse future requirements, not completed ones
                            if (!isActive && !isPastRequirement) {
                              return (
                                <div
                                  key={`${requirementIndex}-summary`}
                                  className="eb-rounded-md eb-border eb-border-gray-200 eb-p-3"
                                >
                                  <h4 className="eb-text-sm eb-font-medium eb-text-gray-700">
                                    <div className="eb-flex eb-items-center">
                                      <CircleDashed className="eb-mr-2 eb-h-4 eb-w-4 eb-text-gray-400" />
                                      <span className="eb-font-medium">
                                        Step {requirementIndex + 1}.
                                      </span>
                                      <span className="eb-ml-2 eb-text-gray-500">
                                        Pending completion of previous steps
                                      </span>
                                    </div>
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
                                  !isDocTypeSatisfied(docTypeStr) ||
                                  isSelectedInForm
                                );
                              });

                            // Get only document types that haven't been satisfied yet for display
                            // const unsatisfiedDocTypes =
                            //   requirement.documentTypes.filter(
                            //     (docType) =>
                            //       !isDocTypeSatisfied(
                            //         docType as DocumentTypeSmbdo
                            //       )
                            //   );

                            return (
                              <div
                                key={`${requirementIndex}-active`}
                                className="eb-rounded-md eb-border eb-border-gray-200 eb-p-4"
                              >
                                <h4 className="eb-mb-3 eb-text-sm eb-font-medium eb-text-gray-700">
                                  <div className="eb-flex eb-items-center">
                                    {isPastRequirement ? (
                                      <CheckCircle className="eb-mr-2 eb-h-4 eb-w-4 eb-text-green-600" />
                                    ) : (
                                      <ArrowRight className="eb-mr-2 eb-h-4 eb-w-4 eb-text-amber-600" />
                                    )}
                                    <span className="eb-font-medium">
                                      Step {requirementIndex + 1}
                                    </span>
                                    {isPastRequirement ? (
                                      <span className="eb-ml-2 eb-font-normal eb-text-gray-600">
                                        Completed - Documents provided:
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
                                    ) : numFieldsToShow > 0 ? (
                                      <span className="eb-ml-2 eb-font-normal eb-text-gray-600">
                                        {requirement.minRequired === 0 ? (
                                          <>
                                            {/* Optional: Upload any of the
                                            following document types */}
                                            <span className="eb-ml-2 eb-inline-flex eb-items-center eb-rounded-full eb-bg-gray-100 eb-px-2 eb-py-0.5 eb-text-xs eb-font-medium eb-text-gray-500">
                                              Optional
                                            </span>
                                          </>
                                        ) : (
                                          // `Upload ${numFieldsToShow} of the following document types`
                                          ''
                                        )}
                                      </span>
                                    ) : (
                                      <span className="eb-ml-2 eb-font-normal eb-text-gray-600">
                                        All required documents provided
                                      </span>
                                    )}
                                  </div>

                                  {/* <div className="eb-mt-2 eb-flex eb-flex-wrap eb-gap-2">
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
                                  </div> */}
                                </h4>

                                {/* Show the form for active steps or completed steps (for viewing) */}
                                {isPastRequirement ||
                                (availableDocTypes.length > 0 &&
                                  numFieldsToShowForReq > 0) ? (
                                  <>
                                    {/* Show fixed number of upload sections based on requirement */}
                                    {Array.from({
                                      length: numFieldsToShowForReq,
                                    }).map((_, uploadIndex) => {
                                      // Get the current field name to maintain selection state
                                      const docTypeFieldName = `${documentRequest?.id}.requirement_${requirementIndex}_docType${uploadIndex > 0 ? `_${uploadIndex}` : ''}`;

                                      return (
                                        <div
                                          key={`upload-section-${uploadIndex}`}
                                          className="eb-mb-6"
                                        >
                                          {/* <div className="eb-mb-2 eb-flex eb-items-center">
                                            <span className="eb-rounded-full eb-bg-[#f0fffd] eb-px-2 eb-py-0.5 eb-text-xs eb-font-medium eb-text-[#2CB9AC]">
                                              Document {uploadIndex + 1} of{' '}
                                              {numFieldsToShowForReq}
                                            </span>
                                          </div> */}

                                          {/* Document Type Selection */}
                                          <FormField
                                            key={`${docTypeFieldName}-${dropzoneResetKey}`}
                                            control={form.control}
                                            name={docTypeFieldName}
                                            render={({ field }) => (
                                              <FormItem className="eb-mb-4">
                                                <FormLabel
                                                  asterisk={
                                                    requirement.minRequired !==
                                                    0
                                                  }
                                                  className="eb-text-sm eb-font-medium eb-text-gray-700"
                                                >
                                                  Select Document Type
                                                  {requirement.minRequired ===
                                                    0 && (
                                                    <span className="eb-ml-2 eb-text-xs eb-font-normal eb-text-gray-500">
                                                      (Optional)
                                                    </span>
                                                  )}
                                                </FormLabel>
                                                <FormControl>
                                                  <Select
                                                    onValueChange={
                                                      field.onChange
                                                    }
                                                    value={field.value || ''}
                                                    disabled={isPastRequirement}
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
                                            key={`${documentRequest?.id}.requirement_${requirementIndex}_files${uploadIndex > 0 ? `_${uploadIndex}` : ''}-${dropzoneResetKey}`}
                                            control={form.control}
                                            name={`${documentRequest?.id}.requirement_${requirementIndex}_files${uploadIndex > 0 ? `_${uploadIndex}` : ''}`}
                                            render={({
                                              field: {
                                                onChange,
                                                ...fieldProps
                                              },
                                            }) => (
                                              <FormItem className="eb-space-y-2">
                                                <FormLabel
                                                  asterisk={
                                                    requirement.minRequired !==
                                                    0
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

                                                <FormControl>
                                                  <Dropzone
                                                    key={`${documentRequest?.id}-${requirementIndex}-${uploadIndex}-${dropzoneResetKey}`}
                                                    containerClassName="eb-max-w-full"
                                                    {...fieldProps}
                                                    multiple
                                                    accept={ACCEPTED_FILE_TYPES}
                                                    onChange={onChange}
                                                    compressionFunc={
                                                      compressImage
                                                    }
                                                    compressibleExtensions={[
                                                      '.jpeg',
                                                      '.jpg',
                                                      '.png',
                                                    ]}
                                                    fileMaxSize={
                                                      MAX_FILE_SIZE_BYTES
                                                    }
                                                    compressionMaxDimension={
                                                      1000
                                                    }
                                                    showCompressionInfo
                                                  />
                                                </FormControl>
                                                <FormMessage className="eb-text-xs" />
                                              </FormItem>
                                            )}
                                          />
                                        </div>
                                      );
                                    })}
                                  </>
                                ) : (
                                  // Show message when all requirements are met
                                  <div className="eb-rounded-md eb-bg-green-50 eb-p-2 eb-text-sm eb-font-medium eb-text-green-700">
                                    All document types for this requirement have
                                    been provided. You can proceed to the next
                                    step.
                                  </div>
                                )}
                              </div>
                            );
                          }
                        )}
                      </div>
                    </Card>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="eb-mt-6 eb-flex eb-flex-col eb-gap-3">
            <ServerErrorAlert
              error={
                uploadDocumentMutation.error || submitDocumentMutation.error
              }
              customErrorMessage={
                uploadDocumentMutation.error
                  ? 'There was an unexpected error uploading documents. Please try again.'
                  : submitDocumentMutation.error
                    ? 'There was an unexpected error submitting document requests. Please try again.'
                    : undefined
              }
            />

            <Button
              type="submit"
              disabled={
                form.formState.isSubmitting || !allRequirementsSatisfied
              }
            >
              {form.formState.isSubmitting
                ? 'Uploading...'
                : !allRequirementsSatisfied
                  ? 'Complete All Required Documents'
                  : 'Upload Documents'}
            </Button>
            <Button
              variant="ghost"
              onClick={() => goTo('upload-documents-section')}
              className="eb-text-primary hover:eb-bg-primary/5 hover:eb-text-primary"
            >
              Cancel
            </Button>
          </div>
        </StepLayout>
      </form>
    </Form>
  );
};
