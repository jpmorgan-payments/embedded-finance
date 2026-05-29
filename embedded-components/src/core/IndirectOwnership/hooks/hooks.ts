import { useCallback, useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { useSmbdoGetClient } from '@/api/generated/smbdo';

import type {
  IndirectOwnershipComponentProps,
  OwnershipEntityFormData,
  OwnershipStructure,
  OwnershipValidationError,
  OwnershipValidationStatus,
  OwnershipValidationWarning,
} from '../types';

/**
 * Main hook for managing indirect ownership data and operations
 */
export function useIndirectOwnership(props: IndirectOwnershipComponentProps) {
  const { clientId, onOwnershipStructureUpdate } = props;

  // Fetch client data including parties
  const {
    data: clientData,
    isLoading: isLoadingClient,
    error: clientError,
  } = useSmbdoGetClient(clientId || '', {
    query: {
      enabled: Boolean(clientId),
    },
  });

  // Build ownership structure from client data
  const processedOwnership = useMemo(() => {
    if (!clientData?.parties) return null;

    // TODO: Implement ownership structure processing
    // This is a placeholder that will be expanded
    return {
      clientId: clientId || '',
      rootParty: {} as any,
      ownershipChain: [],
      ultimateBeneficialOwners: [],
      validationStatus: {
        isValid: false,
        errors: [],
        warnings: [],
        completionLevel: 'INCOMPLETE',
      },
    } satisfies OwnershipStructure;
  }, [clientData, clientId]);

  // Update callback
  const handleOwnershipUpdate = useCallback(
    (newStructure: OwnershipStructure, error?: any) => {
      onOwnershipStructureUpdate?.(newStructure, error);
    },
    [onOwnershipStructureUpdate]
  );

  return {
    clientData,
    ownershipStructure: processedOwnership,
    isLoading: isLoadingClient,
    error: clientError,
    handleOwnershipUpdate,
  };
}

/**
 * Hook for ownership structure validation
 */
export function useOwnershipValidation(
  ownershipStructure: OwnershipStructure | null
) {
  const validationStatus = useMemo((): OwnershipValidationStatus => {
    if (!ownershipStructure) {
      return {
        isValid: false,
        errors: [
          {
            code: 'NO_STRUCTURE',
            message: 'No ownership structure provided',
            severity: 'ERROR',
          },
        ],
        warnings: [],
        completionLevel: 'INCOMPLETE',
      };
    }

    // TODO: Implement comprehensive validation logic
    const errors: OwnershipValidationError[] = [];
    const warnings: OwnershipValidationWarning[] = [];

    // Placeholder validation rules
    if (ownershipStructure.ultimateBeneficialOwners.length === 0) {
      errors.push({
        code: 'NO_ULTIMATE_OWNERS',
        message: 'No ultimate beneficial owners identified',
        severity: 'ERROR' as const,
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      completionLevel: errors.length === 0 ? 'COMPLETE' : 'INCOMPLETE',
    };
  }, [ownershipStructure]);

  return validationStatus;
}

/**
 * Schema for ownership entity form validation
 */
const ownershipEntitySchema = z.object({
  partyType: z.enum(['INDIVIDUAL', 'ORGANIZATION']),
  parentPartyId: z.string().optional(),

  // Organization fields
  organizationName: z.string().min(1).optional(),
  organizationType: z.string().optional(),
  countryOfFormation: z.string().optional(),

  // Individual fields
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  dateOfBirth: z.string().optional(),

  // Common fields
  roles: z.array(z.string()),
});

/**
 * Hook for managing ownership entity forms
 */
export function useOwnershipEntityForm() {
  const form = useForm<OwnershipEntityFormData>({
    resolver: zodResolver(ownershipEntitySchema),
    defaultValues: {
      roles: [],
    },
  });

  const handleSubmit = useCallback(async (_data: OwnershipEntityFormData) => {
    try {
      // TODO: Transform form data to API format and submit

      // Placeholder for API call - will use useSmbdoUpdateClient to add parties
      // const result = await updateClientMutation.mutateAsync({
      //   id: clientId,
      //   data: { addParties: [transformToApiFormat(data)] }
      // });

      return { success: true };
    } catch (error) {
      console.error('Error creating ownership entity:', error);
      throw error;
    }
  }, []);

  return {
    form,
    handleSubmit,
    isLoading: false,
    error: null,
  };
}

/**
 * Hook for ownership tree navigation and manipulation
 */
export function useOwnershipTree(
  ownershipStructure: OwnershipStructure | null
) {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  const toggleNode = useCallback((nodeId: string) => {
    setExpandedNodes((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  }, []);

  const selectNode = useCallback((nodeId: string | null) => {
    setSelectedNode(nodeId);
  }, []);

  const expandAll = useCallback(() => {
    if (!ownershipStructure) return;

    // TODO: Extract all node IDs from ownership structure
    const allNodeIds: string[] = [];
    setExpandedNodes(new Set(allNodeIds));
  }, [ownershipStructure]);

  const collapseAll = useCallback(() => {
    setExpandedNodes(new Set());
  }, []);

  return {
    expandedNodes,
    selectedNode,
    toggleNode,
    selectNode,
    expandAll,
    collapseAll,
  };
}
