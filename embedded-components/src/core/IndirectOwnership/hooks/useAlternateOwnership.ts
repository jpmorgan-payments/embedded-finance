'use client';

import React from 'react';
import type { AlternateBeneficialOwner, AlternateOwnershipState } from '../types/types';

/**
 * Hook for managing the alternate ownership flow state
 */
export const useAlternateOwnership = (
  kycCompanyName?: string,
  initialOwners?: AlternateBeneficialOwner[]
) => {
  const [state, setState] = React.useState<AlternateOwnershipState>({
    kycCompanyName: kycCompanyName || '',
    beneficialOwners: initialOwners || [],
    currentStep: 'OWNERS',
    currentOwnerIndex: 0,
    validationErrors: [],
    isComplete: false,
  });

  const updateBeneficialOwners = React.useCallback((owners: any[]) => {
    setState(prev => ({
      ...prev,
      beneficialOwners: owners.map(owner => ({
        ...owner,
        ownershipType: owner.ownershipType || 'PENDING_CLASSIFICATION',
        hierarchyChain: owner.hierarchyChain || [],
        owns25PercentOfKycCompany: true,
      })),
    }));
  }, []);

  const setOwnershipType = React.useCallback((ownerId: string, type: 'DIRECT' | 'INDIRECT') => {
    setState(prev => ({
      ...prev,
      beneficialOwners: prev.beneficialOwners.map(owner => 
        owner.id === ownerId 
          ? { ...owner, ownershipType: type, hierarchyChain: type === 'DIRECT' ? [] : owner.hierarchyChain }
          : owner
      ),
    }));
  }, []);

  const setOwnerHierarchy = React.useCallback((ownerId: string, hierarchyChain: any[]) => {
    setState(prev => ({
      ...prev,
      beneficialOwners: prev.beneficialOwners.map(owner => 
        owner.id === ownerId 
          ? { ...owner, hierarchyChain }
          : owner
      ),
    }));
  }, []);

  const goToStep = React.useCallback((step: AlternateOwnershipState['currentStep'], ownerIndex = 0) => {
    setState(prev => ({
      ...prev,
      currentStep: step,
      currentOwnerIndex: ownerIndex,
      validationErrors: [],
    }));
  }, []);

  const nextOwner = React.useCallback(() => {
    setState(prev => {
      const nextIndex = prev.currentOwnerIndex + 1;
      
      // Check if we need to move to hierarchy building for this owner
      const currentOwner = prev.beneficialOwners[prev.currentOwnerIndex];
      if (currentOwner?.ownershipType === 'INDIRECT') {
        return {
          ...prev,
          currentStep: 'HIERARCHY',
        };
      }

      // If there are more owners to classify, go to next owner
      if (nextIndex < prev.beneficialOwners.length) {
        return {
          ...prev,
          currentOwnerIndex: nextIndex,
        };
      }

      // All owners classified, go to review
      return {
        ...prev,
        currentStep: 'REVIEW',
        currentOwnerIndex: 0,
      };
    });
  }, []);

  const previousOwner = React.useCallback(() => {
    setState(prev => {
      const prevIndex = prev.currentOwnerIndex - 1;
      
      if (prevIndex >= 0) {
        return {
          ...prev,
          currentOwnerIndex: prevIndex,
        };
      }

      // Go back to owners step
      return {
        ...prev,
        currentStep: 'OWNERS',
        currentOwnerIndex: 0,
      };
    });
  }, []);

  const completeOwnership = React.useCallback(() => {
    setState(prev => ({
      ...prev,
      isComplete: true,
    }));
  }, []);

  const resetFlow = React.useCallback(() => {
    setState({
      kycCompanyName: kycCompanyName || '',
      beneficialOwners: [],
      currentStep: 'OWNERS',
      currentOwnerIndex: 0,
      validationErrors: [],
      isComplete: false,
    });
  }, [kycCompanyName]);

  const getCurrentOwner = React.useCallback(() => {
    return state.beneficialOwners[state.currentOwnerIndex];
  }, [state.beneficialOwners, state.currentOwnerIndex]);

  const getOwnersNeedingClassification = React.useCallback(() => {
    return state.beneficialOwners.filter(owner => owner.ownershipType === 'PENDING_CLASSIFICATION');
  }, [state.beneficialOwners]);

  const getOwnersNeedingHierarchy = React.useCallback(() => {
    return state.beneficialOwners.filter(
      owner => owner.ownershipType === 'INDIRECT' && (!owner.hierarchyChain || owner.hierarchyChain.length === 0)
    );
  }, [state.beneficialOwners]);

  return {
    state,
    updateBeneficialOwners,
    setOwnershipType,
    setOwnerHierarchy,
    goToStep,
    nextOwner,
    previousOwner,
    completeOwnership,
    resetFlow,
    getCurrentOwner,
    getOwnersNeedingClassification,
    getOwnersNeedingHierarchy,
  };
};
