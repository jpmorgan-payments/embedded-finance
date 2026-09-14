import { useEffect, useRef } from 'react';
import { useTranslationWithTokens } from '@/i18n';
import {
  ArrowRightIcon,
  CircleMinusIcon,
  CirclePlusIcon,
  PencilIcon,
  Undo2Icon,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ServerErrorAlert } from '@/components/ServerErrorAlert';
import { Button, Skeleton } from '@/components/ui';

import type {
  OrganizationMaintenanceEntityTask,
  PartyMaintenanceEntityTask,
} from '../utils/buildMaintenanceEntityTasks';
import {
  MaintenanceBreadcrumb,
  type MaintenanceBreadcrumbItem,
} from './MaintenanceBreadcrumb';
import { MaintenanceChangeStatusIcon } from './MaintenanceChangeStatusIcon';
import { MaintenanceChangeTable } from './MaintenanceChangeTable';
import { MaintenanceDetailsGroup } from './MaintenanceDetailsGroup';
import { MaintenanceDocumentRequestRow } from './MaintenanceDocumentRequestRow';
import { MaintenanceSection } from './MaintenanceSection';
import { MaintenanceViewNavigation } from './MaintenanceViewNavigation';

type MaintenanceOrganizationViewProps = {
  task: OrganizationMaintenanceEntityTask | PartyMaintenanceEntityTask;
  isIntermediary?: boolean;
  isLoadingDocuments: boolean;
  documentError?: unknown;
  breadcrumbs: MaintenanceBreadcrumbItem[];
  canEdit: boolean;
  canCancel: boolean;
  onBack: () => void;
  onEdit: () => void;
  onViewRequestDetails: () => void;
  onCancelChanges: () => void;
  onSelectDocument: (documentRequestId: string) => void;
};

const formatEnumLabel = (value: string) =>
  value
    .toLowerCase()
    .split('_')
    .join(' ')
    .replace(/^./, (character) => character.toUpperCase());

const maskIdentifier = (value?: string) =>
  value ? `••••${value.slice(-4)}` : undefined;

