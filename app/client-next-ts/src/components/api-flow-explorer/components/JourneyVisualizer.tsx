import React, { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  ConnectionMode,
  Panel,
} from '@xyflow/react';
import type { Node, Edge, NodeTypes } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import type { ApiJourney } from '../types';
// Custom Node Components
import { OperationNode } from './nodes/OperationNode';
import { StartNode } from './nodes/StartNode';
import { EndNode } from './nodes/EndNode';
import { DecisionNode } from './nodes/DecisionNode';

interface JourneyVisualizerProps {
  journey: ApiJourney;
  onNodeSelect: (nodeId: string) => void;
  selectedNode?: string;
}

// Define custom node types
const nodeTypes: NodeTypes = {
  operation: OperationNode,
  start: StartNode,
  end: EndNode,
  decision: DecisionNode,
  input: StartNode, // ReactFlow input type maps to our StartNode
  output: EndNode, // ReactFlow output type maps to our EndNode
  default: OperationNode, // Default type maps to OperationNode
};

export const JourneyVisualizer: React.FC<JourneyVisualizerProps> = ({
  journey,
  onNodeSelect,
  selectedNode,
}) => {
  // Note: useJourneyBuilder is used for building journeys from Arazzo workflows
  // Here we work directly with the provided journey data

  // Create ReactFlow nodes and edges from journey data
  const initialNodes: Node[] = useMemo(() => {
    return journey.nodes.map((node) => ({
      id: node.id,
      type: getReactFlowNodeType(node.type),
      position: node.position,
      data: {
        ...node.data,
        operation: node.operation,
        isSelected: selectedNode === node.id,
        onSelect: () => onNodeSelect(node.id),
      },
      style: getNodeStyle(node.data.status, selectedNode === node.id),
      draggable: false, // Disable dragging to maintain layout
    }));
  }, [journey.nodes, selectedNode, onNodeSelect]);

  const initialEdges: Edge[] = useMemo(() => {
    return journey.edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: edge.type || 'default',
      label: edge.label,
      animated: edge.animated || false,
      style: edge.style,
      markerEnd: {
        type: 'arrowclosed',
      },
    }));
  }, [journey.edges]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes when journey or selection changes
  React.useEffect(() => {
    setNodes(initialNodes);
  }, [initialNodes, setNodes]);

  React.useEffect(() => {
    setEdges(initialEdges);
  }, [initialEdges, setEdges]);

  // Handle node clicks
  const onNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      event.stopPropagation();
      onNodeSelect(node.id);
    },
    [onNodeSelect],
  );

  // Handle background clicks to deselect
  const onPaneClick = useCallback(() => {
    if (selectedNode) {
      onNodeSelect('');
    }
  }, [selectedNode, onNodeSelect]);

  return (
    <div className="h-full w-full">
      <div className="h-full border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          nodeTypes={nodeTypes}
          connectionMode={ConnectionMode.Strict}
          fitView
          fitViewOptions={{
            padding: 0.2,
            includeHiddenNodes: false,
          }}
          minZoom={0.1}
          maxZoom={2}
          defaultViewport={{ x: 0, y: 0, zoom: 1 }}
          proOptions={{ hideAttribution: true }}
        >
          <Background color="#e5e7eb" gap={20} />
          <Controls position="bottom-right" showInteractive={false} />
          <MiniMap
            position="bottom-left"
            nodeColor={(node) => {
              const status = node.data?.status || 'neutral';
              switch (status) {
                case 'success':
                  return '#10b981';
                case 'failure':
                  return '#ef4444';
                default:
                  return '#6b7280';
              }
            }}
            maskColor="rgba(0, 0, 0, 0.1)"
            pannable
            zoomable
          />

          {/* Journey metadata panel */}
          <Panel
            position="top-left"
            className="bg-white p-3 rounded-lg shadow-sm border"
          >
            <div className="text-sm">
              <h4 className="font-semibold text-gray-900 mb-2">
                {journey.metadata.title}
              </h4>
              {journey.metadata.description && (
                <p className="text-gray-600 mb-2 text-xs">
                  {journey.metadata.description}
                </p>
              )}
              <div className="flex gap-4 text-xs text-gray-500">
                <span>Steps: {journey.metadata.totalSteps}</span>
                <span>Required: {journey.metadata.requiredSteps}</span>
                {journey.metadata.optionalSteps > 0 && (
                  <span>Optional: {journey.metadata.optionalSteps}</span>
                )}
              </div>
            </div>
          </Panel>

          {/* Legend panel */}
          <Panel
            position="top-right"
            className="bg-white p-3 rounded-lg shadow-sm border"
          >
            <div className="text-xs">
              <h5 className="font-semibold text-gray-900 mb-2">Legend</h5>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded border-2 border-green-500 bg-green-50"></div>
                  <span>Success Path</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded border-2 border-red-500 bg-red-50"></div>
                  <span>Error Path</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded border-2 border-gray-500 bg-gray-50"></div>
                  <span>Standard Step</span>
                </div>
              </div>
            </div>
          </Panel>
        </ReactFlow>
      </div>
    </div>
  );
};

/**
 * Maps journey node types to ReactFlow node types
 */
function getReactFlowNodeType(nodeType: string): string {
  switch (nodeType) {
    case 'start':
      return 'start';
    case 'end':
      return 'end';
    case 'decision':
      return 'decision';
    case 'operation':
    default:
      return 'operation';
  }
}

/**
 * Gets node styling based on status and selection
 */
function getNodeStyle(
  status: string,
  isSelected: boolean,
): React.CSSProperties {
  const baseStyle: React.CSSProperties = {
    border: '2px solid',
    borderRadius: '8px',
    boxShadow: isSelected ? '0 0 0 3px rgba(59, 130, 246, 0.3)' : undefined,
  };

  switch (status) {
    case 'success':
      return {
        ...baseStyle,
        borderColor: isSelected ? '#059669' : '#10b981',
      };
    case 'failure':
      return {
        ...baseStyle,
        borderColor: isSelected ? '#dc2626' : '#ef4444',
      };
    case 'neutral':
    default:
      return {
        ...baseStyle,
        borderColor: isSelected ? '#4b5563' : '#6b7280',
      };
  }
}
