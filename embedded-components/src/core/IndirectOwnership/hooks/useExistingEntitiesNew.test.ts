import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import {
  useCategorizedEntities,
  useExistingEntities,
} from './useExistingEntitiesNew';

describe('useExistingEntitiesNew', () => {
  describe('useExistingEntities', () => {
    it('returns empty array for no beneficial owners', () => {
      const { result } = renderHook(() => useExistingEntities([]));
      expect(result.current).toEqual([]);
    });

    it('extracts unique entity names from hierarchy steps', () => {
      const owners = [
        {
          ownershipHierarchy: {
            steps: [{ entityName: 'Alpha Corp' }, { entityName: 'Beta LLC' }],
          },
        },
        {
          ownershipHierarchy: {
            steps: [{ entityName: 'Alpha Corp' }, { entityName: 'Gamma Inc' }],
          },
        },
      ] as any[];

      const { result } = renderHook(() => useExistingEntities(owners));
      expect(result.current).toHaveLength(3);
      expect(result.current).toContain('Alpha Corp');
      expect(result.current).toContain('Beta LLC');
      expect(result.current).toContain('Gamma Inc');
    });

    it('trims whitespace from entity names', () => {
      const owners = [
        {
          ownershipHierarchy: {
            steps: [{ entityName: '  Padded Corp  ' }],
          },
        },
      ] as any[];

      const { result } = renderHook(() => useExistingEntities(owners));
      expect(result.current).toContain('Padded Corp');
    });

    it('excludes empty/blank entity names', () => {
      const owners = [
        {
          ownershipHierarchy: {
            steps: [
              { entityName: '' },
              { entityName: '   ' },
              { entityName: 'Valid Corp' },
            ],
          },
        },
      ] as any[];

      const { result } = renderHook(() => useExistingEntities(owners));
      expect(result.current).toEqual(['Valid Corp']);
    });

    it('sorts entities case-insensitively', () => {
      const owners = [
        {
          ownershipHierarchy: {
            steps: [
              { entityName: 'zebra Corp' },
              { entityName: 'Alpha LLC' },
              { entityName: 'beta Inc' },
            ],
          },
        },
      ] as any[];

      const { result } = renderHook(() => useExistingEntities(owners));
      expect(result.current).toEqual(['Alpha LLC', 'beta Inc', 'zebra Corp']);
    });

    it('handles owners without ownershipHierarchy', () => {
      const owners = [
        { firstName: 'John' },
        {
          ownershipHierarchy: {
            steps: [{ entityName: 'Corp A' }],
          },
        },
      ] as any[];

      const { result } = renderHook(() => useExistingEntities(owners));
      expect(result.current).toEqual(['Corp A']);
    });
  });

  describe('useCategorizedEntities', () => {
    it('returns all entities as available when no context provided', () => {
      const owners = [
        {
          ownershipHierarchy: {
            steps: [{ entityName: 'Corp A' }, { entityName: 'Corp B' }],
          },
        },
      ] as any[];

      const { result } = renderHook(() =>
        useCategorizedEntities(owners, undefined)
      );

      expect(result.current.recommended).toEqual([]);
      expect(result.current.available).toContain('Corp A');
      expect(result.current.available).toContain('Corp B');
      expect(result.current.problematic).toEqual([]);
    });

    it('returns empty when no owners', () => {
      const { result } = renderHook(() =>
        useCategorizedEntities([], undefined)
      );

      expect(result.current.available).toEqual([]);
    });

    it('sorts available entities case-insensitively when no context', () => {
      const owners = [
        {
          ownershipHierarchy: {
            steps: [{ entityName: 'Zebra' }, { entityName: 'alpha' }],
          },
        },
      ] as any[];

      const { result } = renderHook(() =>
        useCategorizedEntities(owners, undefined)
      );

      expect(result.current.available).toEqual(['alpha', 'Zebra']);
    });
  });
});
