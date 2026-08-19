'use client';

import React, { useCallback, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Building,
  CheckCircle2,
  Clock,
  Edit,
  GripVertical,
  Plus,
  Trash2,
  User,
  UserCheck,
  Users,
} from 'lucide-react';

import { trackUserEvent, useUserEventTracking } from '@/lib/utils/userTracking';
import type { PartyResponse } from '@/api/generated/smbdo.schemas';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { EntityCombobox } from './components/EntityCombobox';
import { OwnershipCalculationsTooltip } from './components/OwnershipCalculationsTooltip';
import { useExistingEntities } from './hooks/useExistingEntities';
import { INDIRECT_OWNERSHIP_USER_JOURNEYS } from './IndirectOwnership.constants';
import {
  INTERMEDIARY_OWNER_ROLE,
  type BeneficialOwner,
  type IndirectOwnershipProps,
  type ValidationSummary,
} from './IndirectOwnership.types';
import {
  extractOwnershipRelationships,
  getRelationshipConflictError,
} from './utils/hierarchyIntegrity';
import {
  getBeneficialOwnerFullName,
  getRootCompanyName,
  transformPartyToBeneficialOwner,
} from './utils/openapi-transforms';

/**
 * IndirectOwnership - Streamlined ownership structure building
 *
 * Features:
 * - Single interface with real-time updates
 * - Dialog-based owner addition with immediate feedback
 * - On-demand hierarchy building for indirect owners
 * - Live validation and progress tracking
 * - Enhanced error handling with boundaries and safe transforms
 * - Retry mechanisms for failed operations
 */
/** Build a local (fake-id) owner party for standalone/demo mode. */
export function buildDemoOwnerParty(ownerData: {
  entityType: 'INDIVIDUAL' | 'BUSINESS';
  firstName?: string;
  lastName?: string;
  businessName?: string;
  ownershipType: 'DIRECT' | 'INDIRECT';
}): PartyResponse {
  const nature = ownerData.ownershipType === 'INDIRECT' ? 'Indirect' : 'Direct';
  const parentPartyId =
    ownerData.ownershipType === 'INDIRECT' ? 'temp-parent' : undefined;

  if (ownerData.entityType === 'INDIVIDUAL') {
    return {
      id: `owner-${Date.now()}`,
      partyType: 'INDIVIDUAL',
      active: true,
      roles: ['BENEFICIAL_OWNER'],
      parentPartyId,
      individualDetails: {
        firstName: ownerData.firstName!,
        lastName: ownerData.lastName!,
        natureOfOwnership: nature,
      },
      createdAt: new Date().toISOString(),
    };
  }

  return {
    // Business entities are intermediary owners; they can be Direct or Indirect
    // owners in their own right (spec 3.3/3.4).
    id: `business-${Date.now()}`,
    partyType: 'ORGANIZATION',
    active: true,
    roles: [INTERMEDIARY_OWNER_ROLE],
    parentPartyId,
    organizationDetails: {
      organizationName: ownerData.businessName!,
      natureOfOwnership: nature,
    } as PartyResponse['organizationDetails'],
    createdAt: new Date().toISOString(),
  };
}

/** Transform parties to owner views once, applying the optimistic
 * "pending indirect" override for owners marked indirect before their chain
 * exists. */
export function deriveAllOwners(
  parties: PartyResponse[],
  clientParties: PartyResponse[],
  customHierarchies: Map<string, unknown>,
  pendingIndirectOwnerIds: Set<string>
): BeneficialOwner[] {
  return parties.map((party) => {
    const owner = transformPartyToBeneficialOwner(
      party,
      clientParties,
      customHierarchies.get(party.id || '')
    );
    if (
      owner.id &&
      pendingIndirectOwnerIds.has(owner.id) &&
      owner.ownershipType === 'DIRECT'
    ) {
      return {
        ...owner,
        ownershipType: 'INDIRECT',
        status: 'PENDING_HIERARCHY',
      } as BeneficialOwner;
    }
    return owner;
  });
}

/** All business names across business owners and individual owners' chains
 * (lower-cased), used to prevent duplicate entities. */
export function collectExistingBusinessNames(
  businessOwners: BeneficialOwner[],
  individualOwners: BeneficialOwner[]
): Set<string> {
  const names = new Set<string>();
  businessOwners.forEach((owner) => {
    const name = owner.organizationDetails?.organizationName;
    if (name) names.add(name.toLowerCase());
  });
  individualOwners.forEach((owner) => {
    owner.ownershipHierarchy?.steps?.forEach((step) => {
      if (step.entityName) names.add(step.entityName.toLowerCase());
    });
  });
  return names;
}

/** Names of other owners whose chain reuses the given business entity. */
export function computeChainUsages(
  allOwners: BeneficialOwner[],
  ownerId: string
): string[] {
  const ownerToRemove = allOwners.find((o) => o.id === ownerId);
  const name = ownerToRemove?.organizationDetails?.organizationName;
  if (ownerToRemove?.partyType !== 'ORGANIZATION' || !name) {
    return [];
  }
  const nameToCheck = name.toLowerCase();
  return allOwners
    .filter((owner) => owner.id !== ownerId)
    .filter((owner) =>
      owner.ownershipHierarchy?.steps?.some(
        (step) => step.entityName?.toLowerCase() === nameToCheck
      )
    )
    .map((owner) =>
      owner.partyType === 'INDIVIDUAL'
        ? `${owner.individualDetails?.firstName ?? ''} ${owner.individualDetails?.lastName ?? ''}`.trim()
        : (owner.organizationDetails?.organizationName ?? 'Unknown')
    );
}

/** Pending-removal ids that are no longer present among the current owners. */
export function computeCompletedRemovals(
  pending: Set<string>,
  currentIds: Set<string>
): string[] {
  const completed: string[] = [];
  pending.forEach((ownerId) => {
    if (!currentIds.has(ownerId)) completed.push(ownerId);
  });
  return completed;
}

/** The initial "does anyone own 25% indirectly?" gating card. */
const GatingQuestionCard: React.FC<{
  className?: string;
  testId?: string;
  onAnswer: (answer: 'has-indirect' | 'direct-only') => void;
}> = ({ className, testId, onAnswer }) => (
  <div
    id="indirect-ownership-container"
    className={`eb-component eb-mx-auto eb-w-full eb-max-w-5xl eb-space-y-6 ${className}`}
    data-testid={testId}
  >
    <Card role="region" aria-labelledby="gating-question-title">
      <CardHeader className="eb-border-b eb-bg-muted/30 eb-p-4">
        <CardTitle
          id="gating-question-title"
          className="eb-font-header eb-text-lg eb-font-semibold"
        >
          Ownership structure
        </CardTitle>
      </CardHeader>
      <CardContent className="eb-space-y-4 eb-p-4">
        <p className="eb-text-sm eb-text-muted-foreground">
          Does anyone own 25% or more of your business through one or more other
          companies (indirect ownership)?
        </p>
        <RadioGroup
          onValueChange={(value: string) =>
            onAnswer(value === 'yes' ? 'has-indirect' : 'direct-only')
          }
          className="eb-space-y-3"
        >
          <div className="eb-flex eb-cursor-pointer eb-items-start eb-space-x-3 eb-rounded-lg eb-border eb-p-3 hover:eb-bg-accent">
            <RadioGroupItem value="no" id="gating-no" className="eb-mt-0.5" />
            <div className="eb-flex-1 eb-space-y-1">
              <Label htmlFor="gating-no" className="eb-cursor-pointer">
                No — all owners hold their shares directly
              </Label>
            </div>
          </div>
          <div className="eb-flex eb-cursor-pointer eb-items-start eb-space-x-3 eb-rounded-lg eb-border eb-p-3 hover:eb-bg-accent">
            <RadioGroupItem value="yes" id="gating-yes" className="eb-mt-0.5" />
            <div className="eb-flex-1 eb-space-y-1">
              <Label htmlFor="gating-yes" className="eb-cursor-pointer">
                Yes — some owners hold shares through other companies
              </Label>
              <p className="eb-text-sm eb-text-muted-foreground">
                You&apos;ll be asked to define the ownership chain for each
                indirect owner.
              </p>
            </div>
          </div>
        </RadioGroup>
      </CardContent>
    </Card>
  </div>
);

/** The validation-status message shown in the footer alert. */
export function getValidationStatusMessage(
  summary: ValidationSummary,
  noBeneficialOwnersAttested: boolean
): string {
  if (noBeneficialOwnersAttested && summary.totalOwners === 0) {
    return 'No beneficial owners — ready to continue';
  }
  if (summary.totalOwners === 0) {
    return 'Add your first beneficial owner to get started.';
  }
  if (summary.canComplete) {
    return 'All owners have complete information';
  }
  const n = summary.pendingHierarchies;
  return `${n} owner${n !== 1 ? 's' : ''} pending — edit to complete details`;
}

/** Footer alert summarizing completion state of the ownership structure. */
const ValidationStatusSection: React.FC<{
  validationSummary: ValidationSummary;
  noBeneficialOwnersAttested: boolean;
}> = ({ validationSummary, noBeneficialOwnersAttested }) => {
  const isComplete =
    validationSummary.canComplete || noBeneficialOwnersAttested;
  const alertClass = validationSummary.hasErrors
    ? 'eb-border-destructive eb-bg-destructive-accent'
    : isComplete
      ? 'eb-border-success eb-bg-success-accent'
      : 'eb-border-warning eb-bg-warning-accent';
  const textClass = validationSummary.hasErrors
    ? 'eb-text-destructive'
    : isComplete
      ? 'eb-text-success'
      : 'eb-text-warning';

  return (
    <section
      aria-labelledby="validation-status-heading"
      aria-live="polite"
      aria-atomic="true"
    >
      <h3
        id="validation-status-heading"
        className="eb-mb-3 eb-font-header eb-font-medium eb-text-foreground"
      >
        Validation Status:
      </h3>
      <Alert
        className={alertClass}
        role="status"
        aria-labelledby="validation-status-heading"
        aria-describedby="validation-summary"
      >
        <div className="eb-flex eb-items-center eb-gap-2">
          {validationSummary.hasErrors ? (
            <AlertTriangle
              className="eb-h-4 eb-w-4 eb-text-destructive"
              aria-hidden="true"
            />
          ) : isComplete ? (
            <CheckCircle2
              className="eb-h-4 eb-w-4 eb-text-success"
              aria-hidden="true"
            />
          ) : (
            <Clock
              className="eb-h-4 eb-w-4 eb-text-warning"
              aria-hidden="true"
            />
          )}
          <span className={`eb-text-sm eb-font-semibold ${textClass}`}>
            {getValidationStatusMessage(
              validationSummary,
              noBeneficialOwnersAttested
            )}
          </span>
        </div>
        {validationSummary.totalOwners > 0 && (
          <AlertDescription id="validation-summary">
            <div className="eb-space-y-1">
              <div>
                Ready to complete:{' '}
                {validationSummary.canComplete
                  ? 'Yes ✓'
                  : 'No (pending actions required)'}
              </div>
              <div className="eb-text-sm eb-opacity-75">
                Completion: {validationSummary.completionPercentage}%
              </div>
            </div>
          </AlertDescription>
        )}
      </Alert>
    </section>
  );
};

