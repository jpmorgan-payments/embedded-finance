import { useState, useCallback, useMemo } from 'react';
import { Node, Edge } from '@xyflow/react';
import { ArazzoWorkflow, WorkflowStep, StepReference } from '../types/arazzo';
import {
  ApiJourney,
  JourneyNode,
  JourneyEdge,
  JourneyMetadata,
  NodePosition,
  LayoutConfig,
  NodeType,
  NodeStatus,
} from '../types/journey';
import { ApiOperation } from '../types/api';
import {
  extractStepDependencies,
  findEntryPoints,
  findTerminalSteps,
} from '../utils/arazzoProcessor';

export interface JourneyBuilderState {
  journey: ApiJourney | null;
  isBuilding: boolean;
  error: string | null;
  layoutConfig: LayoutConfig;
}

export interface UseJourneyBuilderOptions {
  layoutConfig?: Partial<LayoutConfig>;
  onError?: (error: string) => void;
  onJourneyBuilt?: (journey: ApiJourney) => void;
}

const DEFAULT_LAYOUT_CONFIG: LayoutConfig = {
  nodeSpacing: {
    horizontal: 200,
    vertical: 150,
  },
  direction: 'TB',
  alignment: 'center',
};

/**
 * Custom hook for building journey visualizations from Arazzo workflows
 */
export function useJourneyBuilder(options: UseJourneyBuilderOptions = {}) {
  const { layoutConfig: customLayoutConfig, onError, onJourneyBuilt } = options;

  const [state, setState] = useState<JourneyBuilderState>({
    journey: null,
    isBuilding: false,
    error: null,
    layoutConfig: { ...DEFAULT_LAYOUT_CONFIG, ...customLayoutConfig },
  });

  /**
   * Builds a journey from an Arazzo workflow
   */
  const buildJourney = useCallback(
    async (
      workflow: ArazzoWorkflow,
      operations: Map<string, ApiOperation> = new Map(),
    ) => {
      setState((prev) => ({ ...prev, isBuilding: true, error: null }));

      try {
        const journey = await buildJourneyFromWorkflow(
          workflow,
          operations,
          state.layoutConfig,
        );

        setState((prev) => ({
          ...prev,
          journey,
          isBuilding: false,
        }));

        onJourneyBuilt?.(journey);
      } catch (error) {
        const errorMessage = `Failed to build journey: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`;

        setState((prev) => ({
          ...prev,
          error: errorMessage,
          journey: null,
          isBuilding: false,
        }));

        onError?.(errorMessage);
      }
    },
    [state.layoutConfig, onError, onJourneyBuilt],
  );

  /**
   * Updates the layout configuration and rebuilds the journey if one exists
   */
  const updateLayoutConfig = useCallback(
    async (newConfig: Partial<LayoutConfig>) => {
      const updatedConfig = { ...state.layoutConfig, ...newConfig };

      setState((prev) => ({ ...prev, layoutConfig: updatedConfig }));

      // Rebuild journey with new layout if one exists
      if (state.journey) {
        setState((prev) => ({ ...prev, isBuilding: true }));

        try {
          const updatedJourney = await rebuildJourneyLayout(
            state.journey,
            updatedConfig,
          );

          setState((prev) => ({
            ...prev,
            journey: updatedJourney,
            isBuilding: false,
          }));
        } catch (error) {
          const errorMessage = `Failed to update layout: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`;

          setState((prev) => ({
            ...prev,
            error: errorMessage,
            isBuilding: false,
          }));

          onError?.(errorMessage);
        }
      }
    },
    [state.layoutConfig, state.journey, onError],
  );

  /**
   * Clears the current journey
   */
  const clearJourney = useCallback(() => {
    setState((prev) => ({
      ...prev,
      journey: null,
      error: null,
    }));
  }, []);

  /**
   * Gets ReactFlow-compatible nodes and edges
   */
  const reactFlowElements = useMemo(() => {
    if (!state.journey) {
      return { nodes: [], edges: [] };
    }

    const nodes: Node[] = state.journey.nodes.map((node) => ({
      id: node.id,
      type: getReactFlowNodeType(node.type),
      position: node.position,
      data: {
        ...node.data,
        operation: node.operation,
      },
      style: getNodeStyle(node.data.status),
    }));

    const edges: Edge[] = state.journey.edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: edge.type || 'default',
      label: edge.label,
      animated: edge.animated || false,
      style: edge.style,
    }));

    return { nodes, edges };
  }, [state.journey]);

  return {
    // State
    ...state,

    // ReactFlow elements
    reactFlowElements,

    // Actions
    buildJourney,
    updateLayoutConfig,
    clearJourney,

    // Computed values
    hasJourney: !!state.journey,
    nodeCount: state.journey?.nodes.length || 0,
    edgeCount: state.journey?.edges.length || 0,
  };
}

