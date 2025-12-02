'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';

import type { AlternateOwnershipProps } from '../types/types';
import { useAlternateOwnership } from '../hooks/useAlternateOwnership';

import { AlternateBeneficialOwnerForm } from '../components/AlternateBeneficialOwnerForm';
import { OwnershipTypeSelector } from '../components/OwnershipTypeSelector';
import { HierarchyBuilder } from '../components/HierarchyBuilder';
import { AlternateOwnershipReview } from '../components/AlternateOwnershipReview';

/**
 * AlternateIndirectOwnership - Main container for the alternate ownership flow
 */
export const AlternateIndirectOwnership: React.FC<AlternateOwnershipProps> = ({
  kycCompanyName = 'your company',
  onOwnershipComplete,
  onStepChange,
  initialBeneficialOwners,
  autoAdvance = false,
  maxHierarchyLevels = 10,
  readOnly = false,
}) => {
  const { t } = useTranslation();

  const {
    state,
    updateBeneficialOwners,
    setOwnershipType,
    setOwnerHierarchy,
    goToStep,
    nextOwner,
    previousOwner,
    completeOwnership,
    getCurrentOwner,
    getOwnersNeedingClassification,
    getOwnersNeedingHierarchy,
  } = useAlternateOwnership(kycCompanyName, initialBeneficialOwners);

  // Notify parent of step changes
  React.useEffect(() => {
    if (onStepChange) {
      onStepChange(state.currentStep, state.currentOwnerIndex);
    }
  }, [state.currentStep, state.currentOwnerIndex, onStepChange]);

  // Handle completion
  const handleComplete = () => {
    completeOwnership();
    if (onOwnershipComplete) {
      onOwnershipComplete(state);
    }
  };

  // Handle owners form
  const handleOwnersNext = () => {
    if (state.beneficialOwners.length > 0) {
      goToStep('CLASSIFICATION', 0);
    }
  };

  // Handle ownership classification
  const handleTypeSelect = (type: 'DIRECT' | 'INDIRECT') => {
    const currentOwner = getCurrentOwner();
    if (currentOwner) {
      setOwnershipType(currentOwner.id, type);
    }
  };

  const handleClassificationContinue = () => {
    const currentOwner = getCurrentOwner();
    
    if (currentOwner?.ownershipType === 'INDIRECT') {
      // Go to hierarchy building for this owner
      goToStep('HIERARCHY', state.currentOwnerIndex);
    } else {
      // Move to next owner or review
      const nextIndex = state.currentOwnerIndex + 1;
      if (nextIndex < state.beneficialOwners.length) {
        goToStep('CLASSIFICATION', nextIndex);
      } else {
        // Check if any owners still need hierarchy building
        const needsHierarchy = getOwnersNeedingHierarchy();
        if (needsHierarchy.length > 0) {
          const firstIndirectOwner = state.beneficialOwners.findIndex(
            owner => owner.ownershipType === 'INDIRECT' && (!owner.hierarchyChain || owner.hierarchyChain.length === 0)
          );
          goToStep('HIERARCHY', firstIndirectOwner);
        } else {
          goToStep('REVIEW');
        }
      }
    }
  };

  const handleClassificationBack = () => {
    if (state.currentOwnerIndex > 0) {
      goToStep('CLASSIFICATION', state.currentOwnerIndex - 1);
    } else {
      goToStep('OWNERS');
    }
  };

  // Handle hierarchy building
  const handleHierarchyChange = (hierarchyChain: any[]) => {
    const currentOwner = getCurrentOwner();
    if (currentOwner) {
      setOwnerHierarchy(currentOwner.id, hierarchyChain);
    }
  };

  const handleHierarchyContinue = () => {
    // Check if there are more indirect owners needing hierarchy
    const needsHierarchy = getOwnersNeedingHierarchy().filter(
      owner => owner.id !== getCurrentOwner()?.id
    );
    
    if (needsHierarchy.length > 0) {
      const nextIndirectOwnerIndex = state.beneficialOwners.findIndex(
        owner => owner.id === needsHierarchy[0].id
      );
      goToStep('HIERARCHY', nextIndirectOwnerIndex);
    } else {
      // Check if there are unclassified owners
      const needsClassification = getOwnersNeedingClassification();
      if (needsClassification.length > 0) {
        const nextUnclassifiedIndex = state.beneficialOwners.findIndex(
          owner => owner.ownershipType === 'PENDING_CLASSIFICATION'
        );
        goToStep('CLASSIFICATION', nextUnclassifiedIndex);
      } else {
        goToStep('REVIEW');
      }
    }
  };

  const handleHierarchyBack = () => {
    goToStep('CLASSIFICATION', state.currentOwnerIndex);
  };

  // Render current step
  const renderCurrentStep = () => {
    switch (state.currentStep) {
      case 'OWNERS':
        return (
          <AlternateBeneficialOwnerForm
            owners={state.beneficialOwners}
            onOwnersChange={updateBeneficialOwners}
            onNext={handleOwnersNext}
            kycCompanyName={kycCompanyName}
            readOnly={readOnly}
          />
        );

      case 'CLASSIFICATION': {
        const currentOwner = getCurrentOwner();
        if (!currentOwner) return null;

        return (
          <OwnershipTypeSelector
            owner={currentOwner}
            selectedType={currentOwner.ownershipType !== 'PENDING_CLASSIFICATION' ? currentOwner.ownershipType : undefined}
            onTypeSelect={handleTypeSelect}
            onBack={handleClassificationBack}
            onContinue={handleClassificationContinue}
            kycCompanyName={kycCompanyName}
            currentOwnerIndex={state.currentOwnerIndex}
            totalOwners={state.beneficialOwners.length}
            isLastOwner={state.currentOwnerIndex === state.beneficialOwners.length - 1}
          />
        );
      }

      case 'HIERARCHY': {
        const currentOwner = getCurrentOwner();
        if (!currentOwner) return null;

        return (
          <HierarchyBuilder
            owner={currentOwner}
            hierarchyChain={currentOwner.hierarchyChain || []}
            onHierarchyChange={handleHierarchyChange}
            onBack={handleHierarchyBack}
            onContinue={handleHierarchyContinue}
            kycCompanyName={kycCompanyName}
            maxLevels={maxHierarchyLevels}
          />
        );
      }

      case 'REVIEW':
        return (
          <AlternateOwnershipReview
            beneficialOwners={state.beneficialOwners}
            kycCompanyName={kycCompanyName}
            onBack={() => {
              // Go back to the last step that makes sense
              const needsHierarchy = getOwnersNeedingHierarchy();
              const needsClassification = getOwnersNeedingClassification();
              
              if (needsHierarchy.length > 0) {
                const lastIndirectOwnerIndex = state.beneficialOwners.findIndex(
                  owner => owner.id === needsHierarchy[needsHierarchy.length - 1].id
                );
                goToStep('HIERARCHY', lastIndirectOwnerIndex);
              } else if (needsClassification.length > 0) {
                const lastUnclassifiedIndex = state.beneficialOwners.findIndex(
                  owner => owner.id === needsClassification[needsClassification.length - 1].id
                );
                goToStep('CLASSIFICATION', lastUnclassifiedIndex);
              } else {
                goToStep('CLASSIFICATION', state.beneficialOwners.length - 1);
              }
            }}
            onComplete={handleComplete}
            onAddMoreOwners={() => goToStep('OWNERS')}
            readOnly={readOnly}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="eb-alternate-indirect-ownership eb-w-full eb-max-w-4xl eb-mx-auto eb-p-4">
      {renderCurrentStep()}
    </div>
  );
};
