import React from 'react';
import { render, screen } from '@testing-library/react';
import { JourneyVisualizer } from '../JourneyVisualizer';
import type { ApiJourney } from '../../types';

// Mock ReactFlow to avoid complex setup
vi.mock('@xyflow/react', () => ({
  ReactFlow: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="react-flow">{children}</div>
  ),
  Background: () => <div data-testid="background" />,
  Controls: () => <div data-testid="controls" />,
  MiniMap: () => <div data-testid="minimap" />,
  Panel: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="panel">{children}</div>
  ),
  useNodesState: (initialNodes: any[]) => [initialNodes, vi.fn(), vi.fn()],
  useEdgesState: (initialEdges: any[]) => [initialEdges, vi.fn(), vi.fn()],
  ConnectionMode: { Strict: 'strict' },
  Position: { Top: 'top', Bottom: 'bottom', Left: 'left', Right: 'right' },
}));

// Mock the node components
vi.mock('../nodes/OperationNode', () => ({
  OperationNode: () => <div data-testid="operation-node" />,
}));

vi.mock('../nodes/StartNode', () => ({
  StartNode: () => <div data-testid="start-node" />,
}));

vi.mock('../nodes/EndNode', () => ({
  EndNode: () => <div data-testid="end-node" />,
}));

vi.mock('../nodes/DecisionNode', () => ({
  DecisionNode: () => <div data-testid="decision-node" />,
}));

const mockJourney: ApiJourney = {
  nodes: [
    {
      id: 'start',
      type: 'start',
      position: { x: 0, y: 0 },
      data: {
        label: 'Start',
        status: 'neutral' as const,
        description: 'Workflow entry point',
      },
    },
    {
      id: 'operation-1',
      type: 'operation',
      position: { x: 200, y: 0 },
      data: {
        label: 'Create Application',
        method: 'POST',
        path: '/applications',
        status: 'success' as const,
        description: 'Create a new application',
      },
    },
    {
      id: 'end',
      type: 'end',
      position: { x: 400, y: 0 },
      data: {
        label: 'Success',
        status: 'success' as const,
        description: 'Successful completion',
      },
    },
  ],
  edges: [
    {
      id: 'start-operation-1',
      source: 'start',
      target: 'operation-1',
      type: 'default',
    },
    {
      id: 'operation-1-end',
      source: 'operation-1',
      target: 'end',
      type: 'success',
      style: {
        stroke: '#10b981',
        strokeWidth: 2,
      },
    },
  ],
  metadata: {
    title: 'Test Journey',
    description: 'A test journey for validation',
    totalSteps: 1,
    requiredSteps: 1,
    optionalSteps: 0,
  },
};

describe('JourneyVisualizer', () => {
  const mockOnNodeSelect = vi.fn();

  beforeEach(() => {
    mockOnNodeSelect.mockClear();
  });

  it('renders without crashing', () => {
    const { container } = render(
      <JourneyVisualizer
        journey={mockJourney}
        onNodeSelect={mockOnNodeSelect}
      />,
    );

    expect(container).toBeDefined();
    expect(screen.getByTestId('react-flow')).toBeDefined();
  });

  it('displays journey metadata', () => {
    render(
      <JourneyVisualizer
        journey={mockJourney}
        onNodeSelect={mockOnNodeSelect}
      />,
    );

    expect(screen.getByText('Test Journey')).toBeDefined();
    expect(screen.getByText('A test journey for validation')).toBeDefined();
    expect(screen.getByText('Steps: 1')).toBeDefined();
    expect(screen.getByText('Required: 1')).toBeDefined();
  });

  it('displays legend', () => {
    render(
      <JourneyVisualizer
        journey={mockJourney}
        onNodeSelect={mockOnNodeSelect}
      />,
    );

    expect(screen.getByText('Legend')).toBeDefined();
    expect(screen.getByText('Success Path')).toBeDefined();
    expect(screen.getByText('Error Path')).toBeDefined();
    expect(screen.getByText('Standard Step')).toBeDefined();
  });

  it('renders ReactFlow components', () => {
    render(
      <JourneyVisualizer
        journey={mockJourney}
        onNodeSelect={mockOnNodeSelect}
      />,
    );

    expect(screen.getByTestId('react-flow')).toBeDefined();
    expect(screen.getByTestId('background')).toBeDefined();
    expect(screen.getByTestId('controls')).toBeDefined();
    expect(screen.getByTestId('minimap')).toBeDefined();
    expect(screen.getAllByTestId('panel')).toHaveLength(2); // metadata and legend panels
  });

  it('handles node selection', () => {
    render(
      <JourneyVisualizer
        journey={mockJourney}
        onNodeSelect={mockOnNodeSelect}
        selectedNode="operation-1"
      />,
    );

    // Component should render with selected node
    expect(screen.getByTestId('react-flow')).toBeDefined();
  });
});
