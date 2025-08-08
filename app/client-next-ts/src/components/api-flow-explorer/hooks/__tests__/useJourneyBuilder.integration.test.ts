import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useJourneyBuilder } from '../useJourneyBuilder';
import { parseArazzoSpec } from '../../utils/arazzoProcessor';

describe('useJourneyBuilder Integration', () => {
  const sampleArazzoYaml = `
arazzo: 1.0.0
workflowId: sample-workflow
info:
  title: Sample Workflow
  description: A sample workflow for testing
  version: 1.0.0

sourceDescriptions:
  - name: test-api
    url: /api/test.yaml
    type: openapi

steps:
  - stepId: create-resource
    description: Create a new resource
    operationId: createResource
    successCriteria:
      - condition: $statusCode == 201
    onSuccess:
      - stepId: update-resource
    onFailure:
      - stepId: handle-create-error

  - stepId: update-resource
    description: Update the resource
    operationId: updateResource
    successCriteria:
      - condition: $statusCode == 200
    onSuccess:
      - stepId: complete-workflow

  - stepId: complete-workflow
    description: Complete the workflow
    operationId: completeWorkflow
    successCriteria:
      - condition: $statusCode == 200

  - stepId: handle-create-error
    description: Handle creation error
    operationId: logError
    successCriteria:
      - condition: $statusCode == 200
  `;

  it('should build journey from real Arazzo specification', async () => {
    const { result } = renderHook(() => useJourneyBuilder());

    // Parse the Arazzo spec
    const workflow = parseArazzoSpec(sampleArazzoYaml);

    await act(async () => {
      await result.current.buildJourney(workflow);
    });

    expect(result.current.error).toBeNull();
    expect(result.current.journey).not.toBeNull();

    const journey = result.current.journey!;

    // Should have nodes for: start + 4 steps + 2 end nodes = 7 nodes
    expect(journey.nodes.length).toBe(7);

    // Should have edges connecting the workflow
    expect(journey.edges.length).toBeGreaterThan(0);

    // Check metadata
    expect(journey.metadata.title).toBe('Sample Workflow');
    expect(journey.metadata.totalSteps).toBe(4);
    expect(journey.metadata.requiredSteps).toBe(3); // Non-error handling steps
    expect(journey.metadata.optionalSteps).toBe(1); // Error handling steps
  });

  it('should create proper ReactFlow elements from real workflow', async () => {
    const { result } = renderHook(() => useJourneyBuilder());

    const workflow = parseArazzoSpec(sampleArazzoYaml);

    await act(async () => {
      await result.current.buildJourney(workflow);
    });

    const { nodes, edges } = result.current.reactFlowElements;

    expect(nodes.length).toBe(7);
    expect(edges.length).toBeGreaterThan(0);

    // Check that all nodes have valid positions
    nodes.forEach((node) => {
      expect(typeof node.position.x).toBe('number');
      expect(typeof node.position.y).toBe('number');
      expect(isFinite(node.position.x)).toBe(true);
      expect(isFinite(node.position.y)).toBe(true);
    });

    // Check that we have different node types
    const nodeTypes = nodes.map((n) => n.type);
    expect(nodeTypes).toContain('input'); // start node
    expect(nodeTypes).toContain('output'); // end node
    expect(nodeTypes).toContain('default'); // operation nodes
  });

  it('should handle workflow with different layout directions', async () => {
    const { result } = renderHook(() =>
      useJourneyBuilder({
        layoutConfig: { direction: 'LR' },
      }),
    );

    const workflow = parseArazzoSpec(sampleArazzoYaml);

    await act(async () => {
      await result.current.buildJourney(workflow);
    });

    expect(result.current.error).toBeNull();
    expect(result.current.journey).not.toBeNull();
    expect(result.current.layoutConfig.direction).toBe('LR');

    // In LR layout, nodes should be spread horizontally
    const journey = result.current.journey!;
    const xPositions = journey.nodes.map((node) => node.position.x);
    const uniqueXPositions = new Set(xPositions);

    expect(uniqueXPositions.size).toBeGreaterThan(1);
  });
});
