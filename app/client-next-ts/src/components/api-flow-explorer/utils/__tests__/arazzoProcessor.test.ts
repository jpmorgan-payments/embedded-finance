import { describe, it, expect } from 'vitest';
import {
  parseArazzoSpec,
  extractStepDependencies,
  buildDependencyGraph,
  validateWorkflowIntegrity,
  getReferencedOperations,
  findEntryPoints,
  findTerminalSteps,
} from '../arazzoProcessor';
import { ArazzoWorkflow } from '../../types/arazzo';

describe('arazzoProcessor', () => {
  const sampleArazzoYaml = `
workflowId: test-workflow
info:
  title: Test Workflow
  version: 1.0.0
  description: A test workflow for validation
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
    onFailure:
      - stepId: step3
  - stepId: step3
    description: Error handling step
    operationId: logError
    successCriteria:
      - condition: "\$statusCode == 200"
`;

  const sampleWorkflow: ArazzoWorkflow = {
    workflowId: 'test-workflow',
    info: {
      title: 'Test Workflow',
      version: '1.0.0',
      description: 'A test workflow for validation',
    },
    sourceDescriptions: [
      {
        name: 'test-api',
        url: 'https://api.example.com/openapi.yaml',
      },
    ],
    steps: [
      {
        stepId: 'step1',
        description: 'First step',
        operationId: 'createUser',
        successCriteria: [{ condition: '$statusCode == 201' }],
        onSuccess: [{ stepId: 'step2' }],
      },
      {
        stepId: 'step2',
        description: 'Second step',
        operationId: 'updateUser',
        successCriteria: [{ condition: '$statusCode == 200' }],
        onFailure: [{ stepId: 'step3' }],
      },
      {
        stepId: 'step3',
        description: 'Error handling step',
        operationId: 'logError',
        successCriteria: [{ condition: '$statusCode == 200' }],
      },
    ],
  };

  describe('parseArazzoSpec', () => {
    it('should parse valid Arazzo YAML', () => {
      const result = parseArazzoSpec(sampleArazzoYaml);

      expect(result.workflowId).toBe('test-workflow');
      expect(result.info.title).toBe('Test Workflow');
      expect(result.steps).toHaveLength(3);
      expect(result.steps[0].stepId).toBe('step1');
    });

    it('should throw error for invalid YAML', () => {
      expect(() => parseArazzoSpec('invalid: yaml: content:')).toThrow();
    });

    it('should throw error for missing workflowId', () => {
      const invalidYaml = `
info:
  title: Test
steps: []
`;
      expect(() => parseArazzoSpec(invalidYaml)).toThrow(
        'Missing or invalid workflowId',
      );
    });

    it('should throw error for missing info section', () => {
      const invalidYaml = `
workflowId: test
steps: []
`;
      expect(() => parseArazzoSpec(invalidYaml)).toThrow(
        'Missing or invalid info section',
      );
    });

    it('should throw error for missing steps array', () => {
      const invalidYaml = `
workflowId: test
info:
  title: Test
`;
      expect(() => parseArazzoSpec(invalidYaml)).toThrow(
        'Missing or invalid steps array',
      );
    });
  });

  describe('extractStepDependencies', () => {
    it('should extract step dependencies correctly', () => {
      const dependencies = extractStepDependencies(sampleWorkflow);

      expect(dependencies.get('step1')).toEqual(['step2']);
      expect(dependencies.get('step2')).toEqual(['step3']);
      expect(dependencies.get('step3')).toEqual([]);
    });
  });

  describe('buildDependencyGraph', () => {
    it('should build reverse dependency graph', () => {
      const dependents = buildDependencyGraph(sampleWorkflow);

      expect(dependents.get('step1')).toEqual([]);
      expect(dependents.get('step2')).toEqual(['step1']);
      expect(dependents.get('step3')).toEqual(['step2']);
    });
  });

  describe('validateWorkflowIntegrity', () => {
    it('should validate a correct workflow', () => {
      const result = validateWorkflowIntegrity(sampleWorkflow);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect duplicate step IDs', () => {
      const invalidWorkflow: ArazzoWorkflow = {
        ...sampleWorkflow,
        steps: [
          ...sampleWorkflow.steps,
          {
            stepId: 'step1', // Duplicate
            description: 'Duplicate step',
            operationId: 'duplicateOp',
            successCriteria: [],
          },
        ],
      };

      const result = validateWorkflowIntegrity(invalidWorkflow);

      expect(result.isValid).toBe(false);
      expect(
        result.errors.some((error) => error.includes('Duplicate step IDs')),
      ).toBe(true);
    });

    it('should detect invalid step references', () => {
      const invalidWorkflow: ArazzoWorkflow = {
        ...sampleWorkflow,
        steps: [
          {
            stepId: 'step1',
            description: 'First step',
            operationId: 'createUser',
            successCriteria: [],
            onSuccess: [{ stepId: 'nonexistent' }], // Invalid reference
          },
        ],
      };

      const result = validateWorkflowIntegrity(invalidWorkflow);

      expect(result.isValid).toBe(false);
      expect(
        result.errors.some((error) =>
          error.includes('references non-existent step'),
        ),
      ).toBe(true);
    });
  });

  describe('getReferencedOperations', () => {
    it('should return all referenced operation IDs', () => {
      const operations = getReferencedOperations(sampleWorkflow);

      expect(operations).toContain('createUser');
      expect(operations).toContain('updateUser');
      expect(operations).toContain('logError');
      expect(operations).toHaveLength(3);
    });
  });

  describe('findEntryPoints', () => {
    it('should find entry point steps', () => {
      const entryPoints = findEntryPoints(sampleWorkflow);

      expect(entryPoints).toHaveLength(1);
      expect(entryPoints[0].stepId).toBe('step1');
    });
  });

  describe('findTerminalSteps', () => {
    it('should find terminal steps', () => {
      const terminalSteps = findTerminalSteps(sampleWorkflow);

      expect(terminalSteps).toHaveLength(1);
      expect(terminalSteps[0].stepId).toBe('step3');
    });
  });
});