type OwnerCardHandlers = {
  readOnly?: boolean;
  controllerPartyId?: string;
  rootCompanyName: string;
  onEditOwner?: (ownerId: string) => void;
  onBuildHierarchy: (ownerId: string) => void;
  onEditHierarchy: (ownerId: string) => void;
  onRemoveOwner: (ownerId: string) => void;
  onChangeNature?: (ownerId: string, nature: 'DIRECT' | 'INDIRECT') => void;
  onReorderHierarchy?: (
    ownerId: string,
    fromIndex: number,
    toIndex: number
  ) => void;
};

/** Empty-state block with the "no one owns 25%" attestation checkbox. */
const EmptyOwnershipState: React.FC<{
  noBeneficialOwnersAttested: boolean;
  onAttestChange: (value: boolean) => void;
}> = ({ noBeneficialOwnersAttested, onAttestChange }) => (
  <div
    className="eb-flex eb-animate-fade-in eb-flex-col eb-items-center eb-justify-center eb-space-y-3 eb-py-12 eb-text-center"
    role="status"
    aria-label="Empty ownership structure"
  >
    <div className="eb-relative" aria-hidden="true">
      <div className="eb-rounded-full eb-bg-muted eb-p-4">
        <User className="eb-h-8 eb-w-8 eb-text-muted-foreground" />
      </div>
      <div className="eb-absolute -eb-bottom-1 -eb-right-1 eb-rounded-full eb-bg-background eb-p-0.5">
        <Plus className="eb-h-4 eb-w-4 eb-text-muted-foreground" />
      </div>
    </div>
    <div className="eb-space-y-1">
      <h4 className="eb-text-base eb-font-semibold eb-text-foreground">
        No owners added yet
      </h4>
      <p className="eb-max-w-sm eb-text-sm eb-text-muted-foreground">
        Click &quot;Add Owner&quot; to get started building your ownership
        structure
      </p>
    </div>
    <div className="eb-mt-4 eb-flex eb-items-start eb-space-x-2 eb-rounded-md eb-border eb-p-3">
      <Checkbox
        id="no-beneficial-owners"
        checked={noBeneficialOwnersAttested}
        onCheckedChange={(checked) => onAttestChange(checked === true)}
        className="eb-mt-0.5"
      />
      <Label
        htmlFor="no-beneficial-owners"
        className="eb-cursor-pointer eb-text-sm eb-leading-snug"
      >
        No individual or entity owns 25% or more of this business
      </Label>
    </div>
  </div>
);

/** A titled grid of OwnerCards for one owner category. Renders nothing when
 * empty. */
const OwnerCardGrid: React.FC<{
  title: string;
  Icon: React.ElementType;
  owners: BeneficialOwner[];
  ariaLabel: string;
  handlers: OwnerCardHandlers;
  getIsChainIntermediary?: (owner: BeneficialOwner) => boolean;
  forceChainIntermediary?: boolean;
}> = ({
  title,
  Icon,
  owners,
  ariaLabel,
  handlers,
  getIsChainIntermediary,
  forceChainIntermediary,
}) => {
  if (owners.length === 0) return null;
  return (
    <div>
      <div className="eb-mb-3 eb-flex eb-items-center eb-gap-2">
        <Icon
          className="eb-h-4 eb-w-4 eb-text-muted-foreground"
          aria-hidden="true"
        />
        <h4 className="eb-text-sm eb-font-medium eb-text-foreground">
          {title} ({owners.length})
        </h4>
      </div>
      <div
        className="eb-grid eb-grid-cols-1 eb-items-start eb-gap-3"
        role="list"
        aria-label={ariaLabel}
      >
        {owners.map((owner, index) => (
          <OwnerCard
            key={owner.id}
            owner={owner}
            index={index}
            readOnly={handlers.readOnly}
            controllerPartyId={handlers.controllerPartyId}
            rootCompanyName={handlers.rootCompanyName}
            isChainIntermediary={
              forceChainIntermediary ||
              (getIsChainIntermediary?.(owner) ?? false)
            }
            onBuildHierarchy={handlers.onBuildHierarchy}
            onEditHierarchy={handlers.onEditHierarchy}
            onEditOwner={handlers.onEditOwner}
            onRemoveOwner={handlers.onRemoveOwner}
            onChangeNature={handlers.onChangeNature}
            onReorderHierarchy={handlers.onReorderHierarchy}
          />
        ))}
      </div>
    </div>
  );
};

/** The "Current Ownership Structure" section: empty state or the three owner
 * category grids. */
const OwnershipStructureSection: React.FC<{
  individualOwners: BeneficialOwner[];
  standaloneBusinessOwners: BeneficialOwner[];
  chainIntermediaryOwners: BeneficialOwner[];
  noBeneficialOwnersAttested: boolean;
  onAttestChange: (value: boolean) => void;
  handlers: OwnerCardHandlers;
}> = ({
  individualOwners,
  standaloneBusinessOwners,
  chainIntermediaryOwners,
  noBeneficialOwnersAttested,
  onAttestChange,
  handlers,
}) => {
  const topLevelCount =
    individualOwners.length + standaloneBusinessOwners.length;

  return (
    <section aria-labelledby="ownership-structure-heading" aria-live="polite">
      <h3
        id="ownership-structure-heading"
        className="eb-mb-3 eb-font-header eb-font-medium eb-text-foreground"
      >
        Current Ownership Structure:
        <span className="eb-sr-only">
          {topLevelCount === 0
            ? 'No owners added'
            : `${topLevelCount} owners added`}
        </span>
      </h3>
      {topLevelCount === 0 ? (
        <EmptyOwnershipState
          noBeneficialOwnersAttested={noBeneficialOwnersAttested}
          onAttestChange={onAttestChange}
        />
      ) : (
        <div className="eb-space-y-6">
          <OwnerCardGrid
            title="Beneficial Owners"
            Icon={User}
            owners={individualOwners}
            ariaLabel={`Beneficial owners list with ${individualOwners.length} owners`}
            handlers={handlers}
          />
          <OwnerCardGrid
            title="Business Entity Owners"
            Icon={Building}
            owners={standaloneBusinessOwners}
            ariaLabel={`Business entity owners list with ${standaloneBusinessOwners.length} entities`}
            handlers={handlers}
            getIsChainIntermediary={(owner) =>
              !!owner.parentPartyId &&
              individualOwners.some((ind) => ind.id === owner.parentPartyId)
            }
          />
          <OwnerCardGrid
            title="Intermediary companies"
            Icon={Building}
            owners={chainIntermediaryOwners}
            ariaLabel={`Intermediary companies list with ${chainIntermediaryOwners.length} entities`}
            handlers={handlers}
            forceChainIntermediary
          />
        </div>
      )}
    </section>
  );
};

