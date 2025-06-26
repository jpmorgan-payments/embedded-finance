import React, { useEffect, useState } from 'react';
import {
  Camera,
  ExternalLink,
  Eye,
  FileText,
  Image,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react';
import {
  useDropzone,
  type DropzoneProps as _DropzoneProps,
  type DropzoneState as _DropzoneState,
} from 'react-dropzone';
import truncate from 'truncate';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export interface DropzoneState extends _DropzoneState {}

interface CompressionStatus {
  isCompressing: boolean;
  originalSize?: number;
  compressedSize?: number;
  compressionRatio?: number;
}

interface FileCompressionInfo {
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  wasCompressed: boolean;
}

export interface DropzoneProps extends Omit<_DropzoneProps, 'children'> {
  containerClassName?: string;
  dropZoneClassName?: string;
  children?: (dropzone: DropzoneState) => React.ReactNode;
  showFilesList?: boolean;
  showErrorMessage?: boolean;
  onChange?: (files: File[]) => void;
  compressionFunc?: (file: File, maxDimension?: number) => Promise<string>;
  compressibleExtensions?: string[];
  fileMaxSize?: number; // in bytes
  compressionMaxDimension?: number;
  showCompressionInfo?: boolean;
  resetKey?: number; // Key to force reset of internal state
  enableCameraCapture?: boolean; // Enable camera capture for mobile devices
  captureMode?: 'user' | 'environment'; // Camera facing mode: 'user' for front camera, 'environment' for back camera
  value?: File[]; // Support for external value
  enableFilePreview?: boolean; // Enable file preview functionality
}

/**
 * Enhanced Dropzone component with camera capture support for mobile devices.
 *
 * Features:
 * - Drag and drop file upload
 * - File validation and size limits
 * - Image compression with visual feedback
 * - Camera capture for smartphones (when enableCameraCapture is true)
 * - Support for front camera ('user') and back camera ('environment') modes
 * - Maintains state across unmounts when value prop is provided
 * - Enhanced file preview functionality with option to open in new tab
 */
const Dropzone = ({
  containerClassName,
  dropZoneClassName,
  children,
  showFilesList = true,
  showErrorMessage = true,
  onChange,
  compressionFunc,
  compressibleExtensions = ['.jpeg', '.jpg', '.png'],
  fileMaxSize,
  compressionMaxDimension = 1000,
  showCompressionInfo = true,
  resetKey,
  enableCameraCapture = false,
  captureMode,
  value,
  enableFilePreview = true,
  ...props
}: DropzoneProps) => {
  // State:
  const [filesUploaded, setFilesUploaded] = useState<File[]>(value || []);
  const [errorMessage, setErrorMessage] = useState<string>();
  const [compressionStatus, setCompressionStatus] = useState<CompressionStatus>(
    {
      isCompressing: false,
    }
  );
  const [fileCompressionInfo, setFileCompressionInfo] = useState<
    Map<string, FileCompressionInfo>
  >(new Map());
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState<boolean>(false);

  // Sync with external value when it changes
  useEffect(() => {
    if (value && Array.isArray(value) && value.length > 0) {
      setFilesUploaded(value);
    }
  }, [value]);

  // Reset files and compression info when resetKey changes (for external reset)
  useEffect(() => {
    if (resetKey !== undefined) {
      setFilesUploaded([]);
      setFileCompressionInfo(new Map());
      setCompressionStatus({ isCompressing: false });
      setErrorMessage('');
    }
  }, [resetKey]);

  // Clean up object URL when preview changes or component unmounts
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Helper function to check if a file is compressible
  const isCompressibleFile = (file: File): boolean => {
    if (!compressionFunc) return false;
    const extension = file.name.toLowerCase().match(/\.[^.]*$/)?.[0];
    return extension ? compressibleExtensions.includes(extension) : false;
  };

  // Helper function to validate file size
  const validateFileSize = (file: File): boolean => {
    if (!fileMaxSize) return true;
    return file.size <= fileMaxSize;
  };

  // Helper function to compress files
  const handleFileCompression = async (files: File[]): Promise<File[]> => {
    if (!files || files.length === 0) {
      setCompressionStatus({ isCompressing: false });
      return files;
    }

    const processedFiles: File[] = [];
    const newCompressionInfo = new Map(fileCompressionInfo);

    for (const file of files) {
      const isCompressible = isCompressibleFile(file);

      // For non-compressible files, validate original file size
      if (!isCompressible || !compressionFunc) {
        if (validateFileSize(file)) {
          processedFiles.push(file);
        } else {
          const maxSizeMB = fileMaxSize
            ? (fileMaxSize / (1024 * 1024)).toFixed(2)
            : 'unknown';
          setErrorMessage(
            `File size exceeds the maximum allowed size of ${maxSizeMB} MB`
          );
        }
      } else {
        // Set compression status for this file
        setCompressionStatus({
          isCompressing: true,
          originalSize: file.size,
        });

        try {
          const compressedDataUrl = await compressionFunc(
            file,
            compressionMaxDimension
          );

          // Convert data URL back to a File object
          const base64Response = await fetch(compressedDataUrl);
          const compressedBlob = await base64Response.blob();

          const compressedFile = new File([compressedBlob], file.name, {
            type: file.type,
          });

          // Validate compressed file size
          if (validateFileSize(compressedFile)) {
            // Calculate compression ratio
            const compressionRatio = Math.round(
              ((file.size - compressedFile.size) / file.size) * 100
            );

            // Store compression info using the compressed file's properties for lookup
            const compressedFileKey = `${compressedFile.name}-${compressedFile.size}-${compressedFile.lastModified}`;
            newCompressionInfo.set(compressedFileKey, {
              originalSize: file.size,
              compressedSize: compressedFile.size,
              compressionRatio: Math.max(0, compressionRatio),
              wasCompressed: true,
            });

            processedFiles.push(compressedFile);
          } else {
            const maxSizeMB = fileMaxSize
              ? (fileMaxSize / (1024 * 1024)).toFixed(2)
              : 'unknown';
            setErrorMessage(
              `Even after compression, file size exceeds the maximum allowed size of ${maxSizeMB} MB`
            );
          }
        } catch (compressionError) {
          console.error(
            'Image compression failed, using original file:',
            compressionError
          );

          // Validate original file size after compression failure
          if (validateFileSize(file)) {
            // Store info indicating compression failed (file stays the same)
            const fileKey = `${file.name}-${file.size}-${file.lastModified}`;
            newCompressionInfo.set(fileKey, {
              originalSize: file.size,
              compressedSize: file.size,
              compressionRatio: 0,
              wasCompressed: false,
            });

            processedFiles.push(file);
          } else {
            const maxSizeMB = fileMaxSize
              ? (fileMaxSize / (1024 * 1024)).toFixed(2)
              : 'unknown';
            setErrorMessage(
              `File size exceeds the maximum allowed size of ${maxSizeMB} MB`
            );
          }
        }
      }
    }

    setCompressionStatus({ isCompressing: false });
    setFileCompressionInfo(newCompressionInfo);
    return processedFiles;
  };

  // Constants:
  const dropzone = useDropzone({
    ...props,
    onDrop: async (acceptedFiles, fileRejections, event) => {
      if (props.onDrop) {
        props.onDrop(acceptedFiles, fileRejections, event);
      } else {
        // Handle file compression if needed
        const processedFiles = await handleFileCompression(acceptedFiles);

        if (processedFiles.length > 0) {
          // Combine with existing files if we're supporting multiple files
          const newFiles = props.multiple
            ? [...filesUploaded, ...processedFiles]
            : processedFiles; // Replace if not multiple

          onChange?.(newFiles);
          setFilesUploaded(newFiles);
          setErrorMessage('');
        }

        if (fileRejections.length > 0) {
          let _errorMessage = `Could not upload ${fileRejections[0].file.name}`;
          if (fileRejections.length > 1)
            _errorMessage += `, and ${fileRejections.length - 1} other files.`;
          setErrorMessage(_errorMessage);
        }
      }
    },
  });

  // Prepare input props with capture attribute if camera capture is enabled
  const inputProps = {
    ...dropzone.getInputProps(),
    ...(enableCameraCapture && captureMode && { capture: captureMode }),
  };

  // Functions:
  const deleteUploadedFile = (index: number) => {
    const fileToDelete = filesUploaded[index];
    // Use the actual file's properties for the key (which could be compressed file)
    const fileKey = `${fileToDelete.name}-${fileToDelete.size}-${fileToDelete.lastModified}`;

    const newFiles = [
      ...filesUploaded.slice(0, index),
      ...filesUploaded.slice(index + 1),
    ];

    onChange?.(newFiles);
    setFilesUploaded(newFiles);

    // Remove compression info for this file
    const newCompressionInfo = new Map(fileCompressionInfo);
    newCompressionInfo.delete(fileKey);
    setFileCompressionInfo(newCompressionInfo);

    // Reset compression status when all files are deleted
    if (filesUploaded.length === 1) {
      setCompressionStatus({ isCompressing: false });
    }
  };

  // Preview file handler
  const handleFilePreview = (file: File) => {
    if (!enableFilePreview) return;

    // Clean up previous preview URL if exists
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setPreviewFile(file);
    setPreviewOpen(true);
  };

  // Close preview handler
  const closePreview = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setPreviewFile(null);
    setPreviewOpen(false);
  };

  // Open file in new tab
  const openInNewTab = () => {
    if (previewUrl) {
      window.open(previewUrl, '_blank');
      setPreviewOpen(false);
    }
  };

  // Determine if file is previewable
  const isPreviewable = (file: File): boolean => {
    const type = file.type.toLowerCase();
    return type.startsWith('image/') || type === 'application/pdf';
  };

  // Return:
  return (
    <div className={cn('eb-flex eb-flex-col eb-gap-2', containerClassName)}>
      {!(props.multiple === false && filesUploaded.length > 0) && (
        <div
          {...dropzone.getRootProps()}
          className={cn(
            'eb-flex eb-h-32 eb-w-full eb-cursor-pointer eb-select-none eb-items-center eb-justify-center eb-rounded-lg eb-border-2 eb-border-dashed eb-border-inputBorder eb-bg-input eb-p-4 eb-transition-all hover:eb-bg-accent hover:eb-text-accent-foreground',
            dropZoneClassName
          )}
        >
          <input {...inputProps} />
          {children ? (
            children(dropzone)
          ) : dropzone.isDragAccept ? (
            <div className="eb-text-sm eb-font-medium">
              Drop your files here!
            </div>
          ) : (
            <div className="eb-flex eb-flex-col eb-items-center eb-gap-1.5">
              <div className="eb-flex eb-flex-row eb-items-center eb-gap-0.5 eb-text-sm eb-font-medium">
                {enableCameraCapture && captureMode ? (
                  <>
                    <Camera className="eb-mr-2 eb-h-4 eb-w-4" />
                    Take a photo or upload a file
                  </>
                ) : (
                  <>
                    <Upload className="eb-mr-2 eb-h-4 eb-w-4" />
                    Drag and drop a file or click to browse
                  </>
                )}
              </div>
              {(props.maxSize || fileMaxSize) && (
                <div className="eb-text-xs eb-font-medium eb-text-gray-400">
                  Max. file size:{' '}
                  {(
                    (props.maxSize || fileMaxSize || 0) /
                    (1024 * 1024)
                  ).toFixed(2)}{' '}
                  MB
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Compression Status Alert - only show during compression */}
      {showCompressionInfo &&
        compressionStatus &&
        compressionStatus.isCompressing && (
          <div className="eb-rounded-md eb-bg-blue-50 eb-p-3 eb-text-sm">
            <div className="eb-flex eb-items-center eb-gap-2 eb-text-blue-700">
              <Sparkles className="eb-h-4 eb-w-4 eb-animate-spin" />
              <span>Compressing image to {compressionMaxDimension}px...</span>
            </div>
          </div>
        )}

      {/* Compression Info Note */}
      {showCompressionInfo &&
        compressionFunc &&
        compressibleExtensions.length > 0 && (
          <div className="eb-text-xs eb-text-gray-500">
            <div className="eb-flex eb-items-center eb-gap-1">
              <Sparkles className="eb-h-3 eb-w-3" />
              <span>
                {compressibleExtensions.join(', ').toUpperCase()} images will be
                automatically compressed to {compressionMaxDimension}px for
                faster uploads
              </span>
            </div>
          </div>
        )}

      {showErrorMessage && errorMessage && (
        <span className="eb-mt-3 eb-text-xs eb-text-red-600">
          {errorMessage}
        </span>
      )}
      {showFilesList && filesUploaded.length > 0 && (
        <div
          className={`eb-flex eb-w-full eb-flex-col eb-gap-2 ${filesUploaded.length > 2 ? 'eb-h-48' : 'eb-h-fit'} ${filesUploaded.length > 0 ? 'eb-pb-2' : ''}`}
        >
          <div className="eb-w-full">
            {filesUploaded.map((fileUploaded, index) => (
              <div
                key={index}
                className="eb-mt-2 eb-flex eb-h-16 eb-w-full eb-flex-row eb-items-center eb-justify-between eb-rounded-lg eb-border-2 eb-border-solid eb-border-gray-200 eb-bg-card eb-px-4 eb-shadow-sm"
              >
                {' '}
                <div className="eb-flex eb-h-full eb-flex-row eb-items-center eb-gap-4">
                  {fileUploaded.type === 'application/pdf' ? (
                    <FileText className="eb-h-6 eb-w-6 eb-text-rose-700" />
                  ) : (
                    <Image className="eb-h-6 eb-w-6 eb-text-rose-700" />
                  )}
                  <div className="eb-flex eb-flex-col eb-gap-0">
                    <div className="eb-text-[0.85rem] eb-font-medium eb-leading-snug">
                      {truncate(
                        fileUploaded.name.split('.').slice(0, -1).join('.'),
                        30
                      )}
                    </div>
                    <div className="eb-text-[0.7rem] eb-leading-tight eb-text-gray-500">
                      .{fileUploaded.name.split('.').pop()} •{' '}
                      {(fileUploaded.size / (1024 * 1024)).toFixed(2)} MB
                      {/* Show compression info if available for this specific file */}
                      {(() => {
                        const fileKey = `${fileUploaded.name}-${fileUploaded.size}-${fileUploaded.lastModified}`;
                        const compressionInfo =
                          fileCompressionInfo.get(fileKey);
                        const isCompressibleType =
                          isCompressibleFile(fileUploaded);

                        return showCompressionInfo &&
                          compressionInfo &&
                          isCompressibleType &&
                          compressionInfo.wasCompressed &&
                          compressionInfo.compressionRatio > 0 ? (
                          <span className="eb-ml-2 eb-inline-flex eb-items-center eb-gap-1 eb-text-blue-600">
                            <Sparkles className="eb-h-3 eb-w-3" />
                            <span>compressed</span>
                          </span>
                        ) : null;
                      })()}
                    </div>
                  </div>
                </div>
                <div className="eb-flex eb-items-center eb-gap-2">
                  {isPreviewable(fileUploaded) && enableFilePreview && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="eb-size-8 eb-rounded-full eb-p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleFilePreview(fileUploaded);
                      }}
                      aria-label="Preview file"
                    >
                      <Eye className="eb-size-4" />
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="eb-size-8 eb-rounded-full eb-p-0 eb-text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteUploadedFile(index);
                    }}
                    aria-label="Delete file"
                  >
                    <Trash2 className="eb-size-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* File Preview Dialog */}
      <Dialog
        open={previewOpen}
        onOpenChange={(open) => {
          if (!open) closePreview();
          setPreviewOpen(open);
        }}
      >
        <DialogContent className="eb-max-h-[90vh] eb-w-[92vw] eb-overflow-hidden sm:eb-max-w-4xl">
          <DialogHeader>
            <DialogTitle className="eb-pr-8">{previewFile?.name}</DialogTitle>
          </DialogHeader>

          <div className="eb-flex eb-max-h-[70vh] eb-w-full eb-overflow-auto eb-p-1">
            {previewFile?.type.startsWith('image/') ? (
              <div className="eb-flex eb-min-h-0 eb-w-full eb-items-center eb-justify-center eb-overflow-auto">
                <img
                  src={previewUrl || ''}
                  alt={previewFile?.name}
                  className="eb-max-h-[65vh] eb-max-w-full eb-object-contain"
                  onLoad={(e) => {
                    e.currentTarget.style.display = 'block';
                  }}
                />
              </div>
            ) : previewFile?.type === 'application/pdf' ? (
              <iframe
                src={previewUrl || ''}
                title={previewFile?.name}
                className="eb-h-[65vh] eb-w-full eb-border-0"
              />
            ) : (
              <div className="eb-text-center eb-text-gray-500">
                Preview not available for this file type
              </div>
            )}
          </div>

          <DialogFooter className="eb-flex eb-flex-row eb-justify-center eb-gap-2 sm:eb-justify-center">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={openInNewTab}
              aria-label="Open in new tab"
            >
              <ExternalLink className="eb-mr-1 eb-h-4 eb-w-4" />
              Open in New Tab
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Exports:
export default Dropzone;
