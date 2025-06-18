import { FC } from 'react';
import { ArrowRight, CheckCircle, CircleDashed } from 'lucide-react';
import { Control, UseFormWatch } from 'react-hook-form';

import {
  DocumentRequestResponse,
  DocumentTypeSmbdo,
} from '@/api/generated/smbdo.schemas';
import { DOCUMENT_TYPE_MAPPING } from '@/core/OnboardingWizardBasic/utils/documentTypeMapping';

import { DocumentUploadField } from './DocumentUploadField';

interface RequirementStepProps {
  /**
   * Document request that contains this requirement
   */
  documentRequest: DocumentRequestResponse;
  /**
   * Index of the requirement within the document request
   */
  requirementIndex: number;
  /**
   * Whether this requirement is active/visible
   */
  isActive: boolean;
  /**
   * Whether this requirement is completed
   */
  isPastRequirement: boolean;
  /**
   * Document types that have been satisfied globally
   */
  satisfiedDocTypes: DocumentTypeSmbdo[];
  /**
   * Document types that have been specifically satisfied for this requirement
   */
  docTypesForRequirement: DocumentTypeSmbdo[];
  /**
   * Number of fields to show for document upload
   */
  numFieldsToShow: number;
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
}

/**
 * Component that renders a single document requirement step
 */
export const RequirementStep: FC<RequirementStepProps> = ({
  documentRequest,
  requirementIndex,
  isActive,
  isPastRequirement,
  satisfiedDocTypes,
  docTypesForRequirement,
  numFieldsToShow,
  control,
  watch,
  resetKey,
}) => {
  const requirement = documentRequest.requirements?.[requirementIndex];
  if (!requirement) return null;

  // If this is a future step (not active and not completed)
  if (!isActive && !isPastRequirement) {
    return (
      <div className="eb-rounded-md eb-border eb-border-gray-200 eb-p-3">
        <h4 className="eb-text-sm eb-font-medium eb-text-gray-700">
          <div className="eb-flex eb-items-center">
            <CircleDashed className="eb-mr-2 eb-h-4 eb-w-4 eb-text-gray-400" />
            <span className="eb-font-medium">Step {requirementIndex + 1}.</span>
            <span className="eb-ml-2 eb-text-gray-500">
              Pending completion of previous steps
            </span>
          </div>
        </h4>
      </div>
    );
  }

  // Filter document types to only include ones not yet satisfied or currently selected
  const availableDocTypes = requirement.documentTypes.filter((docType) => {
    const docTypeStr = docType as DocumentTypeSmbdo;

    // Check if this document type is currently selected in any field
    const isSelectedInForm = Array.from({ length: numFieldsToShow }).some(
      (_, idx) => {
        const fieldName = `${documentRequest.id}.requirement_${requirementIndex}_docType${idx > 0 ? `_${idx}` : ''}`;
        return watch(fieldName) === docTypeStr;
      }
    );

    return !satisfiedDocTypes.includes(docTypeStr) || isSelectedInForm;
  });

  // Calculate displayed document types list (specific to this requirement or fallback to all satisfied)
  const displayedDocTypes =
    docTypesForRequirement.length > 0
      ? docTypesForRequirement
      : requirement.documentTypes
          .filter((docType) =>
            satisfiedDocTypes.includes(docType as DocumentTypeSmbdo)
          )
          .map((docType) => docType as DocumentTypeSmbdo);

  return (
    <div className="eb-rounded-md eb-border eb-border-gray-200 eb-p-4">
      <h4 className="eb-mb-3 eb-text-sm eb-font-medium eb-text-gray-700">
        <div className="eb-flex eb-items-center">
          {isPastRequirement ? (
            <CheckCircle className="eb-mr-2 eb-h-4 eb-w-4 eb-text-green-600" />
          ) : (
            <ArrowRight className="eb-mr-2 eb-h-4 eb-w-4 eb-text-amber-600" />
          )}
          <span className="eb-font-medium">Step {requirementIndex + 1}</span>
          {isPastRequirement ? (
            <span className="eb-ml-2 eb-font-normal eb-text-gray-600">
              Completed - Documents provided:
              <span className="eb-ml-1 eb-inline-flex eb-flex-wrap eb-gap-1">
                {displayedDocTypes.map((docType) => (
                  <span
                    key={docType}
                    className="eb-inline-flex eb-items-center eb-rounded-full eb-bg-green-100 eb-px-2 eb-py-0.5 eb-text-xs eb-font-medium eb-text-green-800"
                  >
                    {DOCUMENT_TYPE_MAPPING[docType]?.label || docType}
                  </span>
                ))}
              </span>
            </span>
          ) : numFieldsToShow > 0 ? (
            <span className="eb-ml-2 eb-font-normal eb-text-gray-600">
              {requirement.minRequired === 0 && (
                <span className="eb-ml-2 eb-inline-flex eb-items-center eb-rounded-full eb-bg-gray-100 eb-px-2 eb-py-0.5 eb-text-xs eb-font-medium eb-text-gray-500">
                  Optional
                </span>
              )}
            </span>
          ) : (
            <span className="eb-ml-2 eb-font-normal eb-text-gray-600">
              All required documents provided
            </span>
          )}
        </div>
      </h4>

      {/* Show form fields for active or completed steps */}
      {isPastRequirement ||
      (availableDocTypes.length > 0 && numFieldsToShow > 0) ? (
        <>
          {/* Show fixed number of upload sections based on requirement */}
          {Array.from({ length: numFieldsToShow }).map((_, uploadIndex) => (
            <DocumentUploadField
              key={`${documentRequest.id}-${requirementIndex}-${uploadIndex}-${resetKey}`}
              documentRequestId={documentRequest.id || ''}
              requirementIndex={requirementIndex}
              uploadIndex={uploadIndex}
              availableDocTypes={availableDocTypes as DocumentTypeSmbdo[]}
              control={control}
              isReadOnly={isPastRequirement}
              isOptional={requirement.minRequired === 0}
            />
          ))}
        </>
      ) : (
        // Show message when all requirements are met
        <div className="eb-rounded-md eb-bg-green-50 eb-p-2 eb-text-sm eb-font-medium eb-text-green-700">
          All document types for this requirement have been provided. You can
          proceed to the next step.
        </div>
      )}
    </div>
  );
};
