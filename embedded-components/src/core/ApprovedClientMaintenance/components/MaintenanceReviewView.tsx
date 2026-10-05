import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useTranslationWithTokens } from '@/i18n';
import {
  AlertCircleIcon,
  CircleDashedIcon,
  CircleMinusIcon,
  CirclePlusIcon,
  Clock3Icon,
  FileTextIcon,
  Loader2Icon,
  NetworkIcon,
  PencilIcon,
  PencilLineIcon,
  SendIcon,
  Undo2Icon,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import type { KycUpdateRequestStatus } from '@/api/generated/smbdo.schemas';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ServerErrorAlert } from '@/components/ServerErrorAlert';
import { Button, Checkbox, Label } from '@/components/ui';

import { useMaintenancePartyCaption } from '../hooks/useMaintenancePartyCaption';
import {
  useMaintenanceRequestSummary,
  type MaintenanceUpdateScope,
} from '../hooks/useMaintenanceRequestSummary';
import type {
  MaintenanceEntityTasks,
  PartyMaintenanceEntityTask,
} from '../utils/buildMaintenanceEntityTasks';
import type {
  MaintenanceProjection,
  PartyFieldChange,
  ProductChange,
} from '../utils/buildMaintenanceProjection';
import type { MaintenancePartyStatus } from '../utils/getMaintenancePartyStatus';
import { getMaintenancePartyIdentity } from '../utils/maintenanceDisplay';
import {
  getMaintenanceFieldDescriptor,
  type EditablePartyField,
} from '../utils/maintenanceFieldDescriptors';
import type { MaintenanceSubmissionBlocker } from '../utils/maintenanceReview';
import {
  getOutstandingPartyRequirements,
  MaintenanceSubmissionError,
} from '../utils/maintenanceReview';
import type { MaintenanceAction } from './MaintenanceActionMenu';
import {
  MaintenanceBreadcrumb,
  type MaintenanceBreadcrumbItem,
} from './MaintenanceBreadcrumb';
import { MaintenanceChangeTable } from './MaintenanceChangeTable';
import { MaintenanceDocumentRequestRow } from './MaintenanceDocumentRequestRow';
import { MaintenancePartyStatusPill } from './MaintenancePartyStatusLabel';
import { MaintenanceReviewChangeRow } from './MaintenanceReviewChangeRow';
import { MaintenanceSection } from './MaintenanceSection';
import { MaintenanceViewNavigation } from './MaintenanceViewNavigation';
import { ProductCancellationDialog } from './ProductCancellationDialog';

// Ownership fields are changed from the ownership structure, not the edit form.
const OWNERSHIP_FIELDS = new Set<PartyFieldChange['field']>([
  'parentPartyId',
  'natureOfOwnership',
  'roles',
]);

type DocumentWork = Pick<
  PartyMaintenanceEntityTask,
  'documentRequests' | 'unresolvedDocumentRequestIds'
>;

const hasOpenDocumentWork = (task: DocumentWork) =>
  task.unresolvedDocumentRequestIds.length > 0 ||
  task.documentRequests.some(
    (documentRequest) => documentRequest.status !== 'CLOSED'
  );

// Owned through already says whether ownership is direct or indirect.
const getVisibleFieldChanges = (task: PartyMaintenanceEntityTask) => {
  const fieldChanges = task.change?.fieldChanges ?? [];
  const statesConnection = fieldChanges.some(
    (change) => change.field === 'parentPartyId'
  );
  return fieldChanges.filter(
    (change) => !(change.field === 'natureOfOwnership' && statesConnection)
  );
};

type ChangeGroup = 'added' | 'updated' | 'removed' | 'documents';

const CHANGE_GROUPS = [
  { id: 'added', Icon: CirclePlusIcon, iconClassName: 'eb-text-informative' },
  {
    id: 'updated',
    Icon: PencilLineIcon,
    iconClassName: 'eb-text-muted-foreground',
  },
  {
    id: 'removed',
    Icon: CircleMinusIcon,
    iconClassName: 'eb-text-destructive',
  },
  // Parties with requested documents but no change of their own.
  { id: 'documents', Icon: FileTextIcon, iconClassName: 'eb-text-warning' },
] as const;