/**
 * Builds a journey from an Arazzo workflow
 */
async function buildJourneyFromWorkflow(
  workflow: ArazzoWorkflow,
  operations: Map<string, ApiOperation>,
  layoutConfig: LayoutConfig,
): Promise<ApiJourney> {
  // Extract workflow analysis
  const dependencies = extractStepDependencies(workflow);
  const entryPoints = findEntryPoints(workflow);
  const terminalSteps = findTerminalSteps(workflow);

  // Build nodes
  const nodes = await buildJourneyNodes(
    workflow,
    operations,
    entryPoints,
    terminalSteps,
  );

  // Build edges
  const edges = buildJourneyEdges(workflow, dependencies);

  // Apply layout
  const positionedNodes = applyLayout(nodes, edges, layoutConfig);

  // Build metadata
  const metadata = buildJourneyMetadata(workflow, nodes);

  return {
    nodes: positionedNodes,
    edges,
    metadata,
  };
}

/**
 * Builds journey nodes from workflow steps
 */
async function buildJourneyNodes(
  workflow: ArazzoWorkflow,
  operations: Map<string, ApiOperation>,
  entryPoints: WorkflowStep[],
  terminalSteps: WorkflowStep[],
): Promise<JourneyNode[]> {
  const nodes: JourneyNode[] = [];

  // Add start node if there are entry points
  if (entryPoints.length > 0) {
    nodes.push({
      id: 'start',
      type: 'start',
      position: { x: 0, y: 0 },
      data: {
        label: 'Start',
        status: 'neutral',
        description: 'Workflow entry point',
      },
    });
  }

  // Add step nodes
  for (const step of workflow.steps) {
    const operation = operations.get(step.operationId);
    const isErrorHandler = isErrorHandlingStep(step);

    nodes.push({
      id: step.stepId,
      type: 'operation',
      operation,
      position: { x: 0, y: 0 }, // Will be positioned by layout algorithm
      data: {
        label: step.description || step.stepId,
        method: operation?.method,
        path: operation?.path,
        status: determineNodeStatus(step, isErrorHandler),
        description: step.description,
      },
    });
  }

  // Add end nodes for terminal steps
  const successTerminals = terminalSteps.filter(
    (step) => !isErrorHandlingStep(step),
  );
  const failureTerminals = terminalSteps.filter((step) =>
    isErrorHandlingStep(step),
  );

  if (successTerminals.length > 0) {
    nodes.push({
      id: 'end-success',
      type: 'end',
      position: { x: 0, y: 0 },
      data: {
        label: 'Success',
        status: 'success',
        description: 'Successful completion',
      },
    });
  }

  if (failureTerminals.length > 0) {
    nodes.push({
      id: 'end-failure',
      type: 'end',
      position: { x: 0, y: 0 },
      data: {
        label: 'Failure',
        status: 'failure',
        description: 'Process failed',
      },
    });
  }

  return nodes;
}

/**
 * Builds journey edges from workflow step references
 */