const IndirectOwnershipCore: React.FC<IndirectOwnershipProps> = ({
  userEventsHandler,
  userEventsLifecycle,
  client,
  onValidationChange,
  showGatingQuestion = false,
  onGatingAnswer,
  onAddOwner,
  onRemoveOwner: onRemoveOwnerProp,
  onSaveHierarchy,
  onEditOwner,
  onChangeOwnerNature,
  onNoBeneficialOwners,
  readOnly = false,
  controllerPartyId,
  className = '',
  testId = 'indirect-ownership',
}) => {
  // Gating question state — when showGatingQuestion is true, we start undecided
  const [gatingDecision, setGatingDecision] = useState<
    'undecided' | 'has-indirect'
  >(showGatingQuestion ? 'undecided' : 'has-indirect');
  // "No one owns 25%" attestation checkbox
  const [noBeneficialOwnersAttested, setNoBeneficialOwnersAttested] =
    useState(false);
  // Set up automatic event tracking for data-user-event attributes
  useUserEventTracking({
    containerId: 'indirect-ownership-container',
    userEventsHandler,
    userEventsLifecycle,
  });

  // Extract data from OpenAPI client (established pattern)
  const rootCompanyName = client
    ? getRootCompanyName(client)
    : 'Unknown Entity';
  const initialParties =
    client?.parties?.filter(
      (party) =>
        party.active &&
        (party.roles?.includes('BENEFICIAL_OWNER') ||
          party.roles?.includes(INTERMEDIARY_OWNER_ROLE))
    ) || [];

  // In integrated mode (onAddOwner provided), derive parties directly from
  // client prop so the component stays in sync with API responses.
  // In standalone/demo mode, manage parties locally.
  const isIntegratedMode = !!onAddOwner;

  // State management - Use PartyResponse as source of truth
  const [localBeneficialOwnerParties, setLocalBeneficialOwnerParties] =
    useState<PartyResponse[]>(initialParties);

  const beneficialOwnerParties = isIntegratedMode
    ? initialParties
    : localBeneficialOwnerParties;
  const setBeneficialOwnerParties = setLocalBeneficialOwnerParties;

  // Store custom hierarchies for parties where user manually built/edited them
  const [customOwnershipHierarchies, setCustomOwnershipHierarchies] = useState<
    Map<string, any>
  >(new Map());
  // Track pending owner removals for completion tracking
  const pendingRemovalsRef = React.useRef<Set<string>>(new Set());

  // Owners the user marked indirect before an intermediary chain exists. The
  // API can't persist that intent (nature 'Indirect' is rejected on
  // CLIENT-parented parties), so it's tracked here until the chain is built —
  // which then classifies the owner indirect structurally.
  const [pendingIndirectOwnerIds, setPendingIndirectOwnerIds] = useState<
    Set<string>
  >(() => new Set());
  const awaitingIndirectAddRef = React.useRef(false);
  const prevOwnerIdsRef = React.useRef<Set<string>>(new Set());

  // Computed view - Transform PartyResponse[] to BeneficialOwner[] once.
  // Single derivation: every owner party (individual BO or org intermediary)
  // is transformed exactly once, then filtered into individual vs business
  // views. One source of truth so the two views can never drift.
  const allOwners = useMemo(
    () =>
      deriveAllOwners(
        beneficialOwnerParties,
        client?.parties || [],
        customOwnershipHierarchies,
        pendingIndirectOwnerIds
      ),
    [
      beneficialOwnerParties,
      client?.parties,
      customOwnershipHierarchies,
      pendingIndirectOwnerIds,
    ]
  );

  // Individual beneficial owners (partyType INDIVIDUAL)
  const beneficialOwners = useMemo(
    () => allOwners.filter((owner) => owner.partyType === 'INDIVIDUAL'),
    [allOwners]
  );

  // Alias kept for existing call sites (individuals only)
  const individualOwners = beneficialOwners;

  // Business entity owners (partyType ORGANIZATION), derived from the same
  // single transform pass.
  const businessOwners = useMemo(
    () => allOwners.filter((owner) => owner.partyType === 'ORGANIZATION'),
    [allOwners]
  );

  // Business owners to show as their own top-level card. A conduit — an
  // organization another party is held through (it has active children in a
  // chain) — is shown only inside that owner's chain, not as a separate owner.
  // A terminal business owner (no children, spec case 3.3/3.4) stays visible.
  const standaloneBusinessOwners = useMemo(
    () =>
      businessOwners.filter(
        (owner) =>
          !client?.parties?.some(
            (p) => p.active !== false && p.parentPartyId === owner.id
          )
      ),
    [businessOwners, client?.parties]
  );

  // Conduit intermediaries (organizations another party is held through). They
  // aren't counted as owners, but each still needs its own details collected,
  // so they get a dedicated section with an Add/Edit Details action.
  const chainIntermediaryOwners = useMemo(
    () =>
      businessOwners.filter((owner) =>
        client?.parties?.some(
          (p) => p.active !== false && p.parentPartyId === owner.id
        )
      ),
    [businessOwners, client?.parties]
  );

  // Get all business names from owners and their hierarchies. Used to prevent
  // duplicate business entities being added across owners and chains.
  const allExistingBusinessNames = useMemo(
    () => collectExistingBusinessNames(businessOwners, beneficialOwners),
    [businessOwners, beneficialOwners]
  );

  // Get all existing entity names for combobox suggestions in the Add Owner
  // dialog and chain builder. Includes individual and business owner names
  // plus any entities already named in ownership chains, so existing
  // entities can be reused instead of recreated (avoids duplicates).
  const allExistingEntityNames = useExistingEntities(allOwners) as string[];

  // Stable party ids for existing organization entities, keyed by lowercased
  // name, so a chain step chosen from the existing-entities list carries the
  // selected party's id (not just its name) to the host for safe reuse.
  const existingEntityIdByName = React.useMemo(() => {
    const map = new Map<string, string>();
    (client?.parties ?? []).forEach((party) => {
      const name = party.organizationDetails?.organizationName?.trim();
      if (
        party.active &&
        party.partyType === 'ORGANIZATION' &&
        party.id &&
        name &&
        !map.has(name.toLowerCase())
      ) {
        map.set(name.toLowerCase(), party.id);
      }
    });
    return map;
  }, [client]);

  // Track view when component loads with ownership data
  React.useEffect(() => {
    if (beneficialOwners.length > 0) {
      trackUserEvent({
        actionName: INDIRECT_OWNERSHIP_USER_JOURNEYS.VIEW_STRUCTURE,
        metadata: { ownerCount: beneficialOwners.length },
        userEventsHandler,
      });
    }
  }, [beneficialOwners.length, userEventsHandler]);

  // Track completion of owner removals
  React.useEffect(() => {
    if (pendingRemovalsRef.current.size === 0 || !userEventsHandler) {
      return;
    }

    const currentOwnerIds = new Set(
      beneficialOwnerParties
        .map((party) => party.id)
        .filter(Boolean) as string[]
    );

    computeCompletedRemovals(
      pendingRemovalsRef.current,
      currentOwnerIds
    ).forEach((ownerId) => {
      trackUserEvent({
        actionName: INDIRECT_OWNERSHIP_USER_JOURNEYS.REMOVE_OWNER_COMPLETED,
        metadata: { ownerId },
        userEventsHandler,
      });
      pendingRemovalsRef.current.delete(ownerId);
    });
  }, [beneficialOwnerParties, userEventsHandler]);

  // When an owner was just added via the "indirect" path, the new party comes
  // back from the API classified direct (nature can't be persisted indirect on
  // a CLIENT-parented party). Flag the newly appeared owner as pending-indirect
  // so the chain-required prompt shows until the user builds the chain.
  React.useEffect(() => {
    const currentIds = new Set(
      beneficialOwnerParties.map((p) => p.id).filter(Boolean) as string[]
    );
    if (awaitingIndirectAddRef.current) {
      const newIds = [...currentIds].filter(
        (id) => !prevOwnerIdsRef.current.has(id)
      );
      if (newIds.length > 0) {
        setPendingIndirectOwnerIds((prev) => {
          const next = new Set(prev);
          newIds.forEach((id) => next.add(id));
          return next;
        });
        awaitingIndirectAddRef.current = false;
      }
    }
    prevOwnerIdsRef.current = currentIds;
  }, [beneficialOwnerParties]);
  const [currentDialog, setCurrentDialog] = useState<
    | 'NONE'
    | 'ADD_OWNER'
    | 'BUILD_CHAIN'
    | 'EDIT_CHAIN'
    | 'CONFIRM_CHAIN'
    | 'CONFIRM_REMOVE'
  >('NONE');
  const [currentOwnerBeingEdited, setCurrentOwnerBeingEdited] = useState<
    string | undefined
  >();
  const [pendingRemovalId, setPendingRemovalId] = useState<
    string | undefined
  >();

  // Check if a business owner is used as an intermediary in another owner's chain
  const getChainUsages = useCallback(
    (ownerId: string): string[] => computeChainUsages(allOwners, ownerId),
    [allOwners]
  );

  // Calculate validation summary — `allOwners` is the single transform
  // derivation (individuals + orgs).
  const validationSummary: ValidationSummary = {
    totalOwners: allOwners.length,
    completeOwners: allOwners.filter((owner) => owner.status === 'COMPLETE')
      .length,
    pendingHierarchies: allOwners.filter(
      (owner) => owner.status === 'PENDING_HIERARCHY'
    ).length,
    ownersWithErrors: allOwners.filter((owner) => owner.status === 'ERROR')
      .length,
    hasErrors: allOwners.some((owner) => owner.status === 'ERROR'),
    errors: [],
    warnings: [],
    canComplete:
      (allOwners.length > 0 &&
        allOwners.every((owner) => owner.status === 'COMPLETE')) ||
      (allOwners.length === 0 && noBeneficialOwnersAttested),
    completionPercentage:
      allOwners.length === 0
        ? 0
        : Math.round(
            (allOwners.filter((owner) => owner.status === 'COMPLETE').length /
              allOwners.length) *
              100
          ),
  };

  React.useEffect(() => {
    onValidationChange?.(validationSummary);
  }, [
    onValidationChange,
    validationSummary.totalOwners,
    validationSummary.completeOwners,
    validationSummary.pendingHierarchies,
    validationSummary.ownersWithErrors,
    validationSummary.hasErrors,
    validationSummary.canComplete,
    validationSummary.completionPercentage,
  ]);

  // Handlers
  const handleAddOwner = useCallback(() => {
    setCurrentDialog('ADD_OWNER');
    trackUserEvent({
      actionName: INDIRECT_OWNERSHIP_USER_JOURNEYS.ADD_OWNER_STARTED,
      userEventsHandler,
    });
  }, [userEventsHandler]);

  const handleCloseDialog = useCallback(() => {
    setCurrentDialog('NONE');
    setCurrentOwnerBeingEdited(undefined);
  }, []);

  const handleGatingAnswer = (answer: 'has-indirect' | 'direct-only') => {
    if (answer === 'has-indirect') {
      setGatingDecision('has-indirect');
    }
    onGatingAnswer?.(answer);
  };

  const handleOwnerSubmit = useCallback(
    (ownerData: {
      entityType: 'INDIVIDUAL' | 'BUSINESS';
      firstName?: string;
      lastName?: string;
      businessName?: string;
      ownershipType: 'DIRECT' | 'INDIRECT';
      isExistingEntity?: boolean;
      intermediaryCompany?: string;
    }) => {
      // Delegate to host if callback provided (integrated mode)
      if (onAddOwner) {
        // Persisted nature can't be 'Indirect' on a CLIENT-parented owner, so
        // remember the intent to flag the new party pending-indirect on return.
        if (ownerData.ownershipType === 'INDIRECT') {
          awaitingIndirectAddRef.current = true;
        }
        onAddOwner(ownerData);
        trackUserEvent({
          actionName: INDIRECT_OWNERSHIP_USER_JOURNEYS.ADD_OWNER_COMPLETED,
          metadata: {
            ownershipType: ownerData.ownershipType,
            entityType: ownerData.entityType,
          },
          userEventsHandler,
        });
        handleCloseDialog();
        return;
      }

      // Standalone/demo mode — manage locally with fake IDs

      // If the user selected an existing business entity, link to it instead of creating a duplicate
      if (ownerData.entityType === 'BUSINESS' && ownerData.isExistingEntity) {
        // Find the existing party by name and skip creating a new one
        const existingParty = beneficialOwnerParties.find(
          (p) =>
            p.partyType === 'ORGANIZATION' &&
            p.organizationDetails?.organizationName?.toLowerCase() ===
              ownerData.businessName?.toLowerCase()
        );
        if (existingParty) {
          // Already exists, no-op (entity is already linked)
          trackUserEvent({
            actionName: INDIRECT_OWNERSHIP_USER_JOURNEYS.ADD_OWNER_COMPLETED,
            metadata: {
              ownerId: existingParty.id,
              ownershipType: ownerData.ownershipType,
              entityType: ownerData.entityType,
              linkedExisting: true,
            },
            userEventsHandler,
          });
          handleCloseDialog();
          return;
        }
      }

      const newParty: PartyResponse = buildDemoOwnerParty(ownerData);

      setBeneficialOwnerParties((prev) => [...prev, newParty]);

      // If indirect owner with intermediary company, auto-create a basic hierarchy step
      if (
        ownerData.entityType === 'INDIVIDUAL' &&
        ownerData.ownershipType === 'INDIRECT' &&
        ownerData.intermediaryCompany
      ) {
        setCustomOwnershipHierarchies((prev) => {
          const updated = new Map(prev);
          updated.set(newParty.id!, {
            steps: [
              {
                entityName: ownerData.intermediaryCompany!,
                hasOwnership: true,
                ownsRootBusinessDirectly: true,
                level: 1,
              },
            ],
            isComplete: true,
          });
          return updated;
        });
      }

      trackUserEvent({
        actionName: INDIRECT_OWNERSHIP_USER_JOURNEYS.ADD_OWNER_COMPLETED,
        metadata: {
          ownerId: newParty.id,
          ownershipType: ownerData.ownershipType,
          entityType: ownerData.entityType,
        },
        userEventsHandler,
      });
      handleCloseDialog();
    },
    [handleCloseDialog, userEventsHandler, onAddOwner, beneficialOwnerParties]
  );

  const handleRemoveOwner = useCallback(
    (ownerId: string) => {
      trackUserEvent({
        actionName: INDIRECT_OWNERSHIP_USER_JOURNEYS.REMOVE_OWNER_STARTED,
        metadata: { ownerId },
        userEventsHandler,
      });

      // Check if this entity is used in another owner's chain
      const chainUsages = getChainUsages(ownerId);
      if (chainUsages.length > 0) {
        setPendingRemovalId(ownerId);
        setCurrentDialog('CONFIRM_REMOVE');
        return;
      }

      // Delegate to host if callback provided (integrated mode)
      if (onRemoveOwnerProp) {
        onRemoveOwnerProp(ownerId);
        return;
      }

      // Standalone/demo mode — manage locally
      pendingRemovalsRef.current.add(ownerId);
      setBeneficialOwnerParties((prev) =>
        prev.filter((party) => party.id !== ownerId)
      );
    },
    [userEventsHandler, onRemoveOwnerProp, getChainUsages]
  );

  const handleConfirmRemoval = useCallback(() => {
    if (!pendingRemovalId) return;

    if (onRemoveOwnerProp) {
      onRemoveOwnerProp(pendingRemovalId);
    } else {
      pendingRemovalsRef.current.add(pendingRemovalId);
      setBeneficialOwnerParties((prev) =>
        prev.filter((party) => party.id !== pendingRemovalId)
      );
    }

    // Also remove this entity from the chain of any owner that referenced it,
    // so the owner's graph chain stays in sync (only the removed step is
    // dropped — the rest of the chain is preserved).
    const ownerToRemove = allOwners.find((o) => o.id === pendingRemovalId);
    if (
      ownerToRemove?.partyType === 'ORGANIZATION' &&
      ownerToRemove.organizationDetails?.organizationName
    ) {
      const removedName =
        ownerToRemove.organizationDetails.organizationName.toLowerCase();
      setCustomOwnershipHierarchies((prev) => {
        const updated = new Map(prev);
        allOwners.forEach((owner) => {
          if (owner.id === pendingRemovalId) return;
          const hierarchy = updated.get(owner.id || '');
          if (
            hierarchy?.steps?.some(
              (step: { entityName?: string }) =>
                step.entityName?.toLowerCase() === removedName
            )
          ) {
            const remainingSteps = hierarchy.steps.filter(
              (step: { entityName?: string }) =>
                step.entityName?.toLowerCase() !== removedName
            );
            updated.set(owner.id || '', {
              ...hierarchy,
              steps: remainingSteps,
            });
          }
        });
        return updated;
      });
    }

    setPendingRemovalId(undefined);
    setCurrentDialog('NONE');
  }, [
    pendingRemovalId,
    onRemoveOwnerProp,
    allOwners,
    setCustomOwnershipHierarchies,
  ]);

  const handleBuildHierarchy = useCallback(
    (ownerId: string) => {
      setCurrentOwnerBeingEdited(ownerId);
      setCurrentDialog('BUILD_CHAIN');
      trackUserEvent({
        actionName: INDIRECT_OWNERSHIP_USER_JOURNEYS.EDIT_OWNER_STARTED,
        metadata: { ownerId },
        userEventsHandler,
      });
    },
    [userEventsHandler]
  );

  const handleEditHierarchy = useCallback(
    (ownerId: string) => {
      setCurrentOwnerBeingEdited(ownerId);
      setCurrentDialog('EDIT_CHAIN');
      trackUserEvent({
        actionName: INDIRECT_OWNERSHIP_USER_JOURNEYS.EDIT_OWNER_STARTED,
        metadata: { ownerId },
        userEventsHandler,
      });
    },
    [userEventsHandler]
  );

  const handleHierarchySaved = useCallback(
    (ownerId: string, hierarchy: any) => {
      // Delegate to host if callback provided (integrated mode)
      if (onSaveHierarchy && hierarchy?.steps) {
        onSaveHierarchy(
          ownerId,
          hierarchy.steps.map(
            (step: {
              entityName: string;
              ownsRootBusinessDirectly: boolean;
              isExistingEntity?: boolean;
              partyId?: string;
            }) => ({
              entityName: step.entityName,
              ownsRootBusinessDirectly: step.ownsRootBusinessDirectly,
              isExistingEntity: step.isExistingEntity,
              partyId: step.partyId,
            })
          )
        );
      }

      // Store hierarchy data locally (for display in both modes)
      setCustomOwnershipHierarchies((prev) =>
        new Map(prev).set(ownerId, hierarchy)
      );

      // Track edit completion
      trackUserEvent({
        actionName: INDIRECT_OWNERSHIP_USER_JOURNEYS.EDIT_OWNER_COMPLETED,
        metadata: { ownerId },
        userEventsHandler,
      });

      handleCloseDialog();
    },
    [handleCloseDialog, userEventsHandler, onSaveHierarchy]
  );

  const handleReorderHierarchy = useCallback(
    (ownerId: string, fromIndex: number, toIndex: number) => {
      setCustomOwnershipHierarchies((prev) => {
        // If the hierarchy isn't in the custom map yet (came from API transform),
        // seed it from the current owner's computed hierarchy so reorder works.
        let existing = prev.get(ownerId);
        if (!existing?.steps) {
          const owner = allOwners.find((o) => o.id === ownerId);
          if (!owner?.ownershipHierarchy?.steps) return prev;
          existing = owner.ownershipHierarchy;
        }

        const steps = [...existing.steps];
        const [moved] = steps.splice(fromIndex, 1);
        steps.splice(toIndex, 0, moved);

        // Reassign ownsRootBusinessDirectly — only the last step connects to root
        const updatedSteps = steps.map((step, i) => ({
          ...step,
          ownsRootBusinessDirectly: i === steps.length - 1,
        }));

        const next = new Map(prev);
        next.set(ownerId, { ...existing, steps: updatedSteps });
        return next;
      });
    },
    [allOwners]
  );

  // Change an owner's nature of ownership (Direct <-> Indirect).
  // Single source of truth: writes natureOfOwnership on the party. When
  // switching to DIRECT, any existing intermediary chain is cleared.
  const handleChangeOwnerNature = useCallback(
    (ownerId: string, nature: 'DIRECT' | 'INDIRECT') => {
      // Clear the chain locally when reverting to direct
      if (nature === 'DIRECT') {
        setCustomOwnershipHierarchies((prev) => {
          if (!prev.has(ownerId)) return prev;
          const next = new Map(prev);
          next.delete(ownerId);
          return next;
        });
        setPendingIndirectOwnerIds((prev) => {
          if (!prev.has(ownerId)) return prev;
          const next = new Set(prev);
          next.delete(ownerId);
          return next;
        });
      } else {
        // Remember the indirect intent so the chain-required prompt shows even
        // before any intermediary chain exists.
        setPendingIndirectOwnerIds((prev) => new Set(prev).add(ownerId));
      }

      // Delegate to host if callback provided (integrated mode)
      if (onChangeOwnerNature) {
        onChangeOwnerNature(ownerId, nature);
        // Indirectness is expressed by building the intermediary chain (the API
        // rejects a persisted 'Indirect' nature on a CLIENT-parented owner), so
        // open the chain builder to let the user add it right away.
        if (nature === 'INDIRECT') {
          setCurrentOwnerBeingEdited(ownerId);
          setCurrentDialog('BUILD_CHAIN');
        }
        return;
      }

      // Standalone/demo mode — update the party's natureOfOwnership locally
      setBeneficialOwnerParties((prev) =>
        prev.map((party) => {
          if (party.id !== ownerId) return party;
          const natureValue = nature === 'INDIRECT' ? 'Indirect' : 'Direct';
          if (party.partyType === 'INDIVIDUAL') {
            return {
              ...party,
              individualDetails: {
                ...party.individualDetails,
                natureOfOwnership: natureValue,
              },
            } as PartyResponse;
          }
          return {
            ...party,
            organizationDetails: {
              ...party.organizationDetails,
              natureOfOwnership: natureValue,
            },
          } as PartyResponse;
        })
      );
    },
    [onChangeOwnerNature, setBeneficialOwnerParties]
  );

  const handleNoBeneficialOwnersChange = (value: boolean) => {
    setNoBeneficialOwnersAttested(value);
    onNoBeneficialOwners?.(value);
  };

  const ownerCardHandlers: OwnerCardHandlers = {
    readOnly,
    controllerPartyId,
    rootCompanyName,
    onEditOwner,
    onBuildHierarchy: handleBuildHierarchy,
    onEditHierarchy: handleEditHierarchy,
    onRemoveOwner: handleRemoveOwner,
    onChangeNature: handleChangeOwnerNature,
    onReorderHierarchy: handleReorderHierarchy,
  };

  // Gating question UI — shown before the full ownership builder
  if (gatingDecision === 'undecided') {
    return (
      <GatingQuestionCard
        className={className}
        testId={testId}
        onAnswer={handleGatingAnswer}
      />
    );
  }

  return (
    <div
      id="indirect-ownership-container"
      className={`eb-component eb-mx-auto eb-w-full eb-max-w-5xl eb-space-y-6 ${className}`}
      data-testid={testId}
    >
      {/* Main Header - Aligned with LinkedAccountWidget pattern */}
      <Card
        role="region"
        aria-labelledby="ownership-title"
        aria-describedby="ownership-description"
      >
        <CardHeader className="eb-border-b eb-bg-muted/30 eb-p-2.5 eb-transition-all eb-duration-300 eb-ease-in-out @md:eb-p-3 @lg:eb-p-4">
          <div className="eb-flex eb-flex-wrap eb-items-center eb-justify-between eb-gap-4">
            <div>
              <CardTitle
                id="ownership-title"
                className="eb-font-header eb-text-lg eb-font-semibold @md:eb-text-xl"
              >
                Who are your beneficial owners?{' '}
                {beneficialOwners.length > 0 && (
                  <span
                    className="eb-animate-fade-in"
                    aria-live="polite"
                    aria-label={`${beneficialOwners.length} beneficial owners added`}
                  >
                    ({beneficialOwners.length} added)
                  </span>
                )}
              </CardTitle>
              <div className="eb-mt-1 eb-flex eb-items-start eb-gap-2">
                <p
                  id="ownership-description"
                  className="eb-text-sm eb-text-muted-foreground"
                >
                  A beneficial owner can be an individual or business entity
                  that owns 25% or more of your business, either directly or
                  through other companies.
                </p>
                <OwnershipCalculationsTooltip />
              </div>
            </div>
            <div
              className="eb-flex eb-items-center eb-gap-2"
              role="toolbar"
              aria-label="Beneficial ownership management actions"
            >
              {!readOnly && (
                <Button
                  data-user-event={
                    INDIRECT_OWNERSHIP_USER_JOURNEYS.ADD_OWNER_STARTED
                  }
                  onClick={handleAddOwner}
                  variant="outline"
                  size="sm"
                  className="eb-shrink-0 eb-bg-background"
                  aria-label="Add new beneficial owner to ownership structure"
                  aria-describedby="ownership-description"
                  disabled={allOwners.length >= 4}
                  title={
                    allOwners.length >= 4
                      ? 'Maximum of 4 owners reached (each owns 25% or more)'
                      : undefined
                  }
                >
                  <Plus
                    className="eb-mr-1.5 eb-h-4 eb-w-4"
                    aria-hidden="true"
                  />
                  Add Beneficial Owner
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="eb-space-y-4 eb-p-2.5 eb-transition-all eb-duration-300 eb-ease-in-out @md:eb-p-3 @lg:eb-p-4">
          {/* Current Ownership Structure */}
          <OwnershipStructureSection
            individualOwners={individualOwners}
            standaloneBusinessOwners={standaloneBusinessOwners}
            chainIntermediaryOwners={chainIntermediaryOwners}
            noBeneficialOwnersAttested={noBeneficialOwnersAttested}
            onAttestChange={handleNoBeneficialOwnersChange}
            handlers={ownerCardHandlers}
          />

          {/* Validation Status */}
          <ValidationStatusSection
            validationSummary={validationSummary}
            noBeneficialOwnersAttested={noBeneficialOwnersAttested}
          />
        </CardContent>
      </Card>

      {/* Add Owner Dialog */}
      <AddOwnerDialog
        isOpen={currentDialog === 'ADD_OWNER'}
        onClose={handleCloseDialog}
        onSubmit={handleOwnerSubmit}
        existingOwners={beneficialOwners}
        allExistingBusinessNames={allExistingBusinessNames}
        existingEntityNames={allExistingEntityNames}
      />

      {/* Hierarchy Building Dialog */}
      <HierarchyBuildingDialog
        isOpen={currentDialog === 'BUILD_CHAIN'}
        onClose={handleCloseDialog}
        ownerId={currentOwnerBeingEdited || ''}
        ownerName={
          currentOwnerBeingEdited
            ? getBeneficialOwnerFullName(
                [...beneficialOwners, ...businessOwners].find(
                  (o) => o.id === currentOwnerBeingEdited
                )!
              )
            : ''
        }
        rootCompanyName={rootCompanyName}
        onSave={handleHierarchySaved}
        beneficialOwners={allOwners}
        existingEntityIdByName={existingEntityIdByName}
      />

      {/* Edit Hierarchy Dialog */}
      <HierarchyBuildingDialog
        isOpen={currentDialog === 'EDIT_CHAIN'}
        onClose={handleCloseDialog}
        ownerId={currentOwnerBeingEdited || ''}
        ownerName={
          currentOwnerBeingEdited
            ? getBeneficialOwnerFullName(
                [...beneficialOwners, ...businessOwners].find(
                  (o) => o.id === currentOwnerBeingEdited
                )!
              )
            : ''
        }
        rootCompanyName={rootCompanyName}
        onSave={handleHierarchySaved}
        existingHierarchy={
          currentOwnerBeingEdited
            ? [...beneficialOwners, ...businessOwners].find(
                (o) => o.id === currentOwnerBeingEdited
              )?.ownershipHierarchy
            : undefined
        }
        isEditMode
        beneficialOwners={allOwners}
        existingEntityIdByName={existingEntityIdByName}
      />

      {/* Confirm Removal Dialog — shown when a business entity is used in another owner's chain */}
      <Dialog
        open={currentDialog === 'CONFIRM_REMOVE'}
        onOpenChange={(open) => {
          if (!open) {
            setPendingRemovalId(undefined);
            setCurrentDialog('NONE');
          }
        }}
      >
        <DialogContent className="eb-max-w-md">
          <DialogHeader>
            <DialogTitle>Remove owner?</DialogTitle>
          </DialogHeader>
          <div className="eb-space-y-3 eb-text-sm eb-text-muted-foreground">
            <p>
              <strong className="eb-text-foreground">
                {pendingRemovalId
                  ? (allOwners.find((o) => o.id === pendingRemovalId)
                      ?.organizationDetails?.organizationName ?? 'This entity')
                  : 'This entity'}
              </strong>{' '}
              is also used as an intermediary in the ownership chain of:
            </p>
            <ul className="eb-list-disc eb-space-y-1 eb-pl-5">
              {pendingRemovalId &&
                getChainUsages(pendingRemovalId).map((name) => (
                  <li key={name} className="eb-font-medium eb-text-foreground">
                    {name}
                  </li>
                ))}
            </ul>
            <p>Removing it will also remove it from their ownership chain.</p>
          </div>
          <DialogFooter className="eb-gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setPendingRemovalId(undefined);
                setCurrentDialog('NONE');
              }}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleConfirmRemoval}>
              Remove anyway
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

/**
 * IndirectOwnership component (relies on global ErrorBoundary in EBComponentsProvider)
 */
export const IndirectOwnership: React.FC<IndirectOwnershipProps> = (props) => {
  return <IndirectOwnershipCore {...props} />;
};

/**
 * Owner Card Component - Displays individual or business owner
 */
interface OwnerCardProps {
  owner: BeneficialOwner;
  index: number;
  readOnly?: boolean;
  controllerPartyId?: string;
  rootCompanyName: string;
  /** True when this entity was created as part of another owner's chain */
  isChainIntermediary?: boolean;
  onBuildHierarchy: (ownerId: string) => void;
  onEditHierarchy: (ownerId: string) => void;
  onEditOwner?: (ownerId: string) => void;
  onRemoveOwner: (ownerId: string) => void;
  onChangeNature?: (ownerId: string, nature: 'DIRECT' | 'INDIRECT') => void;
  onReorderHierarchy?: (
    ownerId: string,
    fromIndex: number,
    toIndex: number
  ) => void;
}

/** True once the owner's Stage-2 required details (DOB/address/ID, or org
 * address/ID) have been collected — ignores auto-defaulted creation fields. */
export function ownerHasCollectedDetails(owner: BeneficialOwner): boolean {
  if (owner.partyType === 'INDIVIDUAL') {
    return !!(
      owner.individualDetails?.birthDate ||
      (owner.individualDetails?.addresses?.length ?? 0) > 0 ||
      (owner.individualDetails?.individualIds?.length ?? 0) > 0
    );
  }
  return (
    (owner.organizationDetails?.addresses?.length ?? 0) > 0 ||
    (owner.organizationDetails?.organizationIds?.length ?? 0) > 0
  );
}

export function getOwnershipTypeAriaLabel(
  isIndirect: boolean,
  isIntermediaryEntity: boolean
): string {
  if (isIndirect) return 'Indirect owner';
  return isIntermediaryEntity ? 'Business owner' : 'Direct owner';
}

/** A single draggable intermediary chip in an owner's chain preview. Extracted
 * so its drag handlers live in their own scope. */
const ChainStepChip: React.FC<{
  step: { id?: string; entityName?: string };
  stepIndex: number;
  ownerId?: string;
  draggable: boolean;
  onReorder?: (ownerId: string, fromIndex: number, toIndex: number) => void;
}> = ({ step, stepIndex, ownerId, draggable, onReorder }) => {
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData('text/plain', String(stepIndex));
    e.dataTransfer.effectAllowed = 'move';
    e.currentTarget.style.opacity = '0.5';
  };
  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.style.opacity = '1';
  };
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    e.currentTarget.style.outline = '2px solid hsl(var(--primary))';
    e.currentTarget.style.outlineOffset = '2px';
  };
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.style.outline = '';
    e.currentTarget.style.outlineOffset = '';
  };
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.style.outline = '';
    e.currentTarget.style.outlineOffset = '';
    const fromIndex = Number(e.dataTransfer.getData('text/plain'));
    if (fromIndex !== stepIndex && ownerId && onReorder) {
      onReorder(ownerId, fromIndex, stepIndex);
    }
  };

  return (
    <>
      <span className="eb-shrink-0 eb-text-muted-foreground">→</span>
      <div
        draggable={draggable}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`eb-flex eb-shrink-0 eb-items-center eb-gap-1 eb-rounded eb-border eb-border-border eb-bg-card eb-px-2 eb-py-1 ${
          draggable ? 'eb-cursor-grab active:eb-cursor-grabbing' : ''
        }`}
      >
        {draggable && (
          <GripVertical className="eb-h-3 eb-w-3 eb-text-muted-foreground/50" />
        )}
        <Building className="eb-h-3 eb-w-3 eb-text-muted-foreground" />
        <span className="eb-font-medium eb-text-foreground">
          {step.entityName}
        </span>
      </div>
    </>
  );
};

