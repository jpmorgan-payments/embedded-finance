import { FC, Fragment, useEffect, useState } from 'react';
import { useTranslationWithTokens } from '@/i18n';
import {
  CheckCircleIcon,
  ChevronDownIcon,
  CircleDashedIcon,
  PlusIcon,
} from 'lucide-react';
import {
  Control,
  FieldValues,
  useFormContext,
  UseFormWatch,
} from 'react-hook-form';

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
import { Button, Separator } from '@/components/ui';
import { DOCUMENT_TYPE_MAPPING } from '@/core/OnboardingFlow/config';

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
  control: Control<FieldValues>;
  /**
   * Form watch function from parent component
   */
  watch: UseFormWatch<FieldValues>;
  /**
   * Key to force reset of form fields
   */
  resetKey: number;
  /**
   * Maximum file size in bytes for uploads
   */
  maxFileSizeBytes?: number;
  /**
   * Whether this is the only requirement
   */
  isOnlyRequirement?: boolean;
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
  isOnlyRequirement = false,
}) => {
  const { t } = useTranslationWithTokens(['onboarding-overview']);
  const { unregister } = useFormContext();

  const [accordionValue, setAccordionValue] = useState<string | undefined>(
    isActive ? `req-${requirementIndex}` : undefined
  );
  // Optional fields the user added beyond the required count.
  const [addedFieldCount, setAddedFieldCount] = useState(0);

  useEffect(() => {
    setAddedFieldCount(0);
  }, [resetKey]);

  // Effect to control accordion open state when isActive changes to true
  // but not force it to close when isActive changes to false
  useEffect(() => {
    if (isActive) {
      setAccordionValue(`req-${requirementIndex}`);
    }
  }, [isActive, requirementIndex]);

  const requirement = documentRequest.requirements?.[requirementIndex];
  if (!requirement) return null;
  const requirementDescription = (
    requirement as typeof requirement & { description?: string }
  ).description;

  const requiredFieldCount = requirement.minRequired || 1;
  const fieldCount = Math.max(
    numFieldsToShow,
    requiredFieldCount + addedFieldCount
  );
  const getFieldName = (kind: 'docType' | 'files', uploadIndex: number) =>
    `${documentRequest.id}.requirement_${requirementIndex}_${kind}${uploadIndex > 0 ? `_${uploadIndex}` : ''}`;
  const selectedDocTypes = Array.from(
    { length: fieldCount },
    (_, uploadIndex) => watch(getFieldName('docType', uploadIndex))
  );

  // Each field offers its own type plus types no other field has taken.
  const getAvailableDocTypes = (uploadIndex: number) =>
    (requirement.documentTypes as DocumentTypeSmbdo[]).filter(
      (docType) =>
        selectedDocTypes[uploadIndex] === docType ||
        (!selectedDocTypes.includes(docType) &&
          !satisfiedDocTypes.includes(docType))
    );
  const canAddField =
    selectedDocTypes.every(Boolean) &&
    (requirement.documentTypes as DocumentTypeSmbdo[]).some(
      (docType) =>
        !selectedDocTypes.includes(docType) &&
        !satisfiedDocTypes.includes(docType)
    );

  const removeLastField = () => {
    const uploadIndex = fieldCount - 1;
    unregister([
      getFieldName('docType', uploadIndex),
      getFieldName('files', uploadIndex),
    ]);
    setAddedFieldCount((count) => Math.max(count - 1, 0));
  };

  // Calculate displayed document types list (specific to this requirement or fallback to all satisfied)
  const displayedDocTypes =
    docTypesForRequirement.length > 0
      ? docTypesForRequirement
      : requirement.documentTypes
          .filter((docType) =>
            satisfiedDocTypes.includes(docType as DocumentTypeSmbdo)
          )
          .map((docType) => docType as DocumentTypeSmbdo);

  const content = (
    <>
      {requirementDescription ? (
        <h4 className="eb-mb-4 eb-border-b eb-pb-3 eb-text-base eb-font-semibold eb-leading-6">
          {requirementDescription}
        </h4>
      ) : null}
      {Array.from({ length: fieldCount }).map((_, uploadIndex) => (
        <Fragment
          key={`${documentRequest.id}-${requirementIndex}-${uploadIndex}-${resetKey}`}
        >
          <DocumentUploadField
            documentRequestId={documentRequest.id || ''}
            requirementIndex={requirementIndex}
            uploadIndex={uploadIndex}
            availableDocTypes={getAvailableDocTypes(uploadIndex)}
            control={control}
            isReadOnly={isPastRequirement && uploadIndex < requiredFieldCount}
            isOptional={
              requirement.minRequired === 0 || uploadIndex >= requiredFieldCount
            }
            maxFileSizeBytes={maxFileSizeBytes}
            isOnlyFieldShown={fieldCount === 1}
            onRemove={
              addedFieldCount > 0 &&
              uploadIndex === fieldCount - 1 &&
              uploadIndex >= requiredFieldCount
                ? removeLastField
                : undefined
            }
          />
          {uploadIndex < fieldCount - 1 && <Separator className="eb-my-6" />}
        </Fragment>
      ))}
      {canAddField ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="eb-mt-4"
          onClick={() => setAddedFieldCount((count) => count + 1)}
        >
          <PlusIcon />
          {t('onboarding-overview:documentUpload.addAnotherDocument')}
        </Button>
      ) : null}
    </>
  );
  if (isOnlyRequirement) {
    return content;
  }

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
            {t('onboarding-overview:requirementStep.stepLabel', {
              step: requirementIndex + 1,
            })}
          </span>
          {isPastRequirement ? (
            <span className="eb-ml-2 eb-text-sm eb-font-normal eb-text-muted-foreground">
              {t(
                'onboarding-overview:requirementStep.completedDocumentsProvided'
              )}
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
                  {t('onboarding-overview:requirementStep.optional')}
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

        <AccordionContent className="eb-p-4">{content}</AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};
