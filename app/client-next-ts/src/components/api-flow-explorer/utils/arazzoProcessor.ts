import * as YAML from 'yaml';
import {
  ArazzoWorkflow,
  WorkflowStep,
  StepReference,
  Criterion,
  Parameter,
} from '../types/arazzo';

/**
 * Parses an Arazzo YAML specification string into a structured workflow object
 */
export function parseArazzoSpec(yamlContent: string): ArazzoWorkflow {
  try {
    const parsed = YAML.parse(yamlContent);

    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Invalid YAML content: not an object');
    }

    // Validate required fields
    if (!parsed.workflowId || typeof parsed.workflowId !== 'string') {
      throw new Error('Missing or invalid workflowId');
    }

    if (!parsed.info || typeof parsed.info !== 'object') {
      throw new Error('Missing or invalid info section');
    }

    if (!Array.isArray(parsed.steps)) {
      throw new Error('Missing or invalid steps array');
    }

    // Transform and validate the workflow
    const workflow: ArazzoWorkflow = {
      workflowId: parsed.workflowId,
      info: {
        title: parsed.info.title || '',
        summary: parsed.info.summary,
        description: parsed.info.description,
        version: parsed.info.version || '1.0.0',
      },
      sourceDescriptions: Array.isArray(parsed.sourceDescriptions)
        ? parsed.sourceDescriptions.map((source: any) => ({
            name: source.name || '',
            url: source.url || '',
            type: source.type,
          }))
        : [],
      steps: parsed.steps.map((step: any, index: number) =>
        parseWorkflowStep(step, index),
      ),
    };

    return workflow;
  } catch (error) {
    throw new Error(
      `Failed to parse Arazzo specification: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
}

/**
 * Parses and validates a single workflow step
 */
function parseWorkflowStep(stepData: any, index: number): WorkflowStep {
  if (!stepData || typeof stepData !== 'object') {
    throw new Error(`Invalid step at index ${index}: not an object`);
  }

  if (!stepData.stepId || typeof stepData.stepId !== 'string') {
    throw new Error(
      `Invalid step at index ${index}: missing or invalid stepId`,
    );
  }

  if (!stepData.operationId || typeof stepData.operationId !== 'string') {
    throw new Error(
      `Invalid step at index ${index}: missing or invalid operationId`,
    );
  }

  const step: WorkflowStep = {
    stepId: stepData.stepId,
    description: stepData.description || '',
    operationId: stepData.operationId,
    parameters: Array.isArray(stepData.parameters)
      ? stepData.parameters.map((param: any) => parseParameter(param))
      : undefined,
    successCriteria: Array.isArray(stepData.successCriteria)
      ? stepData.successCriteria.map((criterion: any) =>
          parseCriterion(criterion),
        )
      : [],
    onSuccess: Array.isArray(stepData.onSuccess)
      ? stepData.onSuccess.map((ref: any) => parseStepReference(ref))
      : undefined,
    onFailure: Array.isArray(stepData.onFailure)
      ? stepData.onFailure.map((ref: any) => parseStepReference(ref))
      : undefined,
    requestBody: stepData.requestBody,
    outputs:
      stepData.outputs && typeof stepData.outputs === 'object'
        ? stepData.outputs
        : undefined,
  };

  return step;
}

/**
 * Parses a parameter object
 */
function parseParameter(paramData: any): Parameter {
  if (!paramData || typeof paramData !== 'object') {
    throw new Error('Invalid parameter: not an object');
  }

  if (!paramData.name || typeof paramData.name !== 'string') {
    throw new Error('Invalid parameter: missing or invalid name');
  }

  const validLocations = ['query', 'header', 'path', 'cookie'];
  if (!paramData.in || !validLocations.includes(paramData.in)) {
    throw new Error(
      `Invalid parameter: 'in' must be one of ${validLocations.join(', ')}`,
    );
  }

  return {
    name: paramData.name,
    in: paramData.in as 'query' | 'header' | 'path' | 'cookie',
    value: paramData.value,
    description: paramData.description,
  };
}

/**
 * Parses a criterion object
 */
function parseCriterion(criterionData: any): Criterion {
  if (!criterionData || typeof criterionData !== 'object') {
    throw new Error('Invalid criterion: not an object');
  }

  if (!criterionData.condition || typeof criterionData.condition !== 'string') {
    throw new Error('Invalid criterion: missing or invalid condition');
  }

  const validTypes = ['simple', 'regex', 'jsonpath'];
  const type = criterionData.type;
  if (type && !validTypes.includes(type)) {
    throw new Error(
      `Invalid criterion: type must be one of ${validTypes.join(', ')}`,
    );
  }

  return {
    condition: criterionData.condition,
    context: criterionData.context,
    type: type as 'simple' | 'regex' | 'jsonpath' | undefined,
  };
}

/**
 * Parses a step reference object
 */
function parseStepReference(refData: any): StepReference {
  if (!refData || typeof refData !== 'object') {
    throw new Error('Invalid step reference: not an object');
  }

  if (!refData.stepId || typeof refData.stepId !== 'string') {
    throw new Error('Invalid step reference: missing or invalid stepId');
  }

  return {
    stepId: refData.stepId,
    criteria: Array.isArray(refData.criteria)
      ? refData.criteria.map((criterion: any) => parseCriterion(criterion))
      : undefined,
  };
}

/**
 * Extracts workflow step dependencies from the parsed workflow
 */
export function extractStepDependencies(
  workflow: ArazzoWorkflow,
): Map<string, string[]> {
  const dependencies = new Map<string, string[]>();

  workflow.steps.forEach((step) => {
    const stepDeps: string[] = [];

    // Add dependencies from onSuccess references
    if (step.onSuccess) {
      step.onSuccess.forEach((ref) => {
        if (!stepDeps.includes(ref.stepId)) {
          stepDeps.push(ref.stepId);
        }
      });
    }

    // Add dependencies from onFailure references
    if (step.onFailure) {
      step.onFailure.forEach((ref) => {
        if (!stepDeps.includes(ref.stepId)) {
          stepDeps.push(ref.stepId);
        }
      });
    }

    dependencies.set(step.stepId, stepDeps);
  });

  return dependencies;
}

/**
 * Builds a dependency graph showing which steps depend on each step
 */
export function buildDependencyGraph(
  workflow: ArazzoWorkflow,
): Map<string, string[]> {
  const dependents = new Map<string, string[]>();

  // Initialize all steps with empty arrays
  workflow.steps.forEach((step) => {
    dependents.set(step.stepId, []);
  });

  // Build reverse dependency mapping
  workflow.steps.forEach((step) => {
    // Check onSuccess references
    if (step.onSuccess) {
      step.onSuccess.forEach((ref) => {
        const currentDependents = dependents.get(ref.stepId) || [];
        if (!currentDependents.includes(step.stepId)) {
          currentDependents.push(step.stepId);
          dependents.set(ref.stepId, currentDependents);
        }
      });
    }

    // Check onFailure references
    if (step.onFailure) {
      step.onFailure.forEach((ref) => {
        const currentDependents = dependents.get(ref.stepId) || [];
        if (!currentDependents.includes(step.stepId)) {
          currentDependents.push(step.stepId);
          dependents.set(ref.stepId, currentDependents);
        }
      });
    }
  });

  return dependents;
}

/**
 * Validates workflow integrity by checking for circular dependencies and orphaned steps
 */
export function validateWorkflowIntegrity(workflow: ArazzoWorkflow): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  const stepIds = new Set(workflow.steps.map((step) => step.stepId));

  // Check for duplicate step IDs
  const duplicateIds = new Set<string>();
  const seenIds = new Set<string>();
  workflow.steps.forEach((step) => {
    if (seenIds.has(step.stepId)) {
      duplicateIds.add(step.stepId);
    }
    seenIds.add(step.stepId);
  });

  if (duplicateIds.size > 0) {
    errors.push(
      `Duplicate step IDs found: ${Array.from(duplicateIds).join(', ')}`,
    );
  }

  // Check for invalid step references
  workflow.steps.forEach((step) => {
    const checkReferences = (
      refs: StepReference[] | undefined,
      type: string,
    ) => {
      if (refs) {
        refs.forEach((ref) => {
          if (!stepIds.has(ref.stepId)) {
            errors.push(
              `Step '${step.stepId}' references non-existent step '${ref.stepId}' in ${type}`,
            );
          }
        });
      }
    };

    checkReferences(step.onSuccess, 'onSuccess');
    checkReferences(step.onFailure, 'onFailure');
  });

  // Check for circular dependencies (simplified check)
  const dependencies = extractStepDependencies(workflow);
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  const hasCircularDependency = (stepId: string): boolean => {
    if (recursionStack.has(stepId)) {
      return true;
    }
    if (visited.has(stepId)) {
      return false;
    }

    visited.add(stepId);
    recursionStack.add(stepId);

    const deps = dependencies.get(stepId) || [];
    for (const dep of deps) {
      if (hasCircularDependency(dep)) {
        return true;
      }
    }

    recursionStack.delete(stepId);
    return false;
  };

  workflow.steps.forEach((step) => {
    if (hasCircularDependency(step.stepId)) {
      errors.push(
        `Circular dependency detected involving step '${step.stepId}'`,
      );
    }
  });

  // Check for orphaned steps (steps with no incoming or outgoing references)
  const dependents = buildDependencyGraph(workflow);
  workflow.steps.forEach((step) => {
    const hasIncoming = (dependents.get(step.stepId) || []).length > 0;
    const hasOutgoing =
      (step.onSuccess || []).length > 0 || (step.onFailure || []).length > 0;

    if (!hasIncoming && !hasOutgoing && workflow.steps.length > 1) {
      warnings.push(
        `Step '${step.stepId}' appears to be orphaned (no incoming or outgoing references)`,
      );
    }
  });

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Gets all operation IDs referenced in the workflow
 */
export function getReferencedOperations(workflow: ArazzoWorkflow): string[] {
  const operations = new Set<string>();

  workflow.steps.forEach((step) => {
    operations.add(step.operationId);
  });

  return Array.from(operations);
}

/**
 * Finds the entry point steps (steps with no dependencies)
 */
export function findEntryPoints(workflow: ArazzoWorkflow): WorkflowStep[] {
  const dependents = buildDependencyGraph(workflow);

  return workflow.steps.filter((step) => {
    const incomingRefs = dependents.get(step.stepId) || [];
    return incomingRefs.length === 0;
  });
}

/**
 * Finds terminal steps (steps with no outgoing references)
 */
export function findTerminalSteps(workflow: ArazzoWorkflow): WorkflowStep[] {
  return workflow.steps.filter((step) => {
    const hasOutgoing =
      (step.onSuccess || []).length > 0 || (step.onFailure || []).length > 0;
    return !hasOutgoing;
  });
}
