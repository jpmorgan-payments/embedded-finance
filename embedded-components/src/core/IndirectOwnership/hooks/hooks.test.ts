import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useOwnershipTree, useOwnershipValidation } from './hooks';

describe('useOwnershipValidation', () => {
  it('returns invalid status when ownershipStructure is null', () => {
    const { result } = renderHook(() => useOwnershipValidation(null));

    expect(result.current.isValid).toBe(false);
    expect(result.current.errors).toHaveLength(1);
    expect(result.current.errors[0].code).toBe('NO_STRUCTURE');
    expect(result.current.completionLevel).toBe('INCOMPLETE');
  });

  it('returns invalid when no ultimate beneficial owners', () => {
    const structure = {
      clientId: 'client-1',
      rootParty: {} as any,
      ownershipChain: [],
      ultimateBeneficialOwners: [],
      validationStatus: {
        isValid: false,
        errors: [],
        warnings: [],
        completionLevel: 'INCOMPLETE' as const,
      },
    };

    const { result } = renderHook(() => useOwnershipValidation(structure));

    expect(result.current.isValid).toBe(false);
    expect(result.current.errors).toContainEqual(
      expect.objectContaining({ code: 'NO_ULTIMATE_OWNERS' })
    );
  });

  it('returns valid when ultimate beneficial owners exist', () => {
    const structure = {
      clientId: 'client-1',
      rootParty: {} as any,
      ownershipChain: [],
      ultimateBeneficialOwners: [{ id: 'owner-1' } as any],
      validationStatus: {
        isValid: true,
        errors: [],
        warnings: [],
        completionLevel: 'COMPLETE' as const,
      },
    };

    const { result } = renderHook(() => useOwnershipValidation(structure));

    expect(result.current.isValid).toBe(true);
    expect(result.current.errors).toHaveLength(0);
    expect(result.current.completionLevel).toBe('COMPLETE');
  });
});

describe('useOwnershipTree', () => {
  it('starts with empty expanded nodes and no selected node', () => {
    const { result } = renderHook(() => useOwnershipTree(null));

    expect(result.current.expandedNodes.size).toBe(0);
    expect(result.current.selectedNode).toBeNull();
  });

  it('toggleNode adds a node to expanded set', () => {
    const { result } = renderHook(() => useOwnershipTree(null));

    act(() => {
      result.current.toggleNode('node-1');
    });

    expect(result.current.expandedNodes.has('node-1')).toBe(true);
  });

  it('toggleNode removes a node from expanded set on second call', () => {
    const { result } = renderHook(() => useOwnershipTree(null));

    act(() => {
      result.current.toggleNode('node-1');
    });
    act(() => {
      result.current.toggleNode('node-1');
    });

    expect(result.current.expandedNodes.has('node-1')).toBe(false);
  });

  it('selectNode sets the selected node', () => {
    const { result } = renderHook(() => useOwnershipTree(null));

    act(() => {
      result.current.selectNode('node-2');
    });

    expect(result.current.selectedNode).toBe('node-2');
  });

  it('selectNode with null clears selection', () => {
    const { result } = renderHook(() => useOwnershipTree(null));

    act(() => {
      result.current.selectNode('node-2');
    });
    act(() => {
      result.current.selectNode(null);
    });

    expect(result.current.selectedNode).toBeNull();
  });

  it('collapseAll clears expanded nodes', () => {
    const { result } = renderHook(() => useOwnershipTree(null));

    act(() => {
      result.current.toggleNode('node-1');
      result.current.toggleNode('node-2');
    });
    act(() => {
      result.current.collapseAll();
    });

    expect(result.current.expandedNodes.size).toBe(0);
  });

  it('multiple nodes can be expanded simultaneously', () => {
    const { result } = renderHook(() => useOwnershipTree(null));

    act(() => {
      result.current.toggleNode('a');
    });
    act(() => {
      result.current.toggleNode('b');
    });
    act(() => {
      result.current.toggleNode('c');
    });

    expect(result.current.expandedNodes.size).toBe(3);
    expect(result.current.expandedNodes.has('a')).toBe(true);
    expect(result.current.expandedNodes.has('b')).toBe(true);
    expect(result.current.expandedNodes.has('c')).toBe(true);
  });
});
