import { useTranslationWithTokens } from '@/i18n';
import { ChevronRightIcon, FileTextIcon } from 'lucide-react';

import type { DocumentRequestResponse } from '@/api/generated/smbdo.schemas';

type MaintenanceDocumentRequestRowProps = {
  documentRequest: DocumentRequestResponse;
  onSelect: (documentRequestId: string) => void;
};

export function MaintenanceDocumentRequestRow({
  documentRequest,
  onSelect,
}: MaintenanceDocumentRequestRowProps) {
  const { t } = useTranslationWithTokens('approved-client-maintenance');
  const isComplete = documentRequest.status === 'CLOSED';

  return (
    <button
      type="button"
      className="eb-flex eb-w-full eb-items-center eb-gap-3 eb-bg-warning-accent eb-px-4 eb-py-3.5 eb-text-left hover:eb-bg-warning-accent/70 focus-visible:eb-outline-none focus-visible:eb-ring-2 focus-visible:eb-ring-inset focus-visible:eb-ring-ring disabled:eb-cursor-default"
      onClick={() => documentRequest.id && onSelect(documentRequest.id)}
      disabled={!documentRequest.id || isComplete}
    >
      <FileTextIcon className="eb-size-5 eb-shrink-0 eb-text-warning" />
      <span className="eb-min-w-0 eb-flex-1">
        <span className="eb-block eb-text-sm eb-font-medium">
          {t('entity.documentRequest')}
        </span>
        <span
          className="eb-line-clamp-2 eb-text-xs eb-leading-5 eb-text-muted-foreground"
          title={documentRequest.description}
        >
          {documentRequest.description || t('entity.documentsDescription')}
        </span>
      </span>
      {isComplete ? (
        <span className="eb-text-xs eb-font-medium eb-text-success">
          {t('documents.complete')}
        </span>
      ) : (
        <span className="eb-flex eb-shrink-0 eb-items-center eb-gap-1 eb-text-sm eb-font-medium">
          {t('entity.continue')}
          <ChevronRightIcon className="eb-size-4" />
        </span>
      )}
    </button>
  );
}
