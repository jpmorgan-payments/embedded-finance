'use client';

import { useMemo } from 'react';
import type { 
  V2BeneficialOwner, 
  ValidationSummary, 
  V2OwnershipConfig,
  VALIDATION_MESSAGES 
} from '../components/V2AlternateIndirectOwnership/types';

/**
 * Configuration for useRealTimeValidation hook
 */
interface UseRealTimeValidationConfig {
  rootCompanyName: string;
  config: V2OwnershipConfig;
}

/**
 * Hook for real-time validation of ownership structure
 * 
 * Provides comprehensive validation of beneficial owners including:
 * - Required field validation
 * - Duplicate detection
 * - Hierarchy completeness
 * - Ownership threshold validation
 * - Overall completion status
 */
export const useRealTimeValidation = (
  owners: V2BeneficialOwner[],
  { rootCompanyName, config }: UseRealTimeValidationConfig
): ValidationSummary => {
  return useMemo(() => {
    const totalOwners = owners.length;
    const completeOwners = owners.filter(owner => owner.status === 'COMPLETE').length;
    const pendingHierarchies = owners.filter(owner => owner.status === 'PENDING_HIERARCHY').length;
    const ownersWithErrors = owners.filter(owner => owner.status === 'ERROR').length;
    
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate minimum owners requirement
    if (totalOwners === 0) {
      errors.push('At least one beneficial owner is required');
    }

    // Validate each owner
    owners.forEach((owner, index) => {
      const ownerPrefix = `Owner ${index + 1} (${owner.firstName} ${owner.lastName})`;

      // Required field validation
      config.requiredFields.forEach(field => {
        if (!owner[field as keyof V2BeneficialOwner]) {
          errors.push(`${ownerPrefix}: ${field} is required`);
        }
      });

      // Status-specific validation
      switch (owner.status) {
        case 'PENDING_HIERARCHY':
          if (owner.ownershipType === 'INDIRECT') {
            warnings.push(`${ownerPrefix}: Ownership hierarchy is required`);
          }
          break;

        case 'ERROR':
          if (owner.validationErrors && owner.validationErrors.length > 0) {
            owner.validationErrors.forEach(error => {
              errors.push(`${ownerPrefix}: ${error}`);
            });
          } else {
            errors.push(`${ownerPrefix}: Has validation errors`);
          }
          break;

        case 'COMPLETE':
          // Validate hierarchy for indirect owners
          if (owner.ownershipType === 'INDIRECT') {
            if (!owner.ownershipHierarchy) {
              errors.push(`${ownerPrefix}: Missing ownership hierarchy`);
            } else {
              // Validate hierarchy structure
              const hierarchy = owner.ownershipHierarchy;
              
              if (!hierarchy.isValid) {
                errors.push(`${ownerPrefix}: Ownership hierarchy is invalid`);
              }

              if (config.requiresOwnershipThreshold && !hierarchy.meets25PercentThreshold) {
                errors.push(`${ownerPrefix}: Does not meet 25% ownership threshold`);
              }

              // Check if Business Being Onboarded is identified
              const hasBusinessBeingOnboarded = hierarchy.steps.some(step => step.isBusinessBeingOnboarded);
              if (!hasBusinessBeingOnboarded) {
                errors.push(`${ownerPrefix}: Hierarchy does not lead to Business Being Onboarded`);
              }

              // Validate hierarchy depth
              const companySteps = hierarchy.steps.filter(step => step.entityType === 'COMPANY');
              if (companySteps.length > config.maxHierarchyLevels) {
                errors.push(`${ownerPrefix}: Ownership hierarchy exceeds maximum allowed levels (${config.maxHierarchyLevels})`);
              }
            }
          }

          // Validate 25% threshold for all owners
          if (config.requiresOwnershipThreshold && !owner.meets25PercentThreshold) {
            warnings.push(`${ownerPrefix}: May not meet 25% beneficial ownership threshold`);
          }
          break;
      }
    });

    // Duplicate name validation
    if (!config.allowDuplicateNames) {
      const nameMap = new Map<string, V2BeneficialOwner[]>();
      owners.forEach(owner => {
        const fullName = `${owner.firstName.toLowerCase()} ${owner.lastName.toLowerCase()}`;
        if (!nameMap.has(fullName)) {
          nameMap.set(fullName, []);
        }
        nameMap.get(fullName)!.push(owner);
      });

      nameMap.forEach((ownersWithSameName, fullName) => {
        if (ownersWithSameName.length > 1) {
          errors.push(`Duplicate names found: ${ownersWithSameName.length} owners with name "${fullName}"`);
        }
      });
    }

    // Maximum owners validation
    if (config.maxOwners && totalOwners > config.maxOwners) {
      errors.push(`Maximum number of owners (${config.maxOwners}) exceeded`);
    }

    // Calculate completion status
    const hasErrors = errors.length > 0 || ownersWithErrors > 0;
    const canComplete = totalOwners > 0 && 
                       completeOwners === totalOwners && 
                       !hasErrors &&
                       pendingHierarchies === 0;

    const completionPercentage = totalOwners > 0 ? 
      Math.round((completeOwners / totalOwners) * 100) : 0;

    return {
      totalOwners,
      completeOwners,
      pendingHierarchies,
      ownersWithErrors,
      hasErrors,
      errors,
      warnings,
      canComplete,
      completionPercentage,
    };
  }, [owners, rootCompanyName, config]);
};

/**
 * Hook for validating a single owner
 */
export const useOwnerValidation = (
  owner: Partial<V2BeneficialOwner>,
  existingOwners: V2BeneficialOwner[],
  config: V2OwnershipConfig
): { isValid: boolean; errors: string[] } => {
  return useMemo(() => {
    const errors: string[] = [];

    // Required field validation
    config.requiredFields.forEach(field => {
      if (!owner[field as keyof V2BeneficialOwner]) {
        errors.push(`${field} is required`);
      }
    });

    // Duplicate name validation
    if (!config.allowDuplicateNames && owner.firstName && owner.lastName) {
      const isDuplicate = existingOwners.some(existingOwner => 
        existingOwner.id !== owner.id &&
        existingOwner.firstName.toLowerCase() === owner.firstName!.toLowerCase() &&
        existingOwner.lastName.toLowerCase() === owner.lastName!.toLowerCase()
      );

      if (isDuplicate) {
        errors.push('Owner with this name already exists');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }, [owner, existingOwners, config]);
};
