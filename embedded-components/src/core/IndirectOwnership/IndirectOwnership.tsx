'use client';

import React, { useState, useCallback } from 'react';
import { Plus, CheckCircle2, AlertTriangle, Clock, User, Building, Edit, Trash2, UserCheck, Users } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

import type { 
  IndirectOwnershipProps,
  BeneficialOwner,
  ValidationSummary
} from './IndirectOwnership.types';

import { 
  extractBeneficialOwners, 
  getRootCompanyName, 
  hasOutstandingOwnershipRequirements,
  getBeneficialOwnerDisplayName,
  getBeneficialOwnerFullName
} from './utils/openapi-transforms';

/**
 * IndirectOwnership - Streamlined ownership structure building
 * 
 * Features:
 * - Single interface with real-time updates
 * - Dialog-based owner addition with immediate feedback
 * - On-demand hierarchy building for indirect owners
 * - Live validation and progress tracking
 * - Reuses existing AlternateOwnershipReview.renderOwnershipChain() for visualization
 */
export const IndirectOwnership: React.FC<IndirectOwnershipProps> = ({
  client,
  onOwnershipComplete,
  onValidationChange,
  config = {},
  readOnly = false,
  className = '',
  testId = 'indirect-ownership',
}) => {
  // Extract data from OpenAPI client
  const rootCompanyName = client ? getRootCompanyName(client) : 'Unknown Entity';
  const initialOwners = client ? extractBeneficialOwners(client) : [];
  
  // State management
  const [beneficialOwners, setBeneficialOwners] = useState<BeneficialOwner[]>(initialOwners);
  const [currentDialog, setCurrentDialog] = useState<'NONE' | 'ADD_OWNER' | 'BUILD_CHAIN' | 'EDIT_CHAIN' | 'CONFIRM_CHAIN'>('NONE');
  const [currentOwnerBeingEdited, setCurrentOwnerBeingEdited] = useState<string | undefined>();

  // Calculate validation summary
  const validationSummary: ValidationSummary = {
    totalOwners: beneficialOwners.length,
    completeOwners: beneficialOwners.filter(owner => owner.status === 'COMPLETE').length,
    pendingHierarchies: beneficialOwners.filter(owner => owner.status === 'PENDING_HIERARCHY').length,
    ownersWithErrors: beneficialOwners.filter(owner => owner.status === 'ERROR').length,
    hasErrors: beneficialOwners.some(owner => owner.status === 'ERROR'),
    errors: beneficialOwners.flatMap(owner => owner.validationErrors || []),
    warnings: [],
    canComplete: beneficialOwners.length > 0 && beneficialOwners.every(owner => owner.status === 'COMPLETE'),
    completionPercentage: beneficialOwners.length === 0 ? 0 : Math.round((beneficialOwners.filter(owner => owner.status === 'COMPLETE').length / beneficialOwners.length) * 100)
  };

  // Handlers
  const handleAddOwner = useCallback(() => {
    setCurrentDialog('ADD_OWNER');
  }, []);

  const handleCloseDialog = useCallback(() => {
    setCurrentDialog('NONE');
    setCurrentOwnerBeingEdited(undefined);
  }, []);

  const handleOwnerSubmit = useCallback((ownerData: { firstName: string; lastName: string; ownershipType: 'DIRECT' | 'INDIRECT' }) => {
    const newOwner: BeneficialOwner = {
      id: `owner-${Date.now()}`,
      partyType: 'INDIVIDUAL',
      profileStatus: ownerData.ownershipType === 'DIRECT' ? 'APPROVED' : 'INFORMATION_REQUESTED',
      active: true,
      individualDetails: {
        firstName: ownerData.firstName,
        lastName: ownerData.lastName,
      },
      ownershipType: ownerData.ownershipType,
      status: ownerData.ownershipType === 'DIRECT' ? 'COMPLETE' : 'PENDING_HIERARCHY',
      meets25PercentThreshold: ownerData.ownershipType === 'DIRECT' ? true : undefined,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    setBeneficialOwners(prev => [...prev, newOwner]);
    handleCloseDialog();
  }, [handleCloseDialog]);

  const handleRemoveOwner = useCallback((ownerId: string) => {
    setBeneficialOwners(prev => prev.filter(owner => owner.id !== ownerId));
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

  const handleHierarchySaved = useCallback((ownerId: string, hierarchy: any) => {
    setBeneficialOwners(prev => 
      prev.map(owner => 
        owner.id === ownerId 
          ? { 
              ...owner, 
              ownershipHierarchy: hierarchy, 
              status: 'COMPLETE' as const,
              meets25PercentThreshold: true,
              updatedAt: new Date()
            }
          : owner
      )
    );
    handleCloseDialog();
  }, [handleCloseDialog]);
  return (
    <div 
      className={`eb-component eb-mx-auto eb-w-full eb-max-w-5xl eb-space-y-6 ${className}`} 
      data-testid={testId}
    >

      
      {/* Main Header - Aligned with LinkedAccountWidget pattern */}
      <Card>
        <CardHeader className="eb-border-b eb-bg-muted/30 eb-p-2.5 eb-transition-all eb-duration-300 eb-ease-in-out @md:eb-p-3 @lg:eb-p-4">
          <div className="eb-flex eb-flex-wrap eb-items-center eb-justify-between eb-gap-4">
            <div>
              <CardTitle className="eb-font-header eb-text-lg eb-font-semibold @md:eb-text-xl">
                Who are your beneficial owners?{' '}
                {beneficialOwners.length > 0 && (
                  <span className="eb-animate-fade-in">
                    ({beneficialOwners.length} added)
                  </span>
                )}
              </CardTitle>
              <p className="eb-mt-1 eb-text-sm eb-text-muted-foreground">
                A beneficial owner is an individual who owns 25% or more of your business, either directly or through other companies.
              </p>
            </div>
            <div className="eb-flex eb-items-center eb-gap-2">
              {!readOnly && (
                <Button
                  onClick={handleAddOwner}
                  variant="outline"
                  size="sm"
                  className="eb-shrink-0 eb-bg-background"
                >
                  <Plus className="eb-mr-1.5 eb-h-4 eb-w-4" />
                  Add Beneficial Owner
                </Button>
              )}
              {!readOnly && (
                <Button
                  onClick={handleComplete}
                  disabled={!validationSummary.canComplete}
                  variant={validationSummary.canComplete ? 'default' : 'outline'}
                  size="sm"
                >
                  Complete
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="eb-space-y-4 eb-p-2.5 eb-transition-all eb-duration-300 eb-ease-in-out @md:eb-p-3 @lg:eb-p-4">
          {/* Current Ownership Structure */}
          <div>
            <h3 className="eb-font-header eb-font-medium eb-text-foreground eb-mb-3">Current Ownership Structure:</h3>
            {beneficialOwners.length === 0 ? (
              <div className="eb-flex eb-flex-col eb-items-center eb-justify-center eb-space-y-3 eb-py-12 eb-text-center eb-animate-fade-in">
                <div className="eb-relative">
                  <div className="eb-rounded-full eb-bg-muted eb-p-4">
                    <User className="eb-h-8 eb-w-8 eb-text-muted-foreground" />
                  </div>
                  <div className="eb-absolute -eb-bottom-1 -eb-right-1 eb-rounded-full eb-bg-background eb-p-0.5">
                    <Plus className="eb-h-4 eb-w-4 eb-text-muted-foreground" />
                  </div>
                </div>
                <div className="eb-space-y-1">
                  <h3 className="eb-text-base eb-font-semibold eb-text-foreground">
                    No beneficial owners added yet
                  </h3>
                  <p className="eb-max-w-sm eb-text-sm eb-text-muted-foreground">
                    Click "Add Beneficial Owner" to get started building your ownership structure
                  </p>
                </div>
              </div>
            ) : (
              <div className="eb-grid eb-grid-cols-1 eb-items-start eb-gap-3">
                {beneficialOwners.map((owner, index) => (
                  <div 
                    key={owner.id} 
                    className="eb-animate-fade-in eb-overflow-hidden eb-rounded-lg eb-border eb-bg-card eb-text-card-foreground eb-shadow-sm eb-transition-shadow"
                    style={{
                      animationDelay: `${index * 50}ms`,
                      animationFillMode: 'backwards',
                    }}
                  >
                    <div className="eb-p-4">
                    <div className="eb-flex eb-items-center eb-justify-between">
                      <div className="eb-flex eb-items-center eb-gap-3">
                        <div className="eb-flex eb-items-center eb-gap-2">
                          {owner.status === 'COMPLETE' ? (
                            <CheckCircle2 className="eb-h-5 eb-w-5 eb-text-success" />
                          ) : owner.status === 'PENDING_HIERARCHY' ? (
                            <Clock className="eb-h-5 eb-w-5 eb-text-warning" />
                          ) : (
                            <AlertTriangle className="eb-h-5 eb-w-5 eb-text-destructive" />
                          )}
                          <span className="eb-font-medium">{getBeneficialOwnerFullName(owner)}</span>
                        </div>
                        <Badge 
                          variant={owner.ownershipType === 'DIRECT' ? 'success' : 'secondary'}
                          className="eb-inline-flex eb-items-center eb-gap-1 eb-text-xs"
                        >
                          {owner.ownershipType === 'DIRECT' ? (
                            <>
                              <UserCheck className="eb-h-3.5 eb-w-3.5" />
                              Direct Owner
                            </>
                          ) : (
                            <>
                              <Users className="eb-h-3.5 eb-w-3.5" />
                              Indirect Owner
                            </>
                          )}
                        </Badge>
                        {owner.status === 'PENDING_HIERARCHY' && (
                          <Badge 
                            variant="warning"
                            className="eb-inline-flex eb-items-center eb-gap-1 eb-text-xs"
                          >
                            <Clock className="eb-h-3.5 eb-w-3.5" />
                            Pending Hierarchy
                          </Badge>
                        )}
                      </div>
                      <div className="eb-flex eb-items-center eb-gap-2">
                        {!readOnly && owner.status === 'PENDING_HIERARCHY' && (
                          <Button
                            onClick={() => owner.id && handleBuildHierarchy(owner.id)}
                            size="sm"
                            variant="outline"
                            className="eb-shrink-0 eb-bg-background"
                          >
                            Build Ownership Hierarchy
                          </Button>
                        )}
                        {!readOnly && owner.ownershipHierarchy && (
                          <Button
                            onClick={() => owner.id && handleEditHierarchy(owner.id)}
                            size="sm"
                            variant="outline"
                            className="eb-shrink-0 eb-bg-background"
                          >
                            <Edit className="eb-mr-1.5 eb-h-4 eb-w-4" />
                            Edit Chain
                          </Button>
                        )}
                        {!readOnly && (
                          <Button
                            onClick={() => owner.id && handleRemoveOwner(owner.id)}
                            size="sm"
                            variant="outline"
                            className="eb-shrink-0 eb-bg-background eb-text-destructive eb-hover:bg-destructive/5"
                          >
                            <Trash2 className="eb-mr-1.5 eb-h-4 eb-w-4" />
                            Remove
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    {/* Hierarchy visualization for indirect owners with complete hierarchies */}
                    {owner.ownershipHierarchy && owner.status === 'COMPLETE' && (
                      <div className="eb-mt-3 eb-pt-3 eb-border-t">
                        <div className="eb-text-xs eb-text-muted-foreground eb-mb-2">Ownership Chain:</div>
                        <div className="eb-flex eb-items-center eb-gap-2 eb-text-sm eb-flex-wrap eb-p-2 eb-bg-muted eb-border eb-rounded">
                          {/* Owner at the start */}
                          <div className="eb-flex eb-items-center eb-gap-1 eb-px-2 eb-py-1 eb-bg-primary/10 eb-border eb-border-primary/20 eb-rounded eb-shrink-0">
                            <User className="eb-h-3 eb-w-3 eb-text-primary" />
                            <span className="eb-font-medium eb-text-foreground">{getBeneficialOwnerFullName(owner)}</span>
                          </div>
                          
                          {/* Company chain */}
                          {owner.ownershipHierarchy.steps.map((step, stepIndex) => {
                            const isDirectOwner = step.ownsRootBusinessDirectly;
                            
                            return (
                              <React.Fragment key={step.id}>
                                <span className="eb-text-muted-foreground eb-shrink-0">→</span>
                                <div className={`eb-flex eb-items-center eb-gap-1 eb-px-2 eb-py-1 eb-border eb-rounded eb-shrink-0 ${
                                  isDirectOwner 
                                    ? 'eb-bg-success-accent eb-border-success' 
                                    : 'eb-bg-card eb-border-border'
                                }`}>
                                  <Building className={`eb-h-3 eb-w-3 ${
                                    isDirectOwner ? 'eb-text-success' : 'eb-text-muted-foreground'
                                  }`} />
                                  <span className={`eb-font-medium ${
                                    isDirectOwner ? 'eb-text-success' : 'eb-text-foreground'
                                  }`}>
                                    {step.entityName}
                                  </span>
                                  <Badge 
                                    variant={isDirectOwner ? 'success' : 'secondary'}
                                    className="eb-inline-flex eb-items-center eb-gap-1 eb-text-xs eb-px-1 eb-py-0.5"
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
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          
          {/* Validation Status */}
          <div>
            <h3 className="eb-font-header eb-font-medium eb-text-foreground eb-mb-3">Validation Status:</h3>
            <Alert className={
              validationSummary.hasErrors 
                ? 'eb-border-destructive eb-bg-destructive-accent' 
                : validationSummary.canComplete 
                ? 'eb-border-success eb-bg-success-accent' 
                : 'eb-border-warning eb-bg-warning-accent'
            }>
              <div className="eb-flex eb-items-center eb-gap-2">
                {validationSummary.hasErrors ? (
                  <AlertTriangle className="eb-h-4 eb-w-4 eb-text-destructive" />
                ) : validationSummary.canComplete ? (
                  <CheckCircle2 className="eb-h-4 eb-w-4 eb-text-success" />
                ) : (
                  <Clock className="eb-h-4 eb-w-4 eb-text-warning" />
                )}
              </div>
              <AlertDescription>
                <div className="eb-space-y-1">
                  {validationSummary.totalOwners === 0 ? (
                    <div>Add your first beneficial owner to get started.</div>
                  ) : (
                    <>
                      <div>
                        {validationSummary.completeOwners} of {validationSummary.totalOwners} owners have complete information 
                        {validationSummary.canComplete ? ' ✓' : ' ⚠'}
                      </div>
                      {validationSummary.pendingHierarchies > 0 && (
                        <div>
                          {validationSummary.pendingHierarchies} indirect owner{validationSummary.pendingHierarchies !== 1 ? 's' : ''} need{validationSummary.pendingHierarchies === 1 ? 's' : ''} ownership hierarchy
                        </div>
                      )}
                      <div>
                        Ready to complete: {validationSummary.canComplete ? 'Yes ✓' : 'No (pending actions required)'}
                      </div>
                      <div className="eb-text-sm eb-opacity-75">
                        Completion: {validationSummary.completionPercentage}%
                      </div>
                    </>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          </div>
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
        ownerName={currentOwnerBeingEdited ? 
          getBeneficialOwnerFullName(beneficialOwners.find(o => o.id === currentOwnerBeingEdited)!) : ''
        }
        rootCompanyName={rootCompanyName}
        onSave={handleHierarchySaved}
      />

      {/* Edit Hierarchy Dialog */}
      <HierarchyBuildingDialog
        isOpen={currentDialog === 'EDIT_CHAIN'}
        onClose={handleCloseDialog}
        ownerId={currentOwnerBeingEdited || ''}
        ownerName={currentOwnerBeingEdited ? 
          getBeneficialOwnerFullName(beneficialOwners.find(o => o.id === currentOwnerBeingEdited)!) : ''
        }
        rootCompanyName={rootCompanyName}
        onSave={handleHierarchySaved}
        existingHierarchy={currentOwnerBeingEdited ? 
          beneficialOwners.find(o => o.id === currentOwnerBeingEdited)?.ownershipHierarchy : undefined
        }
        isEditMode={true}
      />
    </div>
  );
};

// Simple Add Owner Dialog Component
interface AddOwnerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { firstName: string; lastName: string; ownershipType: 'DIRECT' | 'INDIRECT' }) => void;
  existingOwners: BeneficialOwner[];
}

const AddOwnerDialog: React.FC<AddOwnerDialogProps> = ({ isOpen, onClose, onSubmit, existingOwners }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [ownershipType, setOwnershipType] = useState<'DIRECT' | 'INDIRECT'>('DIRECT');
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
    const isDuplicate = existingOwners.some(owner => 
      getBeneficialOwnerFullName(owner).toLowerCase() === fullName.toLowerCase()
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
      ownershipType
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
          <DialogTitle className="eb-font-header eb-text-lg eb-font-semibold">Add Beneficial Owner</DialogTitle>
        </DialogHeader>
        
        <div className="eb-space-y-6">
          {errors.length > 0 && (
            <Alert className="eb-border-destructive eb-bg-destructive-accent">
              <AlertTriangle className="eb-h-4 eb-w-4 eb-text-destructive" />
              <AlertDescription>
                <div className="eb-space-y-1">
                  {errors.map((error, index) => (
                    <div key={index} className="eb-text-destructive">{error}</div>
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
                onValueChange={(value: 'DIRECT' | 'INDIRECT') => setOwnershipType(value)}
                className="eb-space-y-3"
              >
                <div className="eb-flex eb-items-start eb-space-x-3 eb-p-3 eb-border eb-rounded-lg eb-hover:bg-accent eb-cursor-pointer">
                  <RadioGroupItem value="DIRECT" id="direct" className="eb-mt-0.5" />
                  <div className="eb-flex-1 eb-space-y-1">
                    <Label htmlFor="direct" className="eb-cursor-pointer">
                      Direct Owner
                    </Label>
                    <p className="eb-text-sm eb-text-muted-foreground">
                      Has 25% or more ownership directly
                    </p>
                  </div>
                </div>
                <div className="eb-flex eb-items-start eb-space-x-3 eb-p-3 eb-border eb-rounded-lg eb-hover:bg-accent eb-cursor-pointer">
                  <RadioGroupItem value="INDIRECT" id="indirect" className="eb-mt-0.5" />
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
        
        <DialogFooter className="eb-pt-6 eb-space-x-2">
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
  isEditMode = false 
}) => {
  const [hierarchySteps, setHierarchySteps] = useState<Array<{
    id: string;
    entityName: string;
    hasOwnership: boolean;
    ownsRootBusinessDirectly: boolean;
    level: number;
  }>>([]);
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
      level: hierarchySteps.length + 1
    };

    const updatedSteps = [...hierarchySteps, newStep];

    if (ownsRootBusinessDirectly) {
      // Complete the hierarchy
      const hierarchy = {
        id: `hierarchy-${ownerId}`,
        steps: updatedSteps,
        isValid: true,
        meets25PercentThreshold: true,
        validationErrors: []
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

  const handleClose = () => {
    setHierarchySteps([]);
    setCurrentCompanyName('');
    setErrors([]);
    onClose();
  };

  const renderChainPreview = () => {
    if (hierarchySteps.length === 0) return null;

    return (
      <div className="eb-p-4 eb-bg-muted eb-border eb-rounded-lg">
        <div className="eb-text-sm eb-font-semibold eb-text-foreground eb-mb-3">Current Chain:</div>
        <div className="eb-flex eb-items-center eb-gap-2 eb-text-sm eb-flex-wrap">
          {/* Owner at start */}
          <div className="eb-flex eb-items-center eb-gap-2 eb-px-3 eb-py-2 eb-bg-primary/10 eb-border eb-border-primary/20 eb-rounded-lg eb-shadow-sm">
            <User className="eb-h-4 eb-w-4 eb-text-primary" />
            <span className="eb-font-semibold eb-text-foreground">{ownerName}</span>
          </div>
          
          {/* Company chain */}
          {hierarchySteps.map((step) => (
            <React.Fragment key={step.id}>
              <span className="eb-text-muted-foreground eb-text-lg eb-font-bold">→</span>
              <div className="eb-flex eb-items-center eb-gap-2 eb-px-3 eb-py-2 eb-bg-card eb-border eb-rounded-lg eb-shadow-sm">
                <Building className="eb-h-4 eb-w-4 eb-text-muted-foreground" />
                <span className="eb-font-semibold eb-text-foreground">{step.entityName}</span>
              </div>
            </React.Fragment>
          ))}
          
          {/* Next step indicator */}
          <span className="eb-text-muted-foreground eb-text-lg eb-font-bold">→</span>
          <div className="eb-flex eb-items-center eb-gap-2 eb-px-3 eb-py-2 eb-bg-success-accent eb-border eb-border-success eb-rounded-lg eb-border-dashed eb-shadow-sm">
            <Building className="eb-h-4 eb-w-4 eb-text-success" />
            <span className="eb-font-semibold eb-text-success">{rootCompanyName}</span>
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
          <div className="eb-text-sm eb-text-muted-foreground eb-leading-relaxed">
            {isEditMode ? (
              <>
                Edit the ownership chain from <span className="eb-font-medium eb-text-foreground">{ownerName}</span> to{' '}
                <span className="eb-font-medium eb-text-foreground">{rootCompanyName}</span>.
              </>
            ) : (
              <>
                We'll build the chain step by step from <span className="eb-font-medium eb-text-foreground">{ownerName}</span> to{' '}
                <span className="eb-font-medium eb-text-foreground">{rootCompanyName}</span>.
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
                  <div key={step.id} className="eb-flex eb-items-center eb-justify-between eb-p-3 eb-bg-card eb-border eb-rounded-lg eb-shadow-sm">
                    <div className="eb-flex eb-items-center eb-gap-3">
                      <span className="eb-text-sm eb-font-medium eb-text-muted-foreground">
                        Step {index + 1}:
                      </span>
                      <div className="eb-flex eb-items-center eb-gap-2">
                        <Building className="eb-h-4 eb-w-4 eb-text-muted-foreground" />
                        <span className="eb-font-medium">{step.entityName}</span>
                        {index === hierarchySteps.length - 1 && step.ownsRootBusinessDirectly && (
                          <Badge className="eb-bg-success-accent eb-text-success eb-text-xs">
                            Final Step
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      onClick={() => {
                        const newSteps = hierarchySteps.filter((_, i) => i !== index);
                        setHierarchySteps(newSteps);
                      }}
                      size="sm"
                      variant="outline"
                      className="eb-text-destructive eb-hover:bg-destructive/5"
                    >
                      <Trash2 className="eb-h-3 eb-w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Company Input Form */}
          <div className="eb-space-y-5 eb-p-5 eb-border eb-rounded-lg eb-bg-primary/5 eb-border-primary/20">
            <div className="eb-text-sm eb-font-medium eb-text-foreground">
              {getInstructionText()}
            </div>
            
            <div className="eb-space-y-2">
              <Label htmlFor="companyName">
                Company Name
              </Label>
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
                Does <span className="eb-font-bold eb-text-primary">{currentCompanyName || '[Company Name]'}</span> directly own{' '}
                <span className="eb-font-bold eb-text-primary">{rootCompanyName}</span>?
              </div>

              <div className="eb-flex eb-gap-3">
                <Button 
                  onClick={() => handleAddCompany(true)}
                  disabled={!currentCompanyName.trim()}
                  className="eb-flex-1 eb-bg-success hover:eb-bg-success/90 eb-font-medium eb-h-10 eb-text-white"
                >
                  Yes - Complete Chain
                </Button>
                <Button 
                  onClick={() => handleAddCompany(false)}
                  disabled={!currentCompanyName.trim()}
                  variant="outline"
                  className="eb-flex-1 eb-border-primary eb-text-primary hover:eb-bg-primary/5 eb-font-medium eb-h-10"
                >
                  No - Continue Chain
                </Button>
              </div>
            </div>
          </div>

          {/* Error Messages */}
          {errors.length > 0 && (
            <div className="eb-p-4 eb-bg-destructive-accent eb-border eb-border-destructive eb-rounded-lg">
              <div className="eb-text-destructive eb-text-sm eb-space-y-1">
                {errors.map((error, index) => (
                  <div key={index} className="eb-flex eb-items-center eb-gap-2">
                    <AlertTriangle className="eb-h-3 eb-w-3 eb-text-destructive eb-shrink-0" />
                    <span>{error}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="eb-pt-6 eb-space-x-2">
          <Button variant="outline" onClick={handleClose} className="eb-font-medium">
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
                  validationErrors: []
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
