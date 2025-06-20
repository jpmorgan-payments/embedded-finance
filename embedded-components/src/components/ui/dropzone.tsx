import React, { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import {
  useDropzone,
  type DropzoneProps as _DropzoneProps,
  type DropzoneState as _DropzoneState,
} from 'react-dropzone';
import truncate from 'truncate';

import { cn } from '@/lib/utils';
import { Box } from '@/components/ui/box';

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
}

// Functions:

const Upload = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={cn('lucide lucide-upload', className)}
  >
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" x2="12" y1="3" y2="15" />
  </svg>
);

const PDF = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={cn('lucide lucide-file-text', className)}
  >
    <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
    <path d="M14 2v4a2 2 0 0 0 2 2h4" />
    <path d="M10 9H8" />
    <path d="M16 13H8" />
    <path d="M16 17H8" />
  </svg>
);

const Image = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={cn('lucide lucide-image', className)}
  >
    <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
    <circle cx="9" cy="9" r="2" />
    <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
  </svg>
);

const Trash = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={cn('lucide lucide-trash', className)}
  >
    <path d="M3 6h18" />
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
  </svg>
);

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
  ...props
}: DropzoneProps) => {
  // State:
  const [filesUploaded, setFilesUploaded] = useState<File[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>();
  const [compressionStatus, setCompressionStatus] = useState<CompressionStatus>(
    {
      isCompressing: false,
    }
  );
  const [fileCompressionInfo, setFileCompressionInfo] = useState<
    Map<string, FileCompressionInfo>
  >(new Map());

  // Reset files and compression info when resetKey changes (for external reset)
  useEffect(() => {
    if (resetKey !== undefined) {
      setFilesUploaded([]);
      setFileCompressionInfo(new Map());
      setCompressionStatus({ isCompressing: false });
      setErrorMessage('');
    }
  }, [resetKey]);

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
          onChange?.([...filesUploaded, ...processedFiles]);
          setFilesUploaded((_filesUploaded) => [
            ..._filesUploaded,
            ...processedFiles,
          ]);
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

  // Functions:
  const deleteUploadedFile = (index: number) => {
    const fileToDelete = filesUploaded[index];
    // Use the actual file's properties for the key (which could be compressed file)
    const fileKey = `${fileToDelete.name}-${fileToDelete.size}-${fileToDelete.lastModified}`;

    onChange?.([
      ...filesUploaded.slice(0, index),
      ...filesUploaded.slice(index + 1),
    ]);
    setFilesUploaded((_uploadedFiles) => [
      ..._uploadedFiles.slice(0, index),
      ..._uploadedFiles.slice(index + 1),
    ]);

    // Remove compression info for this file
    const newCompressionInfo = new Map(fileCompressionInfo);
    newCompressionInfo.delete(fileKey);
    setFileCompressionInfo(newCompressionInfo);

    // Reset compression status when all files are deleted
    if (filesUploaded.length === 1) {
      setCompressionStatus({ isCompressing: false });
    }
  };

  // Return:
  return (
    <div className={cn('eb-flex eb-flex-col eb-gap-2', containerClassName)}>
      {!(props.multiple === false && filesUploaded.length > 0) && (
        <div
          {...dropzone.getRootProps()}
          className={cn(
            'eb-flex eb-h-32 eb-w-full eb-cursor-pointer eb-select-none eb-items-center eb-justify-center eb-rounded-lg eb-border-2 eb-border-dashed eb-border-gray-200 eb-p-4 eb-transition-all hover:eb-bg-accent hover:eb-text-accent-foreground',
            dropZoneClassName
          )}
        >
          <input {...dropzone.getInputProps()} />
          {children ? (
            children(dropzone)
          ) : dropzone.isDragAccept ? (
            <div className="eb-text-sm eb-font-medium">
              Drop your files here!
            </div>
          ) : (
            <div className="eb-flex eb-flex-col eb-items-center eb-gap-1.5">
              <div className="eb-flex eb-flex-row eb-items-center eb-gap-0.5 eb-text-sm eb-font-medium">
                <Upload className="eb-mr-2 eb-h-4 eb-w-4" /> Drag and drop a
                file or click to browse
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
                className="eb-mt-2 eb-flex eb-h-16 eb-w-full eb-flex-row eb-items-center eb-justify-between eb-rounded-lg eb-border-2 eb-border-solid eb-border-gray-200 eb-px-4 eb-shadow-sm"
              >
                <div className="eb-flex eb-h-full eb-flex-row eb-items-center eb-gap-4">
                  {fileUploaded.type === 'application/pdf' ? (
                    <PDF className="eb-h-6 eb-w-6 eb-text-rose-700" />
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
                <Box
                  className="eb-cursor-pointer eb-select-none eb-rounded-full eb-border-2 eb-border-solid eb-border-gray-100 eb-p-2 eb-shadow-sm eb-transition-all hover:eb-bg-accent"
                  onClick={() => deleteUploadedFile(index)}
                >
                  <Trash className="eb-h-4 eb-w-4" />
                </Box>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Exports:
export default Dropzone;