const OwnerStatusIcon: React.FC<{ status?: string }> = ({ status }) => {
  if (status === 'COMPLETE') {
    return (
      <CheckCircle2
        className="eb-h-5 eb-w-5 eb-text-success"
        aria-hidden="true"
      />
    );
  }
  if (status === 'PENDING_HIERARCHY' || status === 'PENDING_DETAILS') {
    return (
      <Clock className="eb-h-5 eb-w-5 eb-text-warning" aria-hidden="true" />
    );
  }
  return (
    <AlertTriangle
      className="eb-h-5 eb-w-5 eb-text-destructive"
      aria-hidden="true"
    />
  );
};

const OwnershipTypeBadgeContent: React.FC<{
  isIndirect: boolean;
  isIntermediaryEntity: boolean;
}> = ({ isIndirect, isIntermediaryEntity }) => {
  const icon = isIntermediaryEntity ? (
    <Building className="eb-h-3.5 eb-w-3.5" aria-hidden="true" />
  ) : isIndirect ? (
    <Users className="eb-h-3.5 eb-w-3.5" aria-hidden="true" />
  ) : (
    <UserCheck className="eb-h-3.5 eb-w-3.5" aria-hidden="true" />
  );
  const label = isIndirect
    ? 'Indirect Owner'
    : isIntermediaryEntity
      ? 'Business Owner'
      : 'Direct Owner';
  return (
    <>
      {icon}
      {label}
    </>
  );
};