function buildJourneyEdges(
  workflow: ArazzoWorkflow,
  dependencies: Map<string, string[]>,
): JourneyEdge[] {
  const edges: JourneyEdge[] = [];
  const entryPoints = findEntryPoints(workflow);
  const terminalSteps = findTerminalSteps(workflow);

  // Add edges from start to entry points
  if (entryPoints.length > 0) {
    entryPoints.forEach((entryPoint) => {
      edges.push({
        id: `start-${entryPoint.stepId}`,
        source: 'start',
        target: entryPoint.stepId,
        type: 'default',
      });
    });
  }

  // Add edges between steps
  workflow.steps.forEach((step) => {
    // Success paths
    if (step.onSuccess) {
      step.onSuccess.forEach((ref, index) => {
        edges.push({
          id: `${step.stepId}-success-${ref.stepId}-${index}`,
          source: step.stepId,
          target: ref.stepId,
          type: 'success',
          label: 'Success',
          style: {
            stroke: '#10b981',
            strokeWidth: 2,
          },
        });
      });
    }

    // Failure paths
    if (step.onFailure) {
      step.onFailure.forEach((ref, index) => {
        edges.push({
          id: `${step.stepId}-failure-${ref.stepId}-${index}`,
          source: step.stepId,
          target: ref.stepId,
          type: 'failure',
          label: 'Failure',
          style: {
            stroke: '#ef4444',
            strokeWidth: 2,
            strokeDasharray: '5,5',
          },
        });
      });
    }
  });

  // Add edges to terminal nodes
  const successTerminals = terminalSteps.filter(
    (step) => !isErrorHandlingStep(step),
  );
  const failureTerminals = terminalSteps.filter((step) =>
    isErrorHandlingStep(step),
  );

  successTerminals.forEach((terminal) => {
    edges.push({
      id: `${terminal.stepId}-end-success`,
      source: terminal.stepId,
      target: 'end-success',
      type: 'success',
      style: {
        stroke: '#10b981',
        strokeWidth: 2,
      },
    });
  });

  failureTerminals.forEach((terminal) => {
    edges.push({
      id: `${terminal.stepId}-end-failure`,
      source: terminal.stepId,
      target: 'end-failure',
      type: 'failure',
      style: {
        stroke: '#ef4444',
        strokeWidth: 2,
        strokeDasharray: '5,5',
      },
    });
  });

  return edges;
}

/**
 * Applies layout algorithm to position nodes
 */
function applyLayout(
  nodes: JourneyNode[],
  edges: JourneyEdge[],
  config: LayoutConfig,
): JourneyNode[] {
  // Simple hierarchical layout algorithm
  const positioned = [...nodes];
  const { nodeSpacing, direction } = config;

  // Build adjacency list for topological sorting
  const adjacencyList = new Map<string, string[]>();
  const inDegree = new Map<string, number>();

  // Initialize
  nodes.forEach((node) => {
    adjacencyList.set(node.id, []);
    inDegree.set(node.id, 0);
  });

  // Build graph
  edges.forEach((edge) => {
    const sourceTargets = adjacencyList.get(edge.source) || [];
    sourceTargets.push(edge.target);
    adjacencyList.set(edge.source, sourceTargets);

    const targetInDegree = inDegree.get(edge.target) || 0;
    inDegree.set(edge.target, targetInDegree + 1);
  });

  // Topological sort to determine levels
  const levels: string[][] = [];
  const queue: string[] = [];

  // Find nodes with no incoming edges
  inDegree.forEach((degree, nodeId) => {
    if (degree === 0) {
      queue.push(nodeId);
    }
  });

  while (queue.length > 0) {
    const currentLevel: string[] = [];
    const levelSize = queue.length;

    for (let i = 0; i < levelSize; i++) {
      const nodeId = queue.shift()!;
      currentLevel.push(nodeId);

      // Process neighbors
      const neighbors = adjacencyList.get(nodeId) || [];
      neighbors.forEach((neighbor) => {
        const neighborInDegree = inDegree.get(neighbor)! - 1;
        inDegree.set(neighbor, neighborInDegree);

        if (neighborInDegree === 0) {
          queue.push(neighbor);
        }
      });
    }

    if (currentLevel.length > 0) {
      levels.push(currentLevel);
    }
  }

  // Position nodes based on levels
  levels.forEach((level, levelIndex) => {
    const levelY = levelIndex * nodeSpacing.vertical;
    const levelWidth = (level.length - 1) * nodeSpacing.horizontal;
    const startX = -levelWidth / 2;

    level.forEach((nodeId, nodeIndex) => {
      const nodeX = startX + nodeIndex * nodeSpacing.horizontal;
      const node = positioned.find((n) => n.id === nodeId);

      if (node) {
        if (direction === 'TB' || direction === 'BT') {
          node.position = {
            x: nodeX,
            y: direction === 'TB' ? levelY : -levelY,
          };
        } else {
          node.position = {
            x: direction === 'LR' ? levelY : -levelY,
            y: nodeX,
          };
        }
      }
    });
  });

  return positioned;
}

