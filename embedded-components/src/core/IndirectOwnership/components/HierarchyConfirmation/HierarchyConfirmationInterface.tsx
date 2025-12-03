'use client';

import React, { useState } from 'react';
import { CheckCircle2, Edit, Check, ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { renderOwnershipChain } from '../OwnershipStructureList';
import type { HierarchyConfirmationInterfaceProps } from './types';
import type { V2BeneficialOwner } from '../V2AlternateIndirectOwnership/types';

/**
 * HierarchyConfirmationInterface - Confirm ownership hierarchy before finalizing
 * 
 * Features:
 * - Reuses existing AlternateOwnershipReview.renderOwnershipChain() for visual hierarchy
 * - Beneficial ownership threshold confirmation
 * - Validation status display
 * - Edit/Confirm actions
 * - Can be integrated into main interface or separate confirmation step
 */
export const HierarchyConfirmationInterface: React.FC<HierarchyConfirmationInterfaceProps> = ({
  isOpen,
  ownerId,
  hierarchy,
  rootCompanyName,
  onConfirm,
  onEdit,
  mode = 'dialog',
  testId = 'hierarchy-confirmation-interface',
}) => {
  const { t } = useTranslation();
  const [isConfirming, setIsConfirming] = useState(false);

  // Get owner name from hierarchy
  const ownerStep = hierarchy.steps.find(step => step.entityType === 'INDIVIDUAL');
  const ownerName = ownerStep?.entityName || 'Owner';

  // Create mock owner for rendering
  const previewOwner: V2BeneficialOwner = {
    id: ownerId,
    firstName: ownerName.split(' ')[0] || ownerName,
    lastName: ownerName.split(' ').slice(1).join(' ') || '',
    ownershipType: 'INDIRECT',
    status: 'COMPLETE',
    ownershipHierarchy: hierarchy,
    meets25PercentThreshold: hierarchy.meets25PercentThreshold,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Handle confirmation
  const handleConfirm = async () => {
    setIsConfirming(true);
    try {
      await onConfirm(ownerId, hierarchy);
    } catch (error) {
      console.error('Failed to confirm hierarchy:', error);
    } finally {
      setIsConfirming(false);
    }
  };

  // Get validation summary
  const getValidationSummary = () => {
    const checks = [];
    
    // Check if hierarchy is valid
    if (hierarchy.isValid) {
      checks.push({ status: 'success', message: 'Ownership hierarchy is valid' });
    } else {
      checks.push({ status: 'error', message: 'Ownership hierarchy has validation errors' });
    }

    // Check 25% threshold
    if (hierarchy.meets25PercentThreshold) {
      checks.push({ status: 'success', message: 'Meets 25% beneficial ownership threshold' });
    } else {
      checks.push({ status: 'warning', message: 'May not meet 25% beneficial ownership threshold' });
    }

    // Check if Business Being Onboarded is identified
    const hasBusinessBeingOnboarded = hierarchy.steps.some(step => step.isBusinessBeingOnboarded);
    if (hasBusinessBeingOnboarded) {
      checks.push({ status: 'success', message: 'Hierarchy leads to Business Being Onboarded' });
    } else {
      checks.push({ status: 'error', message: 'Business Being Onboarded not identified in hierarchy' });
    }

    return checks;
  };

  const validationChecks = getValidationSummary();
  const hasErrors = validationChecks.some(check => check.status === 'error');

  // Render the content
  const renderContent = () => (
    <div className="eb-space-y-6" data-testid={testId}>
      {/* Header */}
      <div>
        <h3 className="eb-text-lg eb-font-medium eb-text-gray-900 eb-mb-2">
          Confirm Ownership Hierarchy
        </h3>
        <p className="eb-text-sm eb-text-gray-600">
          Review the ownership chain for {ownerName} and confirm it's correct.
        </p>
      </div>

      {/* Owner Information */}
      <Card>
        <CardHeader>
          <CardTitle className="eb-text-base eb-flex eb-items-center eb-gap-2">
            <CheckCircle2 className="eb-h-4 eb-w-4 eb-text-blue-600" />
            Owner: {ownerName}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Ownership Chain Visualization */}
          <div className="eb-space-y-3">
            <div className="eb-font-medium eb-text-sm eb-text-gray-700">Ownership Chain:</div>
            {renderOwnershipChain(previewOwner, rootCompanyName)}
          </div>
        </CardContent>
      </Card>

      {/* Validation Summary */}
      <div className="eb-space-y-3">
        <h4 className="eb-font-medium eb-text-gray-900">Validation Summary:</h4>
        <div className="eb-space-y-2">
          {validationChecks.map((check, index) => (
            <Alert 
              key={index}
              className={
                check.status === 'success' 
                  ? 'eb-border-green-200 eb-bg-green-50' 
                  : check.status === 'error'
                  ? 'eb-border-red-200 eb-bg-red-50'
                  : 'eb-border-yellow-200 eb-bg-yellow-50'
              }
            >
              <CheckCircle2 className={`eb-h-4 eb-w-4 ${
                check.status === 'success' 
                  ? 'eb-text-green-600' 
                  : check.status === 'error'
                  ? 'eb-text-red-600'
                  : 'eb-text-yellow-600'
              }`} />
              <AlertDescription className={
                check.status === 'success' 
                  ? 'eb-text-green-700' 
                  : check.status === 'error'
                  ? 'eb-text-red-700'
                  : 'eb-text-yellow-700'
              }>
                {check.status === 'success' ? '✓' : check.status === 'error' ? '❌' : '⚠'} {check.message}
              </AlertDescription>
            </Alert>
          ))}
        </div>
      </div>

      {/* Hierarchy Details */}
      <Card>
        <CardHeader>
          <CardTitle className="eb-text-base">Hierarchy Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="eb-space-y-3">
            <div className="eb-text-sm eb-text-gray-600">
              <strong>Total Steps:</strong> {hierarchy.steps.length}
            </div>
            <div className="eb-text-sm eb-text-gray-600">
              <strong>Intermediate Companies:</strong> {hierarchy.steps.filter(s => s.entityType === 'COMPANY' && !s.isBusinessBeingOnboarded).length}
            </div>
            <div className="eb-text-sm eb-text-gray-600">
              <strong>Business Being Onboarded:</strong> {hierarchy.steps.find(s => s.isBusinessBeingOnboarded)?.entityName || 'Not identified'}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Validation Errors */}
      {hierarchy.validationErrors && hierarchy.validationErrors.length > 0 && (
        <Alert className="eb-border-red-200 eb-bg-red-50">
          <AlertDescription className="eb-text-red-700">
            <div className="eb-space-y-1">
              {hierarchy.validationErrors.map((error, index) => (
                <div key={index}>❌ {error}</div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Actions */}
      <div className="eb-flex eb-justify-between eb-items-center eb-pt-4 eb-border-t">
        <Button variant="outline" onClick={onEdit} disabled={isConfirming}>
          <Edit className="eb-h-4 eb-w-4 eb-mr-2" />
          Edit Hierarchy
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={hasErrors || isConfirming}
          className="eb-bg-green-600 hover:eb-bg-green-700"
        >
          <Check className="eb-h-4 eb-w-4 eb-mr-2" />
          {isConfirming ? 'Confirming...' : 'Confirm & Add'}
        </Button>
      </div>
    </div>
  );

  // Render based on mode
  if (mode === 'dialog') {
    return (
      <Dialog open={isOpen}>
        <DialogContent className="eb-max-w-4xl eb-max-h-[90vh] eb-overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Confirm Ownership Hierarchy</DialogTitle>
            <DialogDescription>
              Review and confirm the ownership hierarchy for {ownerName}.
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