type MaintenanceReviewViewProps = {
  mode: 'draft' | 'submitted';
  projection: MaintenanceProjection;
  entityTasks: MaintenanceEntityTasks;
  requestStatus?: KycUpdateRequestStatus;
  updateScope: MaintenanceUpdateScope;
  isDocumentDiscoveryPending: boolean;
  documentError?: unknown;
  blockers: MaintenanceSubmissionBlocker[];
  fingerprint: string;
  isSubmitting: boolean;
  submissionError?: unknown;
  breadcrumbs: MaintenanceBreadcrumbItem[];
  clientPartyId?: string;
  canEditParty?: (partyId: string) => boolean;
  canEditOrganization?: boolean;
  canCancelChanges?: boolean;
  onOpenParty?: (partyId: string) => void;
  onOpenOrganization?: () => void;
  onEditParty?: (partyId: string) => void;
  onEditOrganization?: () => void;
  onCancelOrganization?: () => void;
  onCancelParty?: (partyId: string) => void;
  canCancelAll?: boolean;
  onCancelAll?: () => void;
  onOpenOwnership?: () => void;
  isCancellingProduct?: boolean;
  productCancellationError?: unknown;
  onCancelProductAddition?: () => Promise<void>;
  onSelectDocument: (
    partyId: string | undefined,
    documentRequestId: string
  ) => void;
  onSubmit: (fingerprint: string) => Promise<void>;
  onBack?: () => void;
  onCompleteRequirement?: (type: MaintenanceSubmissionBlocker['type']) => void;
};

const BLOCKER_KEYS: Record<MaintenanceSubmissionBlocker['type'], string> = {
  documents: 'submission.blockers.documents',
  questions: 'submission.blockers.questions',
  parties: 'submission.blockers.parties',
  roles: 'submission.blockers.roles',
  attestations: 'submission.blockers.attestations',
  unresolved: 'submission.blockers.unresolved',
  conflict: 'submission.blockers.conflict',
  request: 'submission.blockers.request',
};

