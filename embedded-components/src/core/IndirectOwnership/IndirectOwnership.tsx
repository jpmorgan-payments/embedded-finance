'use client';

import React, { useCallback, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Building,
  CheckCircle2,
  Clock,
  Edit,
  Plus,
  Trash2,
  User,
  UserCheck,
  Users,
} from 'lucide-react';

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

import { VALIDATION_MESSAGES } from './IndirectOwnership.internal.types';
import type {
  BeneficialOwner,
  IndirectOwnershipProps,
  ValidationSummary,
} from './IndirectOwnership.types';
import {
  getBeneficialOwnerDisplayName,
  getBeneficialOwnerFullName,
  getRootCompanyName,
  hasOutstandingOwnershipRequirements,
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
  client,
  onOwnershipComplete,
  onValidationChange,
  config = {},
  readOnly = false,
  className = '',
  testId = 'indirect-ownership',
}) => {
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
  }, []);

  const handleCloseDialog = useCallback(() => {
    setCurrentDialog('NONE');
    setCurrentOwnerBeingEdited(undefined);
  }, []);

  const handleOwnerSubmit = useCallback(
    (ownerData: {
      firstName: string;
      lastName: string;
      ownershipType: 'DIRECT' | 'INDIRECT';
    }) => {
      const newParty: PartyResponse = {
        id: `owner-${Date.now()}`,
        partyType: 'INDIVIDUAL',
        // Don't set profileStatus - that's managed by KYC systems
        active: true,
        roles: ['BENEFICIAL_OWNER'],
        parentPartyId:
          ownerData.ownershipType === 'INDIRECT' ? 'temp-parent' : undefined,
        individualDetails: {
          firstName: ownerData.firstName,
          lastName: ownerData.lastName,
        },
        createdAt: new Date().toISOString(),
      };

      setBeneficialOwnerParties((prev) => [...prev, newParty]);
      handleCloseDialog();
    },
    [handleCloseDialog]
  );

  const handleRemoveOwner = useCallback((ownerId: string) => {
    setBeneficialOwnerParties((prev) =>
      prev.filter((party) => party.id !== ownerId)
    );
  }, []);

  const handleBuildHierarchy = useCallback((ownerId: string) => {
    setCurrentOwnerBeingEdited(ownerId);
    setCurrentDialog('BUILD_CHAIN');
  }, []);

  const handleEditHierarchy = useCallback((ownerId: string) => {
    setCurrentOwnerBeingEdited(ownerId);
    setCurrentDialog('EDIT_CHAIN');
  }, []);

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

      // Don't modify profileStatus - that's for KYC approval status
      // The transform function will determine completion status based on hierarchy existence
      handleCloseDialog();
    },
    [handleCloseDialog]
  );
  return (
    <div
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
              <p
                id="ownership-description"
                className="eb-mt-1 eb-text-sm eb-text-muted-foreground"
              >
                A beneficial owner is an individual who owns 25% or more of your
                business, either directly or through other companies.
              </p>
            </div>
            <div
              className="eb-flex eb-items-center eb-gap-2"
              role="toolbar"
              aria-label="Beneficial ownership management actions"
            >
              {!readOnly && (
                <Button
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
                  ? 'No beneficial owners added'
                  : `${beneficialOwners.length} beneficial owners added`}
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
                    No beneficial owners added yet
                  </h4>
                  <p className="eb-max-w-sm eb-text-sm eb-text-muted-foreground">
                    Click "Add Beneficial Owner" to get started building your
                    ownership structure
                  </p>
                </div>
              </div>
            ) : (
              <div
                className="eb-grid eb-grid-cols-1 eb-items-start eb-gap-3"
                role="list"
                aria-label={`Beneficial owners list with ${beneficialOwners.length} owners`}
              >
                {beneficialOwners.map((owner, index) => (
                  <div
                    key={owner.id}
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
                            <span
                              id={`owner-${owner.id}-name`}
                              className="eb-font-medium"
                            >
                              {getBeneficialOwnerFullName(owner)}
                            </span>
                          </div>
                          <Badge
                            id={`owner-${owner.id}-type`}
                            variant={
                              owner.ownershipType === 'DIRECT'
                                ? 'success'
                                : 'secondary'
                            }
                            className="eb-inline-flex eb-items-center eb-gap-1 eb-text-xs"
                            aria-label={`Ownership type: ${owner.ownershipType === 'DIRECT' ? 'Direct owner' : 'Indirect owner'}`}
                          >
                            {owner.ownershipType === 'DIRECT' ? (
                              <>
                                <UserCheck
                                  className="eb-h-3.5 eb-w-3.5"
                                  aria-hidden="true"
                                />
                                Direct Owner
                              </>
                            ) : (
                              <>
                                <Users
                                  className="eb-h-3.5 eb-w-3.5"
                                  aria-hidden="true"
                                />
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
                                    onClick={() =>
                                      owner.id && handleBuildHierarchy(owner.id)
                                    }
                                    aria-label={`Build ownership hierarchy for ${getBeneficialOwnerFullName(owner)}`}
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
                                    onClick={() =>
                                      owner.id && handleEditHierarchy(owner.id)
                                    }
                                    aria-label={`Edit ownership hierarchy for ${getBeneficialOwnerFullName(owner)}`}
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
                              onClick={() =>
                                owner.id && handleRemoveOwner(owner.id)
                              }
                              aria-label={`Remove ${getBeneficialOwnerFullName(owner)} from ownership list`}
                            >
                              <Trash2 className="eb-h-4 eb-w-4" />
                            </Button>
                          </div>
                        )}
                      </div>

                      {/* Hierarchy visualization for indirect owners with complete hierarchies */}
                      {owner.ownershipHierarchy &&
                        owner.status === 'COMPLETE' && (
                          <div className="eb-mt-3 eb-border-t eb-pt-3">
                            <div className="eb-mb-2 eb-text-xs eb-text-muted-foreground">
                              Ownership Chain:
                            </div>
                            <div className="eb-flex eb-flex-wrap eb-items-center eb-gap-2 eb-rounded eb-border eb-bg-muted eb-p-2 eb-text-sm">
                              {/* Owner at the start */}
                              <div className="eb-flex eb-shrink-0 eb-items-center eb-gap-1 eb-rounded eb-border eb-border-primary/20 eb-bg-primary/10 eb-px-2 eb-py-1">
                                <User className="eb-h-3 eb-w-3 eb-text-primary" />
                                <span className="eb-font-medium eb-text-foreground">
                                  {getBeneficialOwnerFullName(owner)}
                                </span>
                              </div>

                              {/* Company chain */}
                              {owner.ownershipHierarchy.steps.map((step) => {
                                const isDirectOwner =
                                  step.ownsRootBusinessDirectly;

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
                                        variant={
                                          isDirectOwner
                                            ? 'success'
                                            : 'secondary'
                                        }
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
                      {owner.validationErrors &&
                        owner.validationErrors.length > 0 && (
                          <div className="eb-mt-3 eb-space-y-1">
                            {owner.validationErrors.map(
                              (error: string, errorIndex: number) => (
                                <div
                                  key={errorIndex}
                                  className="eb-flex eb-items-center eb-gap-2 eb-text-xs eb-text-destructive"
                                >
                                  <AlertTriangle
                                    className="eb-h-3 eb-w-3 eb-flex-shrink-0"
                                    aria-hidden="true"
                                  />
                                  <span>{error}</span>
                                </div>
                              )
                            )}
                          </div>
                        )}
                    </div>
                  </div>
                ))}
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
        isEditMode={true}
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
 * Simple Add Owner Dialog Component
 */
interface AddOwnerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    firstName: string;
    lastName: string;
    ownershipType: 'DIRECT' | 'INDIRECT';
  }) => void;
  existingOwners: BeneficialOwner[];
}

const AddOwnerDialog: React.FC<AddOwnerDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  existingOwners,
}) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [ownershipType, setOwnershipType] = useState<'DIRECT' | 'INDIRECT'>(
    'DIRECT'
  );
  const [errors, setErrors] = useState<string[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const newErrors: string[] = [];

    if (!firstName.trim()) {
      newErrors.push('First name is required');
    }

    if (!lastName.trim()) {
      newErrors.push('Last name is required');
    }

    // Check for duplicates
    const fullName = `${firstName.trim()} ${lastName.trim()}`;
    const isDuplicate = existingOwners.some(
      (owner) =>
        getBeneficialOwnerFullName(owner).toLowerCase() ===
        fullName.toLowerCase()
    );

    if (isDuplicate) {
      newErrors.push('Owner with this name already exists');
    }

    if (newErrors.length > 0) {
      setErrors(newErrors);
      return;
    }

    // Submit
    onSubmit({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      ownershipType,
    });

    // Reset form
    setFirstName('');
    setLastName('');
    setOwnershipType('DIRECT');
    setErrors([]);
  };

  const handleClose = () => {
    setFirstName('');
    setLastName('');
    setOwnershipType('DIRECT');
    setErrors([]);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="eb-max-w-md eb-p-6">
        <DialogHeader className="eb-pb-4">
          <DialogTitle className="eb-font-header eb-text-lg eb-font-semibold">
            Add Beneficial Owner
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

            <div className="eb-space-y-3">
              <Label>Ownership Type</Label>
              <RadioGroup
                value={ownershipType}
                onValueChange={(value: 'DIRECT' | 'INDIRECT') =>
                  setOwnershipType(value)
                }
                className="eb-space-y-3"
              >
                <div className="eb-hover:bg-accent eb-flex eb-cursor-pointer eb-items-start eb-space-x-3 eb-rounded-lg eb-border eb-p-3">
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
                      Has 25% or more ownership directly
                    </p>
                  </div>
                </div>
                <div className="eb-hover:bg-accent eb-flex eb-cursor-pointer eb-items-start eb-space-x-3 eb-rounded-lg eb-border eb-p-3">
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
                      Has 25% or more ownership through other companies
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
}) => {
  const [hierarchySteps, setHierarchySteps] = useState<
    Array<{
      id: string;
      entityName: string;
      hasOwnership: boolean;
      ownsRootBusinessDirectly: boolean;
      level: number;
    }>
  >([]);
  const [currentCompanyName, setCurrentCompanyName] = useState('');
  const [errors, setErrors] = useState<string[]>([]);

  // Pre-populate existing hierarchy data in edit mode
  React.useEffect(() => {
    if (isOpen && isEditMode && existingHierarchy) {
      setHierarchySteps(existingHierarchy.steps || []);
    } else if (isOpen && !isEditMode) {
      setHierarchySteps([]);
    }
  }, [isOpen, isEditMode, existingHierarchy]);

  const handleAddCompany = (ownsRootBusinessDirectly: boolean) => {
    if (!currentCompanyName.trim()) {
      setErrors(['Company name is required']);
      return;
    }

    const newStep = {
      id: `step-${Date.now()}`,
      entityName: currentCompanyName.trim(),
      hasOwnership: true,
      ownsRootBusinessDirectly: ownsRootBusinessDirectly,
      level: hierarchySteps.length + 1,
    };

    // When adding a company that directly owns the root business,
    // ensure all previous steps are marked as intermediary (not direct owners)
    const updatedPreviousSteps = hierarchySteps.map((step) => ({
      ...step,
      ownsRootBusinessDirectly: false,
    }));

    const updatedSteps = [...updatedPreviousSteps, newStep];

    if (ownsRootBusinessDirectly) {
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
                We'll build the chain step by step from{' '}
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
                      className="eb-hover:bg-destructive/5 eb-text-destructive"
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
              <Input
                id="companyName"
                value={currentCompanyName}
                onChange={(e) => setCurrentCompanyName(e.target.value)}
                placeholder="Enter company name"
                className="eb-h-10 eb-bg-card"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && currentCompanyName.trim()) {
                    e.preventDefault();
                    // Don't auto-submit, let user choose
                  }
                }}
              />
            </div>

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