/**
 * Builds journey metadata
 */
function buildJourneyMetadata(
  workflow: ArazzoWorkflow,
  nodes: JourneyNode[],
): JourneyMetadata {
  const operationNodes = nodes.filter((node) => node.type === 'operation');
  const errorHandlingNodes = operationNodes.filter((node) =>
    isErrorHandlingStep({ stepId: node.id } as WorkflowStep),
  );

  return {
    title: workflow.info.title,
    description: workflow.info.description,
    totalSteps: operationNodes.length,
    requiredSteps: operationNodes.length - errorHandlingNodes.length,
    optionalSteps: errorHandlingNodes.length,
  };
}

/**
 * Rebuilds journey layout with new configuration
 */
async function rebuildJourneyLayout(
  journey: ApiJourney,
  layoutConfig: LayoutConfig,
): Promise<ApiJourney> {
  const repositionedNodes = applyLayout(
    journey.nodes,
    journey.edges,
    layoutConfig,
  );

  return {
    ...journey,
    nodes: repositionedNodes,
  };
}

/**
 * Determines if a step is an error handling step
 */
function isErrorHandlingStep(step: WorkflowStep): boolean {
  const stepId = step.stepId || '';
  const description = step.description || '';

  return (
    stepId.includes('error') ||
    stepId.includes('handle') ||
    stepId.includes('notify-support') ||
    description.toLowerCase().includes('error') ||
    description.toLowerCase().includes('handle')
  );
}

/**
 * Determines the visual status of a node
 */
function determineNodeStatus(
  step: WorkflowStep,
  isErrorHandler: boolean,
): NodeStatus {
  if (isErrorHandler) {
    return 'failure';
  }

  // Check if step has success criteria indicating it's a critical step
  if (step.successCriteria && step.successCriteria.length > 0) {
    return 'success';
  }

  return 'neutral';
}

/**
 * Maps journey node types to ReactFlow node types
 */
function getReactFlowNodeType(nodeType: NodeType): string {
  switch (nodeType) {
    case 'start':
      return 'input';
    case 'end':
      return 'output';
    case 'decision':
      return 'default';
    case 'operation':
    default:
      return 'default';
  }
}

/**
 * Gets node styling based on status
 */
function getNodeStyle(status: NodeStatus): React.CSSProperties {
  const baseStyle: React.CSSProperties = {
    padding: '10px',
    borderRadius: '8px',
    border: '2px solid',
    backgroundColor: 'white',
    minWidth: '150px',
    textAlign: 'center',
  };

  switch (status) {
    case 'success':
      return {
        ...baseStyle,
        borderColor: '#10b981',
        backgroundColor: '#f0fdf4',
      };
    case 'failure':
      return {
        ...baseStyle,
        borderColor: '#ef4444',
        backgroundColor: '#fef2f2',
      };
    case 'neutral':
    default:
      return {
        ...baseStyle,
        borderColor: '#6b7280',
        backgroundColor: '#f9fafb',
      };
  }
}
