import { useEffect, useMemo, useRef } from 'react';
import { useTranslationWithTokens } from '@/i18n';

import { useSmbdoGetDocumentRequest } from '@/api/generated/smbdo';
import type {
  DocumentRequestRequirement,
  DocumentRequestResponse,
} from '@/api/generated/smbdo.schemas';
import { ServerErrorAlert } from '@/components/ServerErrorAlert';
import { Skeleton } from '@/components/ui';
import { formatDocumentDescription } from '@/core/OnboardingFlow/screens/DocumentUploadScreen/documentUploadUtils';

import { DocumentUploadRequestForm } from './DocumentUploadRequestForm';
import {
  MaintenanceBreadcrumb,
  type MaintenanceBreadcrumbItem,
} from './MaintenanceBreadcrumb';

type MaintenanceDocumentViewProps = {
  documentRequestId: string;
  documentRequestSummary?: DocumentRequestResponse;
  entityName: string;
  previousName?: string;
  breadcrumbs: MaintenanceBreadcrumbItem[];
  maxFileSizeBytes?: number;
  onBack: () => void;
  onComplete: () => Promise<void> | void;
};

export function MaintenanceDocumentView({
  documentRequestId,
  documentRequestSummary,
  entityName,
  previousName,
  breadcrumbs,
  maxFileSizeBytes,
  onBack,
  onComplete,
}: MaintenanceDocumentViewProps) {
  const { t, tString } = useTranslationWithTokens(
    'approved-client-maintenance'
  );
  const headingRef = useRef<HTMLHeadingElement>(null);
  const documentRequestQuery = useSmbdoGetDocumentRequest(documentRequestId, {
    query: { enabled: Boolean(documentRequestId) },
  });
  const documentRequest = useMemo(() => {
    if (!documentRequestQuery.data) return undefined;

    const summaryRequirements = documentRequestSummary?.requirements ?? [];
    const detailRequirements = documentRequestQuery.data.requirements ?? [];
    const requirements = detailRequirements.map((requirement, index) => {
      const summaryRequirement = summaryRequirements[index] as
        | (DocumentRequestRequirement & { description?: string })
        | undefined;
      const detailRequirement = requirement as DocumentRequestRequirement & {
        description?: string;
      };
      return {
        ...summaryRequirement,
        ...detailRequirement,
        description:
          detailRequirement.description ?? summaryRequirement?.description,
      };
    });

    return {
      ...documentRequestSummary,
      ...documentRequestQuery.data,
      description:
        documentRequestQuery.data.description ??
        documentRequestSummary?.description,
      requirements:
        requirements.length > 0
          ? requirements
          : documentRequestSummary?.requirements,
    } as DocumentRequestResponse;
  }, [documentRequestQuery.data, documentRequestSummary]);
  const uploadDocumentRequest = documentRequest
    ? { ...documentRequest, description: undefined }
    : undefined;
  const documentDescription =
    documentRequest?.description ?? documentRequestSummary?.description;

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <div className="eb-component eb-w-full eb-overflow-hidden eb-rounded eb-border eb-bg-background">
      <header className="eb-border-b eb-px-4 eb-py-4">
        <MaintenanceBreadcrumb
          items={breadcrumbs}
          ariaLabel={tString('navigation.breadcrumbLabel')}
        />
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="eb-text-lg eb-font-semibold focus:eb-outline-none"
        >
          {t('document.title', { name: entityName })}
        </h2>
        {previousName ? (
          <p className="eb-mt-1 eb-text-xs eb-text-muted-foreground">
            {t('identity.currentProfileName', { name: previousName })}
          </p>
        ) : null}
      </header>

      {documentDescription ? (
        <section
          aria-labelledby="document-upload-guidance-heading"
          className="eb-border-b eb-bg-informative-accent/40 eb-px-4 eb-py-3 sm:eb-px-5"
        >
          <h3
            id="document-upload-guidance-heading"
            className="eb-text-xs eb-font-semibold eb-uppercase eb-tracking-wider eb-text-informative"
          >
            {t('document.uploadGuidance')}
          </h3>
          <div className="eb-mt-1.5 eb-text-sm eb-leading-6 eb-text-foreground [&>*:last-child]:eb-mb-0">
            {formatDocumentDescription(documentDescription)}
          </div>
        </section>
      ) : null}

      {documentRequestQuery.isPending ? (
        <div className="eb-space-y-3 eb-p-4">
          <Skeleton className="eb-h-6 eb-w-48" />
          <Skeleton className="eb-h-48 eb-w-full" />
        </div>
      ) : documentRequestQuery.error ? (
        <div className="eb-p-4">
          <ServerErrorAlert error={documentRequestQuery.error} />
        </div>
      ) : uploadDocumentRequest ? (
        <DocumentUploadRequestForm
          documentRequest={uploadDocumentRequest}
          maxFileSizeBytes={maxFileSizeBytes}
          onCancel={onBack}
          onComplete={onComplete}
        />
      ) : null}
    </div>
  );
}
