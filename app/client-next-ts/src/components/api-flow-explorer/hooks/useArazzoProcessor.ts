import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  ArazzoWorkflow,
  WorkflowStep,
  CriteriaMappingConfig,
} from '../types/arazzo';
import {
  parseArazzoSpec,
  extractStepDependencies,
  buildDependencyGraph,
  validateWorkflowIntegrity,
  getReferencedOperations,
  findEntryPoints,
  findTerminalSteps,
} from '../utils/arazzoProcessor';

export interface ArazzoProcessorState {
  workflow: ArazzoWorkflow | null;
  isLoading: boolean;
  error: string | null;
  dependencies: Map<string, string[]>;
  dependencyGraph: Map<string, string[]>;
  referencedOperations: string[];
  entryPoints: WorkflowStep[];
  terminalSteps: WorkflowStep[];
  validationResult: {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } | null;
}

export interface UseArazzoProcessorOptions {
  autoValidate?: boolean;
  onError?: (error: string) => void;
  onSuccess?: (workflow: ArazzoWorkflow) => void;
}

/**
 * Custom hook for loading and processing Arazzo workflow specifications
 */
export function useArazzoProcessor(options: UseArazzoProcessorOptions = {}) {
  const { autoValidate = true, onError, onSuccess } = options;

  const [state, setState] = useState<ArazzoProcessorState>({
    workflow: null,
    isLoading: false,
    error: null,
    dependencies: new Map(),
    dependencyGraph: new Map(),
    referencedOperations: [],
    entryPoints: [],
    terminalSteps: [],
    validationResult: null,
  });

  /**
   * Processes a workflow and updates all derived data
   */
  const processWorkflow = useCallback(
    (workflow: ArazzoWorkflow) => {
      try {
        const dependencies = extractStepDependencies(workflow);
        const dependencyGraph = buildDependencyGraph(workflow);
        const referencedOperations = getReferencedOperations(workflow);
        const entryPoints = findEntryPoints(workflow);
        const terminalSteps = findTerminalSteps(workflow);
        const validationResult = autoValidate
          ? validateWorkflowIntegrity(workflow)
          : null;

        setState((prev) => ({
          ...prev,
          workflow,
          dependencies,
          dependencyGraph,
          referencedOperations,
          entryPoints,
          terminalSteps,
          validationResult,
          error: null,
        }));

        if (validationResult && !validationResult.isValid) {
          const errorMessage = `Workflow validation failed: ${validationResult.errors.join(', ')}`;
          onError?.(errorMessage);
        } else {
          onSuccess?.(workflow);
        }
      } catch (error) {
        const errorMessage = `Failed to process workflow: ${error instanceof Error ? error.message : 'Unknown error'}`;
        setState((prev) => ({
          ...prev,
          error: errorMessage,
          workflow: null,
          dependencies: new Map(),
          dependencyGraph: new Map(),
          referencedOperations: [],
          entryPoints: [],
          terminalSteps: [],
          validationResult: null,
        }));
        onError?.(errorMessage);
      }
    },
    [autoValidate, onError, onSuccess],
  );

  /**
   * Loads an Arazzo specification from a URL
   */
  const loadFromUrl = useCallback(
    async (url: string) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(
            `Failed to fetch Arazzo spec: ${response.status} ${response.statusText}`,
          );
        }

        const yamlContent = await response.text();
        const workflow = parseArazzoSpec(yamlContent);

        processWorkflow(workflow);
      } catch (error) {
        const errorMessage = `Failed to load Arazzo spec from URL: ${error instanceof Error ? error.message : 'Unknown error'}`;
        setState((prev) => ({
          ...prev,
          error: errorMessage,
          workflow: null,
          dependencies: new Map(),
          dependencyGraph: new Map(),
          referencedOperations: [],
          entryPoints: [],
          terminalSteps: [],
          validationResult: null,
        }));
        onError?.(errorMessage);
      } finally {
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    },
    [processWorkflow, onError],
  );

  /**
   * Loads an Arazzo specification from YAML content string
   */
  const loadFromContent = useCallback(
    (yamlContent: string) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const workflow = parseArazzoSpec(yamlContent);
        processWorkflow(workflow);
      } catch (error) {
        const errorMessage = `Failed to parse Arazzo content: ${error instanceof Error ? error.message : 'Unknown error'}`;
        setState((prev) => ({
          ...prev,
          error: errorMessage,
          workflow: null,
          dependencies: new Map(),
          dependencyGraph: new Map(),
          referencedOperations: [],
          entryPoints: [],
          terminalSteps: [],
          validationResult: null,
        }));
        onError?.(errorMessage);
      } finally {
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    },
    [processWorkflow, onError],
  );

  /**
   * Loads an Arazzo specification based on criteria mapping
   */
  const loadFromCriteria = useCallback(
    async (
      criteria: {
        product: string;
        jurisdiction: string;
        legalEntityType: string;
      },
      mappingConfig: CriteriaMappingConfig,
    ) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        // Find matching criteria combination
        const criteriaKey = `${criteria.product}-${criteria.jurisdiction}-${criteria.legalEntityType}`;
        const mapping = mappingConfig.mappings[criteriaKey];

        if (!mapping) {
          throw new Error(
            `No Arazzo specification found for criteria: ${criteriaKey}`,
          );
        }

        // Load the Arazzo file
        await loadFromUrl(mapping.arazzoFile);
      } catch (error) {
        const errorMessage = `Failed to load Arazzo spec for criteria: ${error instanceof Error ? error.message : 'Unknown error'}`;
        setState((prev) => ({
          ...prev,
          error: errorMessage,
          workflow: null,
          dependencies: new Map(),
          dependencyGraph: new Map(),
          referencedOperations: [],
          entryPoints: [],
          terminalSteps: [],
          validationResult: null,
          isLoading: false,
        }));
        onError?.(errorMessage);
      }
    },
    [loadFromUrl, onError],
  );

  /**
   * Clears the current workflow and resets state
   */
  const clear = useCallback(() => {
    setState({
      workflow: null,
      isLoading: false,
      error: null,
      dependencies: new Map(),
      dependencyGraph: new Map(),
      referencedOperations: [],
      entryPoints: [],
      terminalSteps: [],
      validationResult: null,
    });
  }, []);

  /**
   * Re-validates the current workflow
   */
  const revalidate = useCallback(() => {
    if (state.workflow) {
      const validationResult = validateWorkflowIntegrity(state.workflow);
      setState((prev) => ({ ...prev, validationResult }));

      if (!validationResult.isValid) {
        const errorMessage = `Workflow validation failed: ${validationResult.errors.join(', ')}`;
        onError?.(errorMessage);
      }
    }
  }, [state.workflow, onError]);

  /**
   * Gets a specific step by ID
   */
  const getStep = useCallback(
    (stepId: string): WorkflowStep | undefined => {
      return state.workflow?.steps.find((step) => step.stepId === stepId);
    },
    [state.workflow],
  );

  /**
   * Gets all steps that depend on a specific step
   */
  const getStepDependents = useCallback(
    (stepId: string): string[] => {
      return state.dependencyGraph.get(stepId) || [];
    },
    [state.dependencyGraph],
  );

  /**
   * Gets all steps that a specific step depends on
   */
  const getStepDependencies = useCallback(
    (stepId: string): string[] => {
      return state.dependencies.get(stepId) || [];
    },
    [state.dependencies],
  );

  /**
   * Checks if a step is an entry point
   */
  const isEntryPoint = useCallback(
    (stepId: string): boolean => {
      return state.entryPoints.some((step) => step.stepId === stepId);
    },
    [state.entryPoints],
  );

  /**
   * Checks if a step is a terminal step
   */
  const isTerminalStep = useCallback(
    (stepId: string): boolean => {
      return state.terminalSteps.some((step) => step.stepId === stepId);
    },
    [state.terminalSteps],
  );

  // Memoized computed values
  const computedValues = useMemo(
    () => ({
      hasWorkflow: !!state.workflow,
      stepCount: state.workflow?.steps.length || 0,
      operationCount: state.referencedOperations.length,
      entryPointCount: state.entryPoints.length,
      terminalStepCount: state.terminalSteps.length,
      hasValidationErrors: state.validationResult
        ? !state.validationResult.isValid
        : false,
      hasValidationWarnings: state.validationResult
        ? state.validationResult.warnings.length > 0
        : false,
    }),
    [state],
  );

  return {
    // State
    ...state,

    // Computed values
    ...computedValues,

    // Actions
    loadFromUrl,
    loadFromContent,
    loadFromCriteria,
    clear,
    revalidate,

    // Utilities
    getStep,
    getStepDependents,
    getStepDependencies,
    isEntryPoint,
    isTerminalStep,
  };
}

/**
 * Hook for loading criteria mapping configuration
 */
export function useCriteriaMappingConfig() {
  const [config, setConfig] = useState<CriteriaMappingConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadConfig = useCallback(
    async (
      configUrl: string = '/api-flow-explorer/data/criteria-mapping.json',
    ) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(configUrl);

        if (!response.ok) {
          throw new Error(
            `Failed to fetch criteria mapping config: ${response.status} ${response.statusText}`,
          );
        }

        const configData = await response.json();

        // Basic validation
        if (!configData.mappings || typeof configData.mappings !== 'object') {
          throw new Error(
            'Invalid criteria mapping config: missing or invalid mappings',
          );
        }

        setConfig(configData);
      } catch (error) {
        const errorMessage = `Failed to load criteria mapping config: ${error instanceof Error ? error.message : 'Unknown error'}`;
        setError(errorMessage);
        setConfig(null);
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  // Auto-load config on mount
  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  return {
    config,
    isLoading,
    error,
    loadConfig,
    reload: () => loadConfig(),
  };
}
