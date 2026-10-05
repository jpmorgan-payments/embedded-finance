import { useEffect, useRef } from 'react';
import { useTranslationWithTokens } from '@/i18n';
import {
  AlertTriangleIcon,
  ArrowRightIcon,
  CircleMinusIcon,
  CirclePlusIcon,
  Loader2Icon,
  PencilIcon,
  Trash2Icon,
  Undo2Icon,
  UserRoundCheckIcon,
  UserRoundCogIcon,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ServerErrorAlert } from '@/components/ServerErrorAlert';
import { Button, Skeleton } from '@/components/ui';

import { usePendingAction } from '../hooks/usePendingAction';
import type { PartyMaintenanceEntityTask } from '../utils/buildMaintenanceEntityTasks';
import { getMaintenancePartyIdentity } from '../utils/maintenanceDisplay';
import {
  MaintenanceBreadcrumb,
  type MaintenanceBreadcrumbItem,
} from './MaintenanceBreadcrumb';
import { MaintenanceChangeStatusIcon } from './MaintenanceChangeStatusIcon';
import { MaintenanceChangeTable } from './MaintenanceChangeTable';
import { MaintenanceDetailsGroup } from './MaintenanceDetailsGroup';
import { MaintenanceDocumentRequestRow } from './MaintenanceDocumentRequestRow';
import { MaintenanceOwnershipRolesSection } from './MaintenanceOwnershipRolesSection';
import { MaintenanceSection } from './MaintenanceSection';
import { MaintenanceViewNavigation } from './MaintenanceViewNavigation';

type MaintenanceEntityViewProps = {
  task: PartyMaintenanceEntityTask;
  canEdit: boolean;
  canCancel: boolean;
  canRemove: boolean;
  canAddBeneficialOwnerRole: boolean;
  canManageOwnership: boolean;
  isLoadingDocuments: boolean;
  documentError?: unknown;
  breadcrumbs: MaintenanceBreadcrumbItem[];
  onBack: () => void;
  onViewRequestDetails: () => void;
  onEdit: () => void;
  onSelectDocument: (documentRequestId: string) => void;
  onCancelChanges: () => void;
  onRemove: () => void;
  onAddBeneficialOwnerRole: () => void;
  /** Offered to a controller who was replaced and is pending removal. */
  onKeepAsBeneficialOwner?: () => Promise<void>;
  onManageOwnership?: () => void;
  onInsertIntermediary: () => void;
  onChangeConnection?: () => void;
  ownershipPath: string[];
  backLabel: string;
  removeActionLabel: string;
  requiresControllerReplacement: boolean;
};

