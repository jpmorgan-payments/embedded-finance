import { FC, Fragment, useEffect, useState } from 'react';
import {
  CheckCircleIcon,
  ChevronDownIcon,
  CircleDashedIcon,
} from 'lucide-react';
import { Control, UseFormWatch } from 'react-hook-form';

import {
  DocumentRequestResponse,
  DocumentTypeSmbdo,
} from '@/api/generated/smbdo.schemas';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Separator } from '@/components/ui';
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
  /**
   * Maximum file size in bytes for uploads
   */
  maxFileSizeBytes?: number;
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
  maxFileSizeBytes,
}) => {
  const [accordionValue, setAccordionValue] = useState<string | undefined>(
    isActive ? `req-${requirementIndex}` : undefined
  );

  // Effect to control accordion open state when isActive changes to true
  // but not force it to close when isActive changes to false
  useEffect(() => {
    if (isActive) {
      setAccordionValue(`req-${requirementIndex}`);
    }
  }, [isActive, requirementIndex]);

  const requirement = documentRequest.requirements?.[requirementIndex];
  if (!requirement) return null;

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
    <Accordion
      type="single"
      className="eb-w-full eb-rounded-lg eb-border eb-bg-card eb-shadow-md"
      value={accordionValue}
      onValueChange={setAccordionValue}
      collapsible
    >
      <AccordionItem
        className="eb-rounded-md eb-border eb-border-gray-200"
        value={`req-${requirementIndex}`}
      >
        <AccordionTrigger className="eb-py-2">
          <ChevronDownIcon className="eb-ml-2 eb-size-4 eb-shrink-0 eb-transition-transform eb-duration-200" />
          <span className="eb-ml-2 eb-text-nowrap eb-text-sm eb-font-semibold">
            Step {requirementIndex + 1}
          </span>
          {isPastRequirement ? (
            <span className="eb-ml-2 eb-text-sm eb-font-normal eb-text-muted-foreground">
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
          ) : null}
          <div className="eb-ml-auto eb-mr-2 eb-flex eb-items-center eb-gap-2 eb-text-sm eb-font-normal eb-text-muted-foreground">
            {isPastRequirement ? (
              <CheckCircleIcon className="eb-size-4 eb-text-green-600" />
            ) : (
              <CircleDashedIcon className="eb-size-4 eb-text-muted-foreground" />
            )}
          </div>
        </AccordionTrigger>

        <AccordionContent className="eb-p-4">
          {/* Show fixed number of upload sections based on requirement */}
          {Array.from({ length: numFieldsToShow }).map((_, uploadIndex) => (
            <Fragment
              key={`${documentRequest.id}-${requirementIndex}-${uploadIndex}-${resetKey}`}
            >
              <DocumentUploadField
                documentRequestId={documentRequest.id || ''}
                requirementIndex={requirementIndex}
                uploadIndex={uploadIndex}
                availableDocTypes={availableDocTypes as DocumentTypeSmbdo[]}
                control={control}
                isReadOnly={isPastRequirement}
                isOptional={requirement.minRequired === 0}
                maxFileSizeBytes={maxFileSizeBytes}
                isOnlyFieldShown={numFieldsToShow === 1}
              />
              {uploadIndex < numFieldsToShow - 1 && (
                <Separator className="eb-my-6" />
              )}
            </Fragment>
          ))}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};
