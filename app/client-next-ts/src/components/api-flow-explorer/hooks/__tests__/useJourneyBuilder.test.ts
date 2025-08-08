import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useJourneyBuilder } from '../useJourneyBuilder';
import { ArazzoWorkflow } from '../../types/arazzo';
import { ApiOperation } from '../../types/api';

describe('useJourneyBuilder', () => {
  const mockWorkflow: ArazzoWorkflow = {
    workflowId: 'test-workflow',
    info: {
      title: 'Test Workflow',
      description: 'A test workflow',
      version: '1.0.0',
    },
    sourceDescriptions: [],
    steps: [
      {
        stepId: 'step1',
        description: 'First step',
        operationId: 'createClient',
        successCriteria: [{ condition: '$statusCode == 201' }],
        onSuccess: [{ stepId: 'step2' }],
      },
      {
        stepId: 'step2',
        description: 'Second step',
        operationId: 'submitInfo',
        successCriteria: [{ condition: '$statusCode == 200' }],
        onSuccess: [{ stepId: 'step3' }],
        onFailure: [{ stepId: 'handle-error' }],
      },
      {
        stepId: 'step3',
        description: 'Final step',
        operationId: 'complete',
        successCriteria: [{ condition: '$statusCode == 200' }],
      },
      {
        stepId: 'handle-error',
        description: 'Handle error',
        operationId: 'logError',
        successCriteria: [],
      },
    ],
  };

  const mockOperations = new Map<string, ApiOperation>([
    [
      'createClient',
      {
        operationId: 'createClient',
        method: 'POST',
        path: '/clients',
        summary: 'Create client',
        description: 'Creates a new client',
        responses: [],
        tags: [],
      },
    ],
  ]);

  describe('initialization', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useJourneyBuilder());

      expect(result.current.journey).toBeNull();
      expect(result.current.isBuilding).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.hasJourney).toBe(false);
      expect(result.current.nodeCount).toBe(0);
      expect(result.current.edgeCount).toBe(0);
    });

    it('should initialize with custom layout config', () => {
      const customConfig = {
        nodeSpacing: { horizontal: 300, vertical: 200 },
        direction: 'LR' as const,
      };

      const { result } = renderHook(() =>
        useJourneyBuilder({ layoutConfig: customConfig }),
      );

      expect(result.current.layoutConfig.nodeSpacing.horizontal).toBe(300);
      expect(result.current.layoutConfig.nodeSpacing.vertical).toBe(200);
      expect(result.current.layoutConfig.direction).toBe('LR');
    });
  });

  describe('buildJourney', () => {
    it('should build journey from workflow successfully', async () => {
      const onJourneyBuilt = vi.fn();
      const { result } = renderHook(() =>
        useJourneyBuilder({ onJourneyBuilt }),
      );

      await act(async () => {
        await result.current.buildJourney(mockWorkflow, mockOperations);
      });

      expect(result.current.isBuilding).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.journey).not.toBeNull();
      expect(result.current.hasJourney).toBe(true);
      expect(onJourneyBuilt).toHaveBeenCalledWith(result.current.journey);
    });

    it('should create nodes and edges', async () => {
      const { result } = renderHook(() => useJourneyBuilder());

      await act(async () => {
        await result.current.buildJourney(mockWorkflow, mockOperations);
      });

      const journey = result.current.journey!;

      expect(journey.nodes.length).toBeGreaterThan(0);
      expect(journey.edges.length).toBeGreaterThan(0);
      expect(result.current.nodeCount).toBeGreaterThan(0);
      expect(result.current.edgeCount).toBeGreaterThan(0);
    });
  });

  describe('clearJourney', () => {
    it('should clear journey and reset state', async () => {
      const { result } = renderHook(() => useJourneyBuilder());

      // Build a journey first
      await act(async () => {
        await result.current.buildJourney(mockWorkflow, mockOperations);
      });

      expect(result.current.journey).not.toBeNull();

      // Clear the journey
      act(() => {
        result.current.clearJourney();
      });

      expect(result.current.journey).toBeNull();
      expect(result.current.error).toBeNull();
      expect(result.current.hasJourney).toBe(false);
      expect(result.current.nodeCount).toBe(0);
      expect(result.current.edgeCount).toBe(0);
    });
  });

  describe('reactFlowElements', () => {
    it('should return empty arrays when no journey exists', () => {
      const { result } = renderHook(() => useJourneyBuilder());

      expect(result.current.reactFlowElements.nodes).toEqual([]);
      expect(result.current.reactFlowElements.edges).toEqual([]);
    });

    it('should convert journey to ReactFlow elements', async () => {
      const { result } = renderHook(() => useJourneyBuilder());

      await act(async () => {
        await result.current.buildJourney(mockWorkflow, mockOperations);
      });

      const { nodes, edges } = result.current.reactFlowElements;

      expect(nodes.length).toBeGreaterThan(0);
      expect(edges.length).toBeGreaterThan(0);

      // Check that nodes have required ReactFlow properties
      nodes.forEach((node) => {
        expect(node).toHaveProperty('id');
        expect(node).toHaveProperty('type');
        expect(node).toHaveProperty('position');
        expect(node).toHaveProperty('data');
        expect(node).toHaveProperty('style');
      });

      // Check that edges have required ReactFlow properties
      edges.forEach((edge) => {
        expect(edge).toHaveProperty('id');
        expect(edge).toHaveProperty('source');
        expect(edge).toHaveProperty('target');
      });
    });
  });
});
