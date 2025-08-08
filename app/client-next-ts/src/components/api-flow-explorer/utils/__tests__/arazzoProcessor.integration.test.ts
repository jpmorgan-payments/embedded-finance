import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import {
  parseArazzoSpec,
  extractStepDependencies,
  buildDependencyGraph,
  validateWorkflowIntegrity,
  getReferencedOperations,
  findEntryPoints,
  findTerminalSteps,
} from '../arazzoProcessor';

describe('arazzoProcessor integration', () => {
  // Load the sample Arazzo file
  const sampleArazzoPath = join(
    process.cwd(),
    'src/components/api-flow-explorer/data/arazzo-specs/sample-embedded-payments-us-llc.yaml',
  );
  let sampleArazzoContent: string;

  try {
    sampleArazzoContent = readFileSync(sampleArazzoPath, 'utf-8');
  } catch (error) {
    // If file doesn't exist in test environment, use inline content
    sampleArazzoContent = `
workflowId: embedded-payments-us-llc-onboarding
info:
  title: Embedded Payments US LLC Onboarding Workflow
  version: 1.0.0
sourceDescriptions:
  - name: embedded-finance-api
    url: /api-flow-explorer/data/api-specs/embedded-finance-pub-smbdo-1.0.16.yaml
steps:
  - stepId: create-client
    description: Create a new client record for the LLC
    operationId: createClient
    successCriteria:
      - condition: "\$statusCode == 201"
    onSuccess:
      - stepId: submit-business-info
    onFailure:
      - stepId: handle-client-creation-error
  - stepId: submit-business-info
    description: Submit business information
    operationId: submitBusinessInformation
    successCriteria:
      - condition: "\$statusCode == 200"
    onSuccess:
      - stepId: setup-account
  - stepId: setup-account
    description: Set up the payment account
    operationId: setupPaymentAccount
    successCriteria:
      - condition: "\$statusCode == 201"
  - stepId: handle-client-creation-error
    description: Handle client creation errors
    operationId: logError
    successCriteria:
      - condition: "\$statusCode == 200"
`;
  }

  it('should parse and process the sample Arazzo workflow correctly', () => {
    const workflow = parseArazzoSpec(sampleArazzoContent);

    // Basic structure validation
    expect(workflow.workflowId).toBe('embedded-payments-us-llc-onboarding');
    expect(workflow.info.title).toBe(
      'Embedded Payments US LLC Onboarding Workflow',
    );
    expect(workflow.steps.length).toBeGreaterThan(0);

    // Validate that all steps have required fields
    workflow.steps.forEach((step) => {
      expect(step.stepId).toBeTruthy();
      expect(step.operationId).toBeTruthy();
      expect(step.description).toBeTruthy();
      expect(Array.isArray(step.successCriteria)).toBe(true);
    });
  });

  it('should extract dependencies correctly from the sample workflow', () => {
    const workflow = parseArazzoSpec(sampleArazzoContent);
    const dependencies = extractStepDependencies(workflow);

    // Verify that dependencies are extracted
    expect(dependencies.size).toBeGreaterThan(0);

    // Each step should have a dependency entry (even if empty)
    workflow.steps.forEach((step) => {
      expect(dependencies.has(step.stepId)).toBe(true);
    });
  });

  it('should build dependency graph correctly', () => {
    const workflow = parseArazzoSpec(sampleArazzoContent);
    const dependencyGraph = buildDependencyGraph(workflow);

    // Verify that dependency graph is built
    expect(dependencyGraph.size).toBeGreaterThan(0);

    // Each step should have an entry in the dependency graph
    workflow.steps.forEach((step) => {
      expect(dependencyGraph.has(step.stepId)).toBe(true);
    });
  });

  it('should validate workflow integrity', () => {
    const workflow = parseArazzoSpec(sampleArazzoContent);
    const validation = validateWorkflowIntegrity(workflow);

    // The sample workflow should be valid
    expect(validation.isValid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  it('should find entry points and terminal steps', () => {
    const workflow = parseArazzoSpec(sampleArazzoContent);
    const entryPoints = findEntryPoints(workflow);
    const terminalSteps = findTerminalSteps(workflow);

    // Should have at least one entry point
    expect(entryPoints.length).toBeGreaterThan(0);

    // Should have at least one terminal step
    expect(terminalSteps.length).toBeGreaterThan(0);

    // Entry points should not have incoming dependencies
    const dependencyGraph = buildDependencyGraph(workflow);
    entryPoints.forEach((step) => {
      const incomingDeps = dependencyGraph.get(step.stepId) || [];
      expect(incomingDeps.length).toBe(0);
    });
  });

  it('should extract referenced operations', () => {
    const workflow = parseArazzoSpec(sampleArazzoContent);
    const operations = getReferencedOperations(workflow);

    // Should have operations
    expect(operations.length).toBeGreaterThan(0);

    // Should include expected operations
    expect(operations).toContain('createClient');

    // All operations should be unique
    const uniqueOperations = new Set(operations);
    expect(uniqueOperations.size).toBe(operations.length);
  });

  it('should handle complex workflow with multiple paths', () => {
    const workflow = parseArazzoSpec(sampleArazzoContent);

    // Find steps with both success and failure paths
    const stepsWithBothPaths = workflow.steps.filter(
      (step) =>
        step.onSuccess &&
        step.onSuccess.length > 0 &&
        step.onFailure &&
        step.onFailure.length > 0,
    );

    if (stepsWithBothPaths.length > 0) {
      // Verify that both paths reference valid steps
      const allStepIds = new Set(workflow.steps.map((s) => s.stepId));

      stepsWithBothPaths.forEach((step) => {
        step.onSuccess?.forEach((ref) => {
          expect(allStepIds.has(ref.stepId)).toBe(true);
        });

        step.onFailure?.forEach((ref) => {
          expect(allStepIds.has(ref.stepId)).toBe(true);
        });
      });
    }
  });
});
