import { FC, useEffect, useState } from 'react';
import { Control } from 'react-hook-form';

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

import { ACCEPTED_FILE_TYPES } from './documentUploadUtils';

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
  /**
   * Maximum file size in bytes
   */
  maxFileSizeBytes?: number;
  /**
   * Whether only this field is shown (for single upload scenarios)
   */
  isOnlyFieldShown?: boolean;
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
  maxFileSizeBytes,
  isOnlyFieldShown = false,
}) => {
  // Camera detection state
  const [enableCameraCapture, setEnableCameraCapture] =
    useState<boolean>(false);

  // Utility functions for mobile and camera detection
  const isMobileDevice = (): boolean => {
    const { userAgent } = navigator;
    const { width, height } = window.screen;

    // Check for explicitly mobile devices (phones and tablets)
    const isMobileUserAgent =
      /Android.*Mobile|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        userAgent
      ) ||
      // iPad detection (modern iPads don't contain "Mobile" in user agent)
      (/iPad|Macintosh/i.test(userAgent) && 'ontouchend' in document);

    // Exclude desktop/laptop operating systems
    const isWindows = /Windows NT/i.test(userAgent);
    const isMacOS =
      /Macintosh|MacIntel/i.test(userAgent) && !('ontouchend' in document);
    const isLinux = /Linux/i.test(userAgent) && !/Android/i.test(userAgent);

    // Exclude devices that are clearly desktops/laptops
    const isDesktop = isWindows || isMacOS || isLinux;

    // For touch devices, use more restrictive criteria
    const isTouchMobile =
      'maxTouchPoints' in navigator &&
      navigator.maxTouchPoints > 0 &&
      !isDesktop &&
      // Mobile devices typically have portrait orientation capability or small screens
      (width <= 768 || height <= 1024) &&
      // Exclude large touch displays (interactive kiosks, large tablets used as laptops)
      width < 1200;

    return isMobileUserAgent || isTouchMobile;
  };

  const hasCameraCapabilities = (): boolean => {
    return !!(
      navigator.mediaDevices &&
      'getUserMedia' in navigator.mediaDevices &&
      'enumerateDevices' in navigator.mediaDevices
    );
  };

  // Check for mobile device and camera capabilities on mount
  useEffect(() => {
    const checkCameraCapabilities = async () => {
      const isMobile = isMobileDevice();
      const hasCamera = hasCameraCapabilities();

      if (isMobile && hasCamera) {
        // Additional check to verify camera access (without requesting permission)
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const hasVideoInput = devices.some(
            (device) => device.kind === 'videoinput'
          );
          setEnableCameraCapture(hasVideoInput);
        } catch (error) {
          // If we can't enumerate devices, assume camera is available on mobile
          setEnableCameraCapture(true);
        }
      }
    };

    checkCameraCapabilities();
  }, []);

  // Field names with optional suffix for multiple fields
  const fieldSuffix = uploadIndex > 0 ? `_${uploadIndex}` : '';
  const docTypeFieldName = `${documentRequestId}.requirement_${requirementIndex}_docType${fieldSuffix}`;
  const filesFieldName = `${documentRequestId}.requirement_${requirementIndex}_files${fieldSuffix}`;

  return (
    <div>
      {!isOnlyFieldShown && (
        <h3 className="eb-mb-3 eb-font-header eb-text-lg eb-font-medium">
          Document {uploadIndex + 1}
        </h3>
      )}
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
                fileMaxSize={maxFileSizeBytes}
                compressionMaxDimension={1000}
                showCompressionInfo
                enableCameraCapture={enableCameraCapture}
                captureMode="environment"
              />
            </FormControl>
            <FormMessage className="eb-text-xs" />
          </FormItem>
        )}
      />
    </div>
  );
};
