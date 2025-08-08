// Arazzo specification types

export interface ArazzoWorkflow {
  workflowId: string;
  info: WorkflowInfo;
  sourceDescriptions: SourceDescription[];
  steps: WorkflowStep[];
}

export interface WorkflowInfo {
  title: string;
  summary?: string;
  description?: string;
  version: string;
}

export interface SourceDescription {
  name: string;
  url: string;
  type?: string;
}

export interface WorkflowStep {
  stepId: string;
  description: string;
  operationId: string;
  parameters?: Parameter[];
  successCriteria: Criterion[];
  onSuccess?: StepReference[];
  onFailure?: StepReference[];
  requestBody?: any;
  outputs?: { [key: string]: string };
}

export interface Parameter {
  name: string;
  in: 'query' | 'header' | 'path' | 'cookie';
  value: string | number | boolean;
  description?: string;
}

export interface Criterion {
  condition: string;
  context?: string;
  type?: 'simple' | 'regex' | 'jsonpath';
}

export interface StepReference {
  stepId: string;
  criteria?: Criterion[];
}

export interface CriteriaMapping {
  [key: string]: {
    product: string;
    jurisdiction: string;
    legalEntityType: string;
    arazzoFile: string;
    requiredOperations: string[];
    displayName: string;
    description: string;
  };
}

export interface CriteriaMappingConfig {
  mappings: CriteriaMapping;
  defaultCriteria: {
    product: string;
    jurisdiction: string;
    legalEntityType: string;
  };
  supportedCombinations: string[];
}