export function MaintenanceEntityView({
  task,
  canEdit,
  canCancel,
  canRemove,
  canAddBeneficialOwnerRole,
  canManageOwnership,
  isLoadingDocuments,
  documentError,
  breadcrumbs,
  onBack,
  onViewRequestDetails,
  onEdit,
  onSelectDocument,
  onCancelChanges,
  onRemove,
  onAddBeneficialOwnerRole,
  onKeepAsBeneficialOwner,
  onManageOwnership,
  onInsertIntermediary,
  onChangeConnection,
  ownershipPath,
  backLabel,
  removeActionLabel,
  requiresControllerReplacement,
}: MaintenanceEntityViewProps) {
  const { t, tString } = useTranslationWithTokens([
    'approved-client-maintenance',
    'common',
  ]);
  const keepAsOwner = usePendingAction<'keep'>();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const displayedParty = task.isPendingAddition
    ? task.proposedParty
    : task.party;
  const identity = getMaintenancePartyIdentity(
    displayedParty,
    undefined,
    tString('notProvided')
  );
  const updateStatus = task.change?.proposal.updateRequest?.status;
  const isPendingRemoval = task.change?.removesParty ?? false;
  const isAdditionUnderReview =
    task.isPendingAddition && updateStatus === 'REVIEW_IN_PROGRESS';
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
  const individual = displayedParty.individualDetails;
  const address = individual?.addresses?.[0];
  const addressValue = address
    ? [
        ...(address.addressLines ?? []),
        [address.city, address.state, address.postalCode]
          .filter(Boolean)
          .join(', '),
        address.country
          ? tString(
              [
                `common:countries.${address.country}`,
              ] as unknown as TemplateStringsArray,
              { defaultValue: address.country }
            )
          : undefined,
      ]
        .filter(Boolean)
        .join('\n')
    : undefined;
  const identityDocument = individual?.individualIds?.[0];
  const identityDetails = [
    { label: t('editor.firstName'), value: individual?.firstName },
    { label: t('editor.middleName'), value: individual?.middleName },
    { label: t('editor.lastName'), value: individual?.lastName },
    {
      label: t('individualDetails.nameSuffix'),
      value: individual?.nameSuffix,
    },
    {
      label: t('editor.birthDate'),
      value: individual?.birthDate ? '••••••••' : undefined,
    },
    {
      label: t('individualDetails.countryOfResidence'),
      value: individual?.countryOfResidence
        ? tString(
            [
              `common:countries.${individual.countryOfResidence}`,
            ] as unknown as TemplateStringsArray,
            { defaultValue: individual.countryOfResidence }
          )
        : undefined,
    },
    {
      label: t('individualDetails.identification'),
      value: identityDocument
        ? `${identityDocument.idType ?? ''} ••••${identityDocument.value?.slice(-4) ?? ''}`.trim()
        : undefined,
    },
  ];
  const responsibilityDetails = [
    {
      label: t('individualDetails.jobTitle'),
      value:
        individual?.jobTitle === 'Other'
          ? individual.jobTitleDescription || individual.jobTitle
          : individual?.jobTitle,
    },
  ];
  const contactDetails = [
    { label: t('individualDetails.email'), value: displayedParty.email },
    {
      label: t('individualDetails.phone'),
      value: individual?.phone?.phoneNumber
        ? `${individual.phone.countryCode ?? ''} ••••${individual.phone.phoneNumber.slice(-4)}`.trim()
        : undefined,
    },
    {
      label: t('individualDetails.address'),
      value: addressValue,
      multiline: true,
    },
  ];
  const hasRequirements =
    task.documentRequests.length > 0 ||
    task.unresolvedDocumentRequestIds.length > 0 ||
    isLoadingDocuments ||
    Boolean(documentError);
  const requirementsContent = (
    <>
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
            return (
              <li key={documentRequest.id}>
                <MaintenanceDocumentRequestRow
                  documentRequest={documentRequest}
                  onSelect={onSelectDocument}
                />
              </li>
            );
          })}
        </ul>
      ) : null}
    </>
  );

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <div
      className={cn(
        'eb-component eb-w-full eb-overflow-hidden eb-rounded eb-border eb-bg-background',
        task.isPendingAddition && 'eb-border-informative/60',
        isPendingRemoval && 'eb-border-destructive/50',
        task.isUnreviewed && 'eb-border-warning/60'
      )}
    >
      <header
        className={cn(
          'eb-border-b eb-px-4 eb-py-4',
          task.isPendingAddition &&
            'eb-border-informative/50 eb-bg-informative-accent/40',
          isPendingRemoval &&
            'eb-border-destructive/50 eb-bg-destructive-accent/40',
          task.isUnreviewed && 'eb-border-warning/50 eb-bg-warning-accent/40'
        )}
      >
        <MaintenanceBreadcrumb
          items={breadcrumbs}
          ariaLabel={tString('navigation.breadcrumbLabel')}
        />
        <div className="eb-flex eb-flex-wrap eb-items-start eb-justify-between eb-gap-4">
          <div className="eb-min-w-0">
            {task.isUnreviewed ? (
              <p className="eb-mb-1 eb-inline-flex eb-items-center eb-gap-1.5 eb-text-xs eb-font-semibold eb-uppercase eb-tracking-wider eb-text-warning-foreground">
                <AlertTriangleIcon className="eb-size-3.5" aria-hidden="true" />
                {t('unreviewed.title')}
              </p>
            ) : task.isPendingAddition ? (
              <p className="eb-mb-1 eb-inline-flex eb-items-center eb-gap-1.5 eb-text-xs eb-font-semibold eb-uppercase eb-tracking-wider eb-text-informative">
                {isAdditionUnderReview ? (
                  <MaintenanceChangeStatusIcon
                    status={updateStatus}
                    className="eb-size-3.5"
                  />
                ) : (
                  <CirclePlusIcon className="eb-size-3.5" aria-hidden="true" />
                )}
                {isAdditionUnderReview
                  ? t('changes.additionReviewTitle')
                  : t('status.PENDING_ADDITION')}
              </p>
            ) : isPendingRemoval ? (
              <p className="eb-mb-1 eb-inline-flex eb-items-center eb-gap-1.5 eb-text-xs eb-font-semibold eb-uppercase eb-tracking-wider eb-text-destructive">
                <CircleMinusIcon className="eb-size-3.5" aria-hidden="true" />
                {t('status.PENDING_REMOVAL')}
              </p>
            ) : null}
            <h2
              ref={headingRef}
              tabIndex={-1}
              className="eb-text-lg eb-font-semibold focus:eb-outline-none"
            >
              {identity.displayName}
            </h2>
            {task.isUnreviewed ? (
              <p className="eb-mt-1 eb-max-w-2xl eb-text-sm eb-leading-5 eb-text-muted-foreground">
                {t('unreviewed.description')}
              </p>
            ) : task.isPendingAddition ? (
              <p className="eb-mt-1 eb-max-w-2xl eb-text-sm eb-leading-5 eb-text-muted-foreground">
                {t('pendingAddition.personDescription')}
              </p>
            ) : isPendingRemoval ? (
              <p className="eb-mt-1 eb-max-w-2xl eb-text-sm eb-leading-5 eb-text-muted-foreground">
                {t('removeParty.description')}
              </p>
            ) : null}
          </div>
          {isPendingRemoval ? (
            <div className="eb-flex eb-w-full eb-flex-col eb-gap-2 @[40rem]:eb-w-auto @[40rem]:eb-flex-row">
              <Button
                variant="outlineSurface"
                size="sm"
                onClick={onViewRequestDetails}
                disabled={keepAsOwner.isPending}
              >
                {t('requestDetails.viewFullRequest')}
                <ArrowRightIcon />
              </Button>
              {onKeepAsBeneficialOwner ? (
                <Button
                  variant="outlineSurface"
                  size="sm"
                  disabled={keepAsOwner.isPending}
                  onClick={() =>
                    void keepAsOwner.run('keep', onKeepAsBeneficialOwner)
                  }
                >
                  {keepAsOwner.isPending ? (
                    <Loader2Icon className="eb-animate-spin" />
                  ) : (
                    <UserRoundCheckIcon />
                  )}
                  {t('pendingRemoval.keepAsOwner')}
                </Button>
              ) : null}
              {canCancel ? (
                <Button
                  variant="outlineSurface"
                  size="sm"
                  onClick={onCancelChanges}
                  disabled={keepAsOwner.isPending}
                >
                  <Undo2Icon />
                  {t('pendingRemoval.cancel')}
                </Button>
              ) : null}
            </div>
          ) : task.isPendingAddition ? (
            <div className="eb-flex eb-w-full eb-flex-col eb-gap-2 @[40rem]:eb-w-auto @[40rem]:eb-flex-row">
              <Button
                variant="outlineSurface"
                size="sm"
                onClick={onViewRequestDetails}
              >
                {t('requestDetails.viewFullRequest')}
                <ArrowRightIcon />
              </Button>
              {canEdit ? (
                <Button variant="outlineSurface" size="sm" onClick={onEdit}>
                  <PencilIcon />
                  {t('pendingAddition.edit')}
                </Button>
              ) : null}
              {canCancel ? (
                <Button
                  variant="outlineSurface"
                  size="sm"
                  className="eb-border-destructive/50 eb-text-destructive hover:eb-bg-destructive-accent hover:eb-text-destructive"
                  onClick={onCancelChanges}
                >
                  <Undo2Icon />
                  {t('pendingAddition.discard')}
                </Button>
              ) : null}
            </div>
          ) : (!task.change && canEdit) || canRemove ? (
            <div className="eb-flex eb-w-full eb-flex-wrap eb-gap-2 @[40rem]:eb-w-auto @[40rem]:eb-justify-end">
              {!task.change && canEdit ? (
                <Button variant="outlineSurface" size="sm" onClick={onEdit}>
                  <PencilIcon />
                  {t('entity.editDetails')}
                </Button>
              ) : null}
              {canRemove ? (
                <Button
                  variant="outlineSurface"
                  size="sm"
                  className="eb-border-destructive/50 eb-text-destructive hover:eb-bg-destructive-accent hover:eb-text-destructive"
                  onClick={onRemove}
                >
                  {requiresControllerReplacement ? (
                    <UserRoundCogIcon />
                  ) : (
                    <Trash2Icon />
                  )}
                  {removeActionLabel}
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
        {keepAsOwner.error ? (
          <div className="eb-mt-3">
            <ServerErrorAlert error={keepAsOwner.error as never} />
          </div>
        ) : null}
      </header>

      {task.change && !task.isPendingAddition && !isPendingRemoval ? (
        <MaintenanceSection
          id="entity-updates-heading"
          title={updateHeading}
          icon={
            <MaintenanceChangeStatusIcon
              status={updateStatus}
              className="eb-size-4 eb-shrink-0"
            />
          }
          caption={updateCaption}
          tone={
            updateStatus === 'NEW' || updateStatus === 'REVIEW_IN_PROGRESS'
              ? 'informative'
              : updateStatus === 'INFORMATION_REQUESTED'
                ? 'warning'
                : 'default'
          }
          divided
          unframed
          actions={
            updateStatus === 'NEW' ? (
              <>
                {canEdit ? (
                  <Button variant="outlineSurface" size="sm" onClick={onEdit}>
                    <PencilIcon />
                    {t('changes.editDraft')}
                  </Button>
                ) : null}
                {canCancel ? (
                  <Button
                    variant="outlineSurface"
                    size="sm"
                    className="eb-border-destructive/50 eb-text-destructive hover:eb-bg-destructive-accent hover:eb-text-destructive"
                    onClick={onCancelChanges}
                  >
                    <Undo2Icon />
                    {t('cancel.discardChanges')}
                  </Button>
                ) : null}
              </>
            ) : undefined
          }
          afterContent={
            <Button
              variant="outlineSurface"
              size="sm"
              onClick={onViewRequestDetails}
            >
              {t('requestDetails.viewFullRequest')}
              <ArrowRightIcon />
            </Button>
          }
        >
          <div className="eb-overflow-hidden eb-rounded-md eb-border eb-bg-background">
            <MaintenanceChangeTable
              changes={task.change.fieldChanges}
              mode={updateStatus === 'NEW' ? 'draft' : 'submitted'}
            />
          </div>
          {hasRequirements ? (
            <div className="eb-mt-3">
              <div className="eb-overflow-hidden eb-rounded-md eb-border eb-border-warning/50 eb-bg-background">
                {requirementsContent}
              </div>
            </div>
          ) : null}
        </MaintenanceSection>
      ) : null}

      {(!task.change || isPendingRemoval) && hasRequirements ? (
        <MaintenanceSection
          id="entity-requirements-heading"
          title={t('entity.documentRequest')}
          tone="warning"
          divided
        >
          {requirementsContent}
        </MaintenanceSection>
      ) : null}

      <section
        aria-labelledby="entity-profile-heading"
        className={
          task.isPendingAddition
            ? 'eb-bg-informative-accent/10 eb-px-4 eb-py-5'
            : 'eb-border-t eb-px-4 eb-py-5'
        }
      >
        <div className="eb-flex eb-flex-wrap eb-items-start eb-justify-between eb-gap-3 eb-pb-2">
          <h3
            id="entity-profile-heading"
            className="eb-text-xs eb-font-semibold eb-uppercase eb-tracking-wider"
          >
            {task.isPendingAddition
              ? t('pendingAddition.personDetailsTitle')
              : t('entity.profileDetails')}
          </h3>
        </div>
        <div className="eb-mt-2">
          <MaintenanceDetailsGroup
            title={t('individualDetails.identityGroup')}
            details={identityDetails}
            notProvided={tString('notProvided')}
            unframed
          />
          <MaintenanceDetailsGroup
            title={t('individualDetails.responsibilityGroup')}
            details={responsibilityDetails}
            notProvided={tString('notProvided')}
            unframed
          />
          <MaintenanceDetailsGroup
            title={t('individualDetails.contactGroup')}
            details={contactDetails}
            notProvided={tString('notProvided')}
            unframed
          />
        </div>
      </section>

      {task.isPendingAddition && hasRequirements ? (
        <MaintenanceSection
          id="entity-pending-requirements-heading"
          title={t('entity.documentRequest')}
          tone="warning"
          divided
        >
          {requirementsContent}
        </MaintenanceSection>
      ) : null}

      <MaintenanceOwnershipRolesSection
        task={task}
        mode={task.isPendingAddition ? 'pending-party' : 'approved-party'}
        canAddBeneficialOwnerRole={canAddBeneficialOwnerRole}
        canManageOwnership={canManageOwnership}
        onAddBeneficialOwnerRole={onAddBeneficialOwnerRole}
        onManageOwnership={onManageOwnership}
        onInsertIntermediary={onInsertIntermediary}
        onChangeConnection={onChangeConnection}
        ownershipPath={ownershipPath}
      />

      <MaintenanceViewNavigation backLabel={backLabel} onBack={onBack} />
    </div>
  );
}
