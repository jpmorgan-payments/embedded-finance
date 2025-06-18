import { FC } from 'react';
import { Control, Controller } from 'react-hook-form';

import { compressImage } from '@/lib/utils';
import { DocumentTypeSmbdo } from '@/api/generated/smbdo.schemas';
import Dropzone from '@/components/ui/dropzone';
import {
  FormControl,
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
import { DOCUMENT_TYPE_MAPPING } from '@/core/OnboardingWizardBasic/utils/documentTypeMapping';

import {
  ACCEPTED_FILE_TYPES,
  MAX_FILE_SIZE_BYTES,
} from './documentUploadUtils';

interface DocumentUploadFieldProps {
  /**
   * Document request ID
   */
  documentRequestId: string;
  /**
   * Index of the requirement in the document request
   */
  requirementIndex: number;
  /**
   * Index of the upload field in the requirement
   */
  uploadIndex: number;
  /**
   * Available document types for selection
   */
  availableDocTypes: DocumentTypeSmbdo[];
  /**
   * Form control from parent form
   */
  control: Control<any>;
  /**
   * Whether the field is read-only (completed)
   */
  isReadOnly?: boolean;
  /**
   * Whether the field is optional
   */
  isOptional?: boolean;
}

/**
 * Component for document type selection and file upload field
 */
export const DocumentUploadField: FC<DocumentUploadFieldProps> = ({
  documentRequestId,
  requirementIndex,
  uploadIndex,
  availableDocTypes,
  control,
  isReadOnly = false,
  isOptional = false,
}) => {
  // Field names with optional suffix for multiple fields
  const fieldSuffix = uploadIndex > 0 ? `_${uploadIndex}` : '';
  const docTypeFieldName = `${documentRequestId}.requirement_${requirementIndex}_docType${fieldSuffix}`;
  const filesFieldName = `${documentRequestId}.requirement_${requirementIndex}_files${fieldSuffix}`;

  return (
    <div className="eb-mb-6">
      {/* Document Type Selection */}
      <FormField
        control={control}
        name={docTypeFieldName}
        render={({ field }) => (
          <FormItem className="eb-mb-4">
            <FormLabel
              asterisk={!isOptional}
              className="eb-text-sm eb-font-medium eb-text-gray-700"
            >
              Select Document Type
              {isOptional && (
                <span className="eb-ml-2 eb-text-xs eb-font-normal eb-text-gray-500">
                  (Optional)
                </span>
              )}
            </FormLabel>
            <FormControl>
              <Select
                onValueChange={field.onChange}
                value={field.value || ''}
                disabled={isReadOnly}
              >
                <SelectTrigger className="eb-w-full">
                  <SelectValue placeholder="Select a document type" />
                </SelectTrigger>
                <SelectContent>
                  {availableDocTypes.map((docType) => (
                    <SelectItem key={docType} value={docType}>
                      {DOCUMENT_TYPE_MAPPING[docType]?.label || docType}
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
        control={control}
        name={filesFieldName}
        render={({ field: { onChange, ...fieldProps } }) => (
          <FormItem className="eb-space-y-2">
            <FormLabel
              asterisk={!isOptional}
              className="eb-text-sm eb-font-medium eb-text-gray-700"
            >
              Upload Document
              {isOptional && (
                <span className="eb-ml-2 eb-text-xs eb-font-normal eb-text-gray-500">
                  (Optional)
                </span>
              )}
            </FormLabel>

            <FormControl>
              <Dropzone
                containerClassName="eb-max-w-full"
                {...fieldProps}
                multiple
                accept={ACCEPTED_FILE_TYPES}
                onChange={onChange}
                compressionFunc={compressImage}
                compressibleExtensions={['.jpeg', '.jpg', '.png']}
                fileMaxSize={MAX_FILE_SIZE_BYTES}
                compressionMaxDimension={1000}
                showCompressionInfo
              />
            </FormControl>
            <FormMessage className="eb-text-xs" />
          </FormItem>
        )}
      />
    </div>
  );
};
