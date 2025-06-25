import { FC } from 'react';
import { RefreshCw } from 'lucide-react';
import { Control, UseFormWatch } from 'react-hook-form';

import {
  DocumentRequestResponse,
  DocumentTypeSmbdo,
} from '@/api/generated/smbdo.schemas';
import { AlertDescription } from '@/components/ui/alert';
import { Alert, Button } from '@/components/ui';

import { formatDocumentDescription } from './documentUploadUtils';
import { RequirementStep } from './RequirementStep';

interface DocumentRequestCardProps {
  /**
   * Document request data
   */
  documentRequest: DocumentRequestResponse;
  /**
   * Active requirements for this document request
   */
  activeRequirements: number[];
  /**
   * Document types that have been satisfied
   */
  satisfiedDocTypes: DocumentTypeSmbdo[];
  /**
   * Document types uploaded for each requirement
   */
  requirementDocTypes: Record<number, DocumentTypeSmbdo[]>;
  /**
   * Form control from parent component
   */
  control: Control<any>;
  /**
   * Form watch function from parent component
   */
  watch: UseFormWatch<any>;
  /**
   * Key to force reset of form fields
   */
  resetKey: number;
  /**
   * Callback to reset the form
   */
  onReset: () => void;
  /**
   * Maximum file size in bytes for uploads
   */
  maxFileSizeBytes?: number;
}

/**
 * Component that renders a card for a single document request with multiple requirements
 */
export const DocumentRequestCard: FC<DocumentRequestCardProps> = ({
  documentRequest,
  activeRequirements,
  satisfiedDocTypes,
  requirementDocTypes,
  control,
  watch,
  resetKey,
  onReset,
  maxFileSizeBytes,
}) => {
  if (!documentRequest?.id || !documentRequest.requirements?.length)
    return null;

  return (
    <div>
      {documentRequest.description && (
        <Alert variant="informative" density="sm" noTitle>
          <AlertDescription>
            {formatDocumentDescription(documentRequest.description)}
          </AlertDescription>
        </Alert>
      )}

      <div className="eb-mt-6 eb-w-full">
        <div className="eb-mb-4 eb-flex eb-justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onReset}
            className="eb-flex eb-h-6 eb-items-center eb-gap-1 eb-p-1 eb-text-xs"
          >
            <RefreshCw className="!eb-size-3" /> Reset form
          </Button>
        </div>

        <div className="eb-space-y-6">
          {documentRequest.requirements.map((requirement, requirementIndex) => {
            // Check if this requirement is active
            const isActive = activeRequirements.includes(requirementIndex);
            // Count how many document types are already satisfied
            const satisfiedCount = requirement.documentTypes.filter((docType) =>
              satisfiedDocTypes.includes(docType as DocumentTypeSmbdo)
            ).length;

            // Calculate how many document fields we need based on requirement
            const numFieldsToShow = Math.max(
              (requirement.minRequired || 1) - satisfiedCount,
              0
            );

            // Check if this is a past (completed) requirement
            const isPastRequirement =
              satisfiedCount > 0 &&
              (satisfiedCount === requirement.documentTypes.length ||
                numFieldsToShow === 0);

            // Get document types that were specifically uploaded for this requirement
            const docTypesForThisRequirement =
              requirementDocTypes[requirementIndex] || [];

            // For completed steps, ensure we show at least the satisfied documents
            // For active steps, use the calculated number
            const numFieldsToShowForReq = Math.max(
              docTypesForThisRequirement.length,
              requirement.minRequired || 1
            );

            return (
              <RequirementStep
                key={`${documentRequest.id}-req-${requirementIndex}`}
                documentRequest={documentRequest}
                requirementIndex={requirementIndex}
                isActive={isActive}
                isPastRequirement={isPastRequirement}
                satisfiedDocTypes={satisfiedDocTypes}
                docTypesForRequirement={docTypesForThisRequirement}
                numFieldsToShow={numFieldsToShowForReq}
                control={control}
                watch={watch}
                resetKey={resetKey}
                maxFileSizeBytes={maxFileSizeBytes}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};
