'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Building, Plus, Trash2, Check, ArrowLeft, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { renderOwnershipChain } from '../OwnershipStructureList';
import type { 
  HierarchyBuildingInterfaceProps, 
  HierarchyStepFormData,
  HierarchyBuildingErrors 
} from './types';
import type { 
  OwnershipHierarchy, 
  HierarchyStep, 
  V2BeneficialOwner 
} from '../V2AlternateIndirectOwnership/types';

/**
 * HierarchyBuildingInterface - Flexible interface for building ownership hierarchies
 * 
 * Features:
 * - Flexible implementation approach (dialog, inline, or integrated)
 * - Reuses existing hierarchy validation logic and business rules
 * - Integrates existing AlternateOwnershipReview.renderOwnershipChain() for real-time preview
 * - Leverages existing Business Being Onboarded identification and validation
 */
export const HierarchyBuildingInterface: React.FC<HierarchyBuildingInterfaceProps> = ({
  isOpen,
  ownerId,
  ownerName,
  rootCompanyName,
  currentHierarchy,
  onComplete,
  onCancel,
  mode = 'dialog',
  testId = 'hierarchy-building-interface',
}) => {
  const { t } = useTranslation();

  // State for building the hierarchy
  const [hierarchySteps, setHierarchySteps] = useState<HierarchyStep[]>([]);
  const [currentStep, setCurrentStep] = useState<HierarchyStepFormData>({
    entityName: '',
    hasOwnership: true,
    isBusinessBeingOnboarded: false,
  });
  const [errors, setErrors] = useState<HierarchyBuildingErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize hierarchy from existing data
  useEffect(() => {
    if (isOpen && currentHierarchy) {
      setHierarchySteps([...currentHierarchy.steps]);
    } else if (isOpen) {
      // Start fresh
      setHierarchySteps([]);
    }
  }, [isOpen, currentHierarchy]);

  // Validate current step
  const validateStep = useCallback((stepData: HierarchyStepFormData): HierarchyBuildingErrors => {
    const newErrors: HierarchyBuildingErrors = {};

    if (!stepData.entityName.trim()) {
      newErrors.entityName = 'Company name is required';
    }

    // Check if Business Being Onboarded was already identified in previous steps
    const businessAlreadyIdentified = hierarchySteps.some(step => step.isBusinessBeingOnboarded);
    if (businessAlreadyIdentified && stepData.isBusinessBeingOnboarded) {
      newErrors.business = 'Business Being Onboarded already identified in the chain';
    }

    return newErrors;
  }, [hierarchySteps]);

  // Add a step to the hierarchy
  const addStep = useCallback(() => {
    const validationErrors = validateStep(currentStep);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const newStep: HierarchyStep = {
      id: `step-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      entityName: currentStep.entityName.trim(),
      entityType: 'COMPANY',
      hasOwnership: currentStep.hasOwnership,
      isBusinessBeingOnboarded: currentStep.isBusinessBeingOnboarded,
      level: hierarchySteps.length + 1,
    };

    setHierarchySteps([...hierarchySteps, newStep]);
    setCurrentStep({
      entityName: '',
      hasOwnership: true,
      isBusinessBeingOnboarded: false,
    });
    setErrors({});
  }, [currentStep, hierarchySteps, validateStep]);

  // Remove a step from the hierarchy
  const removeStep = useCallback((stepId: string) => {
    const updatedSteps = hierarchySteps
      .filter(step => step.id !== stepId)
      .map((step, index) => ({ ...step, level: index + 1 }));
    setHierarchySteps(updatedSteps);
  }, [hierarchySteps]);

  // Validate complete hierarchy
  const validateHierarchy = useCallback((): string[] => {
    const errors: string[] = [];

    if (hierarchySteps.length === 0) {
      errors.push('At least one intermediate company is required for indirect ownership');
    }

    const businessBeingOnboarded = hierarchySteps.find(step => step.isBusinessBeingOnboarded);
    if (!businessBeingOnboarded) {
      errors.push('You must identify which company is the Business Being Onboarded');
    }

    // Ensure the chain makes sense (Business Being Onboarded should be at the end)
    if (businessBeingOnboarded && businessBeingOnboarded.level !== hierarchySteps.length) {
      errors.push('Business Being Onboarded should be the final company in the ownership chain');
    }

    return errors;
  }, [hierarchySteps]);

  // Complete the hierarchy
  const handleComplete = useCallback(async () => {
    const validationErrors = validateHierarchy();
    if (validationErrors.length > 0) {
      setErrors({ general: validationErrors[0] });
      return;
    }

    setIsSubmitting(true);
    try {
      // Create the complete hierarchy
      const hierarchy: OwnershipHierarchy = {
        id: currentHierarchy?.id || `hierarchy-${Date.now()}`,
        steps: [
          // Add the beneficial owner as the first step
          {
            id: `owner-${ownerId}`,
            entityName: ownerName,
            entityType: 'INDIVIDUAL',
            hasOwnership: true,
            isBusinessBeingOnboarded: false,
            level: 0,
          },
          // Add all the company steps
          ...hierarchySteps,
        ],
        isValid: true,
        meets25PercentThreshold: true, // Assumed valid for now
        createdAt: currentHierarchy?.createdAt || new Date(),
        updatedAt: new Date(),
      };

      await onComplete(ownerId, hierarchy);
    } catch (error) {
      setErrors({ general: error instanceof Error ? error.message : 'Failed to save hierarchy' });
    } finally {
      setIsSubmitting(false);
    }
  }, [hierarchySteps, validateHierarchy, currentHierarchy, ownerId, ownerName, onComplete]);

  // Create mock owner for preview
  const previewOwner: V2BeneficialOwner = {
    id: ownerId,
    firstName: ownerName.split(' ')[0] || ownerName,
    lastName: ownerName.split(' ').slice(1).join(' ') || '',
    ownershipType: 'INDIRECT',
    status: 'COMPLETE',
    ownershipHierarchy: hierarchySteps.length > 0 ? {
      id: 'preview',
      steps: [
        {
          id: `owner-${ownerId}`,
          entityName: ownerName,
          entityType: 'INDIVIDUAL',
          hasOwnership: true,
          isBusinessBeingOnboarded: false,
          level: 0,
        },
        ...hierarchySteps,
      ],
      isValid: true,
      meets25PercentThreshold: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    } : undefined,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Render the content
  const renderContent = () => (
    <div className="eb-space-y-6" data-testid={testId}>
      {/* Header */}
      <div>
        <h3 className="eb-text-lg eb-font-medium eb-text-gray-900 eb-mb-2">
          Build Ownership Hierarchy for {ownerName}
        </h3>
        <p className="eb-text-sm eb-text-gray-600">
          Show how {ownerName} owns 25% or more of {rootCompanyName} through other companies.
        </p>
      </div>

      {/* Current Hierarchy Steps */}
      {hierarchySteps.length > 0 && (
        <div className="eb-space-y-3">
          <h4 className="eb-font-medium eb-text-gray-900">Ownership Chain:</h4>
          <div className="eb-space-y-2">
            {hierarchySteps.map((step, index) => (
              <div key={step.id} className="eb-flex eb-items-center eb-justify-between eb-p-3 eb-border eb-rounded-lg eb-bg-gray-50">
                <div className="eb-flex eb-items-center eb-gap-3">
                  <div className="eb-flex eb-items-center eb-gap-2">
                    <span className="eb-text-sm eb-font-medium eb-text-gray-500">
                      Step {index + 1}:
                    </span>
                    <Building className="eb-h-4 eb-w-4 eb-text-gray-600" />
                    <span className="eb-font-medium">{step.entityName}</span>
                  </div>
                  {step.isBusinessBeingOnboarded && (
                    <span className="eb-text-xs eb-px-2 eb-py-1 eb-bg-green-100 eb-text-green-700 eb-rounded">
                      Business Being Onboarded
                    </span>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeStep(step.id)}
                  className="eb-text-red-600 hover:eb-text-red-700"
                >
                  <Trash2 className="eb-h-4 eb-w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add New Step Form */}
      <Card>
        <CardHeader>
          <CardTitle className="eb-text-base">
            {hierarchySteps.length === 0 ? `${ownerName} directly owns:` : `${hierarchySteps[hierarchySteps.length - 1]?.entityName} owns:`}
          </CardTitle>
        </CardHeader>
        <CardContent className="eb-space-y-4">
          {/* Company Name */}
          <div className="eb-space-y-2">
            <Label htmlFor="companyName">Company Name *</Label>
            <Input
              id="companyName"
              value={currentStep.entityName}
              onChange={(e) => setCurrentStep({ ...currentStep, entityName: e.target.value })}
              placeholder="Enter company name"
              className={errors.entityName ? 'eb-border-red-300' : ''}
            />
            {errors.entityName && (
              <p className="eb-text-sm eb-text-red-600">{errors.entityName}</p>
            )}
          </div>

          {/* Ownership Confirmation */}
          <div className="eb-flex eb-items-center eb-space-x-2">
            <Checkbox
              id="hasOwnership"
              checked={currentStep.hasOwnership}
              onCheckedChange={(checked) => setCurrentStep({ ...currentStep, hasOwnership: !!checked })}
            />
            <Label htmlFor="hasOwnership" className="eb-text-sm">
              Has 25% or more ownership
            </Label>
          </div>

          {/* Business Being Onboarded */}
          <div className="eb-flex eb-items-center eb-space-x-2">
            <Checkbox
              id="isBusinessBeingOnboarded"
              checked={currentStep.isBusinessBeingOnboarded}
              onCheckedChange={(checked) => setCurrentStep({ ...currentStep, isBusinessBeingOnboarded: !!checked })}
            />
            <Label htmlFor="isBusinessBeingOnboarded" className="eb-text-sm eb-font-medium">
              This is the Business Being Onboarded ({rootCompanyName})
            </Label>
          </div>
          {errors.business && (
            <p className="eb-text-sm eb-text-red-600">{errors.business}</p>
          )}

          {/* Add Step Button */}
          <Button
            onClick={addStep}
            disabled={!currentStep.entityName.trim()}
            className="eb-w-full eb-flex eb-items-center eb-gap-2"
          >
            <Plus className="eb-h-4 eb-w-4" />
            Add Company to Chain
          </Button>
        </CardContent>
      </Card>

      {/* Real-time Preview */}
      {hierarchySteps.length > 0 && (
        <div className="eb-space-y-3">
          <h4 className="eb-font-medium eb-text-gray-900">Preview:</h4>
          <div className="eb-p-4 eb-border eb-rounded-lg eb-bg-blue-50">
            {renderOwnershipChain(previewOwner, rootCompanyName)}
          </div>
        </div>
      )}

      {/* Validation Errors */}
      {errors.general && (
        <Alert className="eb-border-red-200 eb-bg-red-50">
          <AlertDescription className="eb-text-red-700">
            {errors.general}
          </AlertDescription>
        </Alert>
      )}

      {/* Actions */}
      <div className="eb-flex eb-justify-between eb-items-center eb-pt-4 eb-border-t">
        <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
          <ArrowLeft className="eb-h-4 eb-w-4 eb-mr-2" />
          Back
        </Button>
        <div className="eb-flex eb-gap-2">
          <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleComplete}
            disabled={hierarchySteps.length === 0 || isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Save Hierarchy'}
          </Button>
        </div>
      </div>
    </div>
  );

  // Render based on mode
  if (mode === 'dialog') {
    return (
      <Dialog open={isOpen} onOpenChange={onCancel}>
        <DialogContent className="eb-max-w-4xl eb-max-h-[90vh] eb-overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Build Ownership Hierarchy</DialogTitle>
            <DialogDescription>
              Create the ownership chain showing how {ownerName} owns 25% or more of {rootCompanyName}.
            </DialogDescription>
          </DialogHeader>
          <div className="eb-py-4">
            {renderContent()}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // For inline and integrated modes, render directly
  return isOpen ? renderContent() : null;
};