const OwnerCard: React.FC<OwnerCardProps> = ({
  owner,
  index,
  readOnly,
  controllerPartyId,
  rootCompanyName,
  isChainIntermediary = false,
  onBuildHierarchy,
  onEditHierarchy,
  onEditOwner,
  onRemoveOwner,
  onChangeNature,
  onReorderHierarchy,
}) => {
  const ownerName =
    owner.partyType === 'INDIVIDUAL'
      ? getBeneficialOwnerFullName(owner)
      : owner.organizationDetails?.organizationName || 'Unknown Business';
  const isIntermediaryEntity = owner.partyType === 'ORGANIZATION';

  // Single source of truth: nature is derived directly from the owner data.
  const isIndirect = owner.ownershipType === 'INDIRECT';
  // Whether the indirect owner already has a built ownership chain. Used to
  // distinguish "still needs a chain" from "chain built, details pending" so
  // the badge, action button and chain visualization stay in sync.
  const hasBuiltChain = (owner.ownershipHierarchy?.steps?.length ?? 0) > 0;
  // Whether the party's own required details have been collected — drives the
  // "Add Details" vs "Edit Details" action label.
  const hasDetails = ownerHasCollectedDetails(owner);
  const [showUnlinkConfirm, setShowUnlinkConfirm] = useState(false);

  const handleToggleChange = (checked: boolean) => {
    if (!checked && owner.ownershipHierarchy) {
      // Owner has a chain — confirm before switching to direct
      setShowUnlinkConfirm(true);
      return;
    }
    if (owner.id) {
      onChangeNature?.(owner.id, checked ? 'INDIRECT' : 'DIRECT');
    }
  };

  const confirmUnlink = () => {
    if (owner.id) {
      onChangeNature?.(owner.id, 'DIRECT');
    }
    setShowUnlinkConfirm(false);
  };
  const ownershipTypeAriaLabel = getOwnershipTypeAriaLabel(
    isIndirect,
    isIntermediaryEntity
  );

  const ownerIcon =
    owner.partyType === 'INDIVIDUAL' ? (
      <User className="eb-h-3 eb-w-3 eb-text-primary" />
    ) : (
      <Building className="eb-h-3 eb-w-3 eb-text-primary" />
    );

  return (
    <div
      className="eb-animate-fade-in eb-overflow-hidden eb-rounded-lg eb-border eb-bg-card eb-text-card-foreground eb-shadow-sm eb-transition-shadow"
      style={{
        animationDelay: `${index * 50}ms`,
        animationFillMode: 'backwards',
      }}
      role="listitem"
      aria-labelledby={`owner-${owner.id}-name`}
      aria-describedby={`owner-${owner.id}-status owner-${owner.id}-type`}
    >
      <div className="eb-p-4">
        <div className="eb-space-y-3">
          {/* Row 1: Name + badges + delete */}
          <div className="eb-flex eb-items-start eb-justify-between eb-gap-2">
            <div className="eb-flex eb-flex-wrap eb-items-center eb-gap-2">
              <div className="eb-flex eb-items-center eb-gap-2">
                <OwnerStatusIcon status={owner.status} />
                <span id={`owner-${owner.id}-name`} className="eb-font-medium">
                  {ownerName}
                </span>
              </div>
              {owner.id === controllerPartyId && (
                <Badge
                  variant="outline"
                  className="eb-border-transparent eb-bg-[#EDF4FF] eb-text-xs eb-text-[#355FA1]"
                >
                  Controller
                </Badge>
              )}
              <Badge
                id={`owner-${owner.id}-type`}
                variant={isIndirect ? 'secondary' : 'success'}
                className="eb-inline-flex eb-items-center eb-gap-1 eb-text-xs"
                aria-label={`Ownership type: ${ownershipTypeAriaLabel}`}
              >
                <OwnershipTypeBadgeContent
                  isIndirect={isIndirect}
                  isIntermediaryEntity={isIntermediaryEntity}
                />
              </Badge>
              {owner.status === 'PENDING_DETAILS' && (
                <Badge
                  id={`owner-${owner.id}-status`}
                  variant="warning"
                  className="eb-inline-flex eb-items-center eb-gap-1 eb-text-xs"
                  aria-label="Status: Details required"
                >
                  <AlertTriangle
                    className="eb-h-3.5 eb-w-3.5"
                    aria-hidden="true"
                  />
                  Details Required
                </Badge>
              )}
            </div>

            {/* Row 1 right: Delete button */}
            {!readOnly && (
              <Button
                variant="ghost"
                size="sm"
                className="eb-h-8 eb-w-8 eb-shrink-0 eb-p-0 eb-text-muted-foreground hover:eb-text-destructive"
                style={
                  owner.id === controllerPartyId
                    ? { display: 'none' }
                    : undefined
                }
                data-user-event={
                  INDIRECT_OWNERSHIP_USER_JOURNEYS.REMOVE_OWNER_STARTED
                }
                onClick={() => owner.id && onRemoveOwner(owner.id)}
                aria-label={`Remove ${ownerName} from ownership list`}
              >
                <Trash2 className="eb-h-4 eb-w-4" />
              </Button>
            )}
          </div>

          {/* Row 2: Action buttons */}
          {!readOnly && (
            <div className="eb-flex eb-items-center eb-gap-2">
              {onEditOwner && (
                <Button
                  variant="outline"
                  size="sm"
                  className="eb-h-8 eb-px-3 eb-text-xs"
                  onClick={() => owner.id && onEditOwner(owner.id)}
                  aria-label={`${hasDetails ? 'Edit' : 'Add'} details for ${ownerName}`}
                >
                  <Edit className="eb-mr-1 eb-h-3 eb-w-3" aria-hidden="true" />
                  {hasDetails ? 'Edit Details' : 'Add Details'}
                </Button>
              )}
              {isIndirect && (
                <>
                  {hasBuiltChain && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="eb-h-8 eb-px-3 eb-text-xs"
                      data-user-event={
                        INDIRECT_OWNERSHIP_USER_JOURNEYS.EDIT_OWNER_STARTED
                      }
                      onClick={() => owner.id && onEditHierarchy(owner.id)}
                      aria-label={`Edit ownership hierarchy for ${ownerName}`}
                    >
                      <Edit
                        className="eb-mr-1 eb-h-3 eb-w-3"
                        aria-hidden="true"
                      />
                      Edit Chain
                    </Button>
                  )}
                </>
              )}
              {/* Indirect owner toggle — only for independent owners, not
                  for entities created as part of another owner's chain. */}
              {!isChainIntermediary && (
                <div className="eb-ml-auto eb-flex eb-items-center eb-gap-2">
                  <Label
                    htmlFor={`indirect-toggle-${owner.id}`}
                    className="eb-text-xs eb-text-muted-foreground"
                  >
                    Indirect owner
                  </Label>
                  <Switch
                    id={`indirect-toggle-${owner.id}`}
                    checked={isIndirect}
                    onCheckedChange={handleToggleChange}
                    aria-label="Toggle indirect ownership"
                  />
                </div>
              )}
            </div>
          )}

          {/* Unlink confirmation dialog */}
          <Dialog open={showUnlinkConfirm} onOpenChange={setShowUnlinkConfirm}>
            <DialogContent className="eb-max-w-md eb-p-0">
              <DialogHeader className="eb-border-b eb-p-6 eb-pb-4">
                <DialogTitle className="eb-font-header eb-text-lg eb-font-semibold">
                  Remove ownership chain?
                </DialogTitle>
              </DialogHeader>
              <div className="eb-px-6 eb-py-4">
                <p className="eb-text-sm eb-text-muted-foreground">
                  Switching{' '}
                  <span className="eb-font-medium eb-text-foreground">
                    {ownerName}
                  </span>{' '}
                  to a direct owner will remove their intermediary ownership
                  chain. This action cannot be undone.
                </p>
              </div>
              <DialogFooter className="eb-border-t eb-px-6 eb-py-4">
                <Button
                  variant="outline"
                  onClick={() => setShowUnlinkConfirm(false)}
                >
                  Keep as indirect
                </Button>
                <Button variant="destructive" onClick={confirmUnlink}>
                  Remove chain
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Pending chain placeholder — shown when indirect is enabled but no chain built yet */}
        {isIndirect && !hasBuiltChain && (
          <div className="eb-mt-3 eb-border-t eb-pt-3">
            <div className="eb-mb-2 eb-flex eb-items-center eb-gap-1.5 eb-text-xs eb-font-medium eb-text-foreground">
              <AlertTriangle
                className="eb-h-3.5 eb-w-3.5 eb-text-warning"
                aria-hidden="true"
              />
              <span>Ownership Chain</span>
              <span className="eb-font-semibold eb-text-warning">
                (Pending)
              </span>
              <span className="eb-sr-only">
                — action required: ownership chain has not been defined yet
              </span>
            </div>
            <div
              className="eb-flex eb-flex-wrap eb-items-center eb-gap-2 eb-rounded eb-border eb-border-warning/50 eb-bg-warning/5 eb-p-3 eb-text-sm"
              role="status"
              aria-label="Ownership chain not yet built"
            >
              <div className="eb-flex eb-shrink-0 eb-items-center eb-gap-1 eb-rounded eb-border eb-border-warning/30 eb-bg-warning/10 eb-px-2 eb-py-1">
                {ownerIcon}
                <span className="eb-font-medium eb-text-foreground">
                  {ownerName}
                </span>
              </div>
              <span className="eb-text-warning">→</span>
              {!readOnly ? (
                <Button
                  variant="outline"
                  size="sm"
                  className="eb-h-auto eb-shrink-0 eb-border-warning/50 eb-px-2 eb-py-1 eb-text-xs eb-font-medium eb-text-warning hover:eb-bg-warning/10"
                  onClick={() => owner.id && onBuildHierarchy(owner.id)}
                  aria-label={`Add intermediary owner for ${ownerName}`}
                >
                  <Plus className="eb-mr-1 eb-h-3 eb-w-3" aria-hidden="true" />
                  Add intermediary owner
                </Button>
              ) : (
                <div className="eb-flex eb-shrink-0 eb-items-center eb-gap-1 eb-rounded eb-border eb-border-dashed eb-border-warning/50 eb-bg-warning/5 eb-px-2 eb-py-1">
                  <AlertTriangle className="eb-h-3 eb-w-3 eb-text-warning" />
                  <span className="eb-text-xs eb-font-medium eb-text-warning">
                    Not defined
                  </span>
                </div>
              )}
              <span className="eb-text-warning">→</span>
              <div className="eb-flex eb-shrink-0 eb-items-center eb-gap-1 eb-rounded eb-border eb-border-warning/30 eb-bg-warning/10 eb-px-2 eb-py-1">
                <Building className="eb-h-3 eb-w-3 eb-text-warning" />
                <span className="eb-font-medium eb-text-warning">
                  {rootCompanyName}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Hierarchy visualization for indirect owners once a chain has been
            built. Shown even while details are still pending so the user can
            see the chain (and any newly added intermediary businesses). */}
        {hasBuiltChain && (
          <div className="eb-mt-3 eb-border-t eb-pt-3">
            <div className="eb-mb-2 eb-text-xs eb-text-muted-foreground">
              Ownership Chain:
            </div>
            <div className="eb-flex eb-flex-wrap eb-items-center eb-gap-2 eb-rounded eb-border eb-bg-muted eb-p-2 eb-text-sm">
              {/* Owner at the start (fixed) */}
              <div className="eb-flex eb-shrink-0 eb-items-center eb-gap-1 eb-rounded eb-border eb-border-primary/20 eb-bg-primary/10 eb-px-2 eb-py-1">
                {ownerIcon}
                <span className="eb-font-medium eb-text-foreground">
                  {ownerName}
                </span>
              </div>

              {/* Intermediary companies (draggable) */}
              {owner.ownershipHierarchy?.steps.map((step, stepIndex) => (
                <ChainStepChip
                  key={step.id}
                  step={step}
                  stepIndex={stepIndex}
                  ownerId={owner.id}
                  draggable={
                    !readOnly && owner.ownershipHierarchy!.steps.length > 1
                  }
                  onReorder={onReorderHierarchy}
                />
              ))}

              {/* Root business at the end (fixed) */}
              <span className="eb-shrink-0 eb-text-muted-foreground">→</span>
              <div className="eb-flex eb-shrink-0 eb-items-center eb-gap-1 eb-rounded eb-border eb-border-success eb-bg-success-accent eb-px-2 eb-py-1">
                <Building className="eb-h-3 eb-w-3 eb-text-success" />
                <span className="eb-font-medium eb-text-success">
                  {rootCompanyName}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Simple Add Owner Dialog Component
 */
interface AddOwnerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    entityType: 'INDIVIDUAL' | 'BUSINESS';
    firstName?: string;
    lastName?: string;
    businessName?: string;
    ownershipType: 'DIRECT' | 'INDIRECT';
    isExistingEntity?: boolean;
    intermediaryCompany?: string;
  }) => void;
  existingOwners: BeneficialOwner[];
  allExistingBusinessNames: Set<string>;
  /** All known entity names for the combobox dropdown */
  existingEntityNames: string[];
}