export function MaintenanceReviewView({
  mode,
  projection,
  entityTasks,
  requestStatus,
  updateScope,
  isDocumentDiscoveryPending,
  documentError,
  blockers,
  fingerprint,
  isSubmitting,
  submissionError,
  breadcrumbs,
  clientPartyId,
  canEditParty,
  canEditOrganization = false,
  canCancelChanges = false,
  onOpenParty,
  onOpenOrganization,
  onEditParty,
  onEditOrganization,
  onCancelOrganization,
  onCancelParty,
  canCancelAll,
  onCancelAll,
  onOpenOwnership,
  isCancellingProduct = false,
  productCancellationError,
  onCancelProductAddition,
  onSelectDocument,
  onSubmit,
  onBack,
  onCompleteRequirement,
}: MaintenanceReviewViewProps) {
  const { t, tString, i18n } = useTranslationWithTokens([
    'approved-client-maintenance',
    'common',
  ]);
  const [isInformationConfirmed, setIsInformationConfirmed] = useState(false);
  const [isOwnershipConfirmed, setIsOwnershipConfirmed] = useState(false);
  const [isProductCancellationOpen, setIsProductCancellationOpen] =
    useState(false);
  const describeParty = useMaintenancePartyCaption(clientPartyId);
  const submittedSummary = useMaintenanceRequestSummary(
    requestStatus === 'INFORMATION_REQUESTED' ? 'action' : 'submitted',
    updateScope
  );
  const [wasUpdated, setWasUpdated] = useState(false);
  const previousFingerprintRef = useRef(fingerprint);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  useEffect(() => {
    if (previousFingerprintRef.current !== fingerprint) {
      previousFingerprintRef.current = fingerprint;
      setIsInformationConfirmed(false);
      setIsOwnershipConfirmed(false);
      setWasUpdated(true);
    }
  }, [fingerprint]);

  const localSubmissionError =
    submissionError instanceof MaintenanceSubmissionError
      ? submissionError.message
      : undefined;
  // Products share the party status vocabulary so a lifecycle reads the same everywhere.
  const getProductStatus = (change: ProductChange): MaintenancePartyStatus => {
    const base = {
      changeCount: 0,
      changeStatus: change.onboardingStatus as
        | KycUpdateRequestStatus
        | undefined,
    };
    if (change.requestedAction === 'REMOVE') {
      return { ...base, kind: 'pendingRemoval', tone: 'destructive' };
    }
    switch (change.onboardingStatus) {
      case 'REVIEW_IN_PROGRESS':
        return { ...base, kind: 'additionUnderReview', tone: 'neutral' };
      case 'INFORMATION_REQUESTED':
        return { ...base, kind: 'changeStatus', tone: 'warning' };
      case 'DECLINED':
      case 'TERMINATED':
        return { ...base, kind: 'changeStatus', tone: 'neutral' };
      default:
        return { ...base, kind: 'pendingAddition', tone: 'informative' };
    }
  };
  const organizationDocumentActions =
    entityTasks.organization.documentRequests.filter(
      (documentRequest) => documentRequest.status !== 'CLOSED'
    );
  const unresolvedDocumentCount =
    entityTasks.organization.unresolvedDocumentRequestIds.length;
  const nonDocumentBlockers = blockers.filter(
    (blocker) => blocker.type !== 'documents'
  );
  const partyInformationRequirements = getOutstandingPartyRequirements(
    projection
  ).map(({ partyId, fields }) => {
    const party =
      projection.proposedClient.parties?.find(
        (candidate) => candidate.id === partyId
      ) ??
      projection.approvedClient.parties?.find(
        (candidate) => candidate.id === partyId
      );
    const change = projection.partyChanges.find(
      (candidate) => candidate.partyId === partyId
    );
    const isOrganization = partyId === clientPartyId;
    const canEdit = isOrganization
      ? canEditOrganization && Boolean(onEditOrganization)
      : Boolean(canEditParty?.(partyId) && onEditParty);
    return {
      partyId,
      // The API may flag a party precisely because its name is missing.
      name: party
        ? getMaintenancePartyIdentity(
            party,
            change,
            describeParty(party) || tString('notProvided')
          ).displayName
        : tString('notProvided'),
      fieldLabels: fields.map((field) => {
        const labelKey = getMaintenanceFieldDescriptor(
          field as EditablePartyField
        )?.labelKey;
        return labelKey
          ? tString([labelKey] as unknown as TemplateStringsArray)
          : field;
      }),
      onEdit: canEdit
        ? () =>
            isOrganization ? onEditOrganization?.() : onEditParty?.(partyId)
        : undefined,
    };
  });
  const partyWorkUnits = entityTasks.parties.filter(
    (task) =>
      task.change ||
      task.unresolvedDocumentRequestIds.length > 0 ||
      task.documentRequests.some(
        (documentRequest) => documentRequest.status !== 'CLOSED'
      )
  );
  const intermediaryWorkUnits = entityTasks.intermediaryOrganizations.filter(
    (task) =>
      task.change ||
      task.unresolvedDocumentRequestIds.length > 0 ||
      task.documentRequests.some(
        (documentRequest) => documentRequest.status !== 'CLOSED'
      )
  );
  const hasOrganizationRequirements =
    organizationDocumentActions.length > 0 || unresolvedDocumentCount > 0;
  const organizationChange = entityTasks.organization.change;
  const hasPartyRequirements = partyWorkUnits.some(
    (task) =>
      task.unresolvedDocumentRequestIds.length > 0 ||
      task.documentRequests.some(
        (documentRequest) => documentRequest.status !== 'CLOSED'
      )
  );
  const hasIntermediaryRequirements = intermediaryWorkUnits.some(
    (task) =>
      task.unresolvedDocumentRequestIds.length > 0 ||
      task.documentRequests.some(
        (documentRequest) => documentRequest.status !== 'CLOSED'
      )
  );
  const hasGlobalRequirements = nonDocumentBlockers.length > 0;
  const hasRequirements =
    isDocumentDiscoveryPending ||
    Boolean(documentError) ||
    hasGlobalRequirements ||
    hasOpenDocumentWork(entityTasks.unassigned) ||
    hasOrganizationRequirements ||
    hasPartyRequirements ||
    hasIntermediaryRequirements;
  const isSubmissionBlocked = hasRequirements || blockers.length > 0;
  const requestActivityDates = projection.partyChanges
    .map((change) => change.proposal.updateRequest?.submittedAt)
    .filter((submittedAt): submittedAt is string => Boolean(submittedAt))
    .map((submittedAt) => new Date(submittedAt))
    .filter((submittedAt) => !Number.isNaN(submittedAt.getTime()));
  const latestRequestActivity = requestActivityDates.sort(
    (left, right) => right.getTime() - left.getTime()
  )[0];
  const locale =
    i18n.resolvedLanguage === 'esUS'
      ? 'es-US'
      : i18n.resolvedLanguage === 'frCA'
        ? 'fr-CA'
        : 'en-US';
  const requestActivityLabel = latestRequestActivity?.toLocaleString(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const relatedPartyTasks = [
    ...entityTasks.parties,
    ...entityTasks.intermediaryOrganizations,
  ];
  const organizationName = getMaintenancePartyIdentity(
    entityTasks.organization.party ?? {},
    organizationChange,
    tString('notProvided')
  ).displayName;
  const getPartyName = (task: PartyMaintenanceEntityTask) =>
    getMaintenancePartyIdentity(task.party, task.change, tString('notProvided'))
      .displayName;
  const documentGroups = [
    {
      id: 'organization',
      partyId: undefined,
      name: organizationName,
      task: entityTasks.organization as DocumentWork,
    },
    ...relatedPartyTasks.map((task) => ({
      id: task.partyId,
      partyId: task.partyId,
      name: getPartyName(task),
      task: task as DocumentWork,
    })),
  ].filter((group) => hasOpenDocumentWork(group.task));
  const attachedDocumentCount = documentGroups.reduce(
    (count, group) =>
      count +
      group.task.documentRequests.filter(
        (documentRequest) => documentRequest.status !== 'CLOSED'
      ).length +
      group.task.unresolvedDocumentRequestIds.length,
    0
  );
  const hasUnassignedDocuments = hasOpenDocumentWork(entityTasks.unassigned);
  // Per-party documents are counted here; keep the API's generic line only if none resolved.
  // Party information is listed per person below, so its count line is dropped.
  const listedBlockers = blockers.filter(
    (blocker) =>
      blocker.type !== 'parties' &&
      (blocker.type !== 'documents' ||
        (attachedDocumentCount === 0 && !hasUnassignedDocuments))
  );
  const showRequirements =
    isDocumentDiscoveryPending ||
    Boolean(documentError) ||
    listedBlockers.length > 0 ||
    partyInformationRequirements.length > 0 ||
    attachedDocumentCount > 0 ||
    hasUnassignedDocuments;

  const renderDocumentRows = (
    partyId: string | undefined,
    task: DocumentWork
  ) => {
    if (!hasOpenDocumentWork(task)) return null;
    const openRequests = task.documentRequests.filter(
      (documentRequest) => documentRequest.status !== 'CLOSED'
    );
    const unresolvedCount = task.unresolvedDocumentRequestIds.length;
    return (
      <ul
        data-review-documents=""
        className="eb-divide-y eb-border-t eb-border-warning/50"
      >
        {openRequests.map((documentRequest) => (
          <li key={documentRequest.id}>
            <MaintenanceDocumentRequestRow
              documentRequest={documentRequest}
              onSelect={(documentRequestId) =>
                onSelectDocument(partyId, documentRequestId)
              }
            />
          </li>
        ))}
        {unresolvedCount > 0 ? (
          <li className="eb-bg-warning-accent eb-px-4 eb-py-3 eb-text-sm">
            {t('documents.unresolved', { count: unresolvedCount })}
          </li>
        ) : null}
      </ul>
    );
  };

  const getPartyActions = (task: PartyMaintenanceEntityTask) => {
    const change = task.change;
    const removesParty = change?.removesParty ?? false;
    const hasEditableChanges = getVisibleFieldChanges(task).some(
      (fieldChange) => !OWNERSHIP_FIELDS.has(fieldChange.field)
    );
    const actions: MaintenanceAction[] = [];
    if (mode !== 'draft' || !change) return actions;
    if (
      !removesParty &&
      onEditParty &&
      canEditParty?.(task.partyId) &&
      (task.isPendingAddition || hasEditableChanges)
    ) {
      actions.push({
        id: 'edit',
        label: tString(
          task.isPendingAddition ? 'pendingAddition.edit' : 'changes.editDraft'
        ),
        icon: <PencilIcon />,
        onSelect: () => onEditParty(task.partyId),
      });
    }
    if (canCancelChanges && onCancelParty) {
      actions.push({
        id: 'discard',
        label: tString(
          removesParty
            ? 'pendingRemoval.cancel'
            : task.isPendingAddition
              ? 'pendingAddition.discard'
              : 'cancel.discardChanges'
        ),
        icon: <Undo2Icon />,
        destructive: !removesParty,
        onSelect: () => onCancelParty(task.partyId),
      });
    }
    return actions;
  };

  const renderProductRow = (change: ProductChange) => {
    const name = tString(
      [
        `common:subProducts.${change.subProduct ?? ''}`,
        `common:products.${change.product}`,
      ] as unknown as TemplateStringsArray,
      { defaultValue: change.subProduct ?? change.product }
    );
    const canCancelProduct =
      mode === 'draft' &&
      change.subProduct === 'LIMITED_DDA_PAYMENTS' &&
      change.onboardingStatus === 'NEW' &&
      Boolean(onCancelProductAddition);
    return (
      <MaintenanceReviewChangeRow
        key={`product-${change.product}-${change.subProduct ?? ''}`}
        changeId={`product-${change.subProduct ?? change.product}`}
        entityKind="product"
        tone={
          change.requestedAction === 'REMOVE' ? 'destructive' : 'informative'
        }
        name={name}
        caption={tString('submission.subProductOf', {
          product: tString(
            [
              `common:products.${change.product}`,
            ] as unknown as TemplateStringsArray,
            { defaultValue: change.product }
          ),
        })}
        status={
          <MaintenancePartyStatusPill status={getProductStatus(change)} />
        }
        menuLabel={tString('submission.changeMenu', { name })}
        actions={
          canCancelProduct
            ? [
                {
                  id: 'cancel-product',
                  label: tString('productCancellation.action'),
                  icon: <Undo2Icon />,
                  destructive: true,
                  onSelect: () => setIsProductCancellationOpen(true),
                },
              ]
            : []
        }
      />
    );
  };

  const renderOrganizationRow = (group: ChangeGroup) => {
    const actions: MaintenanceAction[] = [];
    if (mode === 'draft' && organizationChange) {
      if (canEditOrganization && onEditOrganization) {
        actions.push({
          id: 'edit',
          label: tString('changes.editDraft'),
          icon: <PencilIcon />,
          onSelect: onEditOrganization,
        });
      }
      if (canCancelChanges && onCancelOrganization) {
        actions.push({
          id: 'discard',
          label: tString('cancel.discardChanges'),
          icon: <Undo2Icon />,
          destructive: true,
          onSelect: onCancelOrganization,
        });
      }
    }
    return (
      <MaintenanceReviewChangeRow
        key="organization"
        changeId="organization"
        entityKind="business"
        tone={group === 'documents' ? 'warning' : 'neutral'}
        name={organizationName}
        caption={tString('organization')}
        onOpen={onOpenOrganization}
        menuLabel={tString('submission.changeMenu', { name: organizationName })}
        actions={actions}
      >
        {organizationChange ? (
          <div className="eb-border-t">
            <MaintenanceChangeTable
              changes={organizationChange.fieldChanges}
              mode={mode}
            />
          </div>
        ) : null}
        {renderDocumentRows(undefined, entityTasks.organization)}
      </MaintenanceReviewChangeRow>
    );
  };

  // A new owner's caption says where they connect; the structure page shows the rest.
  const getAdditionCaption = (task: PartyMaintenanceEntityTask) => {
    const caption = describeParty(task.proposedParty);
    const parent = entityTasks.intermediaryOrganizations.find(
      (intermediary) =>
        intermediary.partyId === task.proposedParty.parentPartyId
    );
    return parent
      ? `${caption} · ${tString('submission.ownedThrough', {
          name: getPartyName(parent),
        })}`
      : caption;
  };

  const renderPartyRow = (
    task: PartyMaintenanceEntityTask,
    group: ChangeGroup
  ) => {
    const name = getPartyName(task);
    return (
      <MaintenanceReviewChangeRow
        key={task.partyId}
        changeId={task.partyId}
        entityKind={
          task.proposedParty.roles?.includes('INTERMEDIARY_OWNER')
            ? 'business'
            : 'person'
        }
        tone={
          group === 'added'
            ? 'informative'
            : group === 'removed'
              ? 'destructive'
              : group === 'documents'
                ? 'warning'
                : 'neutral'
        }
        name={name}
        caption={
          group === 'added'
            ? getAdditionCaption(task)
            : describeParty(task.proposedParty)
        }
        onOpen={onOpenParty ? () => onOpenParty(task.partyId) : undefined}
        menuLabel={tString('submission.changeMenu', { name })}
        actions={getPartyActions(task)}
      >
        {group === 'updated' ? (
          <div className="eb-border-t">
            <MaintenanceChangeTable
              changes={getVisibleFieldChanges(task)}
              mode={mode}
            />
          </div>
        ) : null}
        {renderDocumentRows(task.partyId, task)}
      </MaintenanceReviewChangeRow>
    );
  };

  const getChangeGroup = (
    task: PartyMaintenanceEntityTask
  ): ChangeGroup | undefined =>
    task.isPendingAddition
      ? 'added'
      : task.change?.removesParty
        ? 'removed'
        : getVisibleFieldChanges(task).length > 0
          ? 'updated'
          : hasOpenDocumentWork(task)
            ? 'documents'
            : undefined;

  const changeRows: Array<{ group: ChangeGroup; node: ReactNode }> = [
    ...(organizationChange
      ? [
          {
            group: 'updated' as ChangeGroup,
            node: renderOrganizationRow('updated'),
          },
        ]
      : hasOpenDocumentWork(entityTasks.organization)
        ? [
            {
              group: 'documents' as ChangeGroup,
              node: renderOrganizationRow('documents'),
            },
          ]
        : []),
    ...relatedPartyTasks.flatMap((task) => {
      const group = getChangeGroup(task);
      return group ? [{ group, node: renderPartyRow(task, group) }] : [];
    }),
  ];

  const listFormat = new Intl.ListFormat(locale, { type: 'conjunction' });
  // Names say which documents are meant; the requests themselves sit with each party above.
  const documentOwnerNames = listFormat.format(
    documentGroups.map((group) => group.name)
  );
  const requirementsContent = (
    <>
      {documentError ? (
        <div className="eb-p-4">
          <ServerErrorAlert error={documentError as never} />
        </div>
      ) : null}
      <div className="eb-space-y-3 eb-px-4 eb-py-3.5">
        {mode === 'draft' ? (
          <p className="eb-text-sm eb-text-muted-foreground">
            {t('submission.remainingLead')}
          </p>
        ) : null}
        <ul className="eb-space-y-2.5">
          {isDocumentDiscoveryPending ? (
            <li className="eb-flex eb-items-start eb-gap-2.5 eb-text-sm">
              <Loader2Icon
                aria-hidden="true"
                className="eb-mt-0.5 eb-size-4 eb-shrink-0 eb-animate-spin eb-text-muted-foreground"
              />
              {t('flow.preparingDocuments')}
            </li>
          ) : null}
          {attachedDocumentCount > 0 ? (
            <li
              data-review-requirement="documents"
              className="eb-flex eb-items-start eb-gap-2.5 eb-text-sm"
            >
              <CircleDashedIcon
                aria-hidden="true"
                className="eb-mt-0.5 eb-size-4 eb-shrink-0 eb-text-muted-foreground"
              />
              {t('submission.remainingDocuments', {
                names: documentOwnerNames,
              })}
            </li>
          ) : null}
          {partyInformationRequirements.map((requirement) => (
            <li
              key={requirement.partyId}
              data-review-requirement="party-information"
              className="eb-flex eb-items-center eb-gap-2.5 eb-text-sm"
            >
              <CircleDashedIcon
                aria-hidden="true"
                className="eb-size-4 eb-shrink-0 eb-text-muted-foreground"
              />
              <span className="eb-min-w-0 eb-flex-1">
                {requirement.fieldLabels.length > 0
                  ? t('submission.remainingPartyFields', {
                      name: requirement.name,
                      fields: listFormat.format(requirement.fieldLabels),
                    })
                  : t('submission.remainingPartyDetails', {
                      name: requirement.name,
                    })}
              </span>
              {requirement.onEdit ? (
                <Button
                  variant="outlineSurface"
                  size="sm"
                  onClick={requirement.onEdit}
                >
                  {t('submission.completeRequirement')}
                </Button>
              ) : null}
            </li>
          ))}
          {listedBlockers.map((blocker) => {
            const isActionable =
              (blocker.type === 'questions' ||
                blocker.type === 'attestations') &&
              Boolean(onCompleteRequirement);
            return (
              <li
                key={blocker.type}
                className="eb-flex eb-items-center eb-gap-2.5 eb-text-sm"
              >
                <CircleDashedIcon
                  aria-hidden="true"
                  className="eb-size-4 eb-shrink-0 eb-text-muted-foreground"
                />
                <span className="eb-min-w-0 eb-flex-1">
                  {t(
                    [
                      BLOCKER_KEYS[blocker.type],
                    ] as unknown as TemplateStringsArray,
                    { count: blocker.count }
                  )}
                </span>
                {isActionable ? (
                  <Button
                    variant="outlineSurface"
                    size="sm"
                    onClick={() => onCompleteRequirement?.(blocker.type)}
                  >
                    {t('submission.completeRequirement')}
                  </Button>
                ) : null}
              </li>
            );
          })}
        </ul>
      </div>
      {hasUnassignedDocuments ? (
        <div data-review-requirement="unassigned" className="eb-border-t">
          <p className="eb-px-4 eb-pb-1.5 eb-pt-2.5 eb-text-xs eb-font-semibold eb-text-muted-foreground">
            {t('submission.unassignedDocuments')}
          </p>
          {renderDocumentRows(undefined, entityTasks.unassigned)}
        </div>
      ) : null}
    </>
  );

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
          {mode === 'draft'
            ? t('submission.reviewTitle')
            : t([
                `requestDetails.title.${updateScope}`,
              ] as unknown as TemplateStringsArray)}
        </h2>
        <p className="eb-mt-1 eb-text-sm eb-text-muted-foreground">
          {t([
            mode === 'draft'
              ? `submission.reviewDescription.${updateScope}`
              : `requestDetails.description.${updateScope}`,
          ] as unknown as TemplateStringsArray)}
        </p>
        {projection.activeRequestId ? (
          <div className="eb-mt-2 eb-flex eb-flex-wrap eb-gap-x-4 eb-gap-y-1 eb-text-xs eb-text-muted-foreground">
            <span>
              {t('flow.changeSet', { requestId: projection.activeRequestId })}
            </span>
            {requestActivityLabel ? (
              <span>
                {t(
                  mode === 'draft'
                    ? 'requestDetails.lastUpdated'
                    : 'requestDetails.submittedAt',
                  { date: requestActivityLabel }
                )}
              </span>
            ) : null}
          </div>
        ) : null}
      </header>

      {mode === 'submitted' ? (
        <section
          aria-labelledby="maintenance-request-status-heading"
          className={cn(
            'eb-flex eb-items-start eb-gap-3 eb-border-b eb-px-4 eb-py-3.5',
            requestStatus === 'INFORMATION_REQUESTED'
              ? 'eb-border-warning/50 eb-bg-warning-accent'
              : 'eb-border-informative/50 eb-bg-informative-accent'
          )}
        >
          {requestStatus === 'INFORMATION_REQUESTED' ? (
            <AlertCircleIcon className="eb-mt-0.5 eb-size-4 eb-shrink-0 eb-text-warning" />
          ) : (
            <Clock3Icon className="eb-mt-0.5 eb-size-4 eb-shrink-0 eb-text-informative" />
          )}
          <div className="eb-min-w-0">
            <h3
              id="maintenance-request-status-heading"
              className="eb-text-sm eb-font-semibold eb-leading-5"
            >
              {submittedSummary.title}
            </h3>
            <p className="eb-mt-0.5 eb-text-sm eb-leading-5 eb-text-muted-foreground">
              {submittedSummary.description}
            </p>
          </div>
        </section>
      ) : null}

      {wasUpdated ? (
        <Alert variant="informative" noTitle className="eb-m-4 eb-mb-0">
          <AlertDescription>{t('submission.reviewUpdated')}</AlertDescription>
        </Alert>
      ) : null}

      {projection.productChanges.length > 0 ? (
        <MaintenanceSection
          id="review-product-heading"
          title={t('submission.productTitle')}
        >
          <ul className="eb-divide-y">
            {projection.productChanges.map(renderProductRow)}
          </ul>
        </MaintenanceSection>
      ) : null}

      <MaintenanceSection
        id="review-updates-heading"
        title={t('submission.profileUpdates')}
        caption={t('sectionCaption.updates')}
        divided={projection.productChanges.length > 0}
        unframed
        afterContent={
          onOpenOwnership ? (
            <Button
              variant="outlineSurface"
              size="sm"
              data-review-ownership-link=""
              onClick={onOpenOwnership}
            >
              <NetworkIcon />
              {t('ownership.viewStructure')}
            </Button>
          ) : undefined
        }
      >
        {changeRows.length > 0 ? (
          <div className="eb-space-y-5">
            {CHANGE_GROUPS.map(({ id, Icon, iconClassName }) => {
              const rows = changeRows.filter((row) => row.group === id);
              if (rows.length === 0) return null;
              return (
                <section
                  key={id}
                  aria-labelledby={`review-${id}-heading`}
                  data-review-group={id}
                >
                  <h4
                    id={`review-${id}-heading`}
                    className="eb-mb-2 eb-flex eb-items-center eb-gap-1.5 eb-text-sm eb-font-semibold"
                  >
                    <Icon
                      aria-hidden="true"
                      className={cn('eb-size-4', iconClassName)}
                    />
                    {t([
                      `submission.groups.${id}`,
                    ] as unknown as TemplateStringsArray)}
                    <span className="eb-font-normal eb-tabular-nums eb-text-muted-foreground">
                      {rows.length}
                    </span>
                  </h4>
                  <ul className="eb-divide-y eb-overflow-hidden eb-rounded-md eb-border eb-bg-background">
                    {rows.map((row) => row.node)}
                  </ul>
                </section>
              );
            })}
          </div>
        ) : (
          <p className="eb-text-sm eb-text-muted-foreground">
            {t(
              projection.productChanges.length > 0
                ? 'submission.noProfileChanges'
                : 'submission.noChanges'
            )}
          </p>
        )}
      </MaintenanceSection>

      {mode === 'draft' ? (
        <MaintenanceSection
          id="review-ready-heading"
          title={t('submission.sectionTitle')}
          divided
          footer={
            <div className="eb-flex eb-justify-end">
              <Button
                size="sm"
                onClick={() => onSubmit(fingerprint)}
                disabled={
                  !isInformationConfirmed ||
                  !isOwnershipConfirmed ||
                  isSubmissionBlocked ||
                  isSubmitting
                }
              >
                {isSubmitting ? (
                  <Loader2Icon className="eb-animate-spin" />
                ) : (
                  <SendIcon />
                )}
                {t('submission.submitForReview')}
              </Button>
            </div>
          }
        >
          {/* Confirmations only appear once there is nothing left to complete. */}
          {isSubmissionBlocked ? (
            requirementsContent
          ) : (
            <div className="eb-px-4 eb-py-3.5">
              <p className="eb-text-sm eb-text-muted-foreground">
                {t([
                  `submission.lockWarning.${updateScope}`,
                ] as unknown as TemplateStringsArray)}
              </p>
              <p className="eb-mt-2 eb-text-xs eb-leading-5 eb-text-muted-foreground">
                {t('submission.confirmationDescription')}
              </p>
              <div className="eb-mt-4 eb-space-y-3">
                <div className="eb-flex eb-items-start eb-gap-2">
                  <Checkbox
                    id="maintenance-information-confirmation"
                    checked={isInformationConfirmed}
                    onCheckedChange={(checked) =>
                      setIsInformationConfirmed(checked === true)
                    }
                    disabled={isSubmitting}
                  />
                  <Label
                    htmlFor="maintenance-information-confirmation"
                    className="eb-text-sm eb-font-normal eb-leading-5"
                  >
                    {t('submission.informationConfirmation')}
                  </Label>
                </div>
                <div className="eb-flex eb-items-start eb-gap-2">
                  <Checkbox
                    id="maintenance-ownership-confirmation"
                    checked={isOwnershipConfirmed}
                    onCheckedChange={(checked) =>
                      setIsOwnershipConfirmed(checked === true)
                    }
                    disabled={isSubmitting}
                  />
                  <Label
                    htmlFor="maintenance-ownership-confirmation"
                    className="eb-text-sm eb-font-normal eb-leading-5"
                  >
                    {t('submission.ownershipConfirmation')}
                  </Label>
                </div>
              </div>
            </div>
          )}
          {localSubmissionError ? (
            <div className="eb-px-4 eb-pb-3.5">
              <Alert variant="warning" noTitle>
                <AlertDescription>{localSubmissionError}</AlertDescription>
              </Alert>
            </div>
          ) : submissionError ? (
            <div className="eb-px-4 eb-pb-3.5">
              <ServerErrorAlert error={submissionError as never} />
            </div>
          ) : null}
        </MaintenanceSection>
      ) : showRequirements ? (
        <MaintenanceSection
          id="review-requirements-heading"
          title={t('requestDetails.actionRequired')}
          caption={t('sectionCaption.requirements')}
          tone="warning"
          divided
        >
          {requirementsContent}
        </MaintenanceSection>
      ) : null}
      {onBack ? (
        <MaintenanceViewNavigation
          backLabel={tString('submission.backToProfile')}
          onBack={onBack}
          action={
            mode === 'draft' && canCancelAll && onCancelAll ? (
              <Button
                variant="outlineSurface"
                size="sm"
                className="eb-border-destructive/50 eb-text-destructive hover:eb-bg-destructive-accent hover:eb-text-destructive"
                onClick={onCancelAll}
              >
                <Undo2Icon />
                {t('cancel.cancelAll')}
              </Button>
            ) : undefined
          }
        />
      ) : null}
      {onCancelProductAddition ? (
        <ProductCancellationDialog
          open={isProductCancellationOpen}
          isPending={isCancellingProduct}
          error={productCancellationError}
          hasMaintenanceChanges={projection.partyChanges.length > 0}
          onOpenChange={setIsProductCancellationOpen}
          onConfirm={onCancelProductAddition}
        />
      ) : null}
    </div>
  );
}
