'use client';

import React, { useCallback, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Building,
  Check,
  CheckCircle2,
  Clock,
  Edit,
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

import { EntityCombobox } from './components/EntityCombobox';
import { OwnershipCalculationsTooltip } from './components/OwnershipCalculationsTooltip';
import { useExistingEntities } from './hooks/useExistingEntities';
import { INDIRECT_OWNERSHIP_USER_JOURNEYS } from './IndirectOwnership.constants';
import type {
  BeneficialOwner,
  IndirectOwnershipProps,
  ValidationSummary,
} from './IndirectOwnership.types';
import { getEntityOwnershipInfo } from './utils/hierarchyIntegrity';
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
const IndirectOwnershipCore: React.FC<IndirectOwnershipProps> = ({
  userEventsHandler,
  userEventsLifecycle,
  client,
  onOwnershipComplete,
  readOnly = false,
  className = '',
  testId = 'indirect-ownership',
}) => {
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
    client?.parties?.filter((party) =>
      party.roles?.includes('BENEFICIAL_OWNER')
    ) || [];

  // State management - Use PartyResponse as source of truth
  const [beneficialOwnerParties, setBeneficialOwnerParties] =
    useState<PartyResponse[]>(initialParties);
  // Store custom hierarchies for parties where user manually built/edited them
  const [customOwnershipHierarchies, setCustomOwnershipHierarchies] = useState<
    Map<string, any>
  >(new Map());
  // Track pending owner removals for completion tracking
  const pendingRemovalsRef = React.useRef<Set<string>>(new Set());

  // Computed view - Transform PartyResponse[] to BeneficialOwner[] on demand
  // For existing OpenAPI data, hierarchies are auto-derived from parentPartyId
  // For new owners, use custom hierarchies from user interaction
  const beneficialOwners = useMemo(
    () =>
      beneficialOwnerParties.map((party) => {
        const customHierarchy = customOwnershipHierarchies.get(party.id || '');
        return transformPartyToBeneficialOwner(
          party,
          client?.parties || [],
          customHierarchy
        );
      }),
    [beneficialOwnerParties, client?.parties, customOwnershipHierarchies]
  );

  // Separate individuals and businesses
  const individualOwners = useMemo(
    () => beneficialOwners.filter((owner) => owner.partyType === 'INDIVIDUAL'),
    [beneficialOwners]
  );

  const businessOwners = useMemo(
    () =>
      beneficialOwners.filter((owner) => owner.partyType === 'ORGANIZATION'),
    [beneficialOwners]
  );

  // Get all business names from owners and their hierarchies
  const allExistingBusinessNames = useMemo(() => {
    const businessNames = new Set<string>();

    beneficialOwners.forEach((owner) => {
      // Add business entity owners
      if (
        owner.partyType === 'ORGANIZATION' &&
        owner.organizationDetails?.organizationName
      ) {
        businessNames.add(
          owner.organizationDetails.organizationName.toLowerCase()
        );
      }

      // Add all companies from ownership hierarchies
      if (owner.ownershipHierarchy?.steps) {
        owner.ownershipHierarchy.steps.forEach((step) => {
          if (step.entityName) {
            businessNames.add(step.entityName.toLowerCase());
          }
        });
      }
    });

    return businessNames;
  }, [beneficialOwners]);

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

    // Check which pending removals have been completed
    const currentOwnerIds = new Set(
      beneficialOwnerParties
        .map((party) => party.id)
        .filter(Boolean) as string[]
    );

    const completedRemovals: string[] = [];
    pendingRemovalsRef.current.forEach((ownerId) => {
      if (!currentOwnerIds.has(ownerId)) {
        completedRemovals.push(ownerId);
      }
    });

    // Track completion for each removed owner
    completedRemovals.forEach((ownerId) => {
      trackUserEvent({
        actionName: INDIRECT_OWNERSHIP_USER_JOURNEYS.REMOVE_OWNER_COMPLETED,
        metadata: { ownerId },
        userEventsHandler,
      });
      pendingRemovalsRef.current.delete(ownerId);
    });
  }, [beneficialOwnerParties, userEventsHandler]);
  const [currentDialog, setCurrentDialog] = useState<
    'NONE' | 'ADD_OWNER' | 'BUILD_CHAIN' | 'EDIT_CHAIN' | 'CONFIRM_CHAIN'
  >('NONE');
  const [currentOwnerBeingEdited, setCurrentOwnerBeingEdited] = useState<
    string | undefined
  >();

  // Calculate validation summary
  const validationSummary: ValidationSummary = {
    totalOwners: beneficialOwners.length,
    completeOwners: beneficialOwners.filter(
      (owner) => owner.status === 'COMPLETE'
    ).length,
    pendingHierarchies: beneficialOwners.filter(
      (owner) => owner.status === 'PENDING_HIERARCHY'
    ).length,
    ownersWithErrors: beneficialOwners.filter(
      (owner) => owner.status === 'ERROR'
    ).length,
    hasErrors: beneficialOwners.some((owner) => owner.status === 'ERROR'),
    errors: beneficialOwners.flatMap((owner) => owner.validationErrors || []),
    warnings: [],
    canComplete:
      beneficialOwners.length > 0 &&
      beneficialOwners.every((owner) => owner.status === 'COMPLETE'),
    completionPercentage:
      beneficialOwners.length === 0
        ? 0
        : Math.round(
            (beneficialOwners.filter((owner) => owner.status === 'COMPLETE')
              .length /
              beneficialOwners.length) *
              100
          ),
  };

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

  const handleOwnerSubmit = useCallback(
    (ownerData: {
      entityType: 'INDIVIDUAL' | 'BUSINESS';
      firstName?: string;
      lastName?: string;
      businessName?: string;
      ownershipType: 'DIRECT' | 'INDIRECT';
    }) => {
      const newParty: PartyResponse =
        ownerData.entityType === 'INDIVIDUAL'
          ? {
              id: `owner-${Date.now()}`,
              partyType: 'INDIVIDUAL',
              active: true,
              roles: ['BENEFICIAL_OWNER'],
              parentPartyId:
                ownerData.ownershipType === 'INDIRECT'
                  ? 'temp-parent'
                  : undefined,
              individualDetails: {
                firstName: ownerData.firstName!,
                lastName: ownerData.lastName!,
              },
              createdAt: new Date().toISOString(),
            }
          : {
              id: `business-${Date.now()}`,
              partyType: 'ORGANIZATION',
              active: true,
              roles: [],
              parentPartyId:
                ownerData.ownershipType === 'INDIRECT'
                  ? 'temp-parent'
                  : undefined,
              organizationDetails: {
                organizationName: ownerData.businessName!,
              },
              createdAt: new Date().toISOString(),
            };

      setBeneficialOwnerParties((prev) => [...prev, newParty]);
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
    [handleCloseDialog, userEventsHandler]
  );

  const handleRemoveOwner = useCallback(
    (ownerId: string) => {
      trackUserEvent({
        actionName: INDIRECT_OWNERSHIP_USER_JOURNEYS.REMOVE_OWNER_STARTED,
        metadata: { ownerId },
        userEventsHandler,
      });
      // Mark as pending removal
      pendingRemovalsRef.current.add(ownerId);
      // Update state (pure function, no side effects)
      setBeneficialOwnerParties((prev) =>
        prev.filter((party) => party.id !== ownerId)
      );
    },
    [userEventsHandler]
  );

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

  const handleComplete = useCallback(() => {
    if (validationSummary.canComplete) {
      onOwnershipComplete?.(beneficialOwners);
    }
  }, [validationSummary.canComplete, onOwnershipComplete, beneficialOwners]);

  const handleHierarchySaved = useCallback(
    (ownerId: string, hierarchy: any) => {
      // Store hierarchy data separately - this marks the hierarchy as complete
      setCustomOwnershipHierarchies((prev) =>
        new Map(prev).set(ownerId, hierarchy)
      );

      // Track edit completion
      trackUserEvent({
        actionName: INDIRECT_OWNERSHIP_USER_JOURNEYS.EDIT_OWNER_COMPLETED,
        metadata: { ownerId },
        userEventsHandler,
      });

      // Don't modify profileStatus - that's for KYC approval status
      // The transform function will determine completion status based on hierarchy existence
      handleCloseDialog();
    },
    [handleCloseDialog, userEventsHandler]
  );
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
                  A beneficial owner is an individual who owns 25% or more of
                  your business, either directly or through other companies.
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
                >
                  <Plus
                    className="eb-mr-1.5 eb-h-4 eb-w-4"
                    aria-hidden="true"
                  />
                  Add Beneficial Owner
                </Button>
              )}
              {!readOnly && (
                <Button
                  onClick={handleComplete}
                  disabled={!validationSummary.canComplete}
                  variant={
                    validationSummary.canComplete ? 'default' : 'outline'
                  }
                  size="sm"
                  aria-label={`Complete ownership structure setup. ${
                    validationSummary.canComplete
                      ? 'All requirements met, ready to complete'
                      : `${validationSummary.errors.length + validationSummary.pendingHierarchies} issues need to be resolved`
                  }`}
                  aria-describedby="validation-summary"
                >
                  Complete
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="eb-space-y-4 eb-p-2.5 eb-transition-all eb-duration-300 eb-ease-in-out @md:eb-p-3 @lg:eb-p-4">
          {/* Current Ownership Structure */}
          <section
            aria-labelledby="ownership-structure-heading"
            aria-live="polite"
          >
            <h3
              id="ownership-structure-heading"
              className="eb-mb-3 eb-font-header eb-font-medium eb-text-foreground"
            >
              Current Ownership Structure:
              <span className="eb-sr-only">
                {beneficialOwners.length === 0
                  ? 'No owners added'
                  : `${beneficialOwners.length} owners added`}
              </span>
            </h3>
            {beneficialOwners.length === 0 ? (
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
                    Click &quot;Add Owner&quot; to get started building your
                    ownership structure
                  </p>
                </div>
              </div>
            ) : (
              <div className="eb-space-y-6">
                {/* Individual Beneficial Owners Section */}
                {individualOwners.length > 0 && (
                  <div>
                    <div className="eb-mb-3 eb-flex eb-items-center eb-gap-2">
                      <User
                        className="eb-h-4 eb-w-4 eb-text-muted-foreground"
                        aria-hidden="true"
                      />
                      <h4 className="eb-text-sm eb-font-medium eb-text-foreground">
                        Individual Beneficial Owners ({individualOwners.length})
                      </h4>
                    </div>
                    <div
                      className="eb-grid eb-grid-cols-1 eb-items-start eb-gap-3"
                      role="list"
                      aria-label={`Individual beneficial owners list with ${individualOwners.length} owners`}
                    >
                      {individualOwners.map((owner, index) => (
                        <OwnerCard
                          key={owner.id}
                          owner={owner}
                          index={index}
                          readOnly={readOnly}
                          onBuildHierarchy={handleBuildHierarchy}
                          onEditHierarchy={handleEditHierarchy}
                          onRemoveOwner={handleRemoveOwner}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Business Entity Owners Section */}
                {businessOwners.length > 0 && (
                  <div>
                    <div className="eb-mb-3 eb-flex eb-items-center eb-gap-2">
                      <Building
                        className="eb-h-4 eb-w-4 eb-text-muted-foreground"
                        aria-hidden="true"
                      />
                      <h4 className="eb-text-sm eb-font-medium eb-text-foreground">
                        Business Entity Owners ({businessOwners.length})
                      </h4>
                    </div>
                    <div
                      className="eb-grid eb-grid-cols-1 eb-items-start eb-gap-3"
                      role="list"
                      aria-label={`Business entity owners list with ${businessOwners.length} entities`}
                    >
                      {businessOwners.map((owner, index) => (
                        <OwnerCard
                          key={owner.id}
                          owner={owner}
                          index={index}
                          readOnly={readOnly}
                          onBuildHierarchy={handleBuildHierarchy}
                          onEditHierarchy={handleEditHierarchy}
                          onRemoveOwner={handleRemoveOwner}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Validation Status */}
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
              className={
                validationSummary.hasErrors
                  ? 'eb-border-destructive eb-bg-destructive-accent'
                  : validationSummary.canComplete
                    ? 'eb-border-success eb-bg-success-accent'
                    : 'eb-border-warning eb-bg-warning-accent'
              }
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
                ) : validationSummary.canComplete ? (
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
              </div>
              <AlertDescription id="validation-summary">
                <div className="eb-space-y-1">
                  {validationSummary.totalOwners === 0 ? (
                    <div>Add your first beneficial owner to get started.</div>
                  ) : (
                    <>
                      <div>
                        {validationSummary.completeOwners} of{' '}
                        {validationSummary.totalOwners} owners have complete
                        information
                        {validationSummary.canComplete ? ' ✓' : ' ⚠'}
                      </div>
                      {validationSummary.pendingHierarchies > 0 && (
                        <div>
                          {validationSummary.pendingHierarchies} indirect owner
                          {validationSummary.pendingHierarchies !== 1
                            ? 's'
                            : ''}{' '}
                          need
                          {validationSummary.pendingHierarchies === 1
                            ? 's'
                            : ''}{' '}
                          ownership hierarchy
                        </div>
                      )}
                      <div>
                        Ready to complete:{' '}
                        {validationSummary.canComplete
                          ? 'Yes ✓'
                          : 'No (pending actions required)'}
                      </div>
                      <div className="eb-text-sm eb-opacity-75">
                        Completion: {validationSummary.completionPercentage}%
                      </div>
                    </>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          </section>
        </CardContent>
      </Card>

      {/* Add Owner Dialog */}
      <AddOwnerDialog
        isOpen={currentDialog === 'ADD_OWNER'}
        onClose={handleCloseDialog}
        onSubmit={handleOwnerSubmit}
        existingOwners={beneficialOwners}
        allExistingBusinessNames={allExistingBusinessNames}
      />

      {/* Hierarchy Building Dialog */}
      <HierarchyBuildingDialog
        isOpen={currentDialog === 'BUILD_CHAIN'}
        onClose={handleCloseDialog}
        ownerId={currentOwnerBeingEdited || ''}
        ownerName={
          currentOwnerBeingEdited
            ? getBeneficialOwnerFullName(
                beneficialOwners.find((o) => o.id === currentOwnerBeingEdited)!
              )
            : ''
        }
        rootCompanyName={rootCompanyName}
        onSave={handleHierarchySaved}
        beneficialOwners={beneficialOwners}
      />

      {/* Edit Hierarchy Dialog */}
      <HierarchyBuildingDialog
        isOpen={currentDialog === 'EDIT_CHAIN'}
        onClose={handleCloseDialog}
        ownerId={currentOwnerBeingEdited || ''}
        ownerName={
          currentOwnerBeingEdited
            ? getBeneficialOwnerFullName(
                beneficialOwners.find((o) => o.id === currentOwnerBeingEdited)!
              )
            : ''
        }
        rootCompanyName={rootCompanyName}
        onSave={handleHierarchySaved}
        existingHierarchy={
          currentOwnerBeingEdited
            ? beneficialOwners.find((o) => o.id === currentOwnerBeingEdited)
                ?.ownershipHierarchy
            : undefined
        }
        isEditMode
        beneficialOwners={beneficialOwners}
      />
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
  onBuildHierarchy: (ownerId: string) => void;
  onEditHierarchy: (ownerId: string) => void;
  onRemoveOwner: (ownerId: string) => void;
}

const OwnerCard: React.FC<OwnerCardProps> = ({
  owner,
  index,
  readOnly,
  onBuildHierarchy,
  onEditHierarchy,
  onRemoveOwner,
}) => {
  const ownerName =
    owner.partyType === 'INDIVIDUAL'
      ? getBeneficialOwnerFullName(owner)
      : owner.organizationDetails?.organizationName || 'Unknown Business';

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
        <div className="eb-flex eb-items-center eb-justify-between">
          <div className="eb-flex eb-items-center eb-gap-3">
            <div className="eb-flex eb-items-center eb-gap-2">
              {owner.status === 'COMPLETE' ? (
                <CheckCircle2
                  className="eb-h-5 eb-w-5 eb-text-success"
                  aria-hidden="true"
                />
              ) : owner.status === 'PENDING_HIERARCHY' ? (
                <Clock
                  className="eb-h-5 eb-w-5 eb-text-warning"
                  aria-hidden="true"
                />
              ) : (
                <AlertTriangle
                  className="eb-h-5 eb-w-5 eb-text-destructive"
                  aria-hidden="true"
                />
              )}
              <span id={`owner-${owner.id}-name`} className="eb-font-medium">
                {ownerName}
              </span>
            </div>
            <Badge
              id={`owner-${owner.id}-type`}
              variant={
                owner.ownershipType === 'DIRECT' ? 'success' : 'secondary'
              }
              className="eb-inline-flex eb-items-center eb-gap-1 eb-text-xs"
              aria-label={`Ownership type: ${owner.ownershipType === 'DIRECT' ? 'Direct owner' : 'Indirect owner'}`}
            >
              {owner.ownershipType === 'DIRECT' ? (
                <>
                  <UserCheck className="eb-h-3.5 eb-w-3.5" aria-hidden="true" />
                  Direct Owner
                </>
              ) : (
                <>
                  <Users className="eb-h-3.5 eb-w-3.5" aria-hidden="true" />
                  Indirect Owner
                </>
              )}
            </Badge>
            {owner.status === 'PENDING_HIERARCHY' && (
              <Badge
                id={`owner-${owner.id}-status`}
                variant="warning"
                className="eb-text-xs"
                aria-label="Status: Hierarchy required"
              >
                Hierarchy Required
              </Badge>
            )}
          </div>

          {!readOnly && (
            <div className="eb-flex eb-items-center eb-gap-2">
              {owner.ownershipType === 'INDIRECT' && (
                <>
                  {owner.status === 'PENDING_HIERARCHY' ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="eb-h-8 eb-px-3 eb-text-xs"
                      data-user-event={
                        INDIRECT_OWNERSHIP_USER_JOURNEYS.EDIT_OWNER_STARTED
                      }
                      onClick={() => owner.id && onBuildHierarchy(owner.id)}
                      aria-label={`Build ownership hierarchy for ${ownerName}`}
                    >
                      <Edit
                        className="eb-mr-1 eb-h-3 eb-w-3"
                        aria-hidden="true"
                      />
                      Build Chain
                    </Button>
                  ) : (
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
              <Button
                variant="ghost"
                size="sm"
                className="eb-h-8 eb-w-8 eb-p-0 eb-text-muted-foreground hover:eb-text-destructive"
                data-user-event={
                  INDIRECT_OWNERSHIP_USER_JOURNEYS.REMOVE_OWNER_STARTED
                }
                onClick={() => owner.id && onRemoveOwner(owner.id)}
                aria-label={`Remove ${ownerName} from ownership list`}
              >
                <Trash2 className="eb-h-4 eb-w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Hierarchy visualization for indirect owners with complete hierarchies */}
        {owner.ownershipHierarchy && owner.status === 'COMPLETE' && (
          <div className="eb-mt-3 eb-border-t eb-pt-3">
            <div className="eb-mb-2 eb-text-xs eb-text-muted-foreground">
              Ownership Chain:
            </div>
            <div className="eb-flex eb-flex-wrap eb-items-center eb-gap-2 eb-rounded eb-border eb-bg-muted eb-p-2 eb-text-sm">
              {/* Owner at the start */}
              <div className="eb-flex eb-shrink-0 eb-items-center eb-gap-1 eb-rounded eb-border eb-border-primary/20 eb-bg-primary/10 eb-px-2 eb-py-1">
                {ownerIcon}
                <span className="eb-font-medium eb-text-foreground">
                  {ownerName}
                </span>
              </div>

              {/* Company chain */}
              {owner.ownershipHierarchy.steps.map((step) => {
                const isDirectOwner = step.ownsRootBusinessDirectly;

                return (
                  <React.Fragment key={step.id}>
                    <span className="eb-shrink-0 eb-text-muted-foreground">
                      →
                    </span>
                    <div
                      className={`eb-flex eb-shrink-0 eb-items-center eb-gap-1 eb-rounded eb-border eb-px-2 eb-py-1 ${
                        isDirectOwner
                          ? 'eb-border-success eb-bg-success-accent'
                          : 'eb-border-border eb-bg-card'
                      }`}
                    >
                      <Building
                        className={`eb-h-3 eb-w-3 ${
                          isDirectOwner
                            ? 'eb-text-success'
                            : 'eb-text-muted-foreground'
                        }`}
                      />
                      <span
                        className={`eb-font-medium ${
                          isDirectOwner
                            ? 'eb-text-success'
                            : 'eb-text-foreground'
                        }`}
                      >
                        {step.entityName}
                      </span>
                      <Badge
                        variant={isDirectOwner ? 'success' : 'secondary'}
                        className="eb-inline-flex eb-items-center eb-gap-1 eb-px-1 eb-py-0.5 eb-text-xs"
                      >
                        {isDirectOwner ? (
                          <>
                            <Building className="eb-h-3.5 eb-w-3.5" />
                            Direct Owner
                          </>
                        ) : (
                          'Intermediary'
                        )}
                      </Badge>
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}

        {/* Validation Errors */}
        {owner.validationErrors && owner.validationErrors.length > 0 && (
          <div className="eb-mt-3 eb-space-y-1">
            {owner.validationErrors.map((error: string, errorIndex: number) => (
              <div
                key={errorIndex}
                className="eb-flex eb-items-center eb-gap-2 eb-text-xs eb-text-destructive"
              >
                <AlertTriangle
                  className="eb-h-3 eb-w-3 eb-shrink-0"
                  aria-hidden="true"
                />
                <span>{error}</span>
              </div>
            ))}
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
  }) => void;
  existingOwners: BeneficialOwner[];
  allExistingBusinessNames: Set<string>;
}

const AddOwnerDialog: React.FC<AddOwnerDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  existingOwners,
  allExistingBusinessNames,
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
  const [errors, setErrors] = useState<string[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const newErrors: string[] = [];

    if (entityType === 'INDIVIDUAL') {
      if (!firstName.trim()) {
        newErrors.push('First name is required');
      }

      if (!lastName.trim()) {
        newErrors.push('Last name is required');
      }

      // Check for duplicates among individuals
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
    } else {
      // Business entity validation
      if (!businessName.trim()) {
        newErrors.push('Business name is required');
      }

      // Check for duplicates against ALL business names (owners + hierarchies)
      const isDuplicate = allExistingBusinessNames.has(
        businessName.trim().toLowerCase()
      );

      if (isDuplicate) {
        newErrors.push(
          'Business entity with this name already exists in the ownership structure'
        );
      }
    }

    if (newErrors.length > 0) {
      setErrors(newErrors);
      return;
    }

    // Submit
    onSubmit({
      entityType,
      firstName: entityType === 'INDIVIDUAL' ? firstName.trim() : undefined,
      lastName: entityType === 'INDIVIDUAL' ? lastName.trim() : undefined,
      businessName: entityType === 'BUSINESS' ? businessName.trim() : undefined,
      ownershipType,
    });

    // Reset form
    setEntityType('INDIVIDUAL');
    setFirstName('');
    setLastName('');
    setBusinessName('');
    setOwnershipType('DIRECT');
    setErrors([]);
  };

  const handleClose = () => {
    setEntityType('INDIVIDUAL');
    setFirstName('');
    setLastName('');
    setBusinessName('');
    setOwnershipType('DIRECT');
    setErrors([]);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="eb-max-w-md eb-p-6">
        <DialogHeader className="eb-pb-4">
          <DialogTitle className="eb-font-header eb-text-lg eb-font-semibold">
            Add Owner
          </DialogTitle>
        </DialogHeader>

        <div className="eb-space-y-6">
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
            {/* Entity Type Selection */}
            <div className="eb-space-y-3">
              <Label>Owner Type</Label>
              <RadioGroup
                value={entityType}
                onValueChange={(value: 'INDIVIDUAL' | 'BUSINESS') =>
                  setEntityType(value)
                }
                className="eb-space-y-3"
              >
                <div className="eb-flex eb-cursor-pointer eb-items-start eb-space-x-3 eb-rounded-lg eb-border eb-p-3 hover:eb-bg-accent">
                  <RadioGroupItem
                    value="INDIVIDUAL"
                    id="individual"
                    className="eb-mt-0.5"
                  />
                  <div className="eb-flex-1 eb-space-y-1">
                    <Label htmlFor="individual" className="eb-cursor-pointer">
                      Individual person
                    </Label>
                    <p className="eb-text-sm eb-text-muted-foreground">
                      Add a beneficial owner who is an individual
                    </p>
                  </div>
                </div>
                <div className="eb-flex eb-cursor-pointer eb-items-start eb-space-x-3 eb-rounded-lg eb-border eb-p-3 hover:eb-bg-accent">
                  <RadioGroupItem
                    value="BUSINESS"
                    id="business"
                    className="eb-mt-0.5"
                  />
                  <div className="eb-flex-1 eb-space-y-1">
                    <Label htmlFor="business" className="eb-cursor-pointer">
                      Business entity
                    </Label>
                    <p className="eb-text-sm eb-text-muted-foreground">
                      No individual owns 25% or more of this entity
                    </p>
                  </div>
                </div>
              </RadioGroup>
            </div>

            {/* Conditional Fields Based on Entity Type */}
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
              </div>
            )}

            <div className="eb-space-y-3">
              <Label>Ownership Type</Label>
              <RadioGroup
                value={ownershipType}
                onValueChange={(value: 'DIRECT' | 'INDIRECT') =>
                  setOwnershipType(value)
                }
                className="eb-space-y-3"
              >
                <div className="eb-flex eb-cursor-pointer eb-items-start eb-space-x-3 eb-rounded-lg eb-border eb-p-3 hover:eb-bg-accent">
                  <RadioGroupItem
                    value="DIRECT"
                    id="direct"
                    className="eb-mt-0.5"
                  />
                  <div className="eb-flex-1 eb-space-y-1">
                    <Label htmlFor="direct" className="eb-cursor-pointer">
                      Direct Owner
                    </Label>
                    <p className="eb-text-sm eb-text-muted-foreground">
                      {entityType === 'INDIVIDUAL'
                        ? 'Has 25% or more ownership directly'
                        : 'Owns the business directly'}
                    </p>
                  </div>
                </div>
                <div className="eb-flex eb-cursor-pointer eb-items-start eb-space-x-3 eb-rounded-lg eb-border eb-p-3 hover:eb-bg-accent">
                  <RadioGroupItem
                    value="INDIRECT"
                    id="indirect"
                    className="eb-mt-0.5"
                  />
                  <div className="eb-flex-1 eb-space-y-1">
                    <Label htmlFor="indirect" className="eb-cursor-pointer">
                      Indirect Owner
                    </Label>
                    <p className="eb-text-sm eb-text-muted-foreground">
                      {entityType === 'INDIVIDUAL'
                        ? 'Has 25% or more ownership through other companies'
                        : 'Owns the business through other companies'}
                    </p>
                  </div>
                </div>
              </RadioGroup>
            </div>
          </form>
        </div>

        <DialogFooter className="eb-space-x-2 eb-pt-6">
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
    }>
  >([]);

  // Combine existing entities with current chain entities for autocomplete
  const existingEntities = React.useMemo(() => {
    const currentChainEntities = hierarchySteps.map((step) =>
      step.entityName.trim()
    );

    // Combine all entities and remove duplicates (case-insensitive)
    const allEntities = [...allExistingEntities, ...currentChainEntities];
    const uniqueEntities = Array.from(
      new Map(
        allEntities.map((entity) => [entity.toLowerCase(), entity])
      ).values()
    );

    // Filter out root company name
    return uniqueEntities.filter(
      (entity) => entity.toLowerCase() !== rootCompanyName.toLowerCase()
    );
  }, [allExistingEntities, hierarchySteps, rootCompanyName]);
  const [currentCompanyName, setCurrentCompanyName] = useState('');
  const [errors, setErrors] = useState<string[]>([]);

  // Check if current company is known to directly own the root business
  const currentEntityInfo = React.useMemo(() => {
    if (!currentCompanyName.trim()) return null;
    return getEntityOwnershipInfo(
      currentCompanyName.trim(),
      rootCompanyName,
      beneficialOwners
    );
  }, [currentCompanyName, rootCompanyName, beneficialOwners]);

  // Pre-populate existing hierarchy data in edit mode
  React.useEffect(() => {
    if (isOpen && isEditMode && existingHierarchy) {
      setHierarchySteps(existingHierarchy.steps || []);
    } else if (isOpen && !isEditMode) {
      setHierarchySteps([]);
    }
  }, [isOpen, isEditMode, existingHierarchy]);

  const handleAddCompany = (ownsRootBusinessDirectly?: boolean) => {
    if (!currentCompanyName.trim()) {
      setErrors(['Company name is required']);
      return;
    }

    // Check for duplicates in current chain
    const isDuplicateInChain = hierarchySteps.some(
      (step) =>
        step.entityName.toLowerCase() ===
        currentCompanyName.trim().toLowerCase()
    );

    if (isDuplicateInChain) {
      setErrors(['This company is already in the ownership chain']);
      return;
    }

    // Check if entity is known to be a direct owner OR has a known complete path
    const shouldComplete =
      ownsRootBusinessDirectly ??
      currentEntityInfo?.isKnownDirectOwner ??
      currentEntityInfo?.hasKnownPathToRoot ??
      false;

    // If entity has a known path to root, add all steps in that path
    if (
      currentEntityInfo?.hasKnownPathToRoot &&
      currentEntityInfo.pathToRoot &&
      currentEntityInfo.pathToRoot.length > 0
    ) {
      // Mark all previous steps as intermediaries
      const updatedPreviousSteps = hierarchySteps.map((step) => ({
        ...step,
        ownsRootBusinessDirectly: false,
      }));

      // Add all steps from the known path
      const pathSteps = currentEntityInfo.pathToRoot.map((pathStep, index) => ({
        id: `step-${Date.now()}-${index}`,
        entityName: pathStep.entityName,
        entityType: pathStep.entityType || ('COMPANY' as const),
        hasOwnership: true,
        ownsRootBusinessDirectly: pathStep.ownsRootBusinessDirectly,
        level: hierarchySteps.length + index + 1,
      }));

      const completeSteps = [...updatedPreviousSteps, ...pathSteps];

      // Complete the hierarchy
      const hierarchy = {
        id: `hierarchy-${ownerId}`,
        steps: completeSteps,
        isValid: true,
        meets25PercentThreshold: true,
        validationErrors: [],
      };

      onSave(ownerId, hierarchy);
      handleClose();
      return;
    }

    // Regular flow for direct owners or when continuing the chain
    const newStep = {
      id: `step-${Date.now()}`,
      entityName: currentCompanyName.trim(),
      hasOwnership: true,
      ownsRootBusinessDirectly: shouldComplete,
      level: hierarchySteps.length + 1,
    };

    // When adding a company that directly owns the root business,
    // ensure all previous steps are marked as intermediary (not direct owners)
    const updatedPreviousSteps = hierarchySteps.map((step) => ({
      ...step,
      ownsRootBusinessDirectly: false,
    }));

    const updatedSteps = [...updatedPreviousSteps, newStep];

    if (shouldComplete) {
      // Complete the hierarchy
      const hierarchy = {
        id: `hierarchy-${ownerId}`,
        steps: updatedSteps,
        isValid: true,
        meets25PercentThreshold: true,
        validationErrors: [],
      };

      onSave(ownerId, hierarchy);
      handleClose();
    } else {
      // Continue building the chain
      setHierarchySteps(updatedSteps);
      setCurrentCompanyName('');
      setErrors([]);
    }
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
      return `What company does ${ownerName} own that leads to ${rootCompanyName}?`;
    }
    return `What company does ${hierarchySteps[hierarchySteps.length - 1].entityName} own that leads to ${rootCompanyName}?`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="eb-max-w-2xl eb-p-6">
        <DialogHeader className="eb-pb-4">
          <DialogTitle className="eb-font-header eb-text-lg eb-font-semibold">
            {isEditMode ? 'Edit' : 'Build'} Ownership Chain for {ownerName}
          </DialogTitle>
        </DialogHeader>

        <div className="eb-space-y-6">
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
                We&apos;ll build the chain step by step from{' '}
                <span className="eb-font-medium eb-text-foreground">
                  {ownerName}
                </span>{' '}
                to{' '}
                <span className="eb-font-medium eb-text-foreground">
                  {rootCompanyName}
                </span>
                .
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
                        {step.ownsRootBusinessDirectly ? (
                          <Badge className="eb-bg-success-accent eb-text-xs eb-text-success">
                            <Building className="eb-mr-1 eb-h-3 eb-w-3" />
                            Direct Owner
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="eb-text-xs">
                            Intermediary
                          </Badge>
                        )}
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

          {/* Company Input Form */}
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
                existingEntities={existingEntities}
                placeholder="Enter company name"
                className="eb-h-10"
              />
            </div>

            {currentEntityInfo?.isKnownDirectOwner ? (
              // Show completion message for known direct owners
              <div className="eb-space-y-3">
                <div className="eb-rounded-lg eb-border eb-border-success eb-bg-success-accent eb-p-3">
                  <div className="eb-flex eb-items-start eb-gap-2">
                    <Check className="eb-mt-0.5 eb-h-5 eb-w-5 eb-shrink-0 eb-text-success" />
                    <div className="eb-text-sm">
                      <div className="eb-font-medium eb-text-success">
                        <span className="eb-font-bold">
                          {currentCompanyName}
                        </span>{' '}
                        is known to directly own{' '}
                        <span className="eb-font-bold">{rootCompanyName}</span>
                      </div>
                      <div className="eb-mt-1 eb-text-success/80">
                        Based on {currentEntityInfo.source?.ownerName}&apos;s
                        ownership hierarchy
                      </div>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => handleAddCompany()}
                  disabled={!currentCompanyName.trim()}
                  className="eb-h-10 eb-w-full eb-bg-success eb-font-medium eb-text-white hover:eb-bg-success/90"
                >
                  Complete Chain
                </Button>
              </div>
            ) : currentEntityInfo?.hasKnownPathToRoot &&
              currentEntityInfo.pathToRoot ? (
              // Show completion message for entities with known path to root
              <div className="eb-space-y-3">
                <div className="eb-rounded-lg eb-border eb-border-success eb-bg-success-accent eb-p-3">
                  <div className="eb-flex eb-items-start eb-gap-2">
                    <Check className="eb-mt-0.5 eb-h-5 eb-w-5 eb-shrink-0 eb-text-success" />
                    <div className="eb-space-y-2 eb-text-sm">
                      <div className="eb-font-medium eb-text-success">
                        <span className="eb-font-bold">
                          {currentCompanyName}
                        </span>{' '}
                        has a known path to{' '}
                        <span className="eb-font-bold">{rootCompanyName}</span>
                      </div>
                      <div className="eb-text-success/80">
                        Based on {currentEntityInfo.source?.ownerName}&apos;s
                        ownership hierarchy
                      </div>
                      <div className="eb-flex eb-flex-wrap eb-items-center eb-gap-1 eb-text-xs eb-text-success/70">
                        <span>Chain:</span>
                        {currentEntityInfo.pathToRoot.map((step, idx) => (
                          <React.Fragment key={idx}>
                            <span className="eb-font-medium">
                              {step.entityName}
                            </span>
                            {idx < currentEntityInfo.pathToRoot!.length - 1 && (
                              <span>→</span>
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={() => handleAddCompany()}
                  disabled={!currentCompanyName.trim()}
                  className="eb-h-10 eb-w-full eb-bg-success eb-font-medium eb-text-white hover:eb-bg-success/90"
                >
                  Complete Chain with Full Path
                </Button>
              </div>
            ) : (
              // Show standard choice for unknown entities
              <div className="eb-space-y-3">
                <div className="eb-text-sm eb-font-medium eb-text-foreground">
                  Does{' '}
                  <span className="eb-font-bold eb-text-primary">
                    {currentCompanyName || '[Company Name]'}
                  </span>{' '}
                  directly own{' '}
                  <span className="eb-font-bold eb-text-primary">
                    {rootCompanyName}
                  </span>
                  ?
                </div>

                <div className="eb-flex eb-gap-3">
                  <Button
                    onClick={() => handleAddCompany(true)}
                    disabled={!currentCompanyName.trim()}
                    className="eb-h-10 eb-flex-1 eb-bg-success eb-font-medium eb-text-white hover:eb-bg-success/90"
                  >
                    Yes - Complete Chain
                  </Button>
                  <Button
                    onClick={() => handleAddCompany(false)}
                    disabled={!currentCompanyName.trim()}
                    variant="outline"
                    className="eb-h-10 eb-flex-1 eb-border-primary eb-font-medium eb-text-primary hover:eb-bg-primary/5"
                  >
                    No - Continue Chain
                  </Button>
                </div>
              </div>
            )}
          </div>

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

        <DialogFooter className="eb-space-x-2 eb-pt-6">
          <Button
            variant="outline"
            onClick={handleClose}
            className="eb-font-medium"
          >
            Cancel
          </Button>
          {isEditMode && hierarchySteps.length > 0 && (
            <Button
              onClick={() => {
                const hierarchy = {
                  id: `hierarchy-${ownerId}`,
                  steps: hierarchySteps,
                  isValid: true,
                  meets25PercentThreshold: true,
                  validationErrors: [],
                };
                onSave(ownerId, hierarchy);
                handleClose();
              }}
              className="eb-font-medium"
            >
              Save Changes
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