const AddOwnerDialog: React.FC<AddOwnerDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  existingOwners,
  allExistingBusinessNames,
  existingEntityNames,
}) => {
  const [entityType, setEntityType] = useState<'INDIVIDUAL' | 'BUSINESS'>(
    'INDIVIDUAL'
  );
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [ownershipType, setOwnershipType] = useState<'DIRECT' | 'INDIRECT'>(
    'DIRECT'
  );
  const [intermediaryCompany, setIntermediaryCompany] = useState('');
  const [errors, setErrors] = useState<string[]>([]);

  // Track whether selected business is an existing entity (to skip duplicate error)
  const isExistingEntitySelected = existingEntityNames.some(
    (name) => name.toLowerCase() === businessName.trim().toLowerCase()
  );

  // Clear errors when switching entity type
  const handleEntityTypeChange = (value: 'INDIVIDUAL' | 'BUSINESS') => {
    setEntityType(value);
    setErrors([]);
  };

  // Clear errors when switching ownership type
  const handleOwnershipTypeChange = (value: 'DIRECT' | 'INDIRECT') => {
    setOwnershipType(value);
    setErrors([]);
    if (value === 'DIRECT') {
      setIntermediaryCompany('');
    }
  };

  const resetForm = () => {
    setEntityType('INDIVIDUAL');
    setFirstName('');
    setLastName('');
    setBusinessName('');
    setOwnershipType('DIRECT');
    setIntermediaryCompany('');
    setErrors([]);
  };

  // Collects the field/duplicate validation errors for the current form state.
  const collectValidationErrors = (): string[] => {
    const newErrors: string[] = [];

    if (entityType === 'INDIVIDUAL') {
      if (!firstName.trim()) {
        newErrors.push('First name is required');
      }
      if (!lastName.trim()) {
        newErrors.push('Last name is required');
      }
      const fullName = `${firstName.trim()} ${lastName.trim()}`;
      const isDuplicate = existingOwners.some(
        (owner) =>
          owner.partyType === 'INDIVIDUAL' &&
          getBeneficialOwnerFullName(owner).toLowerCase() ===
            fullName.toLowerCase()
      );
      if (isDuplicate) {
        newErrors.push('Owner with this name already exists');
      }
      return newErrors;
    }

    if (!businessName.trim()) {
      newErrors.push('Business name is required');
      return newErrors;
    }

    // Only check for duplicates if the user typed a new name (not one selected
    // from the existing-entity combobox).
    if (
      !isExistingEntitySelected &&
      allExistingBusinessNames.has(businessName.trim().toLowerCase())
    ) {
      newErrors.push(
        'Business entity with this name already exists in the ownership structure'
      );
    }
    return newErrors;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors = collectValidationErrors();
    if (newErrors.length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit({
      entityType,
      firstName: entityType === 'INDIVIDUAL' ? firstName.trim() : undefined,
      lastName: entityType === 'INDIVIDUAL' ? lastName.trim() : undefined,
      businessName: entityType === 'BUSINESS' ? businessName.trim() : undefined,
      ownershipType,
      isExistingEntity: entityType === 'BUSINESS' && isExistingEntitySelected,
      intermediaryCompany:
        entityType === 'INDIVIDUAL' && ownershipType === 'INDIRECT'
          ? intermediaryCompany.trim()
          : undefined,
    });

    resetForm();
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="eb-flex eb-max-h-[90vh] eb-max-w-md eb-flex-col eb-p-0">
        <DialogHeader className="eb-border-b eb-p-6 eb-pb-4">
          <DialogTitle className="eb-font-header eb-text-lg eb-font-semibold">
            Add Owner
          </DialogTitle>
        </DialogHeader>

        <div className="eb-flex-1 eb-overflow-y-auto eb-px-6 eb-py-4">
          <div className="eb-space-y-5">
            {errors.length > 0 && (
              <Alert className="eb-border-destructive eb-bg-destructive-accent">
                <AlertTriangle className="eb-h-4 eb-w-4 eb-text-destructive" />
                <AlertDescription>
                  <div className="eb-space-y-1">
                    {errors.map((error, index) => (
                      <div key={index} className="eb-text-destructive">
                        {error}
                      </div>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="eb-space-y-5">
              {/* Owner type tabs */}
              <Tabs
                value={entityType}
                onValueChange={(value) =>
                  handleEntityTypeChange(value as 'INDIVIDUAL' | 'BUSINESS')
                }
              >
                <TabsList className="eb-grid eb-w-full eb-grid-cols-2">
                  <TabsTrigger value="INDIVIDUAL">Individual</TabsTrigger>
                  <TabsTrigger value="BUSINESS">Business</TabsTrigger>
                </TabsList>
              </Tabs>

              {/* Name / Details */}
              {entityType === 'INDIVIDUAL' ? (
                <>
                  <div className="eb-space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="John"
                      className="eb-h-10"
                    />
                  </div>

                  <div className="eb-space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Smith"
                      className="eb-h-10"
                    />
                  </div>
                </>
              ) : (
                <div className="eb-space-y-2">
                  <Label htmlFor="businessName">Business Name</Label>
                  <Input
                    id="businessName"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="ABC Corporation"
                    className="eb-h-10"
                  />
                  <p className="eb-text-xs eb-text-muted-foreground">
                    Enter the name exactly as it appears on registration
                    documents
                  </p>
                </div>
              )}

              {/* Indirect ownership checkbox */}
              <div className="eb-flex eb-items-start eb-space-x-2 eb-rounded-md eb-border eb-p-3">
                <Checkbox
                  id="indirect-ownership"
                  checked={ownershipType === 'INDIRECT'}
                  onCheckedChange={(checked) =>
                    handleOwnershipTypeChange(checked ? 'INDIRECT' : 'DIRECT')
                  }
                  className="eb-mt-0.5"
                />
                <Label
                  htmlFor="indirect-ownership"
                  className="eb-cursor-pointer eb-text-sm eb-leading-snug"
                >
                  This owner holds their ownership through another company
                  (indirect)
                </Label>
              </div>
            </form>
          </div>
        </div>

        <DialogFooter className="eb-border-t eb-px-6 eb-py-4">
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" onClick={handleSubmit}>
            Add Owner
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Hierarchy Building Dialog Component
interface HierarchyBuildingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  ownerId: string;
  ownerName: string;
  rootCompanyName: string;
  onSave: (ownerId: string, hierarchy: any) => void;
  existingHierarchy?: any;
  isEditMode?: boolean;
  beneficialOwners: BeneficialOwner[];
  /** Lowercased organization name → stable party id, for carrying the selected
   * existing entity's id through the chain instead of matching by name. */
  existingEntityIdByName: Map<string, string>;
}

const HierarchyBuildingDialog: React.FC<HierarchyBuildingDialogProps> = ({
  isOpen,
  onClose,
  ownerId,
  ownerName,
  rootCompanyName,
  onSave,
  existingHierarchy,
  isEditMode = false,
  beneficialOwners,
  existingEntityIdByName,
}) => {
  // Get existing entities from all ownership hierarchies
  const allExistingEntities = useExistingEntities(beneficialOwners) as string[];
  const [hierarchySteps, setHierarchySteps] = useState<
    Array<{
      id: string;
      entityName: string;
      hasOwnership: boolean;
      ownsRootBusinessDirectly: boolean;
      level: number;
      isExistingEntity?: boolean;
      partyId?: string;
    }>
  >([]);
  // After adding at least one entity, ask if there are more intermediaries
  const [showAddMore, setShowAddMore] = useState<boolean>(true);

  // Combine existing entities (from saved hierarchies) with current chain for autocomplete
  const existingEntities = React.useMemo(() => {
    const currentChainEntities = hierarchySteps.map((step) =>
      step.entityName.trim()
    );

    const allEntities = [...allExistingEntities, ...currentChainEntities];
    const uniqueEntities = Array.from(
      new Map(
        allEntities.map((entity) => [entity.toLowerCase(), entity])
      ).values()
    );

    // Filter out root company name and the owner's own name (can't be your own intermediary)
    return uniqueEntities.filter(
      (entity) =>
        entity.toLowerCase() !== rootCompanyName.toLowerCase() &&
        entity.toLowerCase() !== ownerName.toLowerCase()
    );
  }, [allExistingEntities, hierarchySteps, rootCompanyName, ownerName]);
  const [currentCompanyName, setCurrentCompanyName] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const knownRelationships = React.useMemo(
    () => extractOwnershipRelationships(beneficialOwners),
    [beneficialOwners]
  );

  const relationshipConflictHint = React.useMemo(() => {
    const normalizedCompanyName = currentCompanyName.trim();

    if (!normalizedCompanyName || hierarchySteps.length === 0) {
      return null;
    }

    const previousStep = hierarchySteps[hierarchySteps.length - 1];
    return getRelationshipConflictError(
      previousStep.entityName,
      normalizedCompanyName,
      knownRelationships
    );
  }, [currentCompanyName, hierarchySteps, knownRelationships]);

  // Pre-populate existing hierarchy data in edit mode
  React.useEffect(() => {
    if (isOpen && isEditMode && existingHierarchy) {
      setHierarchySteps(existingHierarchy.steps || []);
      setShowAddMore(true);
    } else if (isOpen && !isEditMode) {
      setHierarchySteps([]);
      setShowAddMore(true);
    }
  }, [isOpen, isEditMode, existingHierarchy]);

  const handleAddCompany = (nameArg?: string) => {
    const normalizedCompanyName = (nameArg ?? currentCompanyName).trim();
    if (!normalizedCompanyName) {
      setErrors(['Company name is required']);
      return;
    }

    // Max 10 intermediaries per beneficial owner (spec rule)
    if (hierarchySteps.length >= 10) {
      setErrors([
        'Maximum of 10 intermediary entities per beneficial owner reached',
      ]);
      return;
    }

    // Prevent duplicates within this chain
    const isDuplicateInChain = hierarchySteps.some(
      (step) =>
        step.entityName.toLowerCase() === normalizedCompanyName.toLowerCase()
    );
    if (isDuplicateInChain) {
      setErrors(['This company is already in the ownership chain']);
      return;
    }

    // Prevent adding the owner itself as its own intermediary
    if (normalizedCompanyName.toLowerCase() === ownerName.toLowerCase()) {
      setErrors([
        'An owner cannot be an intermediary in its own ownership chain',
      ]);
      return;
    }

    // Prevent adding the root company as an intermediary
    if (normalizedCompanyName.toLowerCase() === rootCompanyName.toLowerCase()) {
      setErrors([
        `${rootCompanyName} is the business being onboarded and cannot be an intermediary`,
      ]);
      return;
    }

    // Prevent impossible chain structures (known conflicting relationships)
    if (hierarchySteps.length > 0) {
      const previousStep = hierarchySteps[hierarchySteps.length - 1];
      const conflictError = getRelationshipConflictError(
        previousStep.entityName,
        normalizedCompanyName,
        knownRelationships
      );
      if (conflictError) {
        setErrors([conflictError]);
        return;
      }
    }

    setHierarchySteps((prev) => [
      ...prev,
      {
        id: `step-${Date.now()}`,
        entityName: normalizedCompanyName,
        hasOwnership: true,
        ownsRootBusinessDirectly: false,
        level: prev.length + 1,
        // Reuse an existing party when the user picked one from the list;
        // only genuinely new names create a new intermediary party.
        isExistingEntity: existingEntities.some(
          (entity) =>
            entity.trim().toLowerCase() === normalizedCompanyName.toLowerCase()
        ),
        // Carry the selected party's stable id so the host reuses that exact
        // party rather than re-matching by name.
        partyId: existingEntityIdByName.get(
          normalizedCompanyName.toLowerCase()
        ),
      },
    ]);
    setCurrentCompanyName('');
    setErrors([]);
    // After adding, ask if there are more intermediaries
    setShowAddMore(false);
  };

  // Save the whole chain. Includes a company that was typed but not yet added
  // via "Add to chain", so nothing the user entered is lost. The last entity in
  // the chain is the one that owns the business being onboarded directly.
  const handleSaveChain = () => {
    const pending = currentCompanyName.trim();
    const pendingIsNew =
      !!pending &&
      !hierarchySteps.some(
        (step) => step.entityName.toLowerCase() === pending.toLowerCase()
      );

    const combinedSteps = pendingIsNew
      ? [
          ...hierarchySteps,
          {
            id: `step-${Date.now()}`,
            entityName: pending,
            hasOwnership: true,
            ownsRootBusinessDirectly: false,
            level: hierarchySteps.length + 1,
            isExistingEntity: existingEntities.some(
              (entity) => entity.trim().toLowerCase() === pending.toLowerCase()
            ),
            partyId: existingEntityIdByName.get(pending.toLowerCase()),
          },
        ]
      : hierarchySteps;

    if (combinedSteps.length === 0) {
      setErrors(['Add at least one company to the ownership chain']);
      return;
    }

    // The last entity in the chain connects directly to the business.
    const steps = combinedSteps.map((step, index) => ({
      ...step,
      ownsRootBusinessDirectly: index === combinedSteps.length - 1,
    }));

    onSave(ownerId, {
      id: `hierarchy-${ownerId}`,
      steps,
      isValid: true,
      meets25PercentThreshold: true,
      validationErrors: [],
    });
    handleClose();
  };

  const handleRemoveCompany = (indexToRemove: number) => {
    const stepToRemove = hierarchySteps[indexToRemove];
    const newSteps = hierarchySteps.filter((_, i) => i !== indexToRemove);

    // If removing the last step and it was the direct owner,
    // we need to handle the direct ownership assignment
    if (stepToRemove.ownsRootBusinessDirectly && newSteps.length > 0) {
      // Automatically make the new last company the direct owner
      const updatedSteps = newSteps.map((step, index) => ({
        ...step,
        ownsRootBusinessDirectly: index === newSteps.length - 1,
        // Recalculate levels after removal
        level: index + 1,
      }));
      setHierarchySteps(updatedSteps);
    } else {
      // For non-direct owners or when removing results in empty chain,
      // just remove and recalculate levels
      const updatedSteps = newSteps.map((step, index) => ({
        ...step,
        level: index + 1,
      }));
      setHierarchySteps(updatedSteps);
    }
  };

  const handleClose = () => {
    setHierarchySteps([]);
    setCurrentCompanyName('');
    setErrors([]);
    setShowAddMore(true);
    onClose();
  };

  const renderChainPreview = () => {
    if (hierarchySteps.length === 0) return null;

    return (
      <div className="eb-rounded-lg eb-border eb-bg-muted eb-p-4">
        <div className="eb-mb-3 eb-text-sm eb-font-semibold eb-text-foreground">
          Current Chain:
        </div>
        <div className="eb-flex eb-flex-wrap eb-items-center eb-gap-2 eb-text-sm">
          {/* Owner at start */}
          <div className="eb-flex eb-items-center eb-gap-2 eb-rounded-lg eb-border eb-border-primary/20 eb-bg-primary/10 eb-px-3 eb-py-2 eb-shadow-sm">
            <User className="eb-h-4 eb-w-4 eb-text-primary" />
            <span className="eb-font-semibold eb-text-foreground">
              {ownerName}
            </span>
          </div>

          {/* Company chain */}
          {hierarchySteps.map((step) => (
            <React.Fragment key={step.id}>
              <span className="eb-text-lg eb-font-bold eb-text-muted-foreground">
                →
              </span>
              <div className="eb-flex eb-items-center eb-gap-2 eb-rounded-lg eb-border eb-bg-card eb-px-3 eb-py-2 eb-shadow-sm">
                <Building className="eb-h-4 eb-w-4 eb-text-muted-foreground" />
                <span className="eb-font-semibold eb-text-foreground">
                  {step.entityName}
                </span>
              </div>
            </React.Fragment>
          ))}

          {/* Next step indicator */}
          <span className="eb-text-lg eb-font-bold eb-text-muted-foreground">
            →
          </span>
          <div className="eb-flex eb-items-center eb-gap-2 eb-rounded-lg eb-border eb-border-dashed eb-border-success eb-bg-success-accent eb-px-3 eb-py-2 eb-shadow-sm">
            <Building className="eb-h-4 eb-w-4 eb-text-success" />
            <span className="eb-font-semibold eb-text-success">
              {rootCompanyName}
            </span>
          </div>
        </div>
      </div>
    );
  };

  const getInstructionText = () => {
    if (hierarchySteps.length === 0) {
      return `Select or enter the intermediary company for ${ownerName}`;
    }
    return `Select or enter the next intermediary company for ${rootCompanyName}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="eb-flex eb-max-h-[90vh] eb-max-w-2xl eb-flex-col eb-p-0">
        <DialogHeader className="eb-px-6 eb-pb-4 eb-pt-6">
          <DialogTitle className="eb-font-header eb-text-lg eb-font-semibold">
            {isEditMode ? 'Edit' : 'Build'} Ownership Chain for {ownerName}
          </DialogTitle>
        </DialogHeader>

        <div className="eb-flex-1 eb-space-y-6 eb-overflow-y-auto eb-px-6 eb-pb-6">
          <div className="eb-text-sm eb-leading-relaxed eb-text-muted-foreground">
            {isEditMode ? (
              <>
                Edit the ownership chain from{' '}
                <span className="eb-font-medium eb-text-foreground">
                  {ownerName}
                </span>{' '}
                to{' '}
                <span className="eb-font-medium eb-text-foreground">
                  {rootCompanyName}
                </span>
                .
              </>
            ) : (
              <>
                Add each intermediary company between{' '}
                <span className="eb-font-medium eb-text-foreground">
                  {ownerName}
                </span>{' '}
                and{' '}
                <span className="eb-font-medium eb-text-foreground">
                  {rootCompanyName}
                </span>
                , starting from the company closest to the owner.
              </>
            )}
          </div>

          {/* Chain Preview */}
          {renderChainPreview()}

          {/* Edit Mode: Existing Steps Management */}
          {isEditMode && hierarchySteps.length > 0 && (
            <div className="eb-space-y-4">
              <div className="eb-text-sm eb-font-medium eb-text-foreground">
                Current Steps (click to remove):
              </div>
              <div className="eb-space-y-2">
                {hierarchySteps.map((step, index) => (
                  <div
                    key={step.id}
                    className="eb-flex eb-items-center eb-justify-between eb-rounded-lg eb-border eb-bg-card eb-p-3 eb-shadow-sm"
                  >
                    <div className="eb-flex eb-items-center eb-gap-3">
                      <span className="eb-text-sm eb-font-medium eb-text-muted-foreground">
                        Step {index + 1}:
                      </span>
                      <div className="eb-flex eb-items-center eb-gap-2">
                        <Building className="eb-h-4 eb-w-4 eb-text-muted-foreground" />
                        <span className="eb-font-medium">
                          {step.entityName}
                        </span>
                        <Badge variant="secondary" className="eb-text-xs">
                          Intermediary
                        </Badge>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleRemoveCompany(index)}
                      size="sm"
                      variant="outline"
                      className="eb-text-destructive hover:eb-bg-destructive/5"
                    >
                      <Trash2 className="eb-h-3 eb-w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Company Input Form — shown when user indicates more intermediaries */}
          {(showAddMore || hierarchySteps.length === 0) && (
            <div className="eb-space-y-5 eb-rounded-lg eb-border eb-border-primary/20 eb-bg-primary/5 eb-p-5">
              <div className="eb-text-sm eb-font-medium eb-text-foreground">
                {getInstructionText()}
              </div>

              <div className="eb-space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <EntityCombobox
                  id="companyName"
                  value={currentCompanyName}
                  onChange={setCurrentCompanyName}
                  onSelect={(name) => handleAddCompany(name)}
                  existingEntities={existingEntities}
                  placeholder="Enter company name"
                  className="eb-h-10"
                />
                {relationshipConflictHint && (
                  <div className="eb-flex eb-items-start eb-gap-2 eb-rounded-md eb-border eb-border-warning eb-bg-warning-accent eb-p-2 eb-text-xs eb-text-warning-foreground">
                    <AlertTriangle className="eb-mt-0.5 eb-h-3 eb-w-3 eb-shrink-0" />
                    <span>{relationshipConflictHint}</span>
                  </div>
                )}
              </div>

              <Button
                onClick={() => handleAddCompany()}
                disabled={
                  !currentCompanyName.trim() || !!relationshipConflictHint
                }
                variant="outline"
                className="eb-h-10 eb-w-full eb-border-primary eb-font-medium eb-text-primary hover:eb-bg-primary/5"
              >
                <Plus className="eb-mr-1 eb-h-4 eb-w-4" aria-hidden="true" />
                Add to chain
              </Button>
            </div>
          )}

          {/* Intermediary confirmation — shown after adding at least one entity */}
          {!showAddMore && hierarchySteps.length > 0 && (
            <div className="eb-space-y-4 eb-rounded-lg eb-border eb-border-border eb-bg-card eb-p-5">
              <div className="eb-text-sm eb-font-medium eb-text-foreground">
                Is this the complete ownership chain for{' '}
                <span className="eb-font-semibold">{rootCompanyName}</span>?
              </div>
              <div className="eb-flex eb-gap-3">
                <Button
                  variant="outline"
                  className="eb-flex-1"
                  onClick={() => setShowAddMore(true)}
                >
                  <Plus className="eb-mr-1 eb-h-4 eb-w-4" aria-hidden="true" />
                  No, add another
                </Button>
                <Button
                  variant="default"
                  className="eb-flex-1"
                  onClick={handleSaveChain}
                >
                  Yes, save and complete
                </Button>
              </div>
            </div>
          )}

          {/* Error Messages */}
          {errors.length > 0 && (
            <div className="eb-rounded-lg eb-border eb-border-destructive eb-bg-destructive-accent eb-p-4">
              <div className="eb-space-y-1 eb-text-sm eb-text-destructive">
                {errors.map((error, index) => (
                  <div key={index} className="eb-flex eb-items-center eb-gap-2">
                    <AlertTriangle className="eb-h-3 eb-w-3 eb-shrink-0 eb-text-destructive" />
                    <span>{error}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer only in edit mode (save changes) — in build mode the
            inline confirmation buttons handle save, and the X / click-outside
            handles cancel. */}
        {isEditMode && (
          <DialogFooter className="eb-space-x-2 eb-border-t eb-px-6 eb-py-4">
            <Button
              variant="outline"
              onClick={handleClose}
              className="eb-font-medium"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveChain}
              disabled={
                hierarchySteps.length === 0 && !currentCompanyName.trim()
              }
              className="eb-font-medium"
            >
              Save changes
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};
