'use client';

import React, { useState, useCallback } from 'react';
import { Plus, CheckCircle2, AlertTriangle, Clock, User, Building, Edit, Trash2 } from 'lucide-react';

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
  rootCompanyName,
  onOwnershipComplete,
  onValidationChange,
  initialOwners = [],
  config = {},
  readOnly = false,
  className = '',
  testId = 'indirect-ownership',
}) => {
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
      firstName: ownerData.firstName,
      lastName: ownerData.lastName,
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
    <div className={`eb-space-y-6 ${className}`} data-testid={testId}>

      
      {/* Main Header */}
      <Card>
        <CardHeader>
          <CardTitle className="eb-flex eb-items-center eb-justify-between">
            <span>Who are your beneficial owners?</span>
            <div className="eb-flex eb-gap-2">
              {!readOnly && (
                <Button
                  onClick={handleAddOwner}
                  className="eb-flex eb-items-center eb-gap-2"
                >
                  <Plus className="eb-h-4 eb-w-4" />
                  Add Beneficial Owner
                </Button>
              )}
              <Button
                onClick={handleComplete}
                disabled={!validationSummary.canComplete || readOnly}
                variant={validationSummary.canComplete ? 'default' : 'outline'}
              >
                Complete
              </Button>
            </div>
          </CardTitle>
          <p className="eb-text-sm eb-text-gray-600 eb-mt-2">
            A beneficial owner is an individual who owns 25% or more of your business, either directly or through other companies.
          </p>
        </CardHeader>
        <CardContent className="eb-space-y-4">
          {/* Current Ownership Structure */}
          <div>
            <h3 className="eb-font-medium eb-text-gray-900 eb-mb-3">Current Ownership Structure:</h3>
            {beneficialOwners.length === 0 ? (
              <div className="eb-p-6 eb-border eb-rounded eb-bg-gray-50 eb-text-center">
                <User className="eb-h-12 eb-w-12 eb-mx-auto eb-text-gray-400 eb-mb-3" />
                <p className="eb-text-gray-600 eb-mb-2">No beneficial owners added yet</p>
                <p className="eb-text-sm eb-text-gray-500">
                  Click "Add Beneficial Owner" to get started
                </p>
              </div>
            ) : (
              <div className="eb-space-y-3">
                {beneficialOwners.map((owner) => (
                  <div key={owner.id} className="eb-p-4 eb-border eb-rounded eb-bg-white eb-shadow-sm">
                    <div className="eb-flex eb-items-center eb-justify-between">
                      <div className="eb-flex eb-items-center eb-gap-3">
                        <div className="eb-flex eb-items-center eb-gap-2">
                          {owner.status === 'COMPLETE' ? (
                            <CheckCircle2 className="eb-h-5 eb-w-5 eb-text-green-600" />
                          ) : owner.status === 'PENDING_HIERARCHY' ? (
                            <Clock className="eb-h-5 eb-w-5 eb-text-yellow-600" />
                          ) : (
                            <AlertTriangle className="eb-h-5 eb-w-5 eb-text-red-600" />
                          )}
                          <span className="eb-font-medium">{owner.firstName} {owner.lastName}</span>
                        </div>
                        <Badge variant={owner.ownershipType === 'DIRECT' ? 'default' : 'secondary'}>
                          {owner.ownershipType === 'DIRECT' ? 'Direct Owner' : 'Indirect Owner'}
                        </Badge>
                        {owner.status === 'PENDING_HIERARCHY' && (
                          <Badge variant="outline" className="eb-text-yellow-600 eb-border-yellow-300">
                            Pending Hierarchy
                          </Badge>
                        )}
                      </div>
                      <div className="eb-flex eb-items-center eb-gap-2">
                        {owner.status === 'PENDING_HIERARCHY' && (
                          <Button
                            onClick={() => handleBuildHierarchy(owner.id)}
                            size="sm"
                            variant="outline"
                          >
                            Build Ownership Hierarchy
                          </Button>
                        )}
                        {owner.ownershipHierarchy && (
                          <Button
                            onClick={() => handleEditHierarchy(owner.id)}
                            size="sm"
                            variant="outline"
                          >
                            <Edit className="eb-h-4 eb-w-4" />
                            Edit Chain
                          </Button>
                        )}
                        {!readOnly && (
                          <Button
                            onClick={() => handleRemoveOwner(owner.id)}
                            size="sm"
                            variant="outline"
                            className="eb-text-red-600 eb-hover:bg-red-50"
                          >
                            <Trash2 className="eb-h-4 eb-w-4" />
                            Remove
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    {/* Hierarchy visualization for indirect owners with complete hierarchies */}
                    {owner.ownershipHierarchy && owner.status === 'COMPLETE' && (
                      <div className="eb-mt-3 eb-pt-3 eb-border-t">
                        <div className="eb-text-xs eb-text-gray-500 eb-mb-2">Ownership Chain:</div>
                        <div className="eb-flex eb-items-center eb-gap-2 eb-text-sm eb-flex-wrap eb-p-2 eb-bg-gray-50 eb-border eb-rounded">
                          {/* Owner at the start */}
                          <div className="eb-flex eb-items-center eb-gap-1 eb-px-2 eb-py-1 eb-bg-blue-50 eb-border eb-border-blue-200 eb-rounded eb-shrink-0">
                            <User className="eb-h-3 eb-w-3 eb-text-blue-600" />
                            <span className="eb-font-medium eb-text-blue-900">{owner.firstName} {owner.lastName}</span>
                          </div>
                          
                          {/* Company chain */}
                          {owner.ownershipHierarchy.steps.map((step, stepIndex) => {
                            const isDirectOwner = step.ownsRootBusinessDirectly;
                            
                            return (
                              <React.Fragment key={step.id}>
                                <span className="eb-text-gray-400 eb-shrink-0">→</span>
                                <div className={`eb-flex eb-items-center eb-gap-1 eb-px-2 eb-py-1 eb-border eb-rounded eb-shrink-0 ${
                                  isDirectOwner 
                                    ? 'eb-bg-green-50 eb-border-green-200' 
                                    : 'eb-bg-white eb-border-gray-200'
                                }`}>
                                  <Building className={`eb-h-3 eb-w-3 ${
                                    isDirectOwner ? 'eb-text-green-600' : 'eb-text-gray-600'
                                  }`} />
                                  <span className={`eb-font-medium ${
                                    isDirectOwner ? 'eb-text-green-900' : 'eb-text-gray-700'
                                  }`}>
                                    {step.entityName}
                                  </span>
                                  <span className={`eb-text-xs eb-px-1 eb-py-0.5 eb-rounded ${
                                    isDirectOwner 
                                      ? 'eb-bg-primary eb-text-primary-foreground' 
                                      : 'eb-bg-gray-100 eb-text-gray-700'
                                  }`}>
                                    {isDirectOwner ? 'Direct' : 'Intermediary'}
                                  </span>
                                </div>
                              </React.Fragment>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          
          {/* Validation Status */}
          <div>
            <h3 className="eb-font-medium eb-text-gray-900 eb-mb-3">Validation Status:</h3>
            <Alert className={
              validationSummary.hasErrors 
                ? 'eb-border-red-200 eb-bg-red-50' 
                : validationSummary.canComplete 
                ? 'eb-border-green-200 eb-bg-green-50' 
                : 'eb-border-yellow-200 eb-bg-yellow-50'
            }>
              <div className="eb-flex eb-items-center eb-gap-2">
                {validationSummary.hasErrors ? (
                  <AlertTriangle className="eb-h-4 eb-w-4 eb-text-red-600" />
                ) : validationSummary.canComplete ? (
                  <CheckCircle2 className="eb-h-4 eb-w-4 eb-text-green-600" />
                ) : (
                  <Clock className="eb-h-4 eb-w-4 eb-text-yellow-600" />
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
          beneficialOwners.find(o => o.id === currentOwnerBeingEdited)?.firstName + ' ' +
          beneficialOwners.find(o => o.id === currentOwnerBeingEdited)?.lastName : ''
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
          beneficialOwners.find(o => o.id === currentOwnerBeingEdited)?.firstName + ' ' +
          beneficialOwners.find(o => o.id === currentOwnerBeingEdited)?.lastName : ''
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
      `${owner.firstName} ${owner.lastName}`.toLowerCase() === fullName.toLowerCase()
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
          <DialogTitle className="eb-text-lg eb-font-semibold">Add Beneficial Owner</DialogTitle>
        </DialogHeader>
        
        <div className="eb-space-y-6">
          {errors.length > 0 && (
            <Alert className="eb-border-red-200 eb-bg-red-50">
              <AlertTriangle className="eb-h-4 eb-w-4 eb-text-red-600" />
              <AlertDescription>
                <div className="eb-space-y-1">
                  {errors.map((error, index) => (
                    <div key={index} className="eb-text-red-700">{error}</div>
                  ))}
                </div>
              </AlertDescription>
            </Alert>
          )}
          
          <form onSubmit={handleSubmit} className="eb-space-y-5">
            <div className="eb-space-y-2">
              <Label htmlFor="firstName" className="eb-text-sm eb-font-medium">First Name</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="John"
                className="eb-h-10"
              />
            </div>
            
            <div className="eb-space-y-2">
              <Label htmlFor="lastName" className="eb-text-sm eb-font-medium">Last Name</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Smith"
                className="eb-h-10"
              />
            </div>
            
            <div className="eb-space-y-3">
              <Label className="eb-text-sm eb-font-medium">Ownership Type</Label>
              <RadioGroup
                value={ownershipType}
                onValueChange={(value: 'DIRECT' | 'INDIRECT') => setOwnershipType(value)}
                className="eb-space-y-3"
              >
                <div className="eb-flex eb-items-start eb-space-x-3 eb-p-3 eb-border eb-rounded-lg eb-hover:bg-gray-50 eb-cursor-pointer">
                  <RadioGroupItem value="DIRECT" id="direct" className="eb-mt-0.5" />
                  <div className="eb-flex-1 eb-space-y-1">
                    <Label htmlFor="direct" className="eb-font-medium eb-cursor-pointer">
                      Direct Owner
                    </Label>
                    <p className="eb-text-sm eb-text-gray-600">
                      Has 25% or more ownership directly
                    </p>
                  </div>
                </div>
                <div className="eb-flex eb-items-start eb-space-x-3 eb-p-3 eb-border eb-rounded-lg eb-hover:bg-gray-50 eb-cursor-pointer">
                  <RadioGroupItem value="INDIRECT" id="indirect" className="eb-mt-0.5" />
                  <div className="eb-flex-1 eb-space-y-1">
                    <Label htmlFor="indirect" className="eb-font-medium eb-cursor-pointer">
                      Indirect Owner
                    </Label>
                    <p className="eb-text-sm eb-text-gray-600">
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
      <div className="eb-p-4 eb-bg-gray-50 eb-border eb-rounded-lg eb-border-gray-200">
        <div className="eb-text-sm eb-font-semibold eb-text-gray-800 eb-mb-3">Current Chain:</div>
        <div className="eb-flex eb-items-center eb-gap-2 eb-text-sm eb-flex-wrap">
          {/* Owner at start */}
          <div className="eb-flex eb-items-center eb-gap-2 eb-px-3 eb-py-2 eb-bg-blue-50 eb-border eb-border-blue-200 eb-rounded-lg eb-shadow-sm">
            <User className="eb-h-4 eb-w-4 eb-text-blue-600" />
            <span className="eb-font-semibold eb-text-blue-900">{ownerName}</span>
          </div>
          
          {/* Company chain */}
          {hierarchySteps.map((step) => (
            <React.Fragment key={step.id}>
              <span className="eb-text-gray-400 eb-text-lg eb-font-bold">→</span>
              <div className="eb-flex eb-items-center eb-gap-2 eb-px-3 eb-py-2 eb-bg-white eb-border eb-border-gray-200 eb-rounded-lg eb-shadow-sm">
                <Building className="eb-h-4 eb-w-4 eb-text-gray-600" />
                <span className="eb-font-semibold eb-text-gray-700">{step.entityName}</span>
              </div>
            </React.Fragment>
          ))}
          
          {/* Next step indicator */}
          <span className="eb-text-gray-400 eb-text-lg eb-font-bold">→</span>
          <div className="eb-flex eb-items-center eb-gap-2 eb-px-3 eb-py-2 eb-bg-green-50 eb-border eb-border-green-200 eb-rounded-lg eb-border-dashed eb-shadow-sm">
            <Building className="eb-h-4 eb-w-4 eb-text-green-600" />
            <span className="eb-font-semibold eb-text-green-900">{rootCompanyName}</span>
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
          <DialogTitle className="eb-text-lg eb-font-semibold">
            {isEditMode ? 'Edit' : 'Build'} Ownership Chain for {ownerName}
          </DialogTitle>
        </DialogHeader>

        <div className="eb-space-y-6">
          <div className="eb-text-sm eb-text-gray-600 eb-leading-relaxed">
            {isEditMode ? (
              <>
                Edit the ownership chain from <span className="eb-font-medium eb-text-gray-900">{ownerName}</span> to{' '}
                <span className="eb-font-medium eb-text-gray-900">{rootCompanyName}</span>.
              </>
            ) : (
              <>
                We'll build the chain step by step from <span className="eb-font-medium eb-text-gray-900">{ownerName}</span> to{' '}
                <span className="eb-font-medium eb-text-gray-900">{rootCompanyName}</span>.
              </>
            )}
          </div>

          {/* Chain Preview */}
          {renderChainPreview()}

          {/* Edit Mode: Existing Steps Management */}
          {isEditMode && hierarchySteps.length > 0 && (
            <div className="eb-space-y-4">
              <div className="eb-text-sm eb-font-medium eb-text-gray-800">
                Current Steps (click to remove):
              </div>
              <div className="eb-space-y-2">
                {hierarchySteps.map((step, index) => (
                  <div key={step.id} className="eb-flex eb-items-center eb-justify-between eb-p-3 eb-bg-white eb-border eb-rounded-lg eb-shadow-sm">
                    <div className="eb-flex eb-items-center eb-gap-3">
                      <span className="eb-text-sm eb-font-medium eb-text-gray-600">
                        Step {index + 1}:
                      </span>
                      <div className="eb-flex eb-items-center eb-gap-2">
                        <Building className="eb-h-4 eb-w-4 eb-text-gray-600" />
                        <span className="eb-font-medium">{step.entityName}</span>
                        {index === hierarchySteps.length - 1 && step.ownsRootBusinessDirectly && (
                          <Badge className="eb-bg-green-100 eb-text-green-800 eb-text-xs">
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
                      className="eb-text-red-600 eb-hover:bg-red-50"
                    >
                      <Trash2 className="eb-h-3 eb-w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Company Input Form */}
          <div className="eb-space-y-5 eb-p-5 eb-border eb-rounded-lg eb-bg-blue-50 eb-border-blue-200">
            <div className="eb-text-sm eb-font-medium eb-text-gray-800">
              {getInstructionText()}
            </div>
            
            <div className="eb-space-y-2">
              <Label htmlFor="companyName" className="eb-text-sm eb-font-medium eb-text-gray-700">
                Company Name
              </Label>
              <Input
                id="companyName"
                value={currentCompanyName}
                onChange={(e) => setCurrentCompanyName(e.target.value)}
                placeholder="Enter company name"
                className="eb-h-10 eb-bg-white eb-border-blue-300 eb-focus:border-blue-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && currentCompanyName.trim()) {
                    e.preventDefault();
                    // Don't auto-submit, let user choose
                  }
                }}
              />
            </div>

            <div className="eb-space-y-3">
              <div className="eb-text-sm eb-font-medium eb-text-gray-800">
                Does <span className="eb-font-bold eb-text-blue-900">{currentCompanyName || '[Company Name]'}</span> directly own{' '}
                <span className="eb-font-bold eb-text-blue-900">{rootCompanyName}</span>?
              </div>

              <div className="eb-flex eb-gap-3">
                <Button 
                  onClick={() => handleAddCompany(true)}
                  disabled={!currentCompanyName.trim()}
                  className="eb-flex-1 eb-bg-green-600 hover:eb-bg-green-700 eb-font-medium eb-h-10"
                >
                  Yes - Complete Chain
                </Button>
                <Button 
                  onClick={() => handleAddCompany(false)}
                  disabled={!currentCompanyName.trim()}
                  variant="outline"
                  className="eb-flex-1 eb-border-blue-300 eb-text-blue-700 hover:eb-bg-blue-50 eb-font-medium eb-h-10"
                >
                  No - Continue Chain
                </Button>
              </div>
            </div>
          </div>

          {/* Error Messages */}
          {errors.length > 0 && (
            <div className="eb-p-4 eb-bg-red-50 eb-border eb-border-red-200 eb-rounded-lg">
              <div className="eb-text-red-800 eb-text-sm eb-space-y-1">
                {errors.map((error, index) => (
                  <div key={index} className="eb-flex eb-items-center eb-gap-2">
                    <AlertTriangle className="eb-h-3 eb-w-3 eb-text-red-600 eb-shrink-0" />
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
