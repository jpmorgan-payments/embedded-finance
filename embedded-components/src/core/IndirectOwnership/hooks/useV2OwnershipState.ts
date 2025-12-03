'use client';

import { useState, useCallback, useMemo } from 'react';
import type { 
  V2BeneficialOwner, 
  V2OwnershipState, 
  V2OwnershipConfig,
  OwnershipHierarchy,
  V2OwnershipEvent 
} from '../components/V2AlternateIndirectOwnership/types';

/**
 * Configuration for useV2OwnershipState hook
 */
interface UseV2OwnershipStateConfig {
  rootCompanyName: string;
  initialOwners?: V2BeneficialOwner[];
  config?: Partial<V2OwnershipConfig>;
  onEvent?: (event: V2OwnershipEvent) => void;
}

/**
 * Default configuration for V2 ownership management
 */
const DEFAULT_CONFIG: V2OwnershipConfig = {
  maxHierarchyLevels: 5,
  requiresOwnershipThreshold: true,
  maxOwners: 10,
  requiredFields: ['firstName', 'lastName', 'ownershipType'],
  allowDuplicateNames: false,
};

/**
 * Hook for managing V2 ownership state
 * 
 * Provides state management for beneficial owners with real-time updates,
 * validation, and hierarchy management.
 */
export const useV2OwnershipState = ({
  rootCompanyName,
  initialOwners = [],
  config = {},
  onEvent,
}: UseV2OwnershipStateConfig) => {
  // Merge config with defaults
  const finalConfig = useMemo(() => ({ ...DEFAULT_CONFIG, ...config }), [config]);

  // Initialize state
  const [ownershipState, setOwnershipState] = useState<V2OwnershipState>({
    rootCompanyName,
    beneficialOwners: initialOwners,
    currentInterface: 'NONE',
    validationSummary: {
      totalOwners: initialOwners.length,
      completeOwners: initialOwners.filter(o => o.status === 'COMPLETE').length,
      pendingHierarchies: initialOwners.filter(o => o.status === 'PENDING_HIERARCHY').length,
      ownersWithErrors: initialOwners.filter(o => o.status === 'ERROR').length,
      hasErrors: initialOwners.some(o => o.status === 'ERROR'),
      errors: [],
      warnings: [],
      canComplete: initialOwners.length > 0 && initialOwners.every(o => o.status === 'COMPLETE'),
      completionPercentage: initialOwners.length > 0 ? 
        (initialOwners.filter(o => o.status === 'COMPLETE').length / initialOwners.length) * 100 : 0,
    },
    isComplete: false,
    config: finalConfig,
  });

  // Generate unique ID for new owners
  const generateOwnerId = useCallback(() => {
    return `owner-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Emit events
  const emitEvent = useCallback((event: V2OwnershipEvent) => {
    onEvent?.(event);
  }, [onEvent]);

  // Add a new owner
  const addOwner = useCallback(async (
    ownerData: Omit<V2BeneficialOwner, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<V2BeneficialOwner> => {
    const newOwner: V2BeneficialOwner = {
      ...ownerData,
      id: generateOwnerId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setOwnershipState(prev => ({
      ...prev,
      beneficialOwners: [...prev.beneficialOwners, newOwner],
    }));

    emitEvent({ type: 'OWNER_ADDED', payload: newOwner });
    return newOwner;
  }, [generateOwnerId, emitEvent]);

  // Update an existing owner
  const updateOwner = useCallback(async (
    ownerId: string, 
    updates: Partial<V2BeneficialOwner>
  ): Promise<V2BeneficialOwner | null> => {
    let updatedOwner: V2BeneficialOwner | null = null;

    setOwnershipState(prev => ({
      ...prev,
      beneficialOwners: prev.beneficialOwners.map(owner => {
        if (owner.id === ownerId) {
          updatedOwner = {
            ...owner,
            ...updates,
            updatedAt: new Date(),
          };
          return updatedOwner;
        }
        return owner;
      }),
    }));

    if (updatedOwner) {
      emitEvent({ type: 'OWNER_UPDATED', payload: updatedOwner });
    }

    return updatedOwner;
  }, [emitEvent]);

  // Remove an owner
  const removeOwner = useCallback(async (ownerId: string): Promise<boolean> => {
    let removed = false;

    setOwnershipState(prev => {
      const ownerExists = prev.beneficialOwners.some(owner => owner.id === ownerId);
      if (ownerExists) {
        removed = true;
        return {
          ...prev,
          beneficialOwners: prev.beneficialOwners.filter(owner => owner.id !== ownerId),
        };
      }
      return prev;
    });

    if (removed) {
      emitEvent({ type: 'OWNER_REMOVED', payload: ownerId });
    }

    return removed;
  }, [emitEvent]);

  // Set hierarchy for an owner
  const setHierarchy = useCallback(async (
    ownerId: string, 
    hierarchy: OwnershipHierarchy
  ): Promise<boolean> => {
    const success = await updateOwner(ownerId, {
      ownershipHierarchy: hierarchy,
      status: 'COMPLETE',
      meets25PercentThreshold: hierarchy.meets25PercentThreshold,
      validationErrors: hierarchy.validationErrors || [],
    });

    if (success) {
      emitEvent({ type: 'HIERARCHY_BUILT', payload: { ownerId, hierarchy } });
    }

    return !!success;
  }, [updateOwner, emitEvent]);

  // Complete the ownership structure
  const completeOwnership = useCallback(async (): Promise<boolean> => {
    // Validate all owners are complete
    const incompleteOwners = ownershipState.beneficialOwners.filter(
      owner => owner.status !== 'COMPLETE'
    );

    if (incompleteOwners.length > 0) {
      throw new Error(`Cannot complete: ${incompleteOwners.length} owners are not complete`);
    }

    if (ownershipState.beneficialOwners.length === 0) {
      throw new Error('Cannot complete: No beneficial owners added');
    }

    setOwnershipState(prev => ({
      ...prev,
      isComplete: true,
    }));

    emitEvent({ type: 'OWNERSHIP_COMPLETED', payload: ownershipState.beneficialOwners });
    return true;
  }, [ownershipState.beneficialOwners, emitEvent]);

  // Get owner by ID
  const getOwnerById = useCallback((ownerId: string): V2BeneficialOwner | null => {
    return ownershipState.beneficialOwners.find(owner => owner.id === ownerId) || null;
  }, [ownershipState.beneficialOwners]);

  // Validate owner data
  const validateOwner = useCallback((owner: Partial<V2BeneficialOwner>): string[] => {
    const errors: string[] = [];

    // Required field validation
    finalConfig.requiredFields.forEach(field => {
      if (!owner[field as keyof V2BeneficialOwner]) {
        errors.push(`${field} is required`);
      }
    });

    // Duplicate name validation
    if (!finalConfig.allowDuplicateNames && owner.firstName && owner.lastName) {
      const isDuplicate = ownershipState.beneficialOwners.some(existingOwner => 
        existingOwner.id !== owner.id &&
        existingOwner.firstName.toLowerCase() === owner.firstName!.toLowerCase() &&
        existingOwner.lastName.toLowerCase() === owner.lastName!.toLowerCase()
      );

      if (isDuplicate) {
        errors.push('Owner with this name already exists');
      }
    }

    return errors;
  }, [ownershipState.beneficialOwners, finalConfig]);

  // Check if we can add more owners
  const canAddOwner = useMemo(() => {
    return ownershipState.beneficialOwners.length < (finalConfig.maxOwners || 10);
  }, [ownershipState.beneficialOwners.length, finalConfig.maxOwners]);

  return {
    ownershipState,
    addOwner,
    updateOwner,
    removeOwner,
    setHierarchy,
    completeOwnership,
    getOwnerById,
    validateOwner,
    canAddOwner,
    config: finalConfig,
  };
};
