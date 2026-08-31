import { useEffect, useRef } from 'react';
import { useTranslationWithTokens } from '@/i18n';
import {
  ArrowRightIcon,
  ChevronRightIcon,
  FileTextIcon,
  PencilIcon,
  Trash2Icon,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ServerErrorAlert } from '@/components/ServerErrorAlert';
import { Button, Skeleton } from '@/components/ui';

import type { PartyMaintenanceEntityTask } from '../utils/buildMaintenanceEntityTasks';
import {
  formatMaintenanceRoles,
  getMaintenancePartyIdentity,
} from '../utils/maintenanceDisplay';
import {
  MaintenanceBreadcrumb,
  type MaintenanceBreadcrumbItem,
} from './MaintenanceBreadcrumb';
import { MaintenanceChangeTable } from './MaintenanceChangeTable';
import { MaintenanceSection } from './MaintenanceSection';
import { MaintenanceViewNavigation } from './MaintenanceViewNavigation';

type MaintenanceEntityViewProps = {
  task: PartyMaintenanceEntityTask;
  canEdit: boolean;
  canCancel: boolean;
  isLoadingDocuments: boolean;
  documentError?: unknown;
  breadcrumbs: MaintenanceBreadcrumbItem[];
  onBack: () => void;
  onViewRequestDetails: () => void;
  onEdit: () => void;
  onSelectDocument: (documentRequestId: string) => void;
  onCancelChanges: () => void;
};

export function MaintenanceEntityView({
  task,
  canEdit,
  canCancel,
  isLoadingDocuments,
  documentError,
  breadcrumbs,
  onBack,
  onViewRequestDetails,
  onEdit,
  onSelectDocument,
  onCancelChanges,
}: MaintenanceEntityViewProps) {
  const { t, tString } = useTranslationWithTokens([
    'approved-client-maintenance',
    'common',
  ]);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const identity = getMaintenancePartyIdentity(
    task.party,
    undefined,
    tString('notProvided')
  );
  const roles = formatMaintenanceRoles(
    task.party.roles,
    (role, fallback) =>
      tString(
        [`common:partyRoles.${role}`] as unknown as TemplateStringsArray,
        { defaultValue: fallback }
      ),
    tString('noRoles')
  );
  const updateStatus = task.change?.proposal.updateRequest?.status;
  const updateHeading =
    updateStatus === 'NEW'
      ? t('changes.draftTitle')
      : updateStatus === 'REVIEW_IN_PROGRESS'
        ? t('changes.reviewTitle')
        : updateStatus === 'INFORMATION_REQUESTED'
          ? t('changes.informationTitle')
          : t('changes.submittedTitle');
  const updateCaption =
    updateStatus === 'NEW'
      ? t('sectionCaption.partyUpdates.draft')
      : updateStatus === 'REVIEW_IN_PROGRESS'
        ? t('sectionCaption.partyUpdates.review')
        : updateStatus === 'INFORMATION_REQUESTED'
          ? t('sectionCaption.partyUpdates.information')
          : t('sectionCaption.partyUpdates.submitted');

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
        <div>
          <h2
            ref={headingRef}
            tabIndex={-1}
            className="eb-text-lg eb-font-semibold focus:eb-outline-none"
          >
            {identity.displayName}
          </h2>
          <p className="eb-mt-0.5 eb-text-sm eb-text-muted-foreground">
            {roles}
          </p>
        </div>
      </header>

      <MaintenanceSection
        id="entity-profile-heading"
        title={t('entity.profileDetails')}
        caption={t('sectionCaption.profileDetails')}
        footer={
          !task.change && canEdit ? (
            <Button variant="ghost" size="sm" onClick={onEdit}>
              <PencilIcon />
              {t('entity.editDetails')}
            </Button>
          ) : undefined
        }
      >
        <dl className="eb-grid eb-gap-x-6 eb-gap-y-3 eb-px-4 eb-py-3.5 sm:eb-grid-cols-2">
          {(['firstName', 'middleName', 'lastName'] as const).map((field) => (
            <div key={field}>
              <dt className="eb-text-xs eb-text-muted-foreground">
                {t([`editor.${field}`] as unknown as TemplateStringsArray)}
              </dt>
              <dd
                className={cn(
                  'eb-mt-0.5 eb-text-sm eb-font-medium',
                  !task.party.individualDetails?.[field] &&
                    'eb-font-normal eb-text-muted-foreground'
                )}
              >
                {task.party.individualDetails?.[field] ||
                  tString('notProvided')}
              </dd>
            </div>
          ))}
          <div>
            <dt className="eb-text-xs eb-text-muted-foreground">
              {t('editor.birthDate')}
            </dt>
            <dd
              className={cn(
                'eb-mt-0.5 eb-text-sm eb-font-medium',
                !task.party.individualDetails?.birthDate &&
                  'eb-font-normal eb-text-muted-foreground'
              )}
            >
              {task.party.individualDetails?.birthDate ??
                tString('notProvided')}
            </dd>
          </div>
        </dl>
      </MaintenanceSection>

      {task.change ? (
        <MaintenanceSection
          id="entity-updates-heading"
          title={updateHeading}
          caption={updateCaption}
          tone={
            updateStatus === 'REVIEW_IN_PROGRESS'
              ? 'informative'
              : updateStatus === 'INFORMATION_REQUESTED'
                ? 'warning'
                : 'default'
          }
          divided
          actions={
            updateStatus === 'NEW' ? (
              <>
                {canEdit ? (
                  <Button variant="outline" size="sm" onClick={onEdit}>
                    <PencilIcon />
                    {t('changes.editDraft')}
                  </Button>
                ) : null}
                {canCancel ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="eb-border-destructive/50 eb-text-destructive hover:eb-bg-destructive-accent hover:eb-text-destructive"
                    onClick={onCancelChanges}
                  >
                    <Trash2Icon />
                    {t('cancel.removePerson')}
                  </Button>
                ) : null}
              </>
            ) : undefined
          }
          afterContent={
            <Button variant="outline" size="sm" onClick={onViewRequestDetails}>
              {t('requestDetails.viewFullRequest')}
              <ArrowRightIcon />
            </Button>
          }
        >
          <MaintenanceChangeTable
            changes={task.change.fieldChanges}
            mode={updateStatus === 'NEW' ? 'draft' : 'submitted'}
          />
        </MaintenanceSection>
      ) : null}

      {(task.documentRequests.length > 0 ||
        task.unresolvedDocumentRequestIds.length > 0 ||
        isLoadingDocuments ||
        Boolean(documentError)) && (
        <MaintenanceSection
          id="entity-requirements-heading"
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
          ) : null}

          {!isLoadingDocuments &&
          !documentError &&
          task.unresolvedDocumentRequestIds.length > 0 ? (
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
