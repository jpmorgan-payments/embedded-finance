import { useEffect, useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';

import {
  useSmbdoListDocumentRequests,
  useSmbdoSubmitDocumentRequest,
  useSmbdoUploadDocument,
} from '@/api/generated/smbdo';
import {
  DocumentRequestResponse,
  DocumentTypeSmbdo,
} from '@/api/generated/smbdo.schemas';
import { Badge, Button, Form } from '@/components/ui';
import { ServerErrorAlert } from '@/core/OnboardingWizardBasic/ServerErrorAlert/ServerErrorAlert';

import { FormLoadingState } from '../../../FormLoadingState/FormLoadingState';
import { StepLayout } from '../../components/StepLayout/StepLayout';
import { useFlowContext } from '../../context/FlowContext';
import { useOnboardingOverviewContext } from '../../OnboardingContext/OnboardingContext';
import { getPartyName } from '../../utils/dataUtils';
import { DocumentRequestCard } from './DocumentRequestCard';
import { UploadedDocument } from './documentUploadUtils';

/**
 * Component for uploading documents for a specific party
 */
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

  const { data: documentRequestList, status: documentRequestListStatus } =
    useSmbdoListDocumentRequests({
      clientId: clientData?.id,
      // @ts-ignore - API expects this parameter
      includeRelatedParty: true,
    });

  const activeDocumentRequests =
    documentRequestList?.documentRequests?.filter(
      (docRequest) =>
        docRequest.status === 'ACTIVE' &&
        filteredDocumentRequests.includes(docRequest.id)
    ) || [];

  // Initialize active requirements when document requests are loaded
  useEffect(() => {
    if (activeDocumentRequests?.length) {
      const initialActiveReqs: Record<string, number[]> = {};
      activeDocumentRequests.forEach((docRequest) => {
        if (docRequest?.id && docRequest.requirements?.length) {
          // Only make the first requirement active initially
          initialActiveReqs[docRequest.id] = [0];
        }
      });
      setActiveRequirements(initialActiveReqs);
    }
  }, [JSON.stringify(activeDocumentRequests)]);

  // zod schema, dynamically generated based on the document types
  const DocumentUploadSchema = useMemo(() => {
    const schema: Record<string, z.ZodType<any>> = {};
    activeDocumentRequests.forEach((documentRequest) => {
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
    JSON.stringify(activeDocumentRequests),
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

    activeDocumentRequests?.forEach((docRequest) => {
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
  }, [
    formValues,
    JSON.stringify(activeDocumentRequests),
    form.formState.errors,
  ]);

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
    activeDocumentRequests.forEach((docRequest) => {
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
    if (!activeDocumentRequests?.length) return false;

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
    const result = activeDocumentRequests.every((docRequest) => {
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
    JSON.stringify(activeDocumentRequests),
    JSON.stringify(activeRequirements),
    satisfiedDocTypes,
    form.formState.errors,
  ]);

  // @ts-ignore - This is a workaround for the type error in the query
  if (documentRequestListStatus === 'pending') {
    return <FormLoadingState message="Fetching document requests..." />;
  }

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
              {activeDocumentRequests?.map((documentRequest) => (
                <DocumentRequestCard
                  key={documentRequest.id}
                  documentRequest={documentRequest}
                  activeRequirements={
                    activeRequirements[documentRequest.id || ''] || [0]
                  }
                  satisfiedDocTypes={satisfiedDocTypes}
                  requirementDocTypes={
                    requirementDocTypes[documentRequest.id || ''] || {}
                  }
                  control={form.control}
                  watch={form.watch}
                  resetKey={dropzoneResetKey}
                  onReset={resetForm}
                />
              ))}
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
