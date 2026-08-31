import { useEffect, useRef } from 'react';
import { useTranslationWithTokens } from '@/i18n';
import { ChevronRightIcon, FileTextIcon, PencilIcon } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ServerErrorAlert } from '@/components/ServerErrorAlert';
import { Skeleton } from '@/components/ui';

import type { OrganizationMaintenanceEntityTask } from '../utils/buildMaintenanceEntityTasks';
import {
  MaintenanceBreadcrumb,
  type MaintenanceBreadcrumbItem,
} from './MaintenanceBreadcrumb';
import { MaintenanceSection } from './MaintenanceSection';
import { MaintenanceViewNavigation } from './MaintenanceViewNavigation';
import { UnavailableMaintenanceAction } from './UnavailableMaintenanceAction';

type MaintenanceOrganizationViewProps = {
  task: OrganizationMaintenanceEntityTask;
  isLoadingDocuments: boolean;
  documentError?: unknown;
  breadcrumbs: MaintenanceBreadcrumbItem[];
  onBack: () => void;
  onSelectDocument: (documentRequestId: string) => void;
};

const formatEnumLabel = (value: string) =>
  value
    .toLowerCase()
    .split('_')
    .join(' ')
    .replace(/^./, (character) => character.toUpperCase());

export function MaintenanceOrganizationView({
  task,
  isLoadingDocuments,
  documentError,
  breadcrumbs,
  onBack,
  onSelectDocument,
}: MaintenanceOrganizationViewProps) {
  const { t, tString } = useTranslationWithTokens(
    'approved-client-maintenance'
  );
  const headingRef = useRef<HTMLHeadingElement>(null);
  const organization = task.party?.organizationDetails;
  const organizationName =
    organization?.organizationName ?? tString('notProvided');

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
          {organizationName}
        </h2>
        <p className="eb-mt-0.5 eb-text-sm eb-text-muted-foreground">
          {t('flow.businessInformation')}
        </p>
      </header>

      <MaintenanceSection
        id="organization-details-heading"
        title={t('organization')}
        caption={t('sectionCaption.organization')}
        footer={
          <UnavailableMaintenanceAction icon={<PencilIcon />}>
            {t('placeholders.editBusiness')}
          </UnavailableMaintenanceAction>
        }
      >
        <dl className="eb-grid eb-gap-x-6 eb-gap-y-3 eb-px-4 eb-py-3.5 sm:eb-grid-cols-2">
          <div>
            <dt className="eb-text-xs eb-text-muted-foreground">
              {t('legalName')}
            </dt>
            <dd
              className={cn(
                'eb-mt-0.5 eb-text-sm eb-font-medium',
                !organization?.organizationName &&
                  'eb-font-normal eb-text-muted-foreground'
              )}
            >
              {organizationName}
            </dd>
          </div>
          <div>
            <dt className="eb-text-xs eb-text-muted-foreground">
              {t('entityType')}
            </dt>
            <dd
              className={cn(
                'eb-mt-0.5 eb-text-sm eb-font-medium',
                !organization?.organizationType &&
                  'eb-font-normal eb-text-muted-foreground'
              )}
            >
              {organization?.organizationType
                ? formatEnumLabel(organization.organizationType)
                : tString('notProvided')}
            </dd>
          </div>
          <div>
            <dt className="eb-text-xs eb-text-muted-foreground">
              {t('countryOfFormation')}
            </dt>
            <dd
              className={cn(
                'eb-mt-0.5 eb-text-sm eb-font-medium',
                !organization?.countryOfFormation &&
                  'eb-font-normal eb-text-muted-foreground'
              )}
            >
              {organization?.countryOfFormation ?? tString('notProvided')}
            </dd>
          </div>
        </dl>
      </MaintenanceSection>

      {(task.documentRequests.length > 0 ||
        task.unresolvedDocumentRequestIds.length > 0 ||
        isLoadingDocuments ||
        Boolean(documentError)) && (
        <MaintenanceSection
          id="organization-requirements-heading"
          title={t('entity.requiredNext')}
          caption={t('sectionCaption.requirements')}
          tone="warning"
          divided
        >
          {isLoadingDocuments ? (
            <div className="eb-space-y-2 eb-px-4 eb-py-3.5">
              <Skeleton className="eb-h-4 eb-w-48" />
              <Skeleton className="eb-h-12 eb-w-full" />
            </div>
          ) : documentError ? (
            <div className="eb-p-4">
              <ServerErrorAlert error={documentError as never} />
            </div>
          ) : task.unresolvedDocumentRequestIds.length > 0 ? (
            <Alert variant="warning" noTitle className="eb-m-4">
              <AlertDescription>
                {t('documents.unresolved', {
                  count: task.unresolvedDocumentRequestIds.length,
                })}
              </AlertDescription>
            </Alert>
          ) : null}
          {!isLoadingDocuments && task.documentRequests.length > 0 ? (
            <ul className="eb-divide-y">
              {task.documentRequests.map((documentRequest) => {
                const isComplete = documentRequest.status === 'CLOSED';
                return (
                  <li key={documentRequest.id}>
                    <button
                      type="button"
                      className="eb-flex eb-w-full eb-items-center eb-gap-3 eb-px-4 eb-py-3.5 eb-text-left hover:eb-bg-muted/40 focus-visible:eb-outline-none focus-visible:eb-ring-2 focus-visible:eb-ring-inset focus-visible:eb-ring-ring disabled:eb-cursor-default"
                      onClick={() =>
                        documentRequest.id &&
                        onSelectDocument(documentRequest.id)
                      }
                      disabled={!documentRequest.id || isComplete}
                    >
                      <FileTextIcon className="eb-size-5 eb-shrink-0 eb-text-muted-foreground" />
                      <span className="eb-min-w-0 eb-flex-1">
                        <span className="eb-block eb-text-sm eb-font-medium">
                          {t('entity.documentRequest')}
                        </span>
                        <span
                          className="eb-line-clamp-2 eb-text-xs eb-leading-5 eb-text-muted-foreground"
                          title={documentRequest.description}
                        >
                          {documentRequest.description ||
                            t('entity.documentsDescription')}
                        </span>
                      </span>
                      {isComplete ? (
                        <span className="eb-text-xs eb-font-medium eb-text-success">
                          {t('documents.complete')}
                        </span>
                      ) : (
                        <>
                          <span className="eb-text-sm eb-font-medium">
                            {t('entity.continue')}
                          </span>
                          <ChevronRightIcon className="eb-size-4" />
                        </>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </MaintenanceSection>
      )}
      <MaintenanceViewNavigation
        backLabel={tString('submission.backToProfile')}
        onBack={onBack}
      />
    </div>
  );
}
