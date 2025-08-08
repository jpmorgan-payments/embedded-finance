import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useArazzoProcessor } from '../useArazzoProcessor';

// Mock fetch
global.fetch = vi.fn();

describe('useArazzoProcessor', () => {
  const sampleArazzoYaml = `
workflowId: test-workflow
info:
  title: Test Workflow
  version: 1.0.0
sourceDescriptions:
  - name: test-api
    url: https://api.example.com/openapi.yaml
steps:
  - stepId: step1
    description: First step
    operationId: createUser
    successCriteria:
      - condition: "\$statusCode == 201"
    onSuccess:
      - stepId: step2
  - stepId: step2
    description: Second step
    operationId: updateUser
    successCriteria:
      - condition: "\$statusCode == 200"
`;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useArazzoProcessor());

      expect(result.current.workflow).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.hasWorkflow).toBe(false);
      expect(result.current.stepCount).toBe(0);
      expect(result.current.operationCount).toBe(0);
    });
  });

  describe('loadFromContent', () => {
    it('should load and process workflow from YAML content', () => {
      const { result } = renderHook(() => useArazzoProcessor());

      act(() => {
        result.current.loadFromContent(sampleArazzoYaml);
      });

      expect(result.current.workflow).not.toBeNull();
      expect(result.current.workflow?.workflowId).toBe('test-workflow');
      expect(result.current.hasWorkflow).toBe(true);
      expect(result.current.stepCount).toBe(2);
      expect(result.current.operationCount).toBe(2);
      expect(result.current.error).toBeNull();
    });

    it('should handle invalid YAML content', () => {
      const { result } = renderHook(() => useArazzoProcessor());

      act(() => {
        result.current.loadFromContent('invalid: yaml: content:');
      });

      expect(result.current.workflow).toBeNull();
      expect(result.current.error).toContain('Failed to parse Arazzo content');
      expect(result.current.hasWorkflow).toBe(false);
    });
  });

  describe('loadFromUrl', () => {
    it('should load workflow from URL successfully', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(sampleArazzoYaml),
      } as Response);

      const { result } = renderHook(() => useArazzoProcessor());

      await act(async () => {
        await result.current.loadFromUrl('https://example.com/workflow.yaml');
      });

      expect(result.current.workflow).not.toBeNull();
      expect(result.current.workflow?.workflowId).toBe('test-workflow');
      expect(result.current.error).toBeNull();
      expect(mockFetch).toHaveBeenCalledWith(
        'https://example.com/workflow.yaml',
      );
    });

    it('should handle fetch errors', async () => {
      const mockFetch = vi.mocked(fetch);
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      } as Response);

      const { result } = renderHook(() => useArazzoProcessor());

      await act(async () => {
        await result.current.loadFromUrl(
          'https://example.com/nonexistent.yaml',
        );
      });

      expect(result.current.workflow).toBeNull();
      expect(result.current.error).toContain(
        'Failed to load Arazzo spec from URL',
      );
      expect(result.current.error).toContain('404 Not Found');
    });
  });

  describe('utility functions', () => {
    it('should provide step utilities', () => {
      const { result } = renderHook(() => useArazzoProcessor());

      act(() => {
        result.current.loadFromContent(sampleArazzoYaml);
      });

      // Test getStep
      const step1 = result.current.getStep('step1');
      expect(step1?.stepId).toBe('step1');
      expect(step1?.operationId).toBe('createUser');

      // Test isEntryPoint
      expect(result.current.isEntryPoint('step1')).toBe(true);
      expect(result.current.isEntryPoint('step2')).toBe(false);

      // Test isTerminalStep
      expect(result.current.isTerminalStep('step1')).toBe(false);
      expect(result.current.isTerminalStep('step2')).toBe(true);
    });
  });

  describe('clear', () => {
    it('should clear workflow and reset state', () => {
      const { result } = renderHook(() => useArazzoProcessor());

      // Load a workflow first
      act(() => {
        result.current.loadFromContent(sampleArazzoYaml);
      });

      expect(result.current.hasWorkflow).toBe(true);

      // Clear the workflow
      act(() => {
        result.current.clear();
      });

      expect(result.current.workflow).toBeNull();
      expect(result.current.hasWorkflow).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.stepCount).toBe(0);
    });
  });

  describe('validation', () => {
    it('should validate workflow on load when autoValidate is true', () => {
      const { result } = renderHook(() =>
        useArazzoProcessor({ autoValidate: true }),
      );

      act(() => {
        result.current.loadFromContent(sampleArazzoYaml);
      });

      expect(result.current.validationResult).not.toBeNull();
      expect(result.current.validationResult?.isValid).toBe(true);
      expect(result.current.hasValidationErrors).toBe(false);
    });

    it('should not validate workflow when autoValidate is false', () => {
      const { result } = renderHook(() =>
        useArazzoProcessor({ autoValidate: false }),
      );

      act(() => {
        result.current.loadFromContent(sampleArazzoYaml);
      });

      expect(result.current.validationResult).toBeNull();
    });

    it('should allow manual revalidation', () => {
      const { result } = renderHook(() =>
        useArazzoProcessor({ autoValidate: false }),
      );

      act(() => {
        result.current.loadFromContent(sampleArazzoYaml);
      });

      expect(result.current.validationResult).toBeNull();

      act(() => {
        result.current.revalidate();
      });

      expect(result.current.validationResult).not.toBeNull();
      expect(result.current.validationResult?.isValid).toBe(true);
    });
  });

  describe('callbacks', () => {
    it('should call onSuccess callback when workflow loads successfully', () => {
      const onSuccess = vi.fn();
      const { result } = renderHook(() => useArazzoProcessor({ onSuccess }));

      act(() => {
        result.current.loadFromContent(sampleArazzoYaml);
      });

      expect(onSuccess).toHaveBeenCalledWith(
        expect.objectContaining({
          workflowId: 'test-workflow',
        }),
      );
    });

    it('should call onError callback when loading fails', () => {
      const onError = vi.fn();
      const { result } = renderHook(() => useArazzoProcessor({ onError }));

      act(() => {
        result.current.loadFromContent('invalid yaml');
      });

      expect(onError).toHaveBeenCalledWith(
        expect.stringContaining('Failed to parse Arazzo content'),
      );
    });
  });
});