export function MaintenanceOrganizationView({
  task,
  isIntermediary = false,
  isLoadingDocuments,
  documentError,
  breadcrumbs,
  canEdit,
  canCancel,
  onBack,
  onEdit,
  onViewRequestDetails,
  onCancelChanges,
  onSelectDocument,
}: MaintenanceOrganizationViewProps) {
  const { t, tString } = useTranslationWithTokens([
    'approved-client-maintenance',
    'onboarding-overview',
    'common',
  ]);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const isPendingAddition =
    'isPendingAddition' in task && task.isPendingAddition;
  const displayedParty = isPendingAddition ? task.proposedParty : task.party;
  const updateStatus = task.change?.proposal.updateRequest?.status;
  const isPendingRemoval = task.change?.removesParty ?? false;
  const isAdditionUnderReview =
    isPendingAddition && updateStatus === 'REVIEW_IN_PROGRESS';
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
  const organization = displayedParty?.organizationDetails;
  const organizationName =
    organization?.organizationName ?? tString('notProvided');
  const address = organization?.addresses?.[0];
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
  const identityDetails = [
    {
      label: t('onboarding-overview:fields.organizationName.label'),
      value: organization?.organizationName,
    },
    ...(isIntermediary
      ? []
      : [
          {
            label: t('onboarding-overview:fields.dbaName.label'),
            value: organization?.dbaName,
          },
        ]),
    {
      label: t('onboarding-overview:fields.organizationType.label'),
      value: organization?.organizationType
        ? tString(
            [
              `onboarding-overview:organizationTypes.${organization.organizationType}`,
            ] as unknown as TemplateStringsArray,
            { defaultValue: formatEnumLabel(organization.organizationType) }
          )
        : undefined,
    },
  ];
  const registrationDetails = [
    {
      label: t('onboarding-overview:fields.countryOfFormation.label'),
      value: organization?.countryOfFormation
        ? tString(
            [
              `common:countries.${organization.countryOfFormation}`,
            ] as unknown as TemplateStringsArray,
            { defaultValue: organization.countryOfFormation }
          )
        : undefined,
    },
    ...(isIntermediary
      ? []
      : [
          {
            label: t('onboarding-overview:fields.yearOfFormation.label'),
            value: organization?.yearOfFormation,
          },
        ]),
    {
      label: t('onboarding-overview:fields.organizationIdEin.label'),
      value: organization?.organizationIds?.[0]
        ? `${organization.organizationIds[0].idType ?? ''} ${
            maskIdentifier(organization.organizationIds[0].value) ?? ''
          }`.trim()
        : undefined,
    },
  ];
  const operationsDetails = [
    {
      label: t('onboarding-overview:fields.organizationDescription.label'),
      value: organization?.organizationDescription,
    },
    {
      label: t('organizationDetails.industry'),
      value:
        organization?.industryType ??
        organization?.industryCategory ??
        organization?.industry?.code,
    },
  ];
  const contactDetails = [
    {
      label: t('organizationDetails.email'),
      value: displayedParty?.email,
    },
    {
      label: t('onboarding-overview:fields.website.label'),
      value: organization?.website,
    },
    {
      label: t('organizationDetails.phone'),
      value: organization?.phone?.phoneNumber
        ? `${organization.phone.countryCode ?? ''} ••••${organization.phone.phoneNumber.slice(-4)}`.trim()
        : undefined,
    },
    {
      label: t('onboarding-overview:fields.organizationAddress.label.default'),
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
          {task.documentRequests.map((documentRequest) => (
            <li key={documentRequest.id}>
              <MaintenanceDocumentRequestRow
                documentRequest={documentRequest}
                onSelect={onSelectDocument}
              />
            </li>
          ))}
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
        isPendingAddition && 'eb-border-informative/60',
        isPendingRemoval && 'eb-border-warning/60'
      )}
    >
      <header
        className={cn(
          'eb-border-b eb-px-4 eb-py-4',
          isPendingAddition &&
            'eb-border-informative/50 eb-bg-informative-accent/40',
          isPendingRemoval && 'eb-border-warning/50 eb-bg-warning-accent/40'
        )}
      >
        <MaintenanceBreadcrumb
          items={breadcrumbs}
          ariaLabel={tString('navigation.breadcrumbLabel')}
        />
        <div className="eb-flex eb-flex-wrap eb-items-start eb-justify-between eb-gap-4">
          <div className="eb-min-w-0">
            {isPendingAddition ? (
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
              <p className="eb-mb-1 eb-inline-flex eb-items-center eb-gap-1.5 eb-text-xs eb-font-semibold eb-uppercase eb-tracking-wider eb-text-warning-foreground">
                <CircleMinusIcon className="eb-size-3.5" aria-hidden="true" />
                {t('status.PENDING_REMOVAL')}
              </p>
            ) : null}
            <h2
              ref={headingRef}
              tabIndex={-1}
              className="eb-text-lg eb-font-semibold focus:eb-outline-none"
            >
              {organizationName}
            </h2>
            <p className="eb-mt-1 eb-max-w-2xl eb-text-sm eb-leading-5 eb-text-muted-foreground">
              {isPendingAddition
                ? t('pendingAddition.businessDescription')
                : isIntermediary
                  ? t('ownership.intermediaryOwner')
                  : t('flow.businessInformation')}
            </p>
          </div>
          {isPendingAddition ? (
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
          ) : null}
        </div>
      </header>

      {task.change && !isPendingAddition ? (
        <MaintenanceSection
          id="organization-updates-heading"
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
            <div className="eb-mt-4">
              <div className="eb-overflow-hidden eb-rounded-md eb-border eb-border-warning/50 eb-bg-background">
                {requirementsContent}
              </div>
            </div>
          ) : null}
        </MaintenanceSection>
      ) : null}

      {!task.change && !isPendingAddition && hasRequirements ? (
        <MaintenanceSection
          id="organization-requirements-heading"
          title={t('entity.documentRequest')}
          tone="warning"
          divided
        >
          {requirementsContent}
        </MaintenanceSection>
      ) : null}

      <section
        aria-labelledby="organization-details-heading"
        className={
          isPendingAddition
            ? 'eb-bg-informative-accent/10 eb-px-4 eb-py-5'
            : 'eb-border-t eb-px-4 eb-py-5'
        }
      >
        <div className="eb-flex eb-flex-wrap eb-items-start eb-justify-between eb-gap-3 eb-pb-2">
          <h3
            id="organization-details-heading"
            className="eb-text-xs eb-font-semibold eb-uppercase eb-tracking-wider"
          >
            {isPendingAddition
              ? t('pendingAddition.businessDetailsTitle')
              : t('organizationDetails.title')}
          </h3>
          <div className="eb-flex eb-flex-wrap eb-gap-2">
            {!isPendingAddition && !task.change && canEdit ? (
              <Button variant="outlineSurface" size="sm" onClick={onEdit}>
                <PencilIcon />
                {t('placeholders.editBusiness')}
              </Button>
            ) : null}
          </div>
        </div>
        <div className="eb-mt-2">
          <MaintenanceDetailsGroup
            title={t('organizationDetails.identityGroup')}
            details={identityDetails}
            notProvided={tString('notProvided')}
            unframed
          />
          <MaintenanceDetailsGroup
            title={t('organizationDetails.registrationGroup')}
            details={registrationDetails}
            notProvided={tString('notProvided')}
            unframed
          />
          {!isIntermediary ? (
            <MaintenanceDetailsGroup
              title={t('organizationDetails.operationsGroup')}
              details={operationsDetails}
              notProvided={tString('notProvided')}
              unframed
            />
          ) : null}
          <MaintenanceDetailsGroup
            title={
              isIntermediary
                ? t('ownership.legalAddress')
                : t('organizationDetails.contactGroup')
            }
            details={
              isIntermediary
                ? contactDetails.filter(
                    (detail) =>
                      detail.label ===
                      tString(
                        'onboarding-overview:fields.organizationAddress.label.default'
                      )
                  )
                : contactDetails
            }
            notProvided={tString('notProvided')}
            unframed
          />
        </div>
      </section>
      {isPendingAddition && hasRequirements ? (
        <MaintenanceSection
          id="organization-pending-requirements-heading"
          title={t('entity.documentRequest')}
          tone="warning"
          divided
        >
          {requirementsContent}
        </MaintenanceSection>
      ) : null}
      <MaintenanceViewNavigation
        backLabel={tString('submission.backToProfile')}
        onBack={onBack}
      />
    </div>
  );
}
