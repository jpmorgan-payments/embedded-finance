import type {
  DocumentRequestResponse,
  DocumentTypeSmbdo,
} from '@/api/generated/smbdo.schemas';

export type DocumentUploadSelection = {
  documentType: DocumentTypeSmbdo;
  file: File;
  requirementIndex: number;
};

export type DocumentUploadFormValues = Record<string, Record<string, unknown>>;

export function getDocumentUploadSelections(
  documentRequest: DocumentRequestResponse,
  formValues: DocumentUploadFormValues
): DocumentUploadSelection[] {
  if (!documentRequest.id) return [];
  const requestValues = formValues[documentRequest.id] ?? {};
  const uploads: DocumentUploadSelection[] = [];

  Object.entries(requestValues).forEach(([fieldName, value]) => {
    if (!fieldName.includes('_docType') || typeof value !== 'string') return;
    const requirementIndex = Number(fieldName.split('_')[1]);
    if (!Number.isInteger(requirementIndex)) return;
    const suffix = fieldName.replace(
      `requirement_${requirementIndex}_docType`,
      ''
    );
    const files =
      requestValues[`requirement_${requirementIndex}_files${suffix}`];
    if (!Array.isArray(files)) return;

    files.forEach((file) => {
      if (file instanceof File) {
        uploads.push({
          documentType: value as DocumentTypeSmbdo,
          file,
          requirementIndex,
        });
      }
    });
  });

  return uploads;
}

export function isDocumentRequestReady(
  documentRequest: DocumentRequestResponse,
  uploads: DocumentUploadSelection[]
) {
  return (documentRequest.requirements ?? []).every(
    (requirement, requirementIndex) => {
      if (requirement.minRequired === 0) return true;
      const matchingTypes = new Set(
        uploads
          .filter(
            (upload) =>
              upload.requirementIndex === requirementIndex &&
              requirement.documentTypes.includes(upload.documentType)
          )
          .map((upload) => upload.documentType)
      );
      return matchingTypes.size >= (requirement.minRequired ?? 1);
    }
  );
}
