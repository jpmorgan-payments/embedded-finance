import { DocumentTypeSmbdo } from '@/api/generated/smbdo.schemas';

/**
 * Accepted file types for document upload
 */
export const ACCEPTED_FILE_TYPES = {
  'application/pdf': ['.pdf'],
  'image/jpeg': ['.jpeg', '.jpg'],
  'image/png': ['.png'],
};

/**
 * Maximum file size in bytes
 */
export const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

/**
 * Interface for uploaded document
 */
export interface UploadedDocument {
  documentType: DocumentTypeSmbdo;
  files: File[];
}

/**
 * Formats a document request description with proper formatting
 * Handles formatting for OR/AND conditions and bullet points
 */
export const formatDocumentDescription = (description?: string) => {
  if (!description) return null;

  // First split by newlines to get main sections
  return description.split('\n').map((section, sectionIndex) => {
    // Check if this section starts with a number (like "1. Formation Document")
    const isNumberedSection = /^\d+\./.test(section.trim());

    // Check if this section has OR conditions
    if (section.includes('[OR]')) {
      // Split by "Acceptable documents are" if present
      let parts = section.split('Acceptable documents are');

      if (parts.length === 2) {
        // Handle the case with "Acceptable documents are" text
        const [mainText, documentsList] = parts;

        // Process the documents list by replacing [OR] with bullet points and removing [AND]
        const documents = documentsList
          .split(/\[AND\]|\[OR\]/g) // Split by [OR] or [AND]
          .map((doc) => doc.trim()) // Trim whitespace
          .filter((doc) => doc); // Filter empty items

        return (
          <div key={`section-${sectionIndex}`} className="eb-mb-2">
            <p
              className={`eb-text-sm ${isNumberedSection ? 'eb-font-medium' : ''}`}
            >
              {mainText}
            </p>
            <p className="eb-ml-4 eb-mt-1 eb-text-sm">
              Acceptable documents are:
            </p>
            <ul className="eb-ml-12 eb-mt-1 eb-list-disc eb-text-sm">
              {documents.map((doc, docIndex) => (
                <li key={`doc-${docIndex}`} className="eb-mb-1">
                  {doc}
                </li>
              ))}
            </ul>
          </div>
        );
      }
      // Process section with OR conditions but no "Acceptable documents are" text
      // Replace [OR] with bullet points
      parts = section
        .split(/\[OR\]/g)
        .map((part) => part.trim())
        .filter((part) => part);

      return (
        <div key={`section-${sectionIndex}`} className="eb-mb-2">
          <p
            className={`eb-text-sm ${isNumberedSection ? 'eb-font-medium' : ''}`}
          >
            {parts[0]}
          </p>
          {parts.length > 1 && (
            <>
              <ul className="eb-ml-6 eb-list-disc eb-text-sm">
                {parts.slice(1).map((part, partIndex) => (
                  <li key={`part-${partIndex}`} className="eb-mb-1">
                    {part}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      );
    }
    if (section.includes('[AND]')) {
      // Handle [AND] sections - split and treat each part as a separate section with its own formatting
      const parts = section
        .split('[AND]')
        .map((part) => part.trim())
        .filter((part) => part);

      return (
        <div key={`section-${sectionIndex}`} className="eb-mb-2">
          {parts.map((part, partIndex) => {
            // Check if this part starts with a number (like "1. Formation Document")
            const isPartNumbered = /^\d+\./.test(part.trim());

            return (
              <p
                key={`and-part-${partIndex}`}
                className={`eb-text-sm ${isPartNumbered || (isNumberedSection && partIndex === 0) ? 'eb-font-medium' : ''} ${partIndex > 0 ? 'eb-mt-2' : ''}`}
              >
                {part}
              </p>
            );
          })}
        </div>
      );
    }
    // Simple text with no OR/AND conditions
    return (
      <p
        key={`section-${sectionIndex}`}
        className={`eb-mb-2 eb-text-sm ${isNumberedSection ? 'eb-font-medium' : ''}`}
      >
        {section}
      </p>
    );
  });
};
