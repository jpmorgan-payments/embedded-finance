'use client';

import { useState, useCallback } from 'react';
import type { 
  InterfaceState,
  OwnershipHierarchy,
  V2BeneficialOwner 
} from '../components/V2AlternateIndirectOwnership/types';

/**
 * Hook for managing interface orchestration in V2 ownership flow
 * 
 * Manages the state of different interfaces (add owner, build hierarchy, confirm hierarchy)
 * and provides functions to transition between them.
 */
export const useInterfaceOrchestration = () => {
  // Interface state
  const [interfaceState, setInterfaceState] = useState<InterfaceState>({
    addOwner: {
      isActive: false,
    },
    buildHierarchy: {
      isActive: false,
      ownerId: '',
      ownerName: '',
      mode: 'dialog',
    },
    confirmHierarchy: {
      isActive: false,
      ownerId: '',
      completedHierarchy: {} as OwnershipHierarchy,
      mode: 'dialog',
    },
  });

  // Add Owner interface functions
  const openAddOwner = useCallback((
    editingOwnerId?: string,
    initialData?: Partial<V2BeneficialOwner>
  ) => {
    setInterfaceState(prev => ({
      ...prev,
      addOwner: {
        isActive: true,
        editingOwnerId,
        initialData,
      },
    }));
  }, []);

  const closeAddOwner = useCallback(() => {
    setInterfaceState(prev => ({
      ...prev,
      addOwner: {
        isActive: false,
      },
    }));
  }, []);

  // Build Hierarchy interface functions
  const openBuildHierarchy = useCallback((
    ownerId: string,
    ownerName: string,
    currentHierarchy?: OwnershipHierarchy,
    mode: 'dialog' | 'inline' | 'integrated' = 'dialog'
  ) => {
    setInterfaceState(prev => ({
      ...prev,
      buildHierarchy: {
        isActive: true,
        ownerId,
        ownerName,
        currentHierarchy,
        mode,
      },
    }));
  }, []);

  const closeBuildHierarchy = useCallback(() => {
    setInterfaceState(prev => ({
      ...prev,
      buildHierarchy: {
        isActive: false,
        ownerId: '',
        ownerName: '',
        mode: 'dialog',
      },
    }));
  }, []);

  // Confirm Hierarchy interface functions
  const openConfirmHierarchy = useCallback((
    ownerId: string,
    completedHierarchy: OwnershipHierarchy,
    mode: 'dialog' | 'inline' | 'integrated' = 'dialog'
  ) => {
    setInterfaceState(prev => ({
      ...prev,
      confirmHierarchy: {
        isActive: true,
        ownerId,
        completedHierarchy,
        mode,
      },
    }));
  }, []);

  const closeConfirmHierarchy = useCallback(() => {
    setInterfaceState(prev => ({
      ...prev,
      confirmHierarchy: {
        isActive: false,
        ownerId: '',
        completedHierarchy: {} as OwnershipHierarchy,
        mode: 'dialog',
      },
    }));
  }, []);

  // Close all interfaces
  const closeAllInterfaces = useCallback(() => {
    setInterfaceState({
      addOwner: { isActive: false },
      buildHierarchy: {
        isActive: false,
        ownerId: '',
        ownerName: '',
        mode: 'dialog',
      },
      confirmHierarchy: {
        isActive: false,
        ownerId: '',
        completedHierarchy: {} as OwnershipHierarchy,
        mode: 'dialog',
      },
    });
  }, []);

  // Get currently active interface
  const getActiveInterface = useCallback((): 'NONE' | 'ADD_OWNER' | 'BUILD_HIERARCHY' | 'CONFIRM_HIERARCHY' => {
    if (interfaceState.addOwner.isActive) return 'ADD_OWNER';
    if (interfaceState.buildHierarchy.isActive) return 'BUILD_HIERARCHY';
    if (interfaceState.confirmHierarchy.isActive) return 'CONFIRM_HIERARCHY';
    return 'NONE';
  }, [interfaceState]);

  // Check if any interface is active
  const hasActiveInterface = useCallback((): boolean => {
    return getActiveInterface() !== 'NONE';
  }, [getActiveInterface]);

  // Set interface mode (useful for responsive design)
  const setInterfaceMode = useCallback((
    interfaceType: 'buildHierarchy' | 'confirmHierarchy',
    mode: 'dialog' | 'inline' | 'integrated'
  ) => {
    setInterfaceState(prev => ({
      ...prev,
      [interfaceType]: {
        ...prev[interfaceType],
        mode,
      },
    }));
  }, []);

  return {
    interfaceState,
    
    // Add Owner
    openAddOwner,
    closeAddOwner,
    
    // Build Hierarchy
    openBuildHierarchy,
    closeBuildHierarchy,
    
    // Confirm Hierarchy
    openConfirmHierarchy,
    closeConfirmHierarchy,
    
    // General
    closeAllInterfaces,
    getActiveInterface,
    hasActiveInterface,
    setInterfaceMode,
  };
};
